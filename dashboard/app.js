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
      acc.innerHTML = `
        <button class="dash-help-btn" type="button" id="dash-help-btn" title="Ayuda y guía de uso (atajo: ?)" aria-label="Abrir ayuda">
          <span aria-hidden="true">?</span>
        </button>
        <div class="dash-account-info">
          <img src="${admin.picture || ""}" alt="" />
          <span class="dash-account-name">${escapeHtml(admin.name || admin.email)}</span>
        </div>
        <details class="dash-account-menu">
          <summary aria-label="Opciones de cuenta">⋯</summary>
          <div class="dash-account-menu-body">
            <button type="button" class="dash-menu-item" id="dash-switch-user">
              <span aria-hidden="true">🔁</span> Cambiar de cuenta
            </button>
            <button type="button" class="dash-menu-item" id="dash-tour-replay">
              <span aria-hidden="true">🎓</span> Ver tour interactivo
            </button>
            <hr/>
            <button type="button" class="dash-menu-item dash-menu-danger" id="dash-signout">
              <span aria-hidden="true">↩</span> Salir
            </button>
          </div>
        </details>
      `;
      document.querySelector("#dash-signout")?.addEventListener("click", signOut);
      document.querySelector("#dash-switch-user")?.addEventListener("click", switchUser);
      document.querySelector("#dash-help-btn")?.addEventListener("click", toggleHelpDrawer);
      document.querySelector("#dash-tour-replay")?.addEventListener("click", () => {
        try { localStorage.removeItem("tlp.dash.tourSeen"); } catch {}
        startTour();
      });
    }
    showTipsIfFirstTime();
    mountHelpDrawer();
    loadSubmits();
    // First-login interactive tour
    const tourSeen = (() => { try { return localStorage.getItem("tlp.dash.tourSeen") === "1"; } catch { return false; } })();
    if (!tourSeen) setTimeout(startTour, 800);
  }

  function signOut() {
    try { google.accounts.id.disableAutoSelect(); } catch {}
    idToken = null; admin = null;
    try { localStorage.removeItem("tlp.dash.lastLogin"); } catch {}
    location.reload();
  }

  function switchUser() {
    // Disable auto-select then revoke + reload con prompt fresh para que aparezca account chooser
    try {
      google.accounts.id.disableAutoSelect();
      if (admin?.email) {
        google.accounts.id.revoke(admin.email, () => {
          idToken = null; admin = null;
          location.reload();
        });
      } else {
        idToken = null; admin = null;
        location.reload();
      }
    } catch {
      location.reload();
    }
  }

  // ============================================================
  // HELP DRAWER + INTERACTIVE TOUR
  // ============================================================
  function mountHelpDrawer() {
    if (document.querySelector("#dash-help-drawer")) return;
    const drawer = document.createElement("aside");
    drawer.id = "dash-help-drawer";
    drawer.className = "dash-help-drawer";
    drawer.setAttribute("aria-label", "Ayuda y guía de uso del dashboard");
    drawer.hidden = true;
    drawer.innerHTML = `
      <header class="dash-help-head">
        <div>
          <p class="dash-help-eyebrow">Centro de ayuda</p>
          <h2>Cómo usar el dashboard</h2>
        </div>
        <button type="button" class="dash-help-close" id="dash-help-close" aria-label="Cerrar ayuda">×</button>
      </header>
      <div class="dash-help-body">
        <nav class="dash-help-tabs" role="tablist">
          <button class="dash-help-tab is-active" data-tab="quick" role="tab" type="button">Inicio rápido</button>
          <button class="dash-help-tab" data-tab="search" role="tab" type="button">Búsqueda</button>
          <button class="dash-help-tab" data-tab="grading" role="tab" type="button">Calificación</button>
          <button class="dash-help-tab" data-tab="shortcuts" role="tab" type="button">Atajos</button>
          <button class="dash-help-tab" data-tab="faq" role="tab" type="button">FAQ</button>
          <button class="dash-help-tab" data-tab="glossary" role="tab" type="button">Glosario</button>
        </nav>

        <section class="dash-help-panel is-active" data-panel="quick">
          <h3>👋 ¡Bienvenido al dashboard!</h3>
          <p>Esta es la consola institucional para revisar entregas. Acá tenés todo lo que hace en orden:</p>
          <ol class="dash-help-steps">
            <li><strong>Refrescá</strong> la lista (botón ↻ Refrescar o tecla <kbd>r</kbd>) cuando esperés entregas nuevas.</li>
            <li><strong>Buscá</strong> con la barra de arriba. Probá <code>score:&gt;80</code>, <code>passing:no</code>, o un nombre.</li>
            <li><strong>Click en una fila</strong> para ver el detalle completo de la entrega.</li>
            <li><strong>Calificá</strong> con criterio binario TLP (1 punto por ítem).</li>
            <li><strong>Descargá</strong> el JSON si querés respaldo.</li>
          </ol>
          <button type="button" class="dash-help-cta" id="dash-tour-from-help">
            <span aria-hidden="true">🎓</span> Hacer tour interactivo guiado
          </button>
        </section>

        <section class="dash-help-panel" data-panel="search">
          <h3>🔍 Cómo buscar</h3>
          <p>La búsqueda combina <strong>operadores</strong> + <strong>texto libre</strong> + <strong>IA opcional</strong>.</p>
          <h4>Operadores</h4>
          <ul class="dash-help-list">
            <li><code>score:&gt;80</code> — entregas con score mayor a 80%</li>
            <li><code>score:&lt;50</code> — score menor a 50%</li>
            <li><code>score:60..80</code> — score entre 60 y 80%</li>
            <li><code>app:biologia</code> — solo de la app biología</li>
            <li><code>passing:yes</code> / <code>passing:no</code> — pasa/no pasa el 80%</li>
            <li><code>student:juan</code> — nombre contiene "juan"</li>
            <li><code>email:@anyssa</code> — email contiene</li>
            <li><code>section:7B</code> — sección</li>
            <li><code>after:2026-05-01</code> — entregas después de fecha</li>
            <li><code>before:2026-05-06</code> — entregas antes</li>
          </ul>
          <p>Combiná: <code>app:biologia score:&gt;80 passing:yes after:2026-05-01</code>.</p>
          <h4>Texto libre</h4>
          <p>Escribí cualquier palabra. Hace fuzzy match (tolera typos), ranquea por relevancia y resalta los matches.</p>
          <h4>IA ✨</h4>
          <p>Cuando tu query es lenguaje natural (ej. <em>"entregas que reprobaron de la semana pasada"</em>), pulsá <strong>✨ IA</strong> o <kbd>⌘+Enter</kbd>. Gemini Flash traduce a filtro estructurado. Gratis (free tier 1500/día).</p>
        </section>

        <section class="dash-help-panel" data-panel="grading">
          <h3>✅ Cómo calificar</h3>
          <h4>Pre-calificación heurística</h4>
          <p>Cálculo automático <strong>sin IA</strong> que ya viene en cada entrega:</p>
          <ul class="dash-help-list">
            <li>Verbos accionables presentes (lo que <em>debe incluir</em>)</li>
            <li>Anti-patterns ausentes (lo que <em>no debe incluir</em>)</li>
            <li>Cantidad mínima de elementos requeridos</li>
            <li>Score binario por ítem (1 pto si pasa todos los criterios, 0 si no)</li>
          </ul>
          <p>El total porcentual aparece en la columna <strong>Pre-grade</strong>. La columna <strong>Pasa 80%</strong> dice ✓ Sí o ✗ No.</p>
          <h4>Calificación con Gemini (opcional)</h4>
          <p>Si querés segunda opinión, abrí el detalle y pulsá <strong>Calificar con Gemini</strong>. Pasa la entrega + el skill TLP/Piqui Parte II al modelo. Devuelve calificación por ítem + justificación + sugerencias.</p>
          <h4>Tu criterio docente final</h4>
          <p>La pre-calificación y el Gemini son <strong>guías</strong>. La nota final la definís vos. Registrala en tu sistema de gestión académica habitual (Classroom, planilla, etc.).</p>
        </section>

        <section class="dash-help-panel" data-panel="shortcuts">
          <h3>⌨️ Atajos de teclado</h3>
          <table class="dash-help-table">
            <tr><td><kbd>/</kbd></td><td>Enfocar búsqueda</td></tr>
            <tr><td><kbd>r</kbd></td><td>Refrescar lista</td></tr>
            <tr><td><kbd>?</kbd></td><td>Abrir esta ayuda</td></tr>
            <tr><td><kbd>Esc</kbd></td><td>Cerrar modal o esta ayuda</td></tr>
            <tr><td><kbd>↓</kbd> <kbd>↑</kbd></td><td>Navegar filas de la tabla</td></tr>
            <tr><td><kbd>Enter</kbd></td><td>Abrir entrega seleccionada</td></tr>
            <tr><td><kbd>⌘</kbd>+<kbd>Enter</kbd></td><td>Buscar con IA ✨</td></tr>
            <tr><td><kbd>⇧</kbd>+<kbd>D</kbd></td><td>Toggle vista de dispositivo</td></tr>
          </table>
        </section>

        <section class="dash-help-panel" data-panel="faq">
          <h3>❓ Preguntas frecuentes</h3>
          <details>
            <summary>¿Por qué no veo todas las entregas que esperaba?</summary>
            <p>El backend devuelve las últimas 200. Si necesitás más antiguas, cambiamos el límite del fetch. Avisanos.</p>
          </details>
          <details>
            <summary>¿Puedo agregar otro docente?</summary>
            <p>Sí. Pedile al admin (joaquin.munoz@) que agregue su email al env var <code>ALLOWED_TEACHERS</code> en Cloud Run. Toma 30 segundos.</p>
          </details>
          <details>
            <summary>¿Cuánto duran las sesiones?</summary>
            <p>1 hora máx. Después tenés que volver a hacer Sign-in. Esto es por seguridad y no se puede extender más.</p>
          </details>
          <details>
            <summary>¿La IA se equivoca a veces al traducir mi query?</summary>
            <p>Gemini Flash es muy bueno pero no perfecto. Si el filtro IA queda raro, pulsá la "×" del chip 🤖 IA activa para volver al heurístico.</p>
          </details>
          <details>
            <summary>¿Dónde se guardan las entregas?</summary>
            <p>5 lugares redundantes: Cloud Storage, Firestore, GitHub privado, Supabase, Linear. Si uno cae, los otros 4 quedan. Más detalle en <a href="/privacy/">privacy</a>.</p>
          </details>
        </section>

        <section class="dash-help-panel" data-panel="glossary">
          <h3>📖 Glosario</h3>
          <dl class="dash-help-glossary">
            <dt>Pre-calificación heurística</dt>
            <dd>Cálculo automático determinístico (sin IA) basado en criterios binarios MEP por ítem.</dd>
            <dt>Score binario</dt>
            <dd>Cada ítem vale 1 punto si pasa todos los criterios "debe incluir" + ningún "no hacer". 0 si no.</dd>
            <dt>Línea de aprobación TLP</dt>
            <dd>80% del score total. Por debajo = ✗ No pasa. Por encima = ✓ Sí pasa.</dd>
            <dt>Skill TLP/Piqui</dt>
            <dd>Documento maestro que define los criterios de evaluación de cada ítem. Parte I = diseño, Parte II = grading, Parte III = QA.</dd>
            <dt>Sink</dt>
            <dd>Cada destino donde se guarda una entrega. Tenemos 5 (GCS, Firestore, GitHub, Supabase, Linear).</dd>
            <dt>Idempotente</dt>
            <dd>Si un estudiante reenvía la misma entrega, no se duplica en ningún sink.</dd>
            <dt>Hd claim</dt>
            <dd>"Hosted domain" en el JWT de Google. Verifica que el email es @thelaunchpadtlp.education.</dd>
          </dl>
        </section>
      </div>
      <footer class="dash-help-foot">
        <span>Más info: <a href="/ayuda/dashboard/" target="_blank" rel="noopener">centro de ayuda completo ↗</a></span>
        <span class="dash-help-version">v1.0</span>
      </footer>
    `;
    document.body.appendChild(drawer);

    // Wire interactions
    drawer.querySelector("#dash-help-close")?.addEventListener("click", closeHelpDrawer);
    drawer.querySelector("#dash-tour-from-help")?.addEventListener("click", () => { closeHelpDrawer(); startTour(); });
    drawer.querySelectorAll(".dash-help-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;
        drawer.querySelectorAll(".dash-help-tab").forEach(t => t.classList.toggle("is-active", t === tab));
        drawer.querySelectorAll(".dash-help-panel").forEach(p => p.classList.toggle("is-active", p.dataset.panel === target));
      });
    });

    // ESC to close, ? to toggle
    document.addEventListener("keydown", (e) => {
      const inField = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if (e.key === "Escape" && !drawer.hidden) closeHelpDrawer();
      if (e.key === "?" && !inField && !e.shiftKey === false) {
        e.preventDefault();
        toggleHelpDrawer();
      }
    });
  }

  function toggleHelpDrawer() {
    const drawer = document.querySelector("#dash-help-drawer");
    if (!drawer) return;
    if (drawer.hidden) {
      drawer.hidden = false;
      requestAnimationFrame(() => drawer.classList.add("is-open"));
    } else {
      closeHelpDrawer();
    }
  }
  function closeHelpDrawer() {
    const drawer = document.querySelector("#dash-help-drawer");
    if (!drawer) return;
    drawer.classList.remove("is-open");
    setTimeout(() => { drawer.hidden = true; }, 280);
  }

  // ============================================================
  // INTERACTIVE TOUR — spotlight overlay con steps
  // ============================================================
  const TOUR_STEPS = [
    { selector: "#dash-account", title: "Tu cuenta", body: "Acá ves quién está logueado. Click en ⋯ para cambiar de cuenta o salir.", placement: "bottom" },
    { selector: ".dash-search", title: "Búsqueda híbrida", body: "Escribí texto libre o usá operadores tipo <code>score:&gt;80</code>. Tolera typos, resalta matches.", placement: "bottom" },
    { selector: "#dash-ai-btn", title: "Búsqueda con IA ✨", body: "Cuando tu query sea lenguaje natural, pulsá esto. Gemini lo traduce a filtro. Gratis.", placement: "bottom" },
    { selector: "#filter-app", title: "Filtro por app", body: "Restringí a una app específica (biología, etc.).", placement: "bottom" },
    { selector: "#dash-refresh", title: "Refrescar", body: "Carga entregas nuevas. Atajo: tecla <kbd>r</kbd>.", placement: "bottom" },
    { selector: ".dash-table-wrap", title: "Tabla de entregas", body: "Cada fila es una entrega. Click para abrir el detalle. Columnas ordenables próximamente.", placement: "top" },
    { selector: "#dash-help-btn", title: "Ayuda integrada", body: "Pulsá el ? cuando tengas dudas. Tour, FAQ, glosario, atajos.", placement: "bottom" }
  ];

  function startTour() {
    const overlay = document.createElement("div");
    overlay.className = "dash-tour-overlay";
    overlay.innerHTML = `
      <div class="dash-tour-spotlight" data-spotlight></div>
      <div class="dash-tour-tooltip" data-tooltip>
        <p class="dash-tour-step-num"><span data-step-num>1</span> de <span data-step-total>${TOUR_STEPS.length}</span></p>
        <h4 data-tour-title></h4>
        <p data-tour-body></p>
        <div class="dash-tour-actions">
          <button type="button" data-tour-skip class="dash-tour-skip">Saltar tour</button>
          <div class="dash-tour-nav">
            <button type="button" data-tour-prev class="dash-tour-btn">← Anterior</button>
            <button type="button" data-tour-next class="dash-tour-btn dash-tour-btn-primary">Siguiente →</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    let idx = 0;
    const render = () => {
      const step = TOUR_STEPS[idx];
      const target = document.querySelector(step.selector);
      const spot = overlay.querySelector("[data-spotlight]");
      const tip = overlay.querySelector("[data-tooltip]");
      overlay.querySelector("[data-step-num]").textContent = String(idx + 1);
      overlay.querySelector("[data-tour-title]").textContent = step.title;
      overlay.querySelector("[data-tour-body]").innerHTML = step.body;
      overlay.querySelector("[data-tour-prev]").disabled = idx === 0;
      const nextBtn = overlay.querySelector("[data-tour-next]");
      nextBtn.textContent = idx === TOUR_STEPS.length - 1 ? "Terminar" : "Siguiente →";

      if (target) {
        const r = target.getBoundingClientRect();
        const pad = 8;
        spot.style.top = `${r.top - pad}px`;
        spot.style.left = `${r.left - pad}px`;
        spot.style.width = `${r.width + pad * 2}px`;
        spot.style.height = `${r.height + pad * 2}px`;
        // Position tooltip
        const tipRect = { width: 320, height: 200 };
        let top, left;
        if (step.placement === "top") {
          top = r.top - tipRect.height - 16;
          left = Math.max(16, r.left + r.width / 2 - tipRect.width / 2);
        } else {
          top = r.bottom + 16;
          left = Math.max(16, r.left + r.width / 2 - tipRect.width / 2);
        }
        // Clamp
        if (left + tipRect.width > window.innerWidth - 16) left = window.innerWidth - tipRect.width - 16;
        if (top + tipRect.height > window.innerHeight - 16) top = window.innerHeight - tipRect.height - 16;
        if (top < 16) top = 16;
        tip.style.top = `${top}px`;
        tip.style.left = `${left}px`;
        target.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        // Target not found, hide spot, center tooltip
        spot.style.display = "none";
        tip.style.top = "50%";
        tip.style.left = "50%";
        tip.style.transform = "translate(-50%, -50%)";
      }
    };
    const finish = () => {
      try { localStorage.setItem("tlp.dash.tourSeen", "1"); } catch {}
      overlay.remove();
    };
    overlay.querySelector("[data-tour-skip]").addEventListener("click", finish);
    overlay.querySelector("[data-tour-prev]").addEventListener("click", () => { if (idx > 0) { idx--; render(); } });
    overlay.querySelector("[data-tour-next]").addEventListener("click", () => {
      if (idx < TOUR_STEPS.length - 1) { idx++; render(); }
      else finish();
    });
    document.addEventListener("keydown", function tourKeys(e) {
      if (!document.body.contains(overlay)) {
        document.removeEventListener("keydown", tourKeys);
        return;
      }
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight" || e.key === "Enter") overlay.querySelector("[data-tour-next]").click();
      if (e.key === "ArrowLeft") overlay.querySelector("[data-tour-prev]").click();
    });
    window.addEventListener("resize", render);
    render();
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
