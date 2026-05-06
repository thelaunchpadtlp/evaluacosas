// evaluacosas — Submit Handler (Cloud Run)
// Recibe POSTs con el JSON de un submit, lo valida mínimamente, y lo sube a la
// carpeta de Drive configurada (ALLOWED_DRIVE_FOLDER). La identidad es la del
// service account del Cloud Run (con scope drive.file). El archivo queda con
// nombre legible y los metadatos del submit.

import express from "express";
import { google } from "googleapis";

const app = express();
app.use(express.json({ limit: "2mb" }));

const ORIGIN_ALLOWLIST = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
const DEFAULT_FOLDER = process.env.DRIVE_FOLDER_ID || "";   // Carpeta donde caen los submits.
const FOLDER_BY_APP = (() => {
  // Permite mapeo opcional por app: APPS_FOLDERS=biologia-10:1abc...,otra-app:2def...
  const raw = process.env.APPS_FOLDERS || "";
  const map = {};
  raw.split(",").forEach((entry) => {
    const [k, v] = entry.split(":").map((s) => s.trim());
    if (k && v) map[k] = v;
  });
  return map;
})();
const SHARED_SECRET = process.env.SHARED_SECRET || ""; // opcional: requiere header X-Submit-Secret

function setCors(res, origin) {
  if (!ORIGIN_ALLOWLIST.length || ORIGIN_ALLOWLIST.includes("*") || ORIGIN_ALLOWLIST.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Submit-Secret");
  res.setHeader("Access-Control-Max-Age", "600");
}

app.options("*", (req, res) => {
  setCors(res, req.headers.origin || "");
  res.status(204).end();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "evaluacosas-submit-handler", version: "1.0.0" });
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
    const studentDate = sanitize(data.student?.["student-date"] || new Date().toISOString().slice(0, 10));
    const appSlug = sanitize(data.assessment?.slug || schema.split(".").slice(1, 3).join("-") || "app");
    const folderId = FOLDER_BY_APP[appSlug] || DEFAULT_FOLDER;
    if (!folderId) {
      return res.status(500).json({ error: "no_folder_configured" });
    }

    const filename = `${appSlug}__${studentName}__${studentDate}__${Date.now()}.json`;
    const auth = await google.auth.getClient({ scopes: ["https://www.googleapis.com/auth/drive.file"] });
    const drive = google.drive({ version: "v3", auth });

    const file = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
        mimeType: "application/json",
        description: `evaluacosas submit · app=${appSlug} · student=${studentName} · date=${studentDate}`
      },
      media: {
        mimeType: "application/json",
        body: JSON.stringify(data, null, 2)
      },
      fields: "id, name, webViewLink, webContentLink, parents, createdTime"
    });

    return res.json({
      ok: true,
      filename,
      driveFileId: file.data.id,
      driveLink: file.data.webViewLink || null,
      createdTime: file.data.createdTime
    });
  } catch (err) {
    console.error("submit_error", err?.message || err);
    return res.status(500).json({ error: "submit_failed", detail: String(err?.message || err) });
  }
});

function sanitize(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 80) || "unknown";
}

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`evaluacosas-submit-handler listening on :${port}`);
  console.log(`  ORIGIN_ALLOWLIST=${ORIGIN_ALLOWLIST.join(",") || "(open)"}`);
  console.log(`  DEFAULT_FOLDER=${DEFAULT_FOLDER || "(unset)"}`);
  console.log(`  APPS_FOLDERS=${Object.keys(FOLDER_BY_APP).join(",") || "(none)"}`);
});
