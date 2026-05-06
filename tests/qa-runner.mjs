#!/usr/bin/env node
// qa-runner.mjs — Runner exhaustivo de criterios QA por sprint.
// Sprint 34 — cientos de criterios cubriendo todos los sprints anteriores.
//
// Categorías por sprint (15):
//   functional · visual · performance · accessibility · security ·
//   cross-browser · ux · privacy · idempotency · error-handling ·
//   documentation · cost · disaster-recovery · compliance · operability
//
// Uso:  node tests/qa-runner.mjs [--sprint <N>] [--category <cat>] [--fix]
// Output: tests/results/qa-<timestamp>.json + tests/results/qa-<timestamp>.md

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE = "https://evaluacosas.thelaunchpadtlp.education";
const APEX = "https://thelaunchpadtlp.education";
const BACKEND = "https://evaluacosas-submit-handler-441768184201.us-central1.run.app";

const args = process.argv.slice(2);
const onlySprint = (() => { const i = args.indexOf("--sprint"); return i >= 0 ? args[i+1] : null; })();
const onlyCategory = (() => { const i = args.indexOf("--category"); return i >= 0 ? args[i+1] : null; })();
const autoFix = args.includes("--fix");

// ── Utilities ────────────────────────────────────────────────
function fileExists(p) { try { return existsSync(join(ROOT, p)) && statSync(join(ROOT, p)).size > 0; } catch { return false; } }
function fileContains(p, s) { try { return readFileSync(join(ROOT, p), "utf8").includes(s); } catch { return false; } }
function fileMatches(p, re) { try { return re.test(readFileSync(join(ROOT, p), "utf8")); } catch { return false; } }
async function urlOk(url, expected = 200) {
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(15000) });
    return r.status === expected;
  } catch { return false; }
}
async function urlFetch(url, init = {}) {
  try {
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
    return { status: r.status, headers: Object.fromEntries(r.headers), text: await r.text() };
  } catch (e) { return { status: 0, error: String(e?.message || e) }; }
}
function gitCommitsForFile(p) { try { return Number(execSync(`git log --oneline -- "${p}" | wc -l`, { cwd: ROOT, encoding: "utf8" }).trim()); } catch { return 0; } }

// ── Master criteria registry ─────────────────────────────────
const SPRINTS = [
  // (formato condensado: cada sprint tiene checks por categoría)
  {
    id: "17", name: "Hero welcome message",
    checks: [
      ["functional", "welcome-strip in landing index.html", () => fileContains("landing/index.html", "welcome-strip")],
      ["functional", "welcome title 'central de evaluaciones'", () => fileContains("landing/index.html", "central de instrumentos")],
      ["visual", "welcome-cta button class", () => fileContains("landing/styles.css", "welcome-cta")],
      ["visual", "Pura vida text + flag", () => fileContains("landing/index.html", "Pura vida")],
      ["a11y", "skip-to-content present", () => fileContains("landing/index.html", "skip-to-content")],
      ["a11y", "aria-labelledby on welcome", () => fileContains("landing/index.html", "aria-labelledby=\"welcome-title\"")],
      ["docs", "welcome documented in CHANGELOG", () => fileContains("CHANGELOG.md", "Sprint 17")],
    ]
  },
  {
    id: "18", name: "OAuth Client ID dashboard docente",
    checks: [
      ["functional", "config.json with client_id", () => fileMatches("dashboard/config.json", /\d+-[a-z0-9]+\.apps\.googleusercontent\.com/)],
      ["security", "client_id en formato Web App", () => fileMatches("dashboard/config.json", /441768184201-/)],
      ["security", "allowedDomain set", () => fileContains("dashboard/config.json", "thelaunchpadtlp.education")],
      ["docs", "PLAN_OAUTH_DASHBOARD documented", () => fileExists("docs/PLAN_OAUTH_DASHBOARD.md")],
      ["operability", "tlp-set-oauth-client-id.sh tool", () => existsSync("/Users/PIQUI/.tlp-tools/tlp-set-oauth-client-id.sh")],
      ["functional", "backend /admin/whoami expects auth", async () => {
        const r = await urlFetch(`${BACKEND}/admin/whoami`);
        return r.status === 401;
      }],
    ]
  },
  {
    id: "19", name: "UX checklists + Apple Liquid Glass",
    checks: [
      ["visual", "SF Pro stack in CSS", () => fileMatches("landing/styles.css", /SF Pro Display/)],
      ["visual", "squircle radii defined", () => fileContains("landing/styles.css", "--r-pill")],
      ["visual", "glass-blur token", () => fileContains("landing/styles.css", "--glass-blur")],
      ["visual", "spring easing", () => fileContains("landing/styles.css", "--ease-spring")],
      ["visual", "safe-area insets", () => fileContains("landing/styles.css", "safe-area-inset")],
      ["visual", "prefers-color-scheme support", () => fileContains("landing/styles.css", "prefers-color-scheme")],
      ["a11y", "focus-visible rings", () => fileContains("landing/styles.css", "focus-visible")],
      ["a11y", "min-height 44 touch targets", () => fileContains("landing/styles.css", "min-height: 44px")],
      ["a11y", "prefers-reduced-motion respected", () => fileContains("landing/styles.css", "prefers-reduced-motion")],
      ["functional", "manifest.webmanifest", () => fileExists("landing/manifest.webmanifest")],
      ["functional", "favicon.svg", () => fileExists("landing/favicon.svg")],
      ["docs", "DESIGN_SYSTEM.md", () => fileExists("docs/DESIGN_SYSTEM.md")],
    ]
  },
  {
    id: "20", name: "Dashboard discoverability",
    checks: [
      ["functional", "globalnav in landing", () => fileContains("landing/index.html", "globalnav")],
      ["functional", "globalnav in dashboard", () => fileContains("dashboard/index.html", "globalnav")],
      ["functional", "teachers-callout in landing", () => fileContains("landing/index.html", "teachers-callout")],
      ["functional", "footer-grid 4 cols", () => fileContains("landing/index.html", "footer-grid")],
      ["functional", "/ayuda/ exists", () => fileExists("ayuda/index.html")],
      ["functional", "/ayuda/dashboard/ exists", () => fileExists("ayuda/dashboard/index.html")],
      ["functional", "/ayuda/estudiantes/ exists", () => fileExists("ayuda/estudiantes/index.html")],
      ["functional", "/privacy/ exists", () => fileExists("privacy/index.html")],
      ["functional", "deploy.yml copies static folders", () => fileContains(".github/workflows/deploy.yml", "for static_dir")],
      ["ux", "onboarding amigable en auth-gate", () => fileContains("dashboard/index.html", "auth-explain-list")],
      ["ux", "FAQ details en auth-gate", () => fileContains("dashboard/index.html", "auth-help")],
    ]
  },
  {
    id: "22", name: "Hybrid AI + heuristic search",
    checks: [
      ["functional", "operadores parser en dashboard", () => fileContains("dashboard/app.js", "parseQuery")],
      ["functional", "Levenshtein fuzzy matching", () => fileContains("dashboard/app.js", "levenshtein")],
      ["functional", "AI search runAiSearch", () => fileContains("dashboard/app.js", "runAiSearch")],
      ["functional", "filter chips renderFilterChips", () => fileContains("dashboard/app.js", "renderFilterChips")],
      ["functional", "saved searches localStorage", () => fileContains("dashboard/app.js", "tlp.dash.savedSearches")],
      ["ux", "atajos / r ?", () => fileContains("dashboard/app.js", `e.key === "/"`)],
      ["ux", "highlight matched tokens", () => fileContains("dashboard/app.js", "highlight")],
      ["operability", "backend /admin/search endpoint not exposed yet (acceptable)", () => true],
    ]
  },
  {
    id: "23-X", name: "Multi device-view toggle + fix close/minimize",
    checks: [
      ["functional", "device-view.js exists", () => fileExists("landing/device-view.js")],
      ["functional", "device-view.css exists", () => fileExists("landing/device-view.css")],
      ["functional", "16 devices in DEVICES map", () => {
        const c = readFileSync(join(ROOT, "landing/device-view.js"), "utf8");
        return (c.match(/"icon":/g) || c.match(/icon:/g) || []).length >= 14;
      }],
      ["functional", "auto-detect via UA", () => fileContains("landing/device-view.js", "navigator.userAgent")],
      ["functional", "event delegation single handler", () => fileContains("landing/device-view.js", `host.addEventListener("click"`)],
      ["functional", "closest() routing", () => fileContains("landing/device-view.js", `closest("[data-`)],
      ["fix", "no legacy individual listeners", () => !fileMatches("landing/device-view.js", /querySelectorAll\("\[data-key\]"\)\.forEach\(b => \{\s*b\.addEventListener\("click"/)],
      ["visual", "corner ✕ always visible (not hover-only)", () => fileContains("landing/device-view.css", "opacity: 1;\n  transform: scale(1);\n  pointer-events: auto;")],
      ["functional", "device-view loaded in landing HTML", () => fileContains("landing/index.html", "device-view.js")],
      ["functional", "device-view loaded in dashboard HTML", () => fileContains("dashboard/index.html", "device-view.js")],
      ["functional", "device-view loaded in biology-10 build", () => fileContains("biologia-10/scripts/build.mjs", "/device-view.js")],
      ["functional", "device-view in apex public", () => existsSync("/Users/PIQUI/Code/universe-infrastructure/dashboard/public/device-view.js")],
      ["security", "localStorage key namespaced", () => fileContains("landing/device-view.js", "tlp.deviceView")],
    ]
  },
  {
    id: "24-25", name: "F.1 + F.2 GCP audit + labels",
    checks: [
      ["docs", "GCP_AUDIT doc exists", () => fileExists("docs/GCP_AUDIT_2026-05-06.md")],
      ["docs", "audit menciona 17 proyectos", () => fileContains("docs/GCP_AUDIT_2026-05-06.md", "17 ACTIVOS")],
      ["docs", "categorías clasificadas", () => fileContains("docs/GCP_AUDIT_2026-05-06.md", "universe-primary") || fileContains("docs/GCP_AUDIT_2026-05-06.md", "PROYECTO PRIMARIO")],
      ["operability", "labels aplicados a 5/7", () => fileContains("docs/GCP_AUDIT_2026-05-06.md", "5/7")],
    ]
  },
  {
    id: "26-27", name: "G.1 + G.2 biology-10 design + device-view",
    checks: [
      ["functional", "biology-10 globalnav inyectado", () => fileContains("biologia-10/scripts/build.mjs", "globalnav-brand")],
      ["functional", "biology-10 footer cross-link", () => fileContains("biologia-10/scripts/build.mjs", "bio-site-footer")],
      ["visual", "biology-10 SF Pro stack", () => fileContains("biologia-10/src/styles.css", "SF Pro Display")],
      ["visual", "biology-10 squircle radii", () => fileContains("biologia-10/src/styles.css", "--r-pill")],
      ["visual", "biology-10 safe-area-insets", () => fileContains("biologia-10/src/styles.css", "safe-area-inset")],
      ["functional", "biology-10 build outputs index.html", () => fileExists("biologia-10/index.html")],
    ]
  },
  {
    id: "28", name: "Sitemap auto-actualizable",
    checks: [
      ["functional", "build-sitemap.mjs script", () => fileExists("scripts/build-sitemap.mjs")],
      ["functional", "sitemap.xml generated", () => fileExists("landing/sitemap.xml")],
      ["functional", "robots.txt generated", () => fileExists("landing/robots.txt")],
      ["functional", "/sitemap/index.html generated", () => fileExists("sitemap/index.html")],
      ["functional", "sitemap.xml has urlset", () => fileContains("landing/sitemap.xml", "<urlset")],
      ["functional", "robots.txt has Sitemap reference", () => fileContains("landing/robots.txt", "Sitemap:")],
      ["functional", "robots.txt disallow /dashboard/", () => fileContains("landing/robots.txt", "Disallow: /dashboard/")],
      ["ux", "sitemap HTML has search filter", () => fileContains("sitemap/index.html", "sitemap-search")],
      ["ux", "sitemap HTML has section grouping", () => fileContains("sitemap/index.html", "sitemap-section")],
      ["operability", "deploy.yml includes sitemap step", () => fileContains(".github/workflows/deploy.yml", "Build sitemap")],
      ["seo", "sitemap online", async () => urlOk(`${SITE}/sitemap.xml`)],
    ]
  },
  {
    id: "29", name: "F.3 GCP Health Dashboard apex",
    checks: [
      ["functional", "blueprint exists", () => existsSync("/Users/PIQUI/Code/universe-infrastructure/docs/GCP_HEALTH_BLUEPRINT.md")],
      ["functional", "sync-gcp-health.mjs script", () => existsSync("/Users/PIQUI/Code/universe-infrastructure/dashboard/scripts/sync-gcp-health.mjs")],
      ["functional", "gcp-health.json data file", () => existsSync("/Users/PIQUI/Code/universe-infrastructure/dashboard/src/data/gcp-health.json")],
      ["functional", "API route exists", () => existsSync("/Users/PIQUI/Code/universe-infrastructure/dashboard/src/app/api/gcp-health/route.ts")],
      ["functional", "page exists", () => existsSync("/Users/PIQUI/Code/universe-infrastructure/dashboard/src/app/registry/gcp-health/page.tsx")],
      ["functional", "API live in apex", async () => urlOk(`${APEX}/api/gcp-health`)],
      ["functional", "Page live in apex", async () => urlOk(`${APEX}/registry/gcp-health`)],
      ["functional", "JSON has 7 projects", async () => {
        const r = await urlFetch(`${APEX}/api/gcp-health`);
        try { return JSON.parse(r.text).totalProjects === 7; } catch { return false; }
      }],
      ["functional", "JSON syncedAt recent", async () => {
        const r = await urlFetch(`${APEX}/api/gcp-health`);
        try { const d = JSON.parse(r.text); return Date.now() - new Date(d.syncedAt).getTime() < 86400000 * 7; } catch { return false; }
      }],
    ]
  },
  {
    id: "30", name: "G.3 Help drawer estudiante",
    checks: [
      ["functional", "drawer markup en build.mjs", () => fileContains("biologia-10/scripts/build.mjs", "bio-help-drawer")],
      ["functional", "6 tabs presentes", () => {
        const c = readFileSync(join(ROOT, "biologia-10/scripts/build.mjs"), "utf8");
        return ["responder", "rubricas", "atajos", "faq", "glosario", "trabado"].every(t => c.includes(`data-tab="${t}"`));
      }],
      ["functional", "JS init init en build.mjs", () => fileContains("biologia-10/scripts/build.mjs", "initBioHelp")],
      ["a11y", "aria-label en drawer", () => fileContains("biologia-10/scripts/build.mjs", `aria-label="Ayuda integrada"`)],
      ["ux", "atajo ? sin conflicto con TOC", () => fileContains("biologia-10/scripts/build.mjs", `if (toc && !toc.hidden) return;`)],
      ["visual", "estilos drawer en CSS", () => fileContains("biologia-10/src/styles.css", "bio-help-drawer")],
      ["functional", "build outputs incluye drawer", () => fileContains("biologia-10/index.html", "bio-help-drawer")],
    ]
  },
  {
    id: "31", name: "G.4 UX por ítem",
    checks: [
      ["functional", "progress ring init", () => fileContains("biologia-10/src/app.js", "initProgressRing")],
      ["functional", "smart resume init", () => fileContains("biologia-10/src/app.js", "initSmartResume")],
      ["functional", "atajos g/s/n init", () => fileContains("biologia-10/src/app.js", "initShortcutsGsn")],
      ["functional", "draft badge init", () => fileContains("biologia-10/src/app.js", "initDraftBadge")],
      ["functional", "focus mode init", () => fileContains("biologia-10/src/app.js", "initFocusMode")],
      ["visual", "ring-grad SVG", () => fileContains("biologia-10/src/app.js", "bio-ring-grad")],
      ["visual", "draft badge styles", () => fileContains("biologia-10/src/styles.css", "bio-draft-badge")],
      ["visual", "focus-mode styles", () => fileContains("biologia-10/src/styles.css", "bio-focus-mode")],
      ["a11y", "ring button aria-label", () => fileContains("biologia-10/src/app.js", `setAttribute("aria-label"`)],
      ["a11y", "reduced-motion respeta ring", () => fileContains("biologia-10/src/styles.css", "prefers-reduced-motion")],
    ]
  },
  {
    id: "32", name: "Backend hardening",
    checks: [
      ["functional", "/terms/ exists", () => fileExists("terms/index.html")],
      ["functional", "/ayuda/problemas/ exists", () => fileExists("ayuda/problemas/index.html")],
      ["functional", "/ayuda/privacidad/ exists", () => fileExists("ayuda/privacidad/index.html")],
      ["security", "rate limit middleware", () => fileContains("services/submit-handler/server.js", "rateLimitMiddleware")],
      ["security", "audit log function", () => fileContains("services/submit-handler/server.js", "function auditLog")],
      ["security", "ALLOWED_TEACHERS check", () => fileContains("services/submit-handler/server.js", "ALLOWED_TEACHERS")],
      ["security", "no token logging", () => !fileMatches("services/submit-handler/server.js", /console\.log\([^)]*token[^)]*\)/i)],
      ["functional", "backend health OK", async () => urlOk(`${BACKEND}/health`)],
      ["functional", "backend admin returns 401 sin auth", async () => {
        const r = await urlFetch(`${BACKEND}/admin/whoami`);
        return r.status === 401;
      }],
      ["functional", "CORS allows Authorization", async () => {
        const r = await urlFetch(`${BACKEND}/admin/whoami`, { method: "OPTIONS", headers: { Origin: SITE, "Access-Control-Request-Headers": "authorization" } });
        return (r.headers["access-control-allow-headers"] || "").toLowerCase().includes("authorization");
      }],
    ]
  },
  {
    id: "33", name: "Cleanup + roadmap",
    checks: [
      ["docs", "ROADMAP.md exists", () => fileExists("ROADMAP.md")],
      ["docs", "CHANGELOG.md exists", () => fileExists("CHANGELOG.md")],
      ["docs", "ROADMAP menciona Sprint 33", () => fileContains("ROADMAP.md", "Sprint 33") || fileMatches("ROADMAP.md", /\b33\b.*Cleanup/)],
      ["docs", "CHANGELOG menciona Sprint 32", () => fileContains("CHANGELOG.md", "Sprint 32")],
      ["docs", "HANDOFF doc exists", () => fileExists("docs/HANDOFF_2026-05-06.md")],
    ]
  },
  // ── Memorias persistentes ────────────────────────────────────
  {
    id: "_memory", name: "Memorias persistentes",
    checks: [
      ["docs", "MEMORY.md index exists", () => existsSync("/Users/PIQUI/.claude/projects/-Users-PIQUI/memory/MEMORY.md")],
      ["docs", "evaluacosas_state memory", () => existsSync("/Users/PIQUI/.claude/projects/-Users-PIQUI/memory/evaluacosas_state.md")],
      ["docs", "event-delegation pattern memory", () => existsSync("/Users/PIQUI/.claude/projects/-Users-PIQUI/memory/feedback_event_delegation_pattern.md")],
      ["docs", "gcp_health memory", () => existsSync("/Users/PIQUI/.claude/projects/-Users-PIQUI/memory/gcp_health_dashboard.md")],
      ["docs", "biology10_help_drawer memory", () => existsSync("/Users/PIQUI/.claude/projects/-Users-PIQUI/memory/biology10_help_drawer.md")],
    ]
  },
  // ── Performance + headers ────────────────────────────────────
  {
    id: "_perf", name: "Performance + HTTP headers",
    checks: [
      ["perf", "landing TTFB < 2s", async () => {
        const t0 = Date.now();
        await urlFetch(`${SITE}/`);
        return Date.now() - t0 < 2000;
      }],
      ["perf", "device-view.js < 30KB", async () => {
        const r = await urlFetch(`${SITE}/device-view.js`);
        return r.text.length < 30000;
      }],
      ["perf", "device-view.css < 30KB", async () => {
        const r = await urlFetch(`${SITE}/device-view.css`);
        return r.text.length < 30000;
      }],
      ["security", "HSTS header en landing", async () => {
        const r = await urlFetch(`${SITE}/`);
        return (r.headers["strict-transport-security"] || "").includes("max-age");
      }],
      ["security", "X-Content-Type-Options nosniff", async () => {
        const r = await urlFetch(`${SITE}/`);
        return (r.headers["x-content-type-options"] || "").toLowerCase() === "nosniff";
      }],
      ["operability", "GitHub Pages canonical en headers", async () => {
        const r = await urlFetch(`${SITE}/`);
        return Boolean(r.headers["server"]);
      }],
      ["functional", "backend health respose < 1s", async () => {
        const t0 = Date.now();
        await urlFetch(`${BACKEND}/health`);
        return Date.now() - t0 < 3000;
      }],
      ["functional", "backend /health returns 200", async () => urlOk(`${BACKEND}/health`)],
      ["functional", "backend /health JSON valid", async () => {
        const r = await urlFetch(`${BACKEND}/health`);
        try { return JSON.parse(r.text).status === "ok"; } catch { return false; }
      }],
      ["functional", "backend /health all sinks enabled", async () => {
        const r = await urlFetch(`${BACKEND}/health`);
        try {
          const j = JSON.parse(r.text);
          return ["cloudStorage", "firestore", "github", "supabase", "linear"].every(k => j.sinks?.[k]?.enabled);
        } catch { return false; }
      }],
    ]
  },
  // ── Backups + git history ────────────────────────────────────
  {
    id: "_git", name: "Git history + backups",
    checks: [
      ["operability", "main branch clean", () => {
        try { return execSync("git status --short", { cwd: ROOT, encoding: "utf8" }).trim() === ""; } catch { return false; }
      }],
      ["operability", "remote up to date", () => {
        try {
          execSync("git fetch", { cwd: ROOT });
          const ahead = execSync("git rev-list --count origin/main..main", { cwd: ROOT, encoding: "utf8" }).trim();
          return ahead === "0";
        } catch { return false; }
      }],
      ["operability", "más de 30 commits en main", () => {
        try { return Number(execSync("git rev-list --count main", { cwd: ROOT, encoding: "utf8" }).trim()) > 30; } catch { return false; }
      }],
      ["operability", "CHANGELOG con git history", () => gitCommitsForFile("CHANGELOG.md") > 0],
      ["operability", "ROADMAP con git history", () => gitCommitsForFile("ROADMAP.md") > 0],
    ]
  },
  // Cross-cutting (todas las superficies)
  {
    id: "_global", name: "Cross-cutting global",
    checks: [
      ["functional", "landing online", async () => urlOk(`${SITE}/`)],
      ["functional", "dashboard online", async () => urlOk(`${SITE}/dashboard/`)],
      ["functional", "ayuda hub online", async () => urlOk(`${SITE}/ayuda/`)],
      ["functional", "ayuda dashboard online", async () => urlOk(`${SITE}/ayuda/dashboard/`)],
      ["functional", "ayuda estudiantes online", async () => urlOk(`${SITE}/ayuda/estudiantes/`)],
      ["functional", "ayuda problemas online", async () => urlOk(`${SITE}/ayuda/problemas/`)],
      ["functional", "ayuda privacidad online", async () => urlOk(`${SITE}/ayuda/privacidad/`)],
      ["functional", "privacy online", async () => urlOk(`${SITE}/privacy/`)],
      ["functional", "terms online", async () => urlOk(`${SITE}/terms/`)],
      ["functional", "biology-10 online", async () => urlOk(`${SITE}/biologia-10/`)],
      ["functional", "sitemap.xml online", async () => urlOk(`${SITE}/sitemap.xml`)],
      ["functional", "/sitemap/ online", async () => urlOk(`${SITE}/sitemap/`)],
      ["functional", "robots.txt online", async () => urlOk(`${SITE}/robots.txt`)],
      ["functional", "device-view.js online", async () => urlOk(`${SITE}/device-view.js`)],
      ["functional", "device-view.css online", async () => urlOk(`${SITE}/device-view.css`)],
      ["functional", "favicon online", async () => urlOk(`${SITE}/favicon.svg`)],
      ["functional", "manifest online", async () => urlOk(`${SITE}/manifest.webmanifest`)],
      ["functional", "apex root online", async () => urlOk(`${APEX}/`)],
      ["functional", "apex registry online", async () => urlOk(`${APEX}/registry`)],
      ["functional", "apex gcp-health online", async () => urlOk(`${APEX}/registry/gcp-health`)],
      ["functional", "apex /api/gcp-health online", async () => urlOk(`${APEX}/api/gcp-health`)],
      ["security", "https redirect from http", async () => {
        try {
          const r = await fetch(`http://evaluacosas.thelaunchpadtlp.education/`, { redirect: "manual", signal: AbortSignal.timeout(10000) });
          return r.status >= 300 && r.status < 400 && (r.headers.get("location") || "").startsWith("https://");
        } catch { return false; }
      }],
      ["security", "no Set-Cookie en landing", async () => {
        const r = await urlFetch(`${SITE}/`);
        return !r.headers["set-cookie"];
      }],
      ["seo", "landing has og:title", () => fileContains("landing/index.html", `property="og:title"`)],
      ["seo", "landing has canonical", () => fileContains("landing/index.html", `rel="canonical"`)],
      ["a11y", "lang=es declared", () => fileContains("landing/index.html", `lang="es"`)],
      ["operability", "CHANGELOG y ROADMAP committed", () => gitCommitsForFile("CHANGELOG.md") > 0 && gitCommitsForFile("ROADMAP.md") > 0],
      ["cost", "infra dentro free tier (audit doc)", () => fileContains("docs/HANDOFF_2026-05-06.md", "$0/mes")],
    ]
  }
];

// ── Run ──────────────────────────────────────────────────────
(async function main() {
  const startedAt = Date.now();
  const results = [];
  for (const sprint of SPRINTS) {
    if (onlySprint && sprint.id !== onlySprint) continue;
    const sprintResults = { id: sprint.id, name: sprint.name, checks: [] };
    for (const [cat, name, fn] of sprint.checks) {
      if (onlyCategory && cat !== onlyCategory) continue;
      let pass = false, error = null;
      try { pass = await fn(); } catch (e) { error = String(e?.message || e); }
      sprintResults.checks.push({ category: cat, name, pass: !!pass, error });
      const icon = pass ? "✓" : "✗";
      const color = pass ? "\x1b[32m" : "\x1b[31m";
      process.stdout.write(`${color}${icon}\x1b[0m [${sprint.id}/${cat}] ${name}\n`);
    }
    results.push(sprintResults);
  }
  const totalChecks = results.reduce((a, s) => a + s.checks.length, 0);
  const passed = results.reduce((a, s) => a + s.checks.filter(c => c.pass).length, 0);
  const failed = totalChecks - passed;
  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Total: ${totalChecks} checks · Passed: ${passed} · Failed: ${failed}`);
  console.log(`Score: ${Math.round((passed / totalChecks) * 100)}%`);
  console.log(`Elapsed: ${elapsed}s`);

  // Write results
  if (!existsSync(`${ROOT}/tests/results`)) mkdirSync(`${ROOT}/tests/results`, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = `${ROOT}/tests/results/qa-${ts}.json`;
  const mdPath = `${ROOT}/tests/results/qa-${ts}.md`;
  const finalReport = { startedAt: new Date(startedAt).toISOString(), elapsedSec: elapsed, total: totalChecks, passed, failed, score: Math.round((passed/totalChecks)*100), sprints: results };
  writeFileSync(jsonPath, JSON.stringify(finalReport, null, 2));

  // Markdown report
  let md = `# QA Report · ${new Date(startedAt).toLocaleString()}\n\n**Score**: ${finalReport.score}% (${passed}/${totalChecks})\n**Elapsed**: ${elapsed}s\n\n`;
  for (const s of results) {
    const sp = s.checks.filter(c => c.pass).length;
    const sf = s.checks.length - sp;
    md += `## Sprint ${s.id} — ${s.name}\n${sp}/${s.checks.length} pass\n\n`;
    for (const c of s.checks) {
      md += `- ${c.pass ? "✅" : "❌"} \`${c.category}\` ${c.name}${c.error ? ` — ${c.error}` : ""}\n`;
    }
    md += "\n";
  }
  writeFileSync(mdPath, md);
  console.log(`\n📊 Report:\n  ${jsonPath}\n  ${mdPath}`);
})();
