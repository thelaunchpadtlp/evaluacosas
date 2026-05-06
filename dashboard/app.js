"use strict";

(function () {
  const BACKEND = "https://evaluacosas-submit-handler-441768184201.us-central1.run.app";
  // OAuth Client ID se inyecta vía meta tag o config.json. Default: placeholder visible.
  // Para configurar: agregar <meta name="oauth-client-id" content="…apps.googleusercontent.com">
  // o servir un /config.json con { oauthClientId: "…" }.
  let OAUTH_CLIENT_ID = "";
  let idToken = null;
  let admin = null;
  let allItems = [];
  const STATE = { search: "", appFilter: "" };

  document.addEventListener("DOMContentLoaded", async () => {
    OAUTH_CLIENT_ID = await loadConfig();
    if (!OAUTH_CLIENT_ID) {
      document.querySelector("#auth-note").textContent = "Configuración pendiente: el administrador del proyecto debe generar un OAuth Client ID y servirlo desde /config.json o como <meta name=\"oauth-client-id\">.";
      return;
    }
    initGoogleSignIn();
    initSearchAndFilters();
    initRefresh();
    initModal();
  });

  async function loadConfig() {
    // Try meta tag
    const meta = document.querySelector('meta[name="oauth-client-id"]');
    if (meta?.content) return meta.content.trim();
    // Try /config.json (puede vivir en root del Pages site)
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
      // GSI library aún no cargó; reintentamos
      setTimeout(initGoogleSignIn, 200);
      return;
    }
    google.accounts.id.initialize({
      client_id: OAUTH_CLIENT_ID,
      callback: onCredentialResponse,
      hd: "thelaunchpadtlp.education",
      auto_select: true
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
      document.querySelector("#auth-note").textContent = `Error de autenticación: ${err?.message || err}. Si tu cuenta no es @thelaunchpadtlp.education, no podés acceder.`;
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
    loadSubmits();
  }

  function signOut() {
    google.accounts.id.disableAutoSelect();
    idToken = null; admin = null;
    location.reload();
  }

  async function loadSubmits() {
    document.querySelector("#dash-tbody").innerHTML = `<tr><td colspan="7" class="dash-empty">Cargando…</td></tr>`;
    try {
      const r = await fetch(`${BACKEND}/admin/submits?limit=200`, { headers: { Authorization: `Bearer ${idToken}` } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      allItems = j.items || [];
      populateFilters();
      renderTable();
    } catch (err) {
      document.querySelector("#dash-tbody").innerHTML = `<tr><td colspan="7" class="dash-empty">Error: ${escapeHtml(err?.message || String(err))}</td></tr>`;
    }
  }

  function populateFilters() {
    const sel = document.querySelector("#filter-app");
    const apps = Array.from(new Set(allItems.map(i => i.app))).filter(Boolean).sort();
    sel.innerHTML = `<option value="">Todas</option>` + apps.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join("");
  }

  function renderTable() {
    const tbody = document.querySelector("#dash-tbody");
    const stats = document.querySelector("#dash-stats");
    const q = STATE.search.toLowerCase();
    const appF = STATE.appFilter;
    const filtered = allItems.filter(i => {
      if (appF && i.app !== appF) return false;
      if (!q) return true;
      const hay = [i.docId, i.app, i.assessmentTitle, i.student?.name, i.student?.email, i.student?.section, i.student?.id, i.student?.teacher].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
    if (stats) stats.textContent = `Mostrando ${filtered.length} de ${allItems.length} entregas`;
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="dash-empty">Sin resultados.</td></tr>`;
      return;
    }
    tbody.innerHTML = filtered.map(i => {
      const pre = i.analytics?.preGradePercentage;
      const passing = i.analytics?.preGradePassing;
      const passClass = passing === true ? "pass-yes" : passing === false ? "pass-no" : "";
      const passLabel = passing === true ? "✓ Sí" : passing === false ? "✗ No" : "—";
      return `<tr>
        <td>${formatDate(i.receivedAt)}</td>
        <td>${escapeHtml(i.app || "—")}</td>
        <td>
          <strong>${escapeHtml(i.student?.name || "—")}</strong><br>
          <span style="color:var(--muted);font-size:.78rem">${escapeHtml(i.student?.email || "")}</span>
        </td>
        <td>${escapeHtml(i.student?.section || "—")}</td>
        <td>${pre != null ? pre + "%" : "—"}</td>
        <td class="${passClass}">${passLabel}</td>
        <td><div class="dash-actions">
          <button data-detail="${escapeAttr(i.docId)}">Ver detalle</button>
          <button data-download="${escapeAttr(i.docId)}">Descargar JSON</button>
        </div></td>
      </tr>`;
    }).join("");
    tbody.querySelectorAll("[data-detail]").forEach(b => b.addEventListener("click", () => openDetail(b.dataset.detail)));
    tbody.querySelectorAll("[data-download]").forEach(b => b.addEventListener("click", () => downloadJson(b.dataset.download)));
  }

  async function openDetail(docId) {
    const modal = document.querySelector("#dash-modal");
    const body = document.querySelector("#modal-body");
    const title = document.querySelector("#modal-title");
    title.textContent = `Detalle: ${docId}`;
    body.innerHTML = "Cargando…";
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

  function initSearchAndFilters() {
    document.querySelector("#dash-search-input")?.addEventListener("input", (e) => {
      STATE.search = e.target.value || "";
      renderTable();
    });
    document.querySelector("#filter-app")?.addEventListener("change", (e) => {
      STATE.appFilter = e.target.value || "";
      renderTable();
    });
  }

  function initRefresh() {
    document.querySelector("#dash-refresh")?.addEventListener("click", loadSubmits);
  }

  function initModal() {
    document.querySelector("#modal-close")?.addEventListener("click", () => {
      document.querySelector("#dash-modal").hidden = true;
    });
    document.querySelector("#dash-modal")?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) document.querySelector("#dash-modal").hidden = true;
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !document.querySelector("#dash-modal").hidden) document.querySelector("#dash-modal").hidden = true;
    });
  }

  function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function escapeAttr(s) { return escapeHtml(s); }
  function formatDate(s) { try { return new Date(s).toLocaleString("es-CR"); } catch { return s || "—"; } }
})();
