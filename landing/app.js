"use strict";

/**
 * Landing TLP/evaluacosas — catálogo de apps educativas.
 * Lee apps.json (servido desde / del Pages site) y renderiza cards con búsqueda y filtros.
 * Animaciones: canvas particles + word-in del hero.
 */

(function () {
  const CANVAS_OPACITY = 0.42;
  const CATALOG_GRID = "#catalog-grid";
  const SEARCH_INPUT = "#search-input";
  const COUNT_EL = "#catalog-count";
  const EMPTY_EL = "#catalog-empty";
  const FILTER_BUTTONS = ".filter-btn";

  let allApps = [];
  let activeFilter = "all";

  document.addEventListener("DOMContentLoaded", () => {
    initCanvasBackground();
    loadCatalog();
    initFilters();
    initSearch();
    initTocPanel();
  });

  function initTocPanel() {
    const fab = document.querySelector("#toc-fab");
    const panel = document.querySelector("#toc-panel");
    const close = document.querySelector("#toc-close");
    if (!fab || !panel) return;
    let lastFocus = null;
    const open = () => {
      lastFocus = document.activeElement;
      panel.hidden = false;
      requestAnimationFrame(() => {
        panel.classList.add("open");
        fab.setAttribute("aria-expanded", "true");
        close?.focus();
      });
    };
    const closeFn = () => {
      panel.classList.remove("open");
      fab.setAttribute("aria-expanded", "false");
      setTimeout(() => { panel.hidden = true; }, 220);
      lastFocus?.focus?.();
    };
    const toggle = () => panel.classList.contains("open") ? closeFn() : open();
    fab.addEventListener("click", toggle);
    close?.addEventListener("click", closeFn);
    document.addEventListener("keydown", (event) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === "?") { event.preventDefault(); toggle(); }
      else if (event.key === "Escape" && panel.classList.contains("open")) { closeFn(); }
    });
    panel.querySelectorAll("a[href^=\"#\"]").forEach((a) => {
      a.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 720px)").matches) closeFn();
      });
    });
  }

  function renderTocApps() {
    const list = document.querySelector("#toc-apps-list");
    if (!list) return;
    list.innerHTML = allApps.map((a) => `<li class="toc-question"><a class="toc-q-btn" href="${escAttr(a.url || a.slug + "/")}"><span class="toc-q-num">▸</span><span class="toc-q-prompt">${esc(a.title)}</span></a></li>`).join("");
  }

  async function loadCatalog() {
    try {
      const resp = await fetch("apps.json", { cache: "no-store" });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const meta = data || {};
      if (Array.isArray(meta.apps)) allApps = meta.apps;
      // Update branding from manifest if present
      if (meta.institution) document.querySelector("#brand-institution").textContent = meta.institution;
      if (meta.institutionLong) document.querySelector("#brand-long").textContent = meta.institutionLong;
      if (meta.program) document.querySelector("#brand-program").textContent = meta.program;
      if (meta.tagline) document.querySelector("#hero-tagline").textContent = meta.tagline;
    } catch (err) {
      console.warn("Catalog load failed:", err);
      allApps = [];
    }
    render();
  }

  function render() {
    const grid = document.querySelector(CATALOG_GRID);
    const empty = document.querySelector(EMPTY_EL);
    const count = document.querySelector(COUNT_EL);
    const q = (document.querySelector(SEARCH_INPUT)?.value || "").trim().toLowerCase();
    const filter = activeFilter;
    const filtered = allApps.filter((a) => {
      if (filter && filter !== "all") {
        if (filter === "live" && a.status !== "live") return false;
        if (filter !== "live" && a.subject && a.subject.toLowerCase() !== filter.toLowerCase()) {
          if (!(a.tags || []).some((t) => t.toLowerCase() === filter.toLowerCase())) return false;
        }
      }
      if (q) {
        const haystack = [a.slug, a.title, a.subtitle, a.description, a.subject, a.grade, a.category, a.modality, a.source, ...(a.tags || []), ...(a.highlights || [])].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    if (count) count.textContent = filtered.length === allApps.length
      ? `Mostrando ${allApps.length} ${allApps.length === 1 ? "evaluación" : "evaluaciones"}`
      : `Mostrando ${filtered.length} de ${allApps.length}`;
    if (filtered.length === 0) {
      grid.innerHTML = "";
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      grid.innerHTML = filtered.map(renderCard).join("");
    }
    renderTocApps();
  }

  function renderCard(a) {
    const stats = [
      a.questions ? { label: "Preguntas", value: a.questions } : null,
      a.points ? { label: "Puntaje", value: `${a.points} pts` } : null,
      a.duration ? { label: "Tiempo", value: a.duration } : null,
      a.passingThreshold ? { label: "Aprobación", value: `${a.passingThreshold}%` } : null
    ].filter(Boolean);
    const highlights = (a.highlights || []).slice(0, 4);
    const tags = (a.tags || []).slice(0, 6);
    const accent = a.accent ? ` style="--card-accent: ${escAttr(a.accent)}; --card-accent-2: ${escAttr(a.accent2 || a.accent)}"` : "";
    return `
      <a class="app-card" href="${escAttr(a.url || a.slug + "/")}"${accent} aria-labelledby="app-${escAttr(a.slug)}-title">
        <div class="app-card-head">
          <div class="app-card-eyebrow">
            ${a.subject ? `<span class="app-card-subject">${esc(a.subject)}</span>` : ""}
            ${a.grade ? `<span class="app-card-grade">${esc(a.grade)}</span>` : ""}
            ${a.status ? `<span class="app-card-status" data-status="${escAttr(a.status)}">${esc(a.status)}</span>` : ""}
          </div>
          ${a.version ? `<span class="app-card-version">${esc(a.version)}</span>` : ""}
        </div>
        <h2 class="app-card-title" id="app-${escAttr(a.slug)}-title">${esc(a.title)}</h2>
        ${a.subtitle ? `<p class="app-card-subtitle">${esc(a.subtitle)}</p>` : ""}
        <p class="app-card-description">${esc(a.description || "")}</p>
        ${stats.length ? `<div class="app-card-stats">${stats.map(s => `<div class="app-card-stat"><span class="app-card-stat-label">${esc(s.label)}</span><span class="app-card-stat-value">${esc(s.value)}</span></div>`).join("")}</div>` : ""}
        ${highlights.length ? `<ul class="app-card-highlights">${highlights.map(h => `<li>${esc(h)}</li>`).join("")}</ul>` : ""}
        ${tags.length ? `<div class="app-card-tags">${tags.map(t => `<span class="app-card-tag">${esc(t)}</span>`).join("")}</div>` : ""}
        <span class="app-card-cta">Empezar evaluación <span class="app-card-cta-arrow" aria-hidden="true">→</span></span>
      </a>`;
  }

  function initFilters() {
    document.querySelectorAll(FILTER_BUTTONS).forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFilter = btn.dataset.filter || "all";
        document.querySelectorAll(FILTER_BUTTONS).forEach((b) => b.classList.toggle("is-active", b === btn));
        render();
      });
    });
  }

  function initSearch() {
    const input = document.querySelector(SEARCH_INPUT);
    if (!input) return;
    let t;
    input.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(render, 80);
    });
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function escAttr(s) { return esc(s); }

  // Canvas background — particles sutiles
  function initCanvasBackground() {
    const canvas = document.querySelector("#bio-canvas");
    if (!canvas || !canvas.getContext) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      canvas.style.display = "none";
      return;
    }
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = window.devicePixelRatio || 1;
    const particles = [];
    const PALETTE = ["#39d98a", "#67d1ff", "#ffd166", "#ff8d8d", "#b39bff"];

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn() {
      const count = Math.min(80, Math.floor((w * h) / 24000));
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.8 + Math.random() * 1.8,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          alpha: 0.18 + Math.random() * 0.42
        });
      }
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    resize();
    spawn();
    window.addEventListener("resize", () => { resize(); spawn(); });
    requestAnimationFrame(frame);
  }
})();
