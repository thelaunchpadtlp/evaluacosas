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
import { OAuth2Client } from "google-auth-library";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.disable("x-powered-by"); // Sprint 36: no info leak

// ============================================================
// SPRINT 32 — Audit log + rate limiting middleware
// ============================================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 min
const RATE_LIMIT_MAX_PER_IP = 100;       // 100 req/min per IP
const RATE_LIMIT_MAX_ADMIN = 200;        // 200 req/min for admin endpoints (slightly higher)
const _ipBuckets = new Map(); // ip → [{ts, count}]

function getClientIp(req) {
  const xf = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return xf || req.socket?.remoteAddress || "unknown";
}

function rateLimitCheck(req, max = RATE_LIMIT_MAX_PER_IP) {
  const ip = getClientIp(req);
  const now = Date.now();
  const bucket = _ipBuckets.get(ip) || { resetAt: now + RATE_LIMIT_WINDOW_MS, count: 0 };
  if (now > bucket.resetAt) { bucket.resetAt = now + RATE_LIMIT_WINDOW_MS; bucket.count = 0; }
  bucket.count += 1;
  _ipBuckets.set(ip, bucket);
  // Cleanup occasional
  if (_ipBuckets.size > 5000) {
    for (const [k, v] of _ipBuckets) if (now > v.resetAt) _ipBuckets.delete(k);
  }
  return bucket.count <= max;
}

function rateLimitMiddleware(max = RATE_LIMIT_MAX_PER_IP) {
  return (req, res, next) => {
    if (!rateLimitCheck(req, max)) {
      const retryAfter = 60;
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({ error: "rate_limited", retry_after_seconds: retryAfter });
    }
    next();
  };
}

function auditLog(req, eventName, extra = {}) {
  // Estructured log line. NO se loguean tokens ni payload sensible.
  const entry = {
    t: new Date().toISOString(),
    event: eventName,
    ip: getClientIp(req),
    method: req.method,
    path: req.path,
    ua: (req.headers["user-agent"] || "").slice(0, 120),
    request_id: req.headers["x-cloud-trace-context"] || req.headers["x-request-id"] || "",
    ...extra
  };
  console.log("AUDIT", JSON.stringify(entry));
  // Persist to Firestore async (best-effort)
  persistAudit(entry).catch(() => {});
}
// Rate limit global generoso para todo
app.use(rateLimitMiddleware(RATE_LIMIT_MAX_PER_IP));

// ────────────────────────────────────────────────────────────
// Sprint 36: per-email rate limit + failed auth lockout
// ────────────────────────────────────────────────────────────
const _emailBuckets = new Map(); // email → {resetAt, count}
const _failedAttempts = new Map(); // email|ip → {count, lockUntil}
const RATE_LIMIT_PER_EMAIL = 60; // 60 admin reqs/min per teacher
const LOCKOUT_THRESHOLD = 5; // 5 failed attempts
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 min lockout

function rateLimitByEmail(email) {
  if (!email) return true;
  const now = Date.now();
  const bucket = _emailBuckets.get(email) || { resetAt: now + RATE_LIMIT_WINDOW_MS, count: 0 };
  if (now > bucket.resetAt) { bucket.resetAt = now + RATE_LIMIT_WINDOW_MS; bucket.count = 0; }
  bucket.count += 1;
  _emailBuckets.set(email, bucket);
  return bucket.count <= RATE_LIMIT_PER_EMAIL;
}

function recordFailedAttempt(key) {
  const now = Date.now();
  const r = _failedAttempts.get(key) || { count: 0, lockUntil: 0 };
  r.count += 1;
  if (r.count >= LOCKOUT_THRESHOLD) r.lockUntil = now + LOCKOUT_DURATION_MS;
  _failedAttempts.set(key, r);
}
function isLockedOut(key) {
  const r = _failedAttempts.get(key);
  if (!r) return false;
  if (Date.now() > r.lockUntil) { _failedAttempts.delete(key); return false; }
  return r.lockUntil > Date.now();
}
function clearFailedAttempts(key) { _failedAttempts.delete(key); }

// Audit log persistente a Firestore (best-effort, no bloquea)
async function persistAudit(entry) {
  try {
    const fs = (await import("@google-cloud/firestore")).Firestore;
    if (!global.__auditFs) global.__auditFs = new fs();
    await global.__auditFs.collection("audit_log").add({ ...entry, _ts: new Date() });
  } catch (e) {
    // Solo log a stdout si Firestore falla (no bloquear el request)
  }
}

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

const ALLOWED_HD = (process.env.ALLOWED_HD || "thelaunchpadtlp.education").split(",").map((s) => s.trim()).filter(Boolean);
const ADMIN_OAUTH_CLIENT_ID = process.env.ADMIN_OAUTH_CLIENT_ID || "";
const oauthClient = ADMIN_OAUTH_CLIENT_ID ? new OAuth2Client(ADMIN_OAUTH_CLIENT_ID) : null;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Submit-Secret, X-Gemini-Access-Token");
  res.setHeader("Access-Control-Expose-Headers", "X-Doc-Id, X-Idempotency-Key");
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
      linear: { enabled: Boolean(LINEAR_API_KEY && LINEAR_TEAM_ID), team: LINEAR_TEAM_ID || null },
      geminiAutograde: { enabled: Boolean(GEMINI_API_KEY), model: GEMINI_MODEL }
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
    // Idempotency key: priorizamos clientDocId si lo manda el cliente (re-submit del mismo file).
    // Si no, generamos uno con UUID + timestamp para evitar colisión cross-millisegundo.
    const clientDocId = String(data.clientDocId || "").trim();
    const uuidShort = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
    const docId = clientDocId && /^[\w-]{8,128}$/.test(clientDocId)
      ? sanitize(clientDocId).slice(0, 128)
      : `${appSlug}__${studentName}__${studentDate}__${ts}__${uuidShort}`;
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

    // Auto-grade con Gemini Flash (free tier 1500 req/día del proyecto TLP).
    // Async, no bloquea respuesta. Si falla, no afecta el submit.
    // El docente puede re-graduar bajo demanda desde el dashboard con SU
    // OAuth token Workspace (POST /admin/grade/:docId) si quiere usar otra cuota.
    if (GEMINI_API_KEY) {
      runGeminiGrade(docId, data, summary).catch((err) => {
        console.warn("gemini_grade_async_failed", docId, err?.message || err);
      });
    }

    return res.json({ ok: true, docId, filename, path, summary });
  } catch (err) {
    console.error("submit_error", err?.message || err);
    return res.status(500).json({ error: "submit_failed", detail: String(err?.message || err) });
  }
});

const GEMINI_GRADER_PROMPT = `Sos un calificador académico experto que aplica el SKILL TLP/Piqui — Parte II (Calificación, Retroalimentación y Análisis) — al instrumento de evaluación incluido como JSON al final.

Reglas obligatorias:
1. Criterio binario: cada pregunta vale 1 punto exacto. Sin medios puntos. Una respuesta correcta recibe 1/1; incorrecta, vaga, contradictoria o no verificable recibe 0/1.
2. Identificación documental por cada ítem: número, eje, tipo de consigna, nivel cognitivo, transcripción literal del enunciado y de la respuesta, respuesta esperada, veredicto, puntaje, análisis breve, corrección si corresponde, comentario didáctico.
3. Errores ortográficos NO se penalizan si el concepto es inequívoco; sí cuando cambian el concepto.
4. "Correcta con matiz" cuando el núcleo es correcto pero hay imprecisión menor; nunca para regalar puntos.
5. Niveles de desempeño TLP: 95-100 Excelente · 90-94 Muy alto · 85-89 Bueno · 80-84 Aceptable (línea de aprobación) · 70-79 No alcanzado por margen estrecho · 60-69 No alcanzado · <60 Insuficiente.
6. NO uses lenguaje de IA ("como modelo", "según mi análisis", etc.). Salida lista para pegar como retroalimentación institucional.

El JSON adjunto incluye blueprint (must, avoid, cognitiveLevel, type) por pregunta + respuestas del estudiante + pre-calificación heurística (preGrade) que NO sustituye tu juicio.

Formato de salida: documento Markdown limpio, listo para pegar a Google Docs / Classroom. Estructura mínima:

# Calificación · {institución} · {curso} · {grado}
**Estudiante:** {nombre} ({email})
**Instrumento:** {título}
**Resultado:** X/80 · YY% · Nivel
**Línea de aprobación TLP (80%):** ✓ supera / ✗ no supera

## Resumen general
[2-3 oraciones de diagnóstico ejecutivo]

## Corrección detallada por ítem
[Para cada uno de los 80 ítems: número, veredicto, puntaje, análisis breve. Sé conciso pero específico.]

## Resumen por eje
- Eje I: X/27
- Eje II: X/27
- Eje III: X/26
- Total: X/80 · YY%

## Fortalezas observadas
[3-5 fortalezas específicas]

## Aspectos por mejorar
[3-5 áreas concretas]

## Recomendaciones
[Accionables, no genéricas]

## Comentario final
[Humano, profesional, motivador, específico]

JSON DEL EXAMEN:
\`\`\`json
{{JSON}}
\`\`\``;

async function runGeminiGrade(docId, data, sinkSummary, userAccessToken = "") {
  const promptBody = GEMINI_GRADER_PROMPT.replace("{{JSON}}", JSON.stringify(data, null, 2));
  // Si tenemos OAuth access token del docente: usarlo (cuota Workspace).
  // Si no: usar API Key del proyecto (free tier 1500 req/día).
  const useOauth = Boolean(userAccessToken);
  const url = useOauth
    ? `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`
    : `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const headers = useOauth
    ? { "Content-Type": "application/json", Authorization: `Bearer ${userAccessToken}` }
    : { "Content-Type": "application/json" };
  const ctrl = new AbortController();
  const tm = setTimeout(() => ctrl.abort(), 120000);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptBody }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
      }),
      signal: ctrl.signal
    });
    clearTimeout(tm);
    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`Gemini HTTP ${r.status}: ${errText.slice(0, 300)}`);
    }
    const j = await r.json();
    const md = j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!md) throw new Error("empty_response");
    // Persistir el grading en Firestore (collection grades/<docId>)
    await firestore.collection("grades").doc(docId).set({
      docId,
      gradedAt: new Date().toISOString(),
      gradedBy: "gemini",
      model: GEMINI_MODEL,
      markdown: md,
      tokensIn: j?.usageMetadata?.promptTokenCount ?? null,
      tokensOut: j?.usageMetadata?.candidatesTokenCount ?? null
    }).catch((err) => console.warn("grades_firestore_save_failed", err?.message || err));

    // Linear comment con el grading (si Linear sink fue OK)
    const linearOk = sinkSummary?.linear?.ok && sinkSummary.linear.issueId && LINEAR_API_KEY;
    if (linearOk) {
      const issueId = sinkSummary.linear.issueId;
      const truncatedMd = md.slice(0, 65000); // Linear max body
      const mutation = `mutation CommentCreate($input: CommentCreateInput!) { commentCreate(input: $input) { success comment { id } } }`;
      const variables = {
        input: {
          issueId,
          body: `**Pre-calificación automática Gemini ${GEMINI_MODEL}** (preliminar — verificación humana requerida):\n\n${truncatedMd}`
        }
      };
      try {
        await fetch("https://api.linear.app/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: LINEAR_API_KEY },
          body: JSON.stringify({ query: mutation, variables })
        });
      } catch (err) { console.warn("linear_comment_failed", err?.message || err); }
    }

    console.log("gemini_grade_ok", docId, `${md.length} chars`);
    return { ok: true, docId, length: md.length };
  } finally {
    clearTimeout(tm);
  }
}

async function writeToCloudStorage(path, data, meta) {
  const bucket = storage.bucket(BUCKET);
  const file = bucket.file(path);
  // Pre-check existence (idempotent: if exists with same content, skip rewrite).
  const [exists] = await file.exists();
  if (exists) {
    return { ok: true, sink: "cloudStorage", uri: `gs://${BUCKET}/${path}`, idempotent: "exists" };
  }
  const buf = Buffer.from(JSON.stringify(data, null, 2));
  await file.save(buf, {
    contentType: "application/json",
    metadata: {
      metadata: {
        student: meta.student.name || "",
        email: meta.student.email || "",
        app: meta.app,
        date: meta.student.date || "",
        teacher: meta.student.teacher || "",
        docId: meta.docId
      },
      cacheControl: "private, max-age=0, no-cache"
    },
    resumable: false,
    // ifGenerationMatch:0 hace la escritura atómica si NO existe; rechaza si ya hay objeto.
    preconditionOpts: { ifGenerationMatch: 0 }
  });
  return { ok: true, sink: "cloudStorage", uri: `gs://${BUCKET}/${path}`, idempotent: "created" };
}

async function writeToFirestore(docId, data, meta) {
  const docRef = firestore.collection(FIRESTORE_COLLECTION).doc(docId);
  // Idempotent: si el doc ya existe con el mismo docId, no overwrite.
  const snapshot = await docRef.get();
  if (snapshot.exists) {
    return { ok: true, sink: "firestore", docPath: docRef.path, idempotent: "exists" };
  }
  await docRef.create({ ...meta, payload: data });
  return { ok: true, sink: "firestore", docPath: docRef.path, idempotent: "created" };
}

async function writeToGitHub(path, data, meta) {
  if (!GITHUB_REPO || !GITHUB_TOKEN) return { ok: false, sink: "github", reason: "disabled" };
  const [owner, repo] = GITHUB_REPO.split("/");
  if (!owner || !repo) return { ok: false, sink: "github", reason: "invalid_repo" };
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  // Idempotent: si el archivo ya existe con el mismo path, omitir creación.
  try {
    await octokit.repos.getContent({ owner, repo, path, ref: GITHUB_BRANCH });
    return { ok: true, sink: "github", repo: GITHUB_REPO, path, branch: GITHUB_BRANCH, idempotent: "exists" };
  } catch (err) {
    if (err.status !== 404) throw err;
  }
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
  const message = `submit: ${meta.app} · ${meta.student.name || "?"} · ${meta.student.date || ""}`;
  await octokit.repos.createOrUpdateFileContents({
    owner, repo, path, message, content, branch: GITHUB_BRANCH,
    committer: { name: "evaluacosas-submit", email: "evaluacosas-submit@thelaunchpadtlplabsuniverse.iam.gserviceaccount.com" },
    author: { name: meta.student.name || "estudiante", email: meta.student.email || "noreply@thelaunchpadtlp.education" }
  });
  return { ok: true, sink: "github", repo: GITHUB_REPO, path, branch: GITHUB_BRANCH, idempotent: "created" };
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
  // Upsert idempotente: si doc_id ya existe NO sobrescribimos (preservamos el estado del docente
  // que pudo haber actualizado graded_status, graded_score, etc.).
  const existing = await supabase.from(SUPABASE_TABLE).select("doc_id").eq("doc_id", docId).maybeSingle();
  if (existing?.data?.doc_id) {
    return { ok: true, sink: "supabase", table: SUPABASE_TABLE, row: docId, idempotent: "exists" };
  }
  const { error } = await supabase.from(SUPABASE_TABLE).insert(row);
  if (error) throw new Error(`supabase: ${error.message}`);
  return { ok: true, sink: "supabase", table: SUPABASE_TABLE, row: docId, idempotent: "created" };
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

  // Idempotency en Linear: agregamos el docId AL INICIO del title (entre llaves)
  // — eso es indexable directamente por issueSearch query, mucho más confiable
  // que buscar substring en description (que puede tener problemas con _ o -).
  const docIdTag = `[${docId}]`;
  const title = `${docIdTag} ${studentName} · ${meta.student.date || ""}`;
  // Listamos issues del team con filtro por title exact-prefix usando issues + filter.
  const searchQuery = `query Search($filter: IssueFilter!) { issues(filter: $filter, first: 5) { nodes { id identifier url title } } }`;
  const searchResp = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": LINEAR_API_KEY },
    body: JSON.stringify({
      query: searchQuery,
      variables: { filter: { title: { contains: docIdTag }, team: { id: { eq: LINEAR_TEAM_ID } } } }
    })
  });
  const searchJ = await searchResp.json();
  const existing = (searchJ.data?.issues?.nodes || []).find((n) => typeof n.title === "string" && n.title.includes(docIdTag));
  if (existing) {
    return { ok: true, sink: "linear", issueId: existing.id, identifier: existing.identifier, url: existing.url, idempotent: "exists" };
  }

  const mutation = `mutation IssueCreate($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier url } } }`;
  const variables = { input: { teamId: LINEAR_TEAM_ID, title, description, priority: 3 } };
  const resp = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": LINEAR_API_KEY },
    body: JSON.stringify({ query: mutation, variables })
  });
  const j = await resp.json();
  if (!j.data?.issueCreate?.success) {
    throw new Error(`linear: ${JSON.stringify(j.errors || j)}`);
  }
  return { ok: true, sink: "linear", issueId: j.data.issueCreate.issue.id, identifier: j.data.issueCreate.issue.identifier, url: j.data.issueCreate.issue.url, idempotent: "created" };
}

function extractResult(settled) {
  if (settled.status === "fulfilled") return settled.value;
  return { ok: false, error: String(settled.reason?.message || settled.reason) };
}

function sanitize(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 80) || "unknown";
}

// Admin auth middleware: valida Google ID token (Bearer) + restricción de domain.
// Sprint 32: rate limiting estricto + audit log de cada acceso.
async function requireAdmin(req, res, next) {
  setCors(res, req.headers.origin || "");
  const ip = getClientIp(req);
  // Lockout check primero (por IP) — evita ataques de fuerza bruta
  if (isLockedOut(ip)) {
    auditLog(req, "admin_locked_out_ip");
    return res.status(429).json({ error: "locked_out", retry_after_seconds: 900 });
  }
  // Rate limit estricto admin (200 req/min IP)
  if (!rateLimitCheck(req, RATE_LIMIT_MAX_ADMIN)) {
    auditLog(req, "admin_rate_limited");
    return res.status(429).json({ error: "rate_limited" });
  }
  try {
    if (!oauthClient) {
      auditLog(req, "admin_not_configured");
      return res.status(503).json({ error: "admin_not_configured" });
    }
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!token) {
      auditLog(req, "admin_missing_token");
      recordFailedAttempt(ip);
      return res.status(401).json({ error: "missing_token" });
    }
    const ticket = await oauthClient.verifyIdToken({ idToken: token, audience: ADMIN_OAUTH_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      auditLog(req, "admin_email_not_verified", { email: payload?.email });
      recordFailedAttempt(ip);
      return res.status(403).json({ error: "email_not_verified" });
    }
    const hd = payload.hd || (payload.email || "").split("@").pop();
    if (!ALLOWED_HD.includes(hd)) {
      auditLog(req, "admin_domain_blocked", { email: payload.email, hd });
      recordFailedAttempt(ip);
      return res.status(403).json({ error: "domain_not_allowed", hd });
    }
    const allowedTeachers = (process.env.ALLOWED_TEACHERS || "").split(",").map(s => s.trim()).filter(Boolean);
    if (allowedTeachers.length && !allowedTeachers.includes(payload.email)) {
      auditLog(req, "admin_email_not_authorized", { email: payload.email });
      recordFailedAttempt(ip);
      return res.status(403).json({ error: "not_a_teacher" });
    }
    // Per-email rate limit (Sprint 36)
    if (!rateLimitByEmail(payload.email)) {
      auditLog(req, "admin_rate_limited_email", { email: payload.email });
      return res.status(429).json({ error: "rate_limited_email" });
    }
    req.admin = { email: payload.email, name: payload.name, picture: payload.picture, hd };
    clearFailedAttempts(ip); // auth exitoso → resetea lockout counter
    auditLog(req, "admin_auth_ok", { email: payload.email });
    next();
  } catch (err) {
    auditLog(req, "admin_auth_error", { msg: String(err?.message || err).slice(0, 120) });
    recordFailedAttempt(ip);
    return res.status(401).json({ error: "auth_failed", detail: String(err?.message || err) });
  }
}

// GET /admin/submits — lista submits desde Firestore (auth requerida)
app.get("/admin/submits", requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const app_filter = String(req.query.app || "").trim();
    const status_filter = String(req.query.status || "").trim();
    let q = firestore.collection(FIRESTORE_COLLECTION).orderBy("receivedAt", "desc").limit(limit);
    if (app_filter) q = q.where("app", "==", app_filter);
    const snap = await q.get();
    const items = [];
    snap.forEach((doc) => {
      const d = doc.data();
      items.push({
        docId: doc.id,
        app: d.app,
        institution: d.institution,
        course: d.course,
        grade: d.grade,
        assessmentTitle: d.assessmentTitle,
        student: d.student || {},
        analytics: d.analytics || {},
        receivedAt: d.receivedAt,
        submittedAt: d.submittedAt,
        filename: d.filename,
        path: d.path
      });
    });
    res.json({ ok: true, total: items.length, admin: req.admin, items });
  } catch (err) {
    console.error("admin_list_error", err?.message || err);
    res.status(500).json({ error: "list_failed", detail: String(err?.message || err) });
  }
});

// GET /admin/submit/:docId — detalle de un submit con respuestas completas
app.get("/admin/submit/:docId", requireAdmin, async (req, res) => {
  try {
    // Sprint 36: sanitización path traversal (solo alfanumerico+_-)
    const rawDocId = String(req.params.docId);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(rawDocId)) {
      auditLog(req, "admin_invalid_docid", { docId: rawDocId.slice(0, 30) });
      return res.status(400).json({ error: "invalid_docid" });
    }
    const docId = rawDocId;
    const doc = await firestore.collection(FIRESTORE_COLLECTION).doc(docId).get();
    if (!doc.exists) return res.status(404).json({ error: "not_found" });
    res.json({ ok: true, admin: req.admin, doc: doc.data() });
  } catch (err) {
    res.status(500).json({ error: "fetch_failed", detail: String(err?.message || err) });
  }
});

// GET /data-export?email=...&token=... — Sprint 36 GDPR Art. 20 portability
// El usuario puede pedir su propio export con email + token de verificación
app.get("/data-export", async (req, res) => {
  setCors(res, req.headers.origin || "");
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    const token = String(req.query.token || "").trim();
    if (!email || !token) {
      return res.status(400).json({ error: "missing_params", hint: "Necesitás email + token. Pedí token a joaquin.munoz@thelaunchpadtlp.education" });
    }
    // Verify token (HMAC-SHA256 of email + secret) to prevent enumeration
    const crypto = await import("node:crypto");
    const expected = crypto.createHmac("sha256", process.env.DSAR_SECRET || "set-DSAR_SECRET-env").update(email).digest("hex").slice(0, 32);
    if (token !== expected) {
      auditLog(req, "data_export_bad_token", { email });
      return res.status(403).json({ error: "invalid_token" });
    }
    // Snapshot all submits with this email
    const snap = await firestore.collection(FIRESTORE_COLLECTION).where("payload.student.email", "==", email).get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    auditLog(req, "data_export_ok", { email, count: docs.length });
    res.setHeader("Content-Disposition", `attachment; filename="evaluacosas-export-${email}.json"`);
    res.json({ ok: true, schema_version: "1.0", exported_at: new Date().toISOString(), email, count: docs.length, submissions: docs });
  } catch (err) {
    res.status(500).json({ error: "export_failed", detail: String(err?.message || err) });
  }
});

// GET /admin/whoami — devuelve la identidad autenticada
app.get("/admin/whoami", requireAdmin, async (req, res) => {
  res.json({ ok: true, admin: req.admin });
});

// POST /admin/grade/:docId — re-calificar con Gemini usando OAuth del docente
// Usa la cuota del Workspace de la cuenta autenticada (suscripción institucional
// del profesor) en lugar de la API Key genérica del proyecto.
app.post("/admin/grade/:docId", requireAdmin, async (req, res) => {
  try {
    const docId = String(req.params.docId);
    const doc = await firestore.collection(FIRESTORE_COLLECTION).doc(docId).get();
    if (!doc.exists) return res.status(404).json({ error: "not_found" });
    const data = doc.data().payload;
    // Auth header del request original lleva el ID token del docente; pero para
    // llamar Gemini API necesitamos un access token (no ID token). El frontend
    // debe haber pedido el access token con scope generative-language al login.
    // Si no se provee X-Gemini-Access-Token, fallback a la API Key del proyecto.
    const userAccessToken = req.headers["x-gemini-access-token"] || "";
    const result = await runGeminiGrade(docId, data, {}, userAccessToken);
    res.json({ ok: true, docId, ...result, gradedBy: req.admin.email, source: userAccessToken ? "workspace-oauth" : "project-api-key" });
  } catch (err) {
    res.status(500).json({ error: "grade_failed", detail: String(err?.message || err) });
  }
});

// GET /cedula/:cedula — proxy multi-proveedor TSE Costa Rica con cache 24h en Firestore
const APIFYCR_TOKEN = process.env.APIFYCR_TOKEN || "";
const CEDULA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

app.get("/cedula/:cedula", async (req, res) => {
  setCors(res, req.headers.origin || "");
  try {
    const raw = String(req.params.cedula || "").replace(/\D+/g, "");
    if (!raw || raw.length < 9 || raw.length > 12) {
      return res.status(400).json({ error: "invalid_cedula", got: raw });
    }
    // Cache check
    const cacheRef = firestore.collection("cedula_cache").doc(raw);
    const cached = await cacheRef.get();
    if (cached.exists) {
      const data = cached.data();
      if (data.cachedAt && (Date.now() - new Date(data.cachedAt).getTime() < CEDULA_CACHE_TTL_MS)) {
        return res.json({ ...data.payload, source: `${data.payload.source}+cache` });
      }
    }
    // Try providers in order
    let result = null;
    if (APIFYCR_TOKEN) {
      try { result = await lookupApifycr(raw); }
      catch (err) { console.warn("apifycr_failed:", err?.message || err); }
    }
    if (!result) {
      try { result = await lookupGometa(raw); }
      catch (err) { console.warn("gometa_failed:", err?.message || err); }
    }
    if (!result) return res.status(502).json({ error: "no_provider_responded" });

    // Cache result
    await cacheRef.set({ payload: result, cachedAt: new Date().toISOString() }).catch(() => {});
    return res.json(result);
  } catch (err) {
    console.error("cedula_lookup_error", err?.message || err);
    return res.status(500).json({ error: "lookup_failed", detail: String(err?.message || err) });
  }
});

async function lookupApifycr(cedula) {
  const ctrl = new AbortController();
  const tm = setTimeout(() => ctrl.abort(), 10000);
  try {
    // tse.apifycr.com (probable endpoint Laravel-style con Bearer token)
    const r = await fetch(`https://tse.apifycr.com/api/cedula/${cedula}`, {
      headers: { Authorization: `Bearer ${APIFYCR_TOKEN}`, Accept: "application/json" },
      signal: ctrl.signal
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const item = j?.data || j?.result || j;
    return normalize({
      cedula,
      firstName: item.nombre || item.firstname || item.first_name || "",
      lastname1: item.primer_apellido || item.lastname1 || item.first_surname || "",
      lastname2: item.segundo_apellido || item.lastname2 || item.second_surname || "",
      fullName: item.nombre_completo || item.fullname || ""
    }, "apifycr");
  } finally {
    clearTimeout(tm);
  }
}

async function lookupGometa(cedula) {
  const ctrl = new AbortController();
  const tm = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(`https://apis.gometa.org/cedulas/${cedula}`, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const item = (j?.results && j.results[0]) || j;
    return normalize({
      cedula,
      firstName: item.firstname || item.nombre || "",
      lastname1: item.lastname1 || item.primer_apellido || "",
      lastname2: item.lastname2 || item.segundo_apellido || "",
      fullName: item.fullname || item.nombre_completo || ""
    }, "gometa");
  } finally {
    clearTimeout(tm);
  }
}

function normalize({ cedula, firstName, lastname1, lastname2, fullName }, source) {
  const nameTokens = String(firstName).trim().split(/\s+/).filter(Boolean);
  const ff = nameTokens[0] || "";
  const sn = nameTokens.slice(1).join(" ") || "";
  const composedFullName = (fullName || `${firstName} ${lastname1} ${lastname2}`).trim().replace(/\s+/g, " ");
  return {
    ok: true,
    cedula,
    firstName: ff,
    secondName: sn,
    firstSurname: lastname1.trim(),
    secondSurname: lastname2.trim(),
    fullName: composedFullName,
    source
  };
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
