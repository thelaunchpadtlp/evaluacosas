#!/usr/bin/env node
// build-sitemap.mjs — auto-generate sitemap.xml + sitemap/index.html
// Reads filesystem for index.html files, builds machine-readable XML and
// human-readable interactive HTML sitemap. Run from CI on every push.

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SITE_URL = "https://evaluacosas.thelaunchpadtlp.education";
const NOW = new Date().toISOString();

// Sections + audience taxonomy
const SECTION_MAP = {
  "/": { label: "Catálogo · Inicio", section: "Estudiantes", icon: "🏠", priority: "1.0", changefreq: "weekly" },
  "/dashboard/": { label: "Dashboard del docente", section: "Docentes", icon: "🔐", priority: "0.8", changefreq: "weekly" },
  "/ayuda/": { label: "Centro de ayuda", section: "Ayuda", icon: "❓", priority: "0.7", changefreq: "monthly" },
  "/ayuda/estudiantes/": { label: "Para estudiantes — guía", section: "Ayuda", icon: "🎒", priority: "0.6", changefreq: "monthly" },
  "/ayuda/dashboard/": { label: "Para docentes — guía", section: "Ayuda", icon: "🔐", priority: "0.6", changefreq: "monthly" },
  "/ayuda/problemas/": { label: "Problemas comunes", section: "Ayuda", icon: "🧯", priority: "0.5", changefreq: "monthly" },
  "/ayuda/privacidad/": { label: "Privacidad — explicada", section: "Ayuda", icon: "🛡️", priority: "0.5", changefreq: "monthly" },
  "/privacy/": { label: "Política de privacidad", section: "Legal", icon: "🛡️", priority: "0.5", changefreq: "yearly" },
  "/terms/": { label: "Términos de uso", section: "Legal", icon: "📄", priority: "0.5", changefreq: "yearly" },
  "/biologia-10/": { label: "Tarea Integral · Biología 10", section: "Evaluaciones", icon: "🧬", priority: "0.9", changefreq: "weekly" },
  "/sitemap/": { label: "Mapa del sitio", section: "Meta", icon: "🗺️", priority: "0.4", changefreq: "weekly" }
};

// Locations on disk to look for index.html
const SOURCE_PATHS = {
  "/": "landing/index.html",
  "/dashboard/": "dashboard/index.html",
  "/ayuda/": "ayuda/index.html",
  "/ayuda/estudiantes/": "ayuda/estudiantes/index.html",
  "/ayuda/dashboard/": "ayuda/dashboard/index.html",
  "/ayuda/problemas/": "ayuda/problemas/index.html",
  "/ayuda/privacidad/": "ayuda/privacidad/index.html",
  "/privacy/": "privacy/index.html",
  "/terms/": "terms/index.html",
  "/biologia-10/": "biologia-10/index.html",
  "/sitemap/": null  // self-generated
};

function git(cmd, fallback = "") {
  try { return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim(); }
  catch { return fallback; }
}

function getLastModified(filePath) {
  if (!filePath) return NOW;
  const abs = join(ROOT, filePath);
  if (!existsSync(abs)) return null;
  const fromGit = git(`git log -1 --format=%cI -- "${filePath}"`, "");
  if (fromGit) return fromGit;
  try { return statSync(abs).mtime.toISOString(); } catch { return NOW; }
}

function existsOnDisk(filePath) {
  if (!filePath) return true;
  return existsSync(join(ROOT, filePath));
}

// Collect entries
const entries = [];
for (const [url, meta] of Object.entries(SECTION_MAP)) {
  const filePath = SOURCE_PATHS[url];
  const exists = existsOnDisk(filePath);
  const lastmod = exists ? getLastModified(filePath) : null;
  entries.push({
    url,
    fullUrl: SITE_URL + url,
    ...meta,
    lastmod,
    exists,
    sourcePath: filePath
  });
}

// Group by section for HTML rendering
const grouped = entries.reduce((acc, e) => {
  (acc[e.section] = acc[e.section] || []).push(e);
  return acc;
}, {});

// ============================================================
// 1) sitemap.xml (Google/Bing crawlers)
// ============================================================
const xmlEntries = entries.filter(e => e.exists).map(e => `  <url>
    <loc>${e.fullUrl}</loc>
    <lastmod>${e.lastmod || NOW}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;
writeFileSync(join(ROOT, "landing/sitemap.xml"), xml);
console.log(`✓ sitemap.xml — ${entries.filter(e => e.exists).length} URLs`);

// ============================================================
// 2) sitemap/index.html (human-readable interactive)
// ============================================================
const totalLive = entries.filter(e => e.exists).length;
const totalDormant = entries.filter(e => !e.exists).length;
const lastBuildIso = NOW;
const gitSha = git("git rev-parse --short HEAD", "?");

const htmlEntries = Object.entries(grouped).map(([section, list]) => {
  const itemsHtml = list.map(e => {
    const status = e.exists ? "live" : "missing";
    const statusLabel = e.exists ? "🟢 vivo" : "⚪ pendiente";
    const lastMod = e.lastmod ? new Date(e.lastmod).toLocaleDateString("es-CR", { year: "numeric", month: "short", day: "numeric" }) : "—";
    return `<li class="sitemap-item" data-status="${status}" data-search="${(e.label + " " + e.url).toLowerCase()}">
        ${e.exists ? `<a class="sitemap-link" href="${e.url}">` : `<span class="sitemap-link sitemap-link-disabled">`}
          <span class="sitemap-icon" aria-hidden="true">${e.icon}</span>
          <span class="sitemap-text">
            <span class="sitemap-label">${e.label}</span>
            <span class="sitemap-url">${e.url}</span>
          </span>
          <span class="sitemap-meta">
            <span class="sitemap-status sitemap-status-${status}">${statusLabel}</span>
            <span class="sitemap-lastmod" title="Última modificación">${lastMod}</span>
          </span>
        ${e.exists ? `</a>` : `</span>`}
      </li>`;
  }).join("\n");
  return `<section class="sitemap-section" data-section="${section}">
      <h2 class="sitemap-section-title">${section} <span class="sitemap-section-count">(${list.length})</span></h2>
      <ul class="sitemap-list">
${itemsHtml}
      </ul>
    </section>`;
}).join("\n");

const sitemapHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#07111d" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#f4f6fb" media="(prefers-color-scheme: light)">
  <meta name="color-scheme" content="dark light">
  <meta name="description" content="Mapa completo del sitio evaluacosas TLP. Auto-generado en cada build.">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/favicon.svg">
  <title>Mapa del sitio · evaluacosas TLP</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;800;900&display=swap">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/ayuda/ayuda.css">
  <link rel="stylesheet" href="/device-view.css">
  <style>
    .sitemap-main { width: min(1080px, calc(100% - 32px)); margin: 32px auto 80px; }
    .sitemap-hero { text-align: center; padding: 48px 24px 32px; }
    .sitemap-eyebrow { margin: 0 0 8px; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); }
    .sitemap-hero h1 {
      margin: 0 0 14px;
      font-size: clamp(1.8rem, 1.4rem + 1.6vw, 2.6rem);
      font-weight: 800; letter-spacing: -0.02em;
      background: linear-gradient(135deg, var(--text), var(--accent-2));
      -webkit-background-clip: text; background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sitemap-stats {
      display: inline-flex; gap: 18px; flex-wrap: wrap;
      justify-content: center;
      padding: 12px 24px;
      border-radius: var(--r-pill);
      background: var(--glass-tint);
      border: 1px solid var(--hairline);
      backdrop-filter: blur(20px) saturate(140%);
      font-size: 0.86rem;
      color: var(--muted);
    }
    .sitemap-stats strong { color: var(--text); }
    .sitemap-search-wrap {
      max-width: 540px; margin: 32px auto 28px;
      position: relative;
    }
    .sitemap-search-icon {
      position: absolute; left: 18px; top: 50%; transform: translateY(-50%);
      color: var(--muted); pointer-events: none;
    }
    .sitemap-search-input {
      width: 100%;
      padding: 14px 18px 14px 44px;
      border-radius: var(--r-pill);
      border: 1px solid var(--hairline);
      background: var(--glass-tint);
      backdrop-filter: blur(20px);
      color: var(--text);
      font-size: 1rem;
      transition: all var(--dur-fast) var(--ease-spring);
    }
    .sitemap-search-input:focus {
      border-color: var(--accent-2);
      box-shadow: 0 0 0 4px color-mix(in oklab, var(--accent-2) 22%, transparent);
      outline: none;
    }
    .sitemap-section {
      margin-bottom: 36px;
      padding: 24px 28px;
      border-radius: var(--r-xl);
      background: var(--glass-tint);
      border: 1px solid var(--hairline);
      backdrop-filter: blur(20px) saturate(140%);
    }
    .sitemap-section[data-empty] { opacity: 0.4; }
    .sitemap-section-title {
      margin: 0 0 16px;
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent);
    }
    .sitemap-section-count {
      color: var(--muted);
      font-weight: 500;
      letter-spacing: 0;
      text-transform: none;
    }
    .sitemap-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
    .sitemap-item[data-hidden] { display: none; }
    .sitemap-link {
      display: grid;
      grid-template-columns: 32px 1fr auto;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      border-radius: var(--r-md);
      text-decoration: none;
      color: var(--text);
      transition: all var(--dur-fast) var(--ease-spring);
      border: 1px solid transparent;
    }
    .sitemap-link:hover {
      background: rgba(57, 217, 138, 0.08);
      border-color: rgba(57, 217, 138, 0.24);
      transform: translateX(2px);
    }
    .sitemap-link-disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .sitemap-icon { font-size: 1.4rem; }
    .sitemap-text { display: grid; gap: 2px; min-width: 0; }
    .sitemap-label { font-weight: 600; font-size: 0.96rem; }
    .sitemap-url { font-size: 0.78rem; color: var(--muted); font-family: ui-monospace, "SF Mono", Menlo, monospace; }
    .sitemap-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .sitemap-status { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
    .sitemap-status-live { background: rgba(57, 217, 138, 0.16); color: var(--accent); }
    .sitemap-status-missing { background: rgba(255, 255, 255, 0.04); color: var(--muted); }
    .sitemap-lastmod { font-size: 0.72rem; color: var(--muted); font-family: ui-monospace, "SF Mono", Menlo, monospace; }
    .sitemap-empty { padding: 40px; text-align: center; color: var(--muted); }
    @media (max-width: 600px) {
      .sitemap-main { margin: 16px auto 60px; }
      .sitemap-section { padding: 18px 16px; }
      .sitemap-link { grid-template-columns: 28px 1fr; }
      .sitemap-meta { grid-column: 2; align-items: flex-start; flex-direction: row; gap: 8px; }
    }
  </style>
</head>
<body>
  <a class="skip-to-content" href="#main">Saltar al contenido</a>

  <nav class="globalnav" aria-label="Navegación principal">
    <div class="globalnav-inner">
      <a class="globalnav-brand" href="/">
        <span class="globalnav-mark" aria-hidden="true">✺</span>
        <span class="globalnav-name">evaluacosas <span class="globalnav-sub">TLP</span></span>
      </a>
      <ul class="globalnav-links" role="list">
        <li><a href="/">Inicio</a></li>
        <li><a href="/#catalog">Catálogo</a></li>
        <li><a href="/ayuda/">Ayuda</a></li>
        <li><a class="globalnav-current" href="/sitemap/" aria-current="page">🗺️ Mapa</a></li>
      </ul>
    </div>
  </nav>

  <main class="sitemap-main" id="main">
    <header class="sitemap-hero">
      <p class="sitemap-eyebrow">Mapa del sitio</p>
      <h1>Toda la estructura del sistema en una pantalla</h1>
      <div class="sitemap-stats">
        <span><strong>${totalLive}</strong> páginas vivas</span>
        ${totalDormant > 0 ? `<span><strong>${totalDormant}</strong> pendientes</span>` : ""}
        <span>commit <strong>${gitSha}</strong></span>
        <span>build <strong>${new Date(lastBuildIso).toLocaleDateString("es-CR", { dateStyle: "medium" })}</strong></span>
      </div>
    </header>

    <div class="sitemap-search-wrap">
      <span class="sitemap-search-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7"/>
          <path d="m20 20-3.5-3.5"/>
        </svg>
      </span>
      <input id="sitemap-search" type="search" placeholder="Filtrar por nombre o URL…" autocomplete="off" class="sitemap-search-input" aria-label="Filtrar mapa">
    </div>

    <div id="sitemap-content">
${htmlEntries}
    </div>

    <p style="text-align:center;color:var(--muted);font-size:0.82rem;margin-top:32px">
      Generado automáticamente. Disponible también como <a href="/sitemap.xml" style="color:var(--accent-2)">sitemap.xml</a> para crawlers.
    </p>
  </main>

  <script>
    (function () {
      const input = document.getElementById("sitemap-search");
      const items = Array.from(document.querySelectorAll(".sitemap-item"));
      const sections = Array.from(document.querySelectorAll(".sitemap-section"));
      input.addEventListener("input", () => {
        const q = input.value.trim().toLowerCase();
        items.forEach(i => {
          const visible = !q || i.dataset.search.includes(q);
          if (visible) i.removeAttribute("data-hidden");
          else i.setAttribute("data-hidden", "1");
        });
        sections.forEach(s => {
          const visibleItems = s.querySelectorAll(".sitemap-item:not([data-hidden])").length;
          if (visibleItems === 0) s.setAttribute("data-empty", "1");
          else s.removeAttribute("data-empty");
        });
      });
    })();
  </script>
  <script src="/device-view.js" defer></script>
</body>
</html>
`;

if (!existsSync(join(ROOT, "sitemap"))) mkdirSync(join(ROOT, "sitemap"), { recursive: true });
writeFileSync(join(ROOT, "sitemap/index.html"), sitemapHtml);
console.log(`✓ sitemap/index.html — ${totalLive} live + ${totalDormant} dormant`);

// ============================================================
// 3) robots.txt (referencia al sitemap.xml)
// ============================================================
const robots = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /admin/
Sitemap: ${SITE_URL}/sitemap.xml
`;
writeFileSync(join(ROOT, "landing/robots.txt"), robots);
console.log(`✓ robots.txt`);

console.log("\nDone.");
