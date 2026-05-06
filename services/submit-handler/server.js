// evaluacosas — Submit Handler (Cloud Run)
// Recibe POSTs con el JSON de un submit y lo persiste en MÚLTIPLES sinks (redundancia
// barata, todo en tier libre Google + GitHub):
//   1. Cloud Storage  (gs://${BUCKET}/<app>/<filename>)        — primario
//   2. Firestore      (collection submits/<docId>)             — index queryable
//   3. GitHub Repo    (commit en repo privado evaluacosas-entregas) — audit trail
// Cada sink se ejecuta en paralelo, errores no bloquean los demás (graceful).
// El cliente recibe summary del éxito por sink. Si TODOS fallan, 500.

import express from "express";
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import { Octokit } from "@octokit/rest";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json({ limit: "2mb" }));

const ORIGIN_ALLOWLIST = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
const BUCKET = process.env.STORAGE_BUCKET || "evaluacosas-entregas";
const FIRESTORE_COLLECTION = process.env.FIRESTORE_COLLECTION || "submits";
const GITHUB_REPO = process.env.GITHUB_REPO || ""; // "owner/name" — vacío = sink deshabilitado
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ""; // PAT con scope repo
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const SHARED_SECRET = process.env.SHARED_SECRET || "";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "submits";

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || "";
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID || "";

const firestore = new Firestore();
const storage = new Storage();
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
  : null;

function setCors(res, origin) {
  if (!ORIGIN_ALLOWLIST.length || ORIGIN_ALLOWLIST.includes("*") || ORIGIN_ALLOWLIST.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Submit-Secret");
  res.setHeader("Access-Control-Max-Age", "600");
}

app.options(/.*/, (req, res) => {
  setCors(res, req.headers.origin || "");
  res.status(204).end();
});

app.get("/health", (req, res) => {
  setCors(res, req.headers.origin || "");
  res.json({
    status: "ok",
    service: "evaluacosas-submit-handler",
    version: "1.1.0",
    sinks: {
      cloudStorage: { enabled: true, bucket: BUCKET },
      firestore: { enabled: true, collection: FIRESTORE_COLLECTION },
      github: { enabled: Boolean(GITHUB_REPO && GITHUB_TOKEN), repo: GITHUB_REPO || null, branch: GITHUB_BRANCH },
      supabase: { enabled: Boolean(supabase), table: SUPABASE_TABLE },
      linear: { enabled: Boolean(LINEAR_API_KEY && LINEAR_TEAM_ID), team: LINEAR_TEAM_ID || null }
    }
  });
});

app.post("/submit", async (req, res) => {
  setCors(res, req.headers.origin || "");
  try {
    if (SHARED_SECRET && req.headers["x-submit-secret"] !== SHARED_SECRET) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const data = req.body;
    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "invalid_body" });
    }
    const schema = String(data.schema || "");
    if (!schema.startsWith("tlp.")) {
      return res.status(400).json({ error: "invalid_schema", got: schema });
    }

    const studentName = sanitize(data.student?.["student-name"] || "estudiante");
    const studentEmail = String(data.student?.["student-email"] || "").trim();
    const studentDate = sanitize(data.student?.["student-date"] || new Date().toISOString().slice(0, 10));
    const appSlug = sanitize(data.assessment?.slug || schema.split(".").slice(1, 3).join("-") || "app");
    const ts = Date.now();
    const docId = `${appSlug}__${studentName}__${studentDate}__${ts}`;
    const filename = `${docId}.json`;
    const path = `${appSlug}/${filename}`;

    const meta = {
      schema,
      schemaVersion: data.schemaVersion || null,
      institution: data.institution || null,
      course: data.course || null,
      grade: data.grade || null,
      assessmentTitle: data.assessment?.title || null,
      app: appSlug,
      student: {
        name: data.student?.["student-name"] || null,
        id: data.student?.["student-id"] || null,
        email: studentEmail || null,
        section: data.student?.["student-section"] || null,
        date: data.student?.["student-date"] || null,
        teacher: data.student?.["teacher-name"] || null
      },
      analytics: {
        substantiveAnswers: data.analytics?.substantiveAnswers || 0,
        emptyAnswers: data.analytics?.emptyAnswers || 0,
        completeMinLength: data.analytics?.completeMinLength || null,
        preGradeScore: data.analytics?.preGrade?.totalScore ?? null,
        preGradePercentage: data.analytics?.preGrade?.percentage ?? null,
        preGradePassing: data.analytics?.preGrade?.passingHeuristic ?? null,
        preGradeLevel: data.analytics?.preGrade?.preliminaryLevel?.label ?? null
      },
      submittedAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      payloadSize: JSON.stringify(data).length,
      filename,
      path,
      docId
    };

    const sinks = await Promise.allSettled([
      writeToCloudStorage(path, data, meta),
      writeToFirestore(docId, data, meta),
      writeToGitHub(path, data, meta),
      writeToSupabase(docId, data, meta),
      writeToLinear(docId, data, meta)
    ]);

    const summary = {
      cloudStorage: extractResult(sinks[0]),
      firestore: extractResult(sinks[1]),
      github: extractResult(sinks[2]),
      supabase: extractResult(sinks[3]),
      linear: extractResult(sinks[4])
    };

    const anyOk = Object.values(summary).some((s) => s.ok);
    if (!anyOk) {
      return res.status(500).json({ error: "all_sinks_failed", summary, docId, filename });
    }

    return res.json({ ok: true, docId, filename, path, summary });
  } catch (err) {
    console.error("submit_error", err?.message || err);
    return res.status(500).json({ error: "submit_failed", detail: String(err?.message || err) });
  }
});

async function writeToCloudStorage(path, data, meta) {
  const bucket = storage.bucket(BUCKET);
  const file = bucket.file(path);
  const buf = Buffer.from(JSON.stringify(data, null, 2));
  await file.save(buf, {
    contentType: "application/json",
    metadata: {
      metadata: {
        student: meta.student.name || "",
        email: meta.student.email || "",
        app: meta.app,
        date: meta.student.date || "",
        teacher: meta.student.teacher || ""
      },
      cacheControl: "private, max-age=0, no-cache"
    },
    resumable: false
  });
  return { ok: true, sink: "cloudStorage", uri: `gs://${BUCKET}/${path}` };
}

async function writeToFirestore(docId, data, meta) {
  const docRef = firestore.collection(FIRESTORE_COLLECTION).doc(docId);
  await docRef.set({
    ...meta,
    payload: data
  });
  return { ok: true, sink: "firestore", docPath: docRef.path };
}

async function writeToGitHub(path, data, meta) {
  if (!GITHUB_REPO || !GITHUB_TOKEN) return { ok: false, sink: "github", reason: "disabled" };
  const [owner, repo] = GITHUB_REPO.split("/");
  if (!owner || !repo) return { ok: false, sink: "github", reason: "invalid_repo" };
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
  const message = `submit: ${meta.app} · ${meta.student.name || "?"} · ${meta.student.date || ""}`;
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content,
    branch: GITHUB_BRANCH,
    committer: { name: "evaluacosas-submit", email: "evaluacosas-submit@thelaunchpadtlplabsuniverse.iam.gserviceaccount.com" },
    author: { name: meta.student.name || "estudiante", email: meta.student.email || "noreply@thelaunchpadtlp.education" }
  });
  return { ok: true, sink: "github", repo: GITHUB_REPO, path, branch: GITHUB_BRANCH };
}

async function writeToSupabase(docId, data, meta) {
  if (!supabase) return { ok: false, sink: "supabase", reason: "disabled" };
  const row = {
    doc_id: docId,
    app: meta.app,
    schema: meta.schema,
    schema_version: meta.schemaVersion,
    student_name: meta.student.name,
    student_id: meta.student.id,
    student_email: meta.student.email,
    student_section: meta.student.section,
    student_date: meta.student.date,
    teacher_name: meta.student.teacher,
    institution: meta.institution,
    course: meta.course,
    grade: meta.grade,
    assessment_title: meta.assessmentTitle,
    substantive_answers: meta.analytics.substantiveAnswers,
    empty_answers: meta.analytics.emptyAnswers,
    pre_grade_score: meta.analytics.preGradeScore,
    pre_grade_percentage: meta.analytics.preGradePercentage,
    pre_grade_passing: meta.analytics.preGradePassing,
    pre_grade_level: meta.analytics.preGradeLevel,
    payload_size: meta.payloadSize,
    filename: meta.filename,
    path: meta.path,
    submitted_at: meta.submittedAt,
    payload: data,
    graded_status: "pending"
  };
  const { error } = await supabase.from(SUPABASE_TABLE).upsert(row, { onConflict: "doc_id" });
  if (error) throw new Error(`supabase: ${error.message}`);
  return { ok: true, sink: "supabase", table: SUPABASE_TABLE, row: docId };
}

async function writeToLinear(docId, data, meta) {
  if (!LINEAR_API_KEY || !LINEAR_TEAM_ID) return { ok: false, sink: "linear", reason: "disabled" };
  const studentName = meta.student.name || "estudiante";
  const studentEmail = meta.student.email || "";
  const teacherName = meta.student.teacher || "";
  const pre = meta.analytics.preGradePercentage != null ? `${meta.analytics.preGradePercentage}%` : "—";
  const preLevel = meta.analytics.preGradeLevel || "—";
  const passing = meta.analytics.preGradePassing ? "✅ supera 80%" : "⚠️ no supera 80%";
  const description = `**Entrega automática desde evaluacosas**

| Campo | Valor |
|-------|-------|
| App | ${meta.app} |
| Estudiante | ${studentName} |
| Email | ${studentEmail} |
| Docente | ${teacherName} |
| Sección | ${meta.student.section || "—"} |
| Fecha | ${meta.student.date || "—"} |
| Pre-calificación heurística | ${pre} (${preLevel}) — ${passing} |
| Preguntas sustantivas | ${meta.analytics.substantiveAnswers} |
| Vacías | ${meta.analytics.emptyAnswers} |
| docId | \`${docId}\` |

**Sinks de almacenamiento:**
- Cloud Storage: \`gs://${BUCKET}/${meta.path}\`
- Firestore: \`${FIRESTORE_COLLECTION}/${docId}\`
${GITHUB_REPO ? `- GitHub: [${GITHUB_REPO}/${meta.path}](https://github.com/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${meta.path})` : ""}
${supabase ? `- Supabase: ${SUPABASE_URL}/project/sql/new (table: ${SUPABASE_TABLE}, doc_id=${docId})` : ""}

**Próximo paso:** mover este Issue a "In Progress" cuando empieces a calificar, y "Done" cuando termines.`;

  const title = `[${meta.app}] ${studentName} · ${meta.student.date || ""}`;
  const labelInput = `app:${meta.app},status:pending`;
  const query = `mutation IssueCreate($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier url } } }`;
  const variables = {
    input: {
      teamId: LINEAR_TEAM_ID,
      title,
      description,
      priority: 3
    }
  };
  const resp = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": LINEAR_API_KEY },
    body: JSON.stringify({ query, variables })
  });
  const j = await resp.json();
  if (!j.data?.issueCreate?.success) {
    throw new Error(`linear: ${JSON.stringify(j.errors || j)}`);
  }
  return { ok: true, sink: "linear", issueId: j.data.issueCreate.issue.id, identifier: j.data.issueCreate.issue.identifier, url: j.data.issueCreate.issue.url };
}

function extractResult(settled) {
  if (settled.status === "fulfilled") return settled.value;
  return { ok: false, error: String(settled.reason?.message || settled.reason) };
}

function sanitize(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 80) || "unknown";
}

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`evaluacosas-submit-handler listening on :${port}`);
  console.log(`  ORIGIN_ALLOWLIST=${ORIGIN_ALLOWLIST.join(",") || "(open)"}`);
  console.log(`  BUCKET=${BUCKET}`);
  console.log(`  FIRESTORE_COLLECTION=${FIRESTORE_COLLECTION}`);
  console.log(`  GITHUB=${GITHUB_REPO || "(disabled)"} branch=${GITHUB_BRANCH}`);
  console.log(`  SUPABASE=${supabase ? SUPABASE_URL : "(disabled)"} table=${SUPABASE_TABLE}`);
  console.log(`  LINEAR=${LINEAR_TEAM_ID || "(disabled)"}`);
});
