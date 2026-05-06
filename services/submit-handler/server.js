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

const app = express();
app.use(express.json({ limit: "2mb" }));

const ORIGIN_ALLOWLIST = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
const BUCKET = process.env.STORAGE_BUCKET || "evaluacosas-entregas";
const FIRESTORE_COLLECTION = process.env.FIRESTORE_COLLECTION || "submits";
const GITHUB_REPO = process.env.GITHUB_REPO || ""; // "owner/name" — vacío = sink deshabilitado
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ""; // PAT con scope repo
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const SHARED_SECRET = process.env.SHARED_SECRET || "";

const firestore = new Firestore();
const storage = new Storage();

function setCors(res, origin) {
  if (!ORIGIN_ALLOWLIST.length || ORIGIN_ALLOWLIST.includes("*") || ORIGIN_ALLOWLIST.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Submit-Secret");
  res.setHeader("Access-Control-Max-Age", "600");
}

app.options("*", (req, res) => {
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
      github: { enabled: Boolean(GITHUB_REPO && GITHUB_TOKEN), repo: GITHUB_REPO || null, branch: GITHUB_BRANCH }
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
      writeToGitHub(path, data, meta)
    ]);

    const summary = {
      cloudStorage: extractResult(sinks[0]),
      firestore: extractResult(sinks[1]),
      github: extractResult(sinks[2])
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
});
