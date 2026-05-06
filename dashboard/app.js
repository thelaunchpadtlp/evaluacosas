"use strict";

(function () {
  const BACKEND = "https://evaluacosas-submit-handler-441768184201.us-central1.run.app";
  let OAUTH_CLIENT_ID = "";
  let idToken = null;
  let admin = null;
  let allItems = [];
  const STATE = {
    rawQuery: "",
    parsedQuery: null,
    appFilter: "",
    aiFilterSpec: null,
    aiActive: false,
    sortKey: "receivedAt",
    sortDir: "desc"
  };
  const SAVED_SEARCHES_KEY = "tlp.dash.savedSearches";

  document.addEventListener("DOMContentLoaded", async () => {
    OAUTH_CLIENT_ID = await loadConfig();
    if (!OAUTH_CLIENT_ID) {
      const note = document.querySelector("#auth-note");
      if (note) note.textContent = "Configuración pendiente: el administrador debe generar OAuth Client ID y servirlo en /dashboard/config.json o como <meta name=\"oauth-client-id\">.";
      return;
    }
    initGoogleSignIn();
    initSearchAndFilters();
    initRefresh();
    initModal();
    initShortcuts();
    initTipsBar();
  });

  async function loadConfig() {
    const meta = document.querySelector('meta[name="oauth-client-id"]');
    if (meta?.content) return meta.content.trim();
    try {
      const r = await fetch("/dashboard/config.json", { cache: "no-cache" });
      if (r.ok) {
        const j = await r.json();
        if (j.oauthClientId) return j.oauthClientId;
      }
    } catch {}
    return "";
  }

  function initGoogleSignIn() {
    if (!window.google?.accounts?.id) {
      setTimeout(initGoogleSignIn, 200);
      return;
    }
    google.accounts.id.initialize({
      client_id: OAUTH_CLIENT_ID,
      callback: onCredentialResponse,
      hd: "thelaunchpadtlp.education",
      auto_select: true,
      ux_mode: "popup"
    });
    google.accounts.id.renderButton(document.getElementById("g_id_signin"), {
      theme: "filled_black",
      size: "large",
      type: "standard",
      text: "signin_with",
      shape: "pill",
      logo_alignment: "left"
    });
    google.accounts.id.prompt();
  }

  async function onCredentialResponse(response) {
    idToken = response.credential;
    try {
      const r = await fetch(`${BACKEND}/admin/whoami`, { headers: { Authorization: `Bearer ${idToken}` } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      admin = j.admin;
      onLoggedIn();
    } catch (err) {
      const note = document.querySelector("#auth-note");
      if (note) note.textContent = `Error de autenticación: ${err?.message || err}. Si tu cuenta no es @thelaunchpadtlp.education, no podés acceder.`;
      idToken = null;
    }
  }

  function onLoggedIn() {
    document.querySelector("#auth-gate").hidden = true;
    document.querySelector("#dash-content").hidden = false;
    const acc = document.querySelector("#dash-account");
    if (acc && admin) {
      acc.innerHTML = `<img src="${admin.picture || ""}" alt=""><span>${escapeHtml(admin.name || admin.email)}</span><button class="signout">Salir</button>`;
      acc.querySelector(".signout").addEventListener("click", signOut);
    }
    showTipsIfFirstTime();
    loadSubmits();
  }

  function signOut() {
    google.accounts.id.disableAutoSelect();
    idToken = null; admin = null;
    location.reload();
  }

  async function loadSubmits() {
    const tbody = document.querySelector("#dash-tbody");
    tbody.innerHTML = `<tr><td colspan="7" class="dash-empty"><div class="dash-empty-state"><span class="dash-empty-icon" aria-hidden="true">⏳</span><p>Cargando entregas…</p></div></td></tr>`;
    try {
      const r = await fetch(`${BACKEND}/admin/submits?limit=200`, { headers: { Authorization: `Bearer ${idToken}` } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      allItems = j.items || [];
      populateFilters();
      renderTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="dash-empty"><div class="dash-empty-state"><span class="dash-empty-icon">⚠️</span><p>Error: ${escapeHtml(err?.message || String(err))}</p><button id="retry-load">Reintentar</button></div></td></tr>`;
      document.querySelector("#retry-load")?.addEventListener("click", loadSubmits);
    }
  }

  function populateFilters() {
    const sel = document.querySelector("#filter-app");
    const apps = Array.from(new Set(allItems.map(i => i.app))).filter(Boolean).sort();
    sel.innerHTML = `<option value="">Todas</option>` + apps.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join("");
  }

  // ============================================================
  // HYBRID SEARCH ENGINE — heurístico + (opcional) AI
  // ============================================================

  // Parser de query con operadores estructurados
  function parseQuery(raw) {
    if (!raw) return { tokens: [], filters: {}, freeText: "" };
    const filters = {};
    const tokens = [];
    let freeText = "";

    // Operadores soportados:
    // score:>80 | score:<50 | score:80..100
    // app:biologia
    // student:juan | name:juan
    // email:@anyssa | email:juan@
    // passing:yes | passing:no
    // section:7B
    // after:2026-05-01 | before:2026-05-06
    // teacher:joaquin
    const opRegex = /(\w+):([^\s]+)/g;
    let cleanedRaw = raw;
    let m;
    while ((m = opRegex.exec(raw)) !== null) {
      const [full, key, val] = m;
      const k = key.toLowerCase();
      if (["score", "app", "student", "name", "email", "passing", "section", "after", "before", "teacher"].includes(k)) {
        filters[k] = val;
        cleanedRaw = cleanedRaw.replace(full, "");
      }
    }
    freeText = cleanedRaw.trim();

    // Tokens del free text para fuzzy match
    if (freeText) {
      tokens.push(...freeText.toLowerCase().split(/\s+/).filter(Boolean));
    }

    return { tokens, filters, freeText, raw };
  }

  // Score de match heurístico — cuanto más alto, mejor match
  function scoreItem(item, parsed) {
    const { tokens, filters, freeText } = parsed;
    let score = 0;

    // Filtros estructurados (todos deben pasar)
    if (filters.app) {
      if (!String(item.app || "").toLowerCase().includes(filters.app.toLowerCase())) return -1;
      score += 5;
    }
    if (filters.student || filters.name) {
      const f = (filters.student || filters.name).toLowerCase();
      if (!String(item.student?.name || "").toLowerCase().includes(f)) return -1;
      score += 5;
    }
    if (filters.email) {
      if (!String(item.student?.email || "").toLowerCase().includes(filters.email.toLowerCase())) return -1;
      score += 5;
    }
    if (filters.section) {
      if (!String(item.student?.section || "").toLowerCase().includes(filters.section.toLowerCase())) return -1;
      score += 5;
    }
    if (filters.teacher) {
      if (!String(item.student?.teacher || "").toLowerCase().includes(filters.teacher.toLowerCase())) return -1;
      score += 5;
    }
    if (filters.passing != null) {
      const p = item.analytics?.preGradePassing;
      const target = ["yes", "true", "si", "sí", "1"].includes(String(filters.passing).toLowerCase());
      if (p !== target) return -1;
      score += 5;
    }
    if (filters.score) {
      const v = Number(item.analytics?.preGradePercentage);
      if (Number.isNaN(v)) return -1;
      const f = String(filters.score);
      if (f.startsWith(">")) { if (!(v > Number(f.slice(1)))) return -1; }
      else if (f.startsWith("<")) { if (!(v < Number(f.slice(1)))) return -1; }
      else if (f.includes("..")) { const [a, b] = f.split(".."); if (!(v >= Number(a) && v <= Number(b))) return -1; }
      else if (!Number.isNaN(Number(f))) { if (v !== Number(f)) return -1; }
      score += 5;
    }
    if (filters.after) {
      const d = parseDateLoose(filters.after);
      if (d && new Date(item.receivedAt) < d) return -1;
      score += 3;
    }
    if (filters.before) {
      const d = parseDateLoose(filters.before);
      if (d && new Date(item.receivedAt) > d) return -1;
      score += 3;
    }

    // Si no hay tokens libres, los filtros ya determinan
    if (tokens.length === 0) return score + 1;

    // Fuzzy match por tokens — campos rankeados por importancia
    const fields = [
      { v: item.student?.name, w: 5 },
      { v: item.student?.email, w: 4 },
      { v: item.app, w: 3 },
      { v: item.assessmentTitle, w: 3 },
      { v: item.student?.section, w: 2 },
      { v: item.student?.id, w: 2 },
      { v: item.student?.teacher, w: 2 },
      { v: item.docId, w: 1 }
    ];
    let allTokensMatched = true;
    for (const tok of tokens) {
      let tokMatched = false;
      for (const f of fields) {
        const s = String(f.v || "").toLowerCase();
        if (!s) continue;
        if (s === tok) { score += f.w * 5; tokMatched = true; break; }       // exact
        if (s.startsWith(tok)) { score += f.w * 3; tokMatched = true; break; } // prefix
        if (s.includes(tok)) { score += f.w * 2; tokMatched = true; break; }   // contains
        if (levenshteinDistance(s, tok) <= 2 && s.length >= 3) { score += f.w; tokMatched = true; break; } // fuzzy
      }
      if (!tokMatched) allTokensMatched = false;
    }
    return allTokensMatched ? score : -1;
  }

  function levenshteinDistance(a, b) {
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    if (Math.abs(a.length - b.length) > 3) return 99; // early reject
    const m = [];
    for (let i = 0; i <= b.length; i++) m[i] = [i];
    for (let j = 0; j <= a.length; j++) m[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        m[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
          ? m[i - 1][j - 1]
          : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
      }
    }
    return m[b.length][a.length];
  }

  function parseDateLoose(s) {
    const d = new Date(s);
    if (!isNaN(d)) return d;
    return null;
  }

  function applyHybridSearch() {
    const parsed = STATE.parsedQuery || parseQuery(STATE.rawQuery);
    let working = allItems.slice();

    // Aplicar filtro app (UI selector)
    if (STATE.appFilter) {
      working = working.filter(i => i.app === STATE.appFilter);
    }

    // Aplicar AI filter spec si existe
    if (STATE.aiActive && STATE.aiFilterSpec) {
      working = applyAiFilterSpec(working, STATE.aiFilterSpec);
    }

    // Aplicar heurístico
    const scored = working
      .map(i => ({ item: i, score: scoreItem(i, parsed) }))
      .filter(x => x.score >= 0)
      .sort((a, b) => b.score - a.score);

    return scored.map(x => x.item);
  }

  function applyAiFilterSpec(items, spec) {
    if (!spec) return items;
    return items.filter(i => {
      if (spec.app && !String(i.app || "").toLowerCase().includes(spec.app.toLowerCase())) return false;
      if (spec.passing != null && i.analytics?.preGradePassing !== spec.passing) return false;
      if (spec.minScore != null && Number(i.analytics?.preGradePercentage) < spec.minScore) return false;
      if (spec.maxScore != null && Number(i.analytics?.preGradePercentage) > spec.maxScore) return false;
      if (spec.studentName && !String(i.student?.name || "").toLowerCase().includes(spec.studentName.toLowerCase())) return false;
      if (spec.section && !String(i.student?.section || "").toLowerCase().includes(spec.section.toLowerCase())) return false;
      if (spec.afterIso && new Date(i.receivedAt) < new Date(spec.afterIso)) return false;
      if (spec.beforeIso && new Date(i.receivedAt) > new Date(spec.beforeIso)) return false;
      return true;
    });
  }

  async function runAiSearch() {
    if (!STATE.rawQuery.trim()) return;
    const aiBtn = document.querySelector("#dash-ai-btn");
    if (aiBtn) {
      aiBtn.disabled = true;
      aiBtn.innerHTML = `<span class="dash-spinner" aria-hidden="true"></span> Pensando…`;
    }
    try {
      const r = await fetch(`${BACKEND}/admin/search`, {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: STATE.rawQuery })
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      STATE.aiFilterSpec = j.filter || null;
      STATE.aiActive = true;
      renderTable();
      const stats = document.querySelector("#dash-stats");
      if (stats && j.explain) stats.dataset.aiExplain = j.explain;
    } catch (err) {
      // Fallback silencioso: si AI falla, queda solo el heurístico
      console.warn("AI search fallback:", err?.message || err);
      const stats = document.querySelector("#dash-stats");
      if (stats) stats.dataset.aiError = err?.message || String(err);
    } finally {
      if (aiBtn) {
        aiBtn.disabled = false;
        aiBtn.innerHTML = `<span aria-hidden="true">✨</span> IA`;
      }
    }
  }

  // ============================================================
  // UI rendering
  // ============================================================
  function renderTable() {
    const tbody = document.querySelector("#dash-tbody");
    const stats = document.querySelector("#dash-stats");
    const filtered = applyHybridSearch();

    // Stats
    if (stats) {
      let txt = `Mostrando ${filtered.length} de ${allItems.length} entregas`;
      if (STATE.aiActive && STATE.aiFilterSpec) txt += " · 🤖 filtro IA activo";
      if (stats.dataset.aiExplain) txt += ` · ${stats.dataset.aiExplain}`;
      stats.textContent = txt;
    }

    // Filter chips
    renderFilterChips();

    if (filtered.length === 0) {
      const hasQuery = STATE.rawQuery || STATE.appFilter || STATE.aiActive;
      tbody.innerHTML = `<tr><td colspan="7" class="dash-empty">
        <div class="dash-empty-state">
          <span class="dash-empty-icon" aria-hidden="true">${hasQuery ? "🔍" : "📭"}</span>
          <p>${hasQuery ? "Sin resultados para tu búsqueda." : "Aún no hay entregas."}</p>
          ${hasQuery ? `<button id="clear-all-search">Limpiar búsqueda</button>` : ""}
        </div>
      </td></tr>`;
      document.querySelector("#clear-all-search")?.addEventListener("click", () => {
        STATE.rawQuery = "";
        STATE.parsedQuery = null;
        STATE.aiActive = false;
        STATE.aiFilterSpec = null;
        STATE.appFilter = "";
        document.querySelector("#dash-search-input").value = "";
        document.querySelector("#filter-app").value = "";
        renderTable();
      });
      return;
    }

    const highlightTokens = (STATE.parsedQuery?.tokens || []);
    tbody.innerHTML = filtered.map(i => {
      const pre = i.analytics?.preGradePercentage;
      const passing = i.analytics?.preGradePassing;
      const passClass = passing === true ? "pass-yes" : passing === false ? "pass-no" : "";
      const passLabel = passing === true ? "✓ Sí" : passing === false ? "✗ No" : "—";
      return `<tr tabindex="0" data-detail="${escapeAttr(i.docId)}">
        <td>${formatDate(i.receivedAt)}</td>
        <td>${highlight(i.app, highlightTokens)}</td>
        <td>
          <strong>${highlight(i.student?.name, highlightTokens)}</strong><br>
          <span style="color:var(--muted);font-size:.78rem">${highlight(i.student?.email, highlightTokens)}</span>
        </td>
        <td>${highlight(i.student?.section, highlightTokens)}</td>
        <td>${pre != null ? pre + "%" : "—"}</td>
        <td class="${passClass}">${passLabel}</td>
        <td><div class="dash-actions">
          <button data-detail="${escapeAttr(i.docId)}" aria-label="Ver detalle">Ver</button>
          <button data-download="${escapeAttr(i.docId)}" aria-label="Descargar JSON">⬇</button>
        </div></td>
      </tr>`;
    }).join("");
    tbody.querySelectorAll("[data-detail]").forEach(b => b.addEventListener("click", () => openDetail(b.dataset.detail || b.closest("tr")?.dataset.detail)));
    tbody.querySelectorAll("[data-download]").forEach(b => b.addEventListener("click", (e) => { e.stopPropagation(); downloadJson(b.dataset.download); }));
    // Row keyboard activation
    tbody.querySelectorAll("tr[data-detail]").forEach(tr => {
      tr.addEventListener("keydown", (e) => {
        if (e.key === "Enter") openDetail(tr.dataset.detail);
      });
    });
  }

  function renderFilterChips() {
    let chipsHost = document.querySelector("#dash-chips");
    if (!chipsHost) {
      const toolbar = document.querySelector(".dash-toolbar");
      if (!toolbar) return;
      chipsHost = document.createElement("div");
      chipsHost.id = "dash-chips";
      chipsHost.className = "dash-chips";
      chipsHost.setAttribute("aria-label", "Filtros activos");
      toolbar.appendChild(chipsHost);
    }
    const chips = [];
    const f = STATE.parsedQuery?.filters || {};
    Object.entries(f).forEach(([k, v]) => chips.push({ key: k, label: `${k}: ${v}`, type: "filter" }));
    if (STATE.appFilter) chips.push({ key: "_app", label: `app · ${STATE.appFilter}`, type: "select" });
    if (STATE.aiActive) chips.push({ key: "_ai", label: `🤖 filtro IA`, type: "ai" });
    if (chips.length === 0) { chipsHost.innerHTML = ""; chipsHost.style.display = "none"; return; }
    chipsHost.style.display = "";
    chipsHost.innerHTML = chips.map(c => `<button class="dash-chip" data-chip="${escapeAttr(c.key)}" type="button">${escapeHtml(c.label)} <span aria-hidden="true">×</span></button>`).join("");
    chipsHost.querySelectorAll("[data-chip]").forEach(b => b.addEventListener("click", () => removeChip(b.dataset.chip)));
  }

  function removeChip(key) {
    if (key === "_app") {
      STATE.appFilter = "";
      document.querySelector("#filter-app").value = "";
    } else if (key === "_ai") {
      STATE.aiActive = false;
      STATE.aiFilterSpec = null;
    } else if (STATE.parsedQuery?.filters[key]) {
      // Remove from raw query
      const re = new RegExp(`${key}:\\S+`, "g");
      STATE.rawQuery = STATE.rawQuery.replace(re, "").replace(/\s+/g, " ").trim();
      STATE.parsedQuery = parseQuery(STATE.rawQuery);
      document.querySelector("#dash-search-input").value = STATE.rawQuery;
    }
    renderTable();
  }

  function highlight(text, tokens) {
    const s = String(text ?? "");
    if (!s) return "—";
    if (!tokens?.length) return escapeHtml(s);
    let out = escapeHtml(s);
    for (const t of tokens) {
      if (t.length < 2) continue;
      const re = new RegExp(`(${escapeRegex(t)})`, "gi");
      out = out.replace(re, '<mark class="dash-hl">$1</mark>');
    }
    return out;
  }
  function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  // ============================================================
  // Detail modal + download
  // ============================================================
  async function openDetail(docId) {
    if (!docId) return;
    const modal = document.querySelector("#dash-modal");
    const body = document.querySelector("#modal-body");
    const title = document.querySelector("#modal-title");
    title.textContent = `Detalle: ${docId}`;
    body.innerHTML = `<div class="dash-empty-state"><span class="dash-empty-icon">⏳</span><p>Cargando…</p></div>`;
    modal.hidden = false;
    try {
      const r = await fetch(`${BACKEND}/admin/submit/${encodeURIComponent(docId)}`, { headers: { Authorization: `Bearer ${idToken}` } });
      const j = await r.json();
      const d = j.doc;
      const ans = d.payload?.answers || {};
      const ansHtml = Object.entries(ans).map(([k, v]) => `<div style="margin-bottom:14px"><strong>${escapeHtml(k)}</strong><pre>${escapeHtml(v || "")}</pre></div>`).join("") || "<p>Sin respuestas registradas</p>";
      body.innerHTML = `
        <h4>${escapeHtml(d.assessmentTitle || "")}</h4>
        <p>Estudiante: <strong>${escapeHtml(d.student?.name || "")}</strong> · ${escapeHtml(d.student?.email || "")}<br>
        Sección: ${escapeHtml(d.student?.section || "—")} · Docente: ${escapeHtml(d.student?.teacher || "—")} · Fecha: ${escapeHtml(d.student?.date || "—")}</p>
        <p>Pre-calificación heurística: <strong>${d.analytics?.preGradeScore ?? "—"}/${d.analytics?.preGradeTotal ?? "—"}</strong> (${d.analytics?.preGradePercentage ?? "—"}%) · ${d.analytics?.preGradeLevel ?? "—"} · ${d.analytics?.preGradePassing ? "supera 80%" : "no supera 80%"}</p>
        <p>Recibido: ${formatDate(d.receivedAt)}</p>
        <hr>
        <h4>Respuestas</h4>
        ${ansHtml}`;
    } catch (err) {
      body.innerHTML = `<p>Error: ${escapeHtml(err?.message || String(err))}</p>`;
    }
  }

  async function downloadJson(docId) {
    try {
      const r = await fetch(`${BACKEND}/admin/submit/${encodeURIComponent(docId)}`, { headers: { Authorization: `Bearer ${idToken}` } });
      const j = await r.json();
      const blob = new Blob([JSON.stringify(j.doc?.payload || j.doc, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${docId}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error descargando: " + (err?.message || err));
    }
  }

  // ============================================================
  // Init UI
  // ============================================================
  function initSearchAndFilters() {
    const input = document.querySelector("#dash-search-input");
    if (input) {
      // Update placeholder with hints
      input.placeholder = 'Buscar… (probá: "score:>80 julieta", "app:biologia passing:no", "after:2026-05-01")';
      let tmr;
      input.addEventListener("input", (e) => {
        STATE.rawQuery = e.target.value || "";
        STATE.parsedQuery = parseQuery(STATE.rawQuery);
        STATE.aiActive = false;
        STATE.aiFilterSpec = null;
        clearTimeout(tmr);
        tmr = setTimeout(renderTable, 80);
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          runAiSearch();
        }
      });
    }
    document.querySelector("#filter-app")?.addEventListener("change", (e) => {
      STATE.appFilter = e.target.value || "";
      renderTable();
    });

    // Inject AI button + saved searches dropdown into the search bar
    const searchHost = document.querySelector(".dash-search");
    if (searchHost && !document.querySelector("#dash-ai-btn")) {
      const aiBtn = document.createElement("button");
      aiBtn.id = "dash-ai-btn";
      aiBtn.className = "dash-ai-btn";
      aiBtn.type = "button";
      aiBtn.title = "Buscar con IA (Gemini Flash · gratis). Atajo: Cmd/Ctrl+Enter";
      aiBtn.setAttribute("aria-label", "Buscar con IA");
      aiBtn.innerHTML = `<span aria-hidden="true">✨</span> IA`;
      aiBtn.addEventListener("click", runAiSearch);
      searchHost.appendChild(aiBtn);

      const savedBtn = document.createElement("button");
      savedBtn.id = "dash-saved-btn";
      savedBtn.className = "dash-saved-btn";
      savedBtn.type = "button";
      savedBtn.title = "Búsquedas guardadas";
      savedBtn.setAttribute("aria-label", "Búsquedas guardadas");
      savedBtn.innerHTML = `<span aria-hidden="true">⭐</span>`;
      savedBtn.addEventListener("click", openSavedSearches);
      searchHost.appendChild(savedBtn);
    }
  }

  function getSavedSearches() {
    try { return JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || "[]"); }
    catch { return []; }
  }
  function setSavedSearches(arr) {
    try { localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(arr)); } catch {}
  }
  function openSavedSearches() {
    const cur = getSavedSearches();
    const action = prompt(
      "Búsquedas guardadas:\n" +
      (cur.length ? cur.map((s, i) => `  ${i + 1}. ${s.label} → ${s.query}`).join("\n") : "  (vacío)") +
      "\n\nEscribí:\n  guardar <etiqueta>  (guarda la query actual)\n  cargar <número>     (carga la búsqueda)\n  borrar <número>     (la elimina)\n  cancelar"
    );
    if (!action) return;
    const m = action.trim().match(/^(guardar|cargar|borrar)\s+(.+)$/i);
    if (!m) return;
    const verb = m[1].toLowerCase();
    if (verb === "guardar") {
      cur.push({ label: m[2], query: STATE.rawQuery });
      setSavedSearches(cur);
    } else if (verb === "cargar") {
      const idx = Number(m[2]) - 1;
      if (cur[idx]) {
        STATE.rawQuery = cur[idx].query;
        STATE.parsedQuery = parseQuery(STATE.rawQuery);
        document.querySelector("#dash-search-input").value = STATE.rawQuery;
        renderTable();
      }
    } else if (verb === "borrar") {
      const idx = Number(m[2]) - 1;
      cur.splice(idx, 1);
      setSavedSearches(cur);
    }
  }

  function initRefresh() {
    document.querySelector("#dash-refresh")?.addEventListener("click", loadSubmits);
  }

  function initModal() {
    document.querySelector("#modal-close")?.addEventListener("click", closeModal);
    document.querySelector("#dash-modal")?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
  }
  function closeModal() {
    const m = document.querySelector("#dash-modal");
    if (m) m.hidden = true;
  }

  function initShortcuts() {
    document.addEventListener("keydown", (e) => {
      const inField = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if (e.key === "Escape") {
        const m = document.querySelector("#dash-modal");
        if (m && !m.hidden) { closeModal(); return; }
      }
      if (inField) return;
      if (e.key === "/") { e.preventDefault(); document.querySelector("#dash-search-input")?.focus(); }
      else if (e.key === "r") { e.preventDefault(); loadSubmits(); }
      else if (e.key === "?") { e.preventDefault(); toggleTipsBar(); }
    });
  }

  function initTipsBar() {
    document.querySelector("#dash-tip-dismiss")?.addEventListener("click", () => {
      document.querySelector("#dash-tips").hidden = true;
      try { localStorage.setItem("tlp.dash.tipsHidden", "1"); } catch {}
    });
  }
  function showTipsIfFirstTime() {
    const hidden = (() => { try { return localStorage.getItem("tlp.dash.tipsHidden") === "1"; } catch { return false; } })();
    if (!hidden) {
      const tips = document.querySelector("#dash-tips");
      if (tips) tips.hidden = false;
    }
  }
  function toggleTipsBar() {
    const tips = document.querySelector("#dash-tips");
    if (tips) tips.hidden = !tips.hidden;
  }

  // Helpers
  function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function escapeAttr(s) { return escapeHtml(s); }
  function formatDate(s) { try { return new Date(s).toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" }); } catch { return s || "—"; } }
})();
