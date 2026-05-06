import { assessment, performanceLevels, evaluationCriteria, cognitiveLevelDefinitions, cognitiveLevelByQuestion, verbGlossary, passingThreshold, mepMapByQuestion, tlpStudents } from "../src/questions.js";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const css = readFileSync(join(root, "src/styles.css"), "utf8");
const app = readFileSync(join(root, "src/app.js"), "utf8")
  .replace("export function initAssessment()", "function initAssessment()");

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`;
}

const TYPE_RULES = [
  { match: /^(identific[áa]|nombr[áa]|defin[íi]|enumer[áa]|list[áa])/i, label: "Identificación" },
  { match: /^(compar[áa]|diferenci[áa]|distingu[íi]|contrast[áa])/i, label: "Comparación" },
  { match: /^(explic[áa]|justific[áa]|argument[áa]|fundament[áa])/i, label: "Explicación" },
  { match: /^(describ[íi]|caracteriz[áa])/i, label: "Descripción" },
  { match: /^(interpret[áa]|analiz[áa]|evalu[áa])/i, label: "Análisis" },
  { match: /^(diseñ[áa]|propon[ée]|aplic[áa]|formul[áa])/i, label: "Aplicación" },
  { match: /^(clasific[áa]|orden[áa]|jerarquiz[áa])/i, label: "Clasificación" },
  { match: /^(calcul[áa]|estim[áa])/i, label: "Cálculo" },
  { match: /^(reflexion[áa]|valor[áa]|posicion[áa])/i, label: "Reflexión / Bioética" }
];

function inferType(prompt) {
  const trimmed = String(prompt).trim();
  for (const rule of TYPE_RULES) {
    if (rule.match.test(trimmed)) return rule.label;
  }
  return "Respuesta abierta";
}

const cognitiveDefByKey = Object.fromEntries(cognitiveLevelDefinitions.map((d) => [d.key, d]));
const verbDefByType = Object.fromEntries(verbGlossary.map((v) => [v.type, v]));

function buildRubric(question, section) {
  // Auto-derived rubric from must/avoid/cognitiveLevel/type/MEP map.
  // Si la pregunta provee question.rubric explícita, usa esa; si no, deriva.
  if (question.rubric) return question.rubric;
  const mep = mepMapByQuestion[question.id] || {};
  const cogKey = cognitiveLevelByQuestion[question.id] || "";
  const cogDef = cognitiveLevelDefinitions.find((d) => d.key === cogKey);
  const type = inferType(question.prompt);

  const earnsPoint = `Cumplí simultáneamente los ${(question.must || []).length} criterios "Debe incluir" listados arriba (todos son esenciales) y mantené tu respuesta dentro de los ${(question.avoid || []).length} límites del bloque "No hacer".`;

  const losesPoint = `Si omitís cualquiera de los criterios "Debe incluir" esenciales, si tu respuesta encaja en alguno de los "No hacer", si la respuesta tiene menos de ${30} caracteres efectivos, o si el formato pedido por la consigna no se cumple.`;

  const formatRequired = (() => {
    if (type === "Comparación") return "Mencioná al menos dos elementos y explicitá una semejanza o una diferencia (no respondas un solo lado).";
    if (type === "Aplicación") return "Aplicá el concepto a un caso o procedimiento concreto. No respondas con teoría general sin uso.";
    if (type === "Análisis") return "Examiná el caso e inferí una conclusión apoyada en evidencia o relación causal.";
    if (type === "Reflexión / Bioética") return "Tomá posición con marco de derechos, evidencia, regulación y proporcionalidad de riesgo.";
    if (type === "Identificación") return "Respuesta breve y exacta con el término del programa MEP.";
    if (type === "Cálculo") return "Indicá datos, fórmula y resultado paso a paso.";
    if (type === "Clasificación") return "Organizá los elementos según criterios explícitos.";
    if (type === "Descripción") return "Caracterizá con rasgos observables o conceptuales (más detalle que identificar).";
    if (type === "Explicación") return "Mostrá la relación entre causa, mecanismo y consecuencia. No basta con definir.";
    return "Oración completa, vocabulario propio de Biología, 3-6 líneas cuando la consigna requiera explicación.";
  })();

  return {
    points: 1,
    binary: true,
    earnsPoint,
    losesPoint,
    mepReference: `${mep.eje || "—"} · ${mep.subtema || "—"}`,
    mepConcepts: mep.concepts || [],
    formatRequired,
    cognitiveLevel: cogDef ? `${cogDef.label} — ${cogDef.description}` : "",
    questionType: type,
    teacherNote: `1 punto binario · sin parciales · línea de aprobación TLP del instrumento: ${passingThreshold}%`
  };
}

function rubricBlock(question, section) {
  const r = buildRubric(question, section);
  const concepts = (r.mepConcepts || []).map((c) => `<span class="rubric-concept">${esc(c)}</span>`).join("");
  return `
      <details class="rubric-block">
        <summary class="rubric-summary">
          <span class="rubric-summary-icon" aria-hidden="true">📋</span>
          <span class="rubric-summary-text">Cómo se evalúa este ítem <span class="rubric-summary-cta">— pasá el mouse o tocá para ver</span> · 1 punto binario · MEP ${esc((r.mepReference || "—").split(" · ")[0])}</span>
          <span class="rubric-summary-toggle" aria-hidden="true">▾</span>
        </summary>
        <div class="rubric-grid">
          <div class="rubric-cell rubric-earn">
            <h4>✓ Cómo se gana el punto</h4>
            <p>${esc(r.earnsPoint)}</p>
          </div>
          <div class="rubric-cell rubric-lose">
            <h4>✗ Cómo se pierde</h4>
            <p>${esc(r.losesPoint)}</p>
          </div>
          <div class="rubric-cell rubric-mep">
            <h4>📚 Programa MEP</h4>
            <p>${esc(r.mepReference)}</p>
            ${concepts ? `<div class="rubric-concepts">${concepts}</div>` : ""}
          </div>
          <div class="rubric-cell rubric-format">
            <h4>📝 Formato requerido</h4>
            <p>${esc(r.formatRequired)}</p>
          </div>
          <div class="rubric-cell rubric-cog">
            <h4>🧠 Habilidad evaluada</h4>
            <p>${esc(r.cognitiveLevel || "—")}${r.questionType ? ` · Consigna tipo <strong>${esc(r.questionType)}</strong>` : ""}</p>
          </div>
          <div class="rubric-cell rubric-teacher">
            <h4>📐 Cómo califica el docente</h4>
            <p>${esc(r.teacherNote)}</p>
          </div>
        </div>
      </details>`;
}

function questionCard(question, sectionSlug) {
  const type = inferType(question.prompt);
  const verbDef = verbDefByType[type];
  const typeTooltip = verbDef ? `${verbDef.verbs} — ${verbDef.expects}` : "";
  const cogKey = cognitiveLevelByQuestion[question.id];
  const cogDef = cognitiveDefByKey[cogKey];
  const cogBadge = cogDef
    ? `<span class="question-cog" data-cog="${esc(cogKey)}" title="${esc(cogDef.description)}">${esc(cogDef.label)}</span>`
    : "";
  const isRequired = question.required !== false;
  const requiredBadge = isRequired
    ? `<span class="question-required" title="Esta pregunta es obligatoria">Obligatoria</span>`
    : "";
  return `
    <article class="question-card${isRequired ? " is-required" : ""}" id="pregunta-${question.id}" data-section="${esc(sectionSlug)}" data-cog="${esc(cogKey || "")}" data-required="${isRequired}">
      <div class="question-head">
        <span class="number">#${question.id}${isRequired ? "<span class=\"req-asterisk\" aria-hidden=\"true\">*</span>" : ""}</span>
        <div class="question-title">
          <div class="question-badges">
            <span class="question-type" data-type="${esc(type)}" title="${esc(typeTooltip)}">${esc(type)}</span>
            ${cogBadge}
            ${requiredBadge}
          </div>
          <h3>${esc(question.prompt)}</h3>
        </div>
      </div>
      <div class="criteria-grid">
        <div class="must-block"><strong>Debe incluir:</strong>${list(question.must)}</div>
        <div class="avoid-block"><strong>No hacer:</strong>${list(question.avoid)}</div>
      </div>
      ${rubricBlock(question, sectionSlug)}
      <label for="q${question.id}">Respuesta del estudiante${isRequired ? ' <span class="req-asterisk" aria-label="obligatoria">*</span>' : ""}</label>
      <div class="answer-state-buttons" data-for="q${question.id}">
        <button class="btn-respond" type="button" data-action="respond" data-target="q${question.id}">✏️ Responder</button>
        <button class="btn-save" type="button" data-action="save" data-target="q${question.id}" hidden>💾 Guardar respuesta</button>
        <button class="btn-edit" type="button" data-action="edit" data-target="q${question.id}" hidden>✎ Editar respuesta</button>
      </div>
      <textarea id="q${question.id}" rows="5" spellcheck="true" data-section="${esc(sectionSlug)}" data-required="${isRequired}" aria-required="${isRequired}" readonly></textarea>
      <div class="answer-controls">
        <span class="save-indicator" data-state="empty" data-for="q${question.id}" aria-live="polite">○ Aún no respondida</span>
        <button class="save-and-next" type="button" data-next-from="${question.id}" hidden>Guardar y seguir →</button>
      </div>
      <div class="answer-meta" data-meta-for="q${question.id}">0 palabras | 0 líneas</div>
      <div class="teacher-grading" aria-hidden="true">
        <div class="teacher-grading-row"><span>Veredicto</span><span class="teacher-grading-options">Correcta · Correcta con matiz · Incorrecta · No verificable</span></div>
        <div class="teacher-grading-row"><span>Puntaje</span><span class="teacher-grading-score">_____ / 1</span></div>
        <div class="teacher-grading-row"><span>Observación</span><span class="teacher-grading-note"></span></div>
      </div>
    </article>`;
}

function commonErrorsBlock(section) {
  if (!Array.isArray(section.commonErrors) || section.commonErrors.length === 0) return "";
  return `
      <aside class="common-errors" aria-label="Errores comunes a evitar">
        <div class="common-errors-head">
          <span class="common-errors-icon" aria-hidden="true">!</span>
          <h3>Errores comunes a evitar en este eje</h3>
        </div>
        <ul>${section.commonErrors.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      </aside>`;
}

function sectionInstructionsBlock(section) {
  if (!section.instructions) return "";
  return `
      <aside class="section-instructions" aria-label="Indicaciones del eje">
        <div class="section-instructions-head">
          <span class="section-instructions-icon" aria-hidden="true">→</span>
          <h3>Indicaciones del eje</h3>
        </div>
        <p>${esc(section.instructions)}</p>
      </aside>`;
}

function sectionClosingBlock(section) {
  if (!section.closing) return "";
  return `
      <aside class="section-closing" aria-label="Cierre del eje">
        <div class="section-closing-head">
          <span class="section-closing-icon" aria-hidden="true">✓</span>
          <h3>Antes de continuar</h3>
        </div>
        <p>${esc(section.closing)}</p>
      </aside>`;
}

function sectionBlock(section) {
  return `
    <section class="content-section" id="${esc(section.slug)}" data-section="${esc(section.slug)}">
      <div class="section-intro">
        <div>
          <p class="eyebrow">${esc(section.axis)}</p>
          <h2>${esc(section.title)}</h2>
          <p>${esc(section.microreading)}</p>
        </div>
        <div class="section-art" aria-hidden="true">${section.art}</div>
      </div>
      ${commonErrorsBlock(section)}
      ${sectionInstructionsBlock(section)}
      <div class="questions-list">
        ${section.questions.map((question) => questionCard(question, section.slug)).join("")}
      </div>
      ${sectionClosingBlock(section)}
    </section>`;
}

function performanceTableRows() {
  return performanceLevels
    .map((level) => `<tr class="perf-row" data-tier="${esc(level.tier)}" data-passing="${level.passing}"><th scope="row">${level.min}–${level.max}%</th><td><strong>${esc(level.label)}</strong> <span class="perf-flag">${level.passing ? "Aprobado" : "No alcanzado"}</span></td><td>${esc(level.description)}</td></tr>`)
    .join("");
}

function evaluationCriteriaList() {
  return evaluationCriteria.rules.map((rule) => `<li>${esc(rule)}</li>`).join("");
}

function tocSections() {
  return assessment.sections
    .map((section) => {
      const items = section.questions
        .map((q) => {
          const verb = q.prompt.split(/\s+/).slice(0, 1)[0];
          const required = q.required !== false;
          return `<li class="toc-question" data-id="${q.id}" data-section="${esc(section.slug)}" data-required="${required}">
            <button type="button" class="toc-q-btn" data-jump="${q.id}">
              <span class="toc-q-num">#${q.id}${required ? "<span class=\"req-asterisk\" aria-hidden=\"true\">*</span>" : ""}</span>
              <span class="toc-dot" data-state="empty" data-for="q${q.id}" aria-label="estado: vacía"></span>
              <span class="toc-q-verb">${esc(verb)}</span>
              <span class="toc-q-prompt">${esc(q.prompt.length > 70 ? q.prompt.slice(0, 70) + "…" : q.prompt)}</span>
            </button>
          </li>`;
        })
        .join("");
      return `<div class="toc-section" data-section="${esc(section.slug)}">
        <h3 class="toc-section-title">${esc(section.axis)} — ${esc(section.title)}</h3>
        <ul class="toc-questions">${items}</ul>
      </div>`;
    })
    .join("");
}

function verbGlossaryBlock() {
  const items = verbGlossary
    .map((entry) => `
      <details class="verb-entry">
        <summary><span class="verb-type" data-type="${esc(entry.type)}">${esc(entry.type)}</span><span class="verb-verbs">${esc(entry.verbs)}</span></summary>
        <p class="verb-expects">${esc(entry.expects)}</p>
        ${entry.examples ? `<p class="verb-example"><em>Ejemplo:</em> ${esc(entry.examples)}</p>` : ""}
      </details>`)
    .join("");
  return `<div class="verb-glossary" aria-labelledby="verb-glossary-title">
    <h3 id="verb-glossary-title">Cómo leer las consignas</h3>
    <p class="verb-glossary-lead">Cada pregunta lleva un badge con su <strong>tipo de consigna</strong>. Pasá el cursor sobre el badge para ver qué pide. Esta es la guía completa de los verbos que aparecen en el examen (skill §23).</p>
    <div class="verb-list">${items}</div>
  </div>`;
}

function cognitiveBalanceRows() {
  const counts = {};
  Object.values(cognitiveLevelByQuestion).forEach((key) => { counts[key] = (counts[key] || 0) + 1; });
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return cognitiveLevelDefinitions
    .filter((def) => counts[def.key] > 0)
    .map((def) => {
      const count = counts[def.key];
      const pct = Math.round((count / total) * 100);
      return `<li class="cog-row" data-cog="${esc(def.key)}">
        <div class="cog-row-head"><strong>${esc(def.label)}</strong><span>${count} ítems · ${pct}%</span></div>
        <div class="cog-row-track"><div class="cog-row-fill" style="width:${pct}%"></div></div>
        <p class="cog-row-desc">${esc(def.description)}</p>
      </li>`;
    })
    .join("");
}

function sectionProgress() {
  return assessment.sections
    .map((section) => `
        <div class="section-progress" data-section="${esc(section.slug)}">
          <div class="section-progress-label">
            <span>${esc(section.axis)}</span>
            <span data-progress-text="${esc(section.slug)}">0/${section.questions.length}</span>
          </div>
          <div class="progress-track"><div class="progress-fill" data-progress-fill="${esc(section.slug)}"></div></div>
        </div>`)
    .join("");
}

const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#07111d">
  <meta name="color-scheme" content="dark light">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="TLP Biología 10">
  <meta name="format-detection" content="telephone=no">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <title>${esc(assessment.institution)} — ${esc(assessment.title)}</title>
  <meta name="description" content="${esc(assessment.title)} — ${esc(assessment.subtitle)} (${esc(assessment.institution)}, ${esc(assessment.institutionLong)}, ${esc(assessment.course)} ${esc(assessment.grade)})">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/favicon.svg">
  <link rel="manifest" href="data:application/manifest+json;charset=utf-8,${encodeURIComponent(JSON.stringify({
    name: `${assessment.institution} — ${assessment.title}`,
    short_name: "TLP Biología 10",
    start_url: ".",
    display: "standalone",
    background_color: "#07111d",
    theme_color: "#07111d",
    description: assessment.subtitle
  }))}">
  <link rel="stylesheet" href="/device-view.css">
  <style>${css}</style>
</head>
<body>
  <a class="skip-to-content" href="#contenido-principal">Saltar al contenido</a>
  <nav class="globalnav" aria-label="Navegación principal">
    <div class="globalnav-inner">
      <a class="globalnav-brand" href="/" aria-label="Volver al catálogo">
        <span class="globalnav-mark" aria-hidden="true">✺</span>
        <span class="globalnav-name">evaluacosas <span class="globalnav-sub">TLP</span></span>
      </a>
      <ul class="globalnav-links" role="list">
        <li><a href="/">Inicio</a></li>
        <li><a href="/#catalog">Catálogo</a></li>
        <li><a href="/ayuda/estudiantes/">Ayuda</a></li>
      </ul>
    </div>
  </nav>
  <canvas id="bio-canvas" aria-hidden="true"></canvas>
  <button class="toc-fab" id="toc-fab" type="button" aria-label="Abrir mapa del examen" aria-controls="toc-panel" aria-expanded="false" title="Mapa del examen — atajo: ?">
    <span class="toc-fab-icon" aria-hidden="true">☰</span>
    <span class="toc-fab-label">Mapa</span>
  </button>
  <aside class="toc-panel" id="toc-panel" hidden aria-labelledby="toc-title">
    <header class="toc-header">
      <div>
        <h2 id="toc-title">Mapa del examen</h2>
        <p class="toc-subtitle"><span id="toc-progress-text">0/${assessment.points}</span> preguntas con avance</p>
      </div>
      <button class="toc-close" id="toc-close" type="button" aria-label="Cerrar mapa">×</button>
    </header>
    <div class="toc-quick-actions">
      <button type="button" id="toc-first-incomplete" class="toc-quick-btn">↓ Primera obligatoria pendiente</button>
      <button type="button" id="toc-next-section" class="toc-quick-btn">→ Siguiente eje</button>
    </div>
    <div class="toc-legend">
      <span><span class="toc-dot" data-state="empty"></span>vacía</span>
      <span><span class="toc-dot" data-state="partial"></span>parcial</span>
      <span><span class="toc-dot" data-state="substantive"></span>completa</span>
    </div>
    <div class="toc-body" id="toc-body" role="navigation" aria-label="Lista de preguntas del examen">${tocSections()}</div>
    <footer class="toc-footer">
      <p>Atajo: <kbd>?</kbd> abre/cierra · <kbd>Esc</kbd> cierra · <kbd>j</kbd> próxima · <kbd>k</kbd> anterior</p>
    </footer>
  </aside>
  <div class="context-bar" id="context-bar" data-state="hidden" aria-live="polite">
    <button class="context-bar-back" type="button" id="context-bar-back" aria-label="Volver al inicio">↑ Inicio</button>
    <div class="context-bar-info">
      <span class="context-bar-axis" id="context-bar-axis">—</span>
      <span class="context-bar-sep" aria-hidden="true">·</span>
      <span class="context-bar-question" id="context-bar-question">Pregunta —</span>
    </div>
    <span class="context-bar-status" id="context-bar-status" data-status="incomplete">En progreso</span>
  </div>
  <main class="shell" id="contenido-principal">
    <a class="back-to-evaluacosas" href="https://evaluacosas.thelaunchpadtlp.education/" title="Volver al catálogo de evaluacosas" aria-label="Volver al catálogo de evaluacosas — sitio principal con todas las evaluaciones TLP">
      <span aria-hidden="true">←</span> <span>evaluacosas</span><span class="back-to-evaluacosas-sep" aria-hidden="true"> · </span><span class="back-to-evaluacosas-tag">catálogo TLP</span>
    </a>
    <header class="hero">
      <div class="brand-block">
        <p class="brand-line brand-primary">${esc(assessment.institution)}</p>
        <p class="brand-line brand-secondary">${esc(assessment.institutionLong)}</p>
        <p class="brand-line brand-tertiary">${esc(assessment.program)}</p>
        <p class="brand-line brand-course">${esc(assessment.course)} · ${esc(assessment.grade)}</p>
      </div>
      <h1>${esc(assessment.title)}</h1>
      <p>${esc(assessment.subtitle)}</p>
      <div class="hero-meta">
        <span class="hero-meta-item"><span class="hero-meta-label">Instrumento</span><strong>${esc(assessment.instrument)}</strong></span>
        <span class="hero-meta-item"><span class="hero-meta-label">Modalidad</span><strong>${esc(assessment.modality)}</strong></span>
        <span class="hero-meta-item"><span class="hero-meta-label">Tiempo sugerido</span><strong>${esc(assessment.suggestedTime)}</strong></span>
        <span class="hero-meta-item"><span class="hero-meta-label">Fuente principal</span><strong>${esc(assessment.source)}</strong></span>
      </div>
    </header>
    <section class="student-grid" aria-label="Datos del estudiante">
      <label class="student-picker-wrap">¿Quién está resolviendo?
        <select id="student-picker" autocomplete="off">
          <option value="">— elegir de la lista o registrarse manualmente —</option>
          ${tlpStudents.map((s) => `<option value="${esc(s.email)}" data-name="${esc(s.name)}" data-first-name="${esc(s.firstName)}" data-second-name="${esc(s.secondName)}" data-first-surname="${esc(s.firstSurname)}" data-second-surname="${esc(s.secondSurname)}">${esc(s.name)} · ${esc(s.email)}</option>`).join("")}
          <option value="__other__">Otro / registro manual</option>
        </select>
      </label>
      <div class="cedula-lookup-wrap">
        <label class="cedula-lookup">Cédula (CR)
          <input id="student-cedula" autocomplete="off" placeholder="1-2345-6789 o 123456789" inputmode="numeric">
        </label>
        <button type="button" id="cedula-lookup-btn" class="cedula-lookup-btn" title="Consultar Padrón Electoral del TSE">Buscar en TSE →</button>
        <span class="cedula-lookup-status" id="cedula-lookup-status" aria-live="polite"></span>
      </div>
      <label>Primer nombre<input id="student-first-name" autocomplete="given-name" placeholder="Ej: Juan"></label>
      <label>Segundo nombre<input id="student-second-name" autocomplete="additional-name" placeholder="Ej: Carlos (opcional)"></label>
      <label>Primer apellido<input id="student-first-surname" autocomplete="family-name" placeholder="Ej: Pérez"></label>
      <label>Segundo apellido<input id="student-second-surname" autocomplete="off" placeholder="Ej: Ortiz (opcional)"></label>
      <label class="full-name-derived">Nombre completo (auto)<input id="student-name" autocomplete="name" placeholder="Se completa solo a partir de los campos de arriba" readonly></label>
      <label>Identificador / carnet<input id="student-id" autocomplete="off" placeholder="Carnet o ID alternativo"></label>
      <label>Correo institucional<input id="student-email" type="email" autocomplete="email" placeholder="@thelaunchpadtlp.education"></label>
      <label>Fecha<input id="student-date" type="date"></label>
      <label>Profesor/a<input id="teacher-name"></label>
      <label>Sección / grupo<input id="student-section" placeholder="Ej. 10-A"></label>
      <div class="score-box"><span>Puntaje total</span><strong>${assessment.points} puntos</strong></div>
      <div class="score-box criterion"><span>Criterio</span><strong>1 punto por ítem · sin parciales</strong></div>
    </section>
    <section class="instructions">
      <h2>Instrucciones generales</h2>
      <p>Respondé cada pregunta con oraciones completas, vocabulario propio de Biología y explicación de procesos, relaciones, evidencias o consecuencias. Las respuestas vagas, incompletas o copiadas sin comprensión pueden calificarse como incorrectas.</p>
      <div class="criteria-row">
        <span>${assessment.points} preguntas</span>
        <span>1 punto por pregunta</span>
        <span>Sin medios puntos</span>
        <span>3 a 6 líneas cuando corresponda</span>
        <span>${assessment.sections.length} ejes (MEP)</span>
      </div>
    </section>
    <section class="evaluation-framework" aria-labelledby="eval-title">
      <h2 id="eval-title">Cómo se evalúa esta tarea</h2>
      <p class="evaluation-lead">Esta es una tarea con rango de examen: tiene ${assessment.points} ítems, cubre los ${assessment.sections.length} ejes del programa MEP de Biología 10 y se califica con criterio binario y trazabilidad por pregunta.</p>
      <div class="evaluation-grid">
        <div class="evaluation-card">
          <h3>Criterio de calificación</h3>
          <ul class="evaluation-rules">${evaluationCriteriaList()}</ul>
        </div>
        <div class="evaluation-card">
          <h3>Niveles de desempeño</h3>
          <p class="passing-note"><strong>Línea de aprobación TLP:</strong> ${passingThreshold}%. Todo nivel con puntaje &lt; ${passingThreshold}% se reporta como <em>no alcanzado</em> y requiere refuerzo o reentrega.</p>
          <table class="performance-table" aria-label="Escala de niveles de desempeño">
            <thead><tr><th scope="col">%</th><th scope="col">Nivel</th><th scope="col">Descripción</th></tr></thead>
            <tbody>${performanceTableRows()}</tbody>
          </table>
        </div>
      </div>
      <div class="cognitive-balance" aria-labelledby="cog-balance-title">
        <h3 id="cog-balance-title">Balance cognitivo del instrumento</h3>
        <p class="cognitive-balance-lead">Esta tarea no se reduce a memorizar. Pone más peso en comprender, comparar y analizar — y termina exigiendo justificar e integrar conceptos. Cada pregunta tiene un nivel cognitivo asignado, visible en la tarjeta de la pregunta.</p>
        <ul class="cognitive-balance-list">${cognitiveBalanceRows()}</ul>
      </div>
      ${verbGlossaryBlock()}
      <p class="evaluation-foot">Cada respuesta queda asociada a su número de pregunta, eje, tipo de consigna y nivel cognitivo, lo que permite recibir retroalimentación pregunta por pregunta, revisar progreso por sección y analizar fortalezas por tipo de habilidad.</p>
    </section>
    <nav class="toolbar" aria-label="Herramientas de trabajo">
      <div class="progress-wrap">
        <div class="progress-label">
          <span>Progreso total</span>
          <span id="progress-text">0/${assessment.points} respuestas con avance</span>
        </div>
        <div class="progress-track"><div class="progress-fill" id="progress-fill"></div></div>
        <div class="section-progress-grid">${sectionProgress()}</div>
      </div>
      <div class="actions">
        <button id="export-json" type="button">Guardar JSON</button>
        <button class="secondary" id="print-page" type="button">Imprimir</button>
        <button class="secondary" id="clear-local" type="button">Borrar local</button>
        <button class="secondary teacher-toggle" id="teacher-toggle" type="button" aria-pressed="false">Vista docente</button>
      </div>
    </nav>
    <aside class="teacher-banner" id="teacher-banner" hidden role="note">
      <strong>Vista docente activada.</strong> Esta vista convierte el examen en una guía de calificación: muestra los criterios <em>Debe incluir</em> y <em>No hacer</em>, y agrega una casilla por pregunta para anotar Veredicto, Puntaje y Observación. Útil para imprimir y corregir a mano. Para volver a la vista del estudiante, hacé clic en <strong>“Vista estudiante”</strong> o quitá <code>#vista-docente</code> de la URL.
    </aside>
    ${assessment.sections.map(sectionBlock).join("")}
    <section class="final-check">
      <h2>Declaración final del estudiante</h2>
      <p class="final-check-lead">Marcá cada casilla solo si podés afirmar la frase con honestidad. Estas casillas forman parte del registro de tu entrega.</p>
      <label><input type="checkbox" id="check-all"> Respondí todas las preguntas que me correspondían.</label>
      <label><input type="checkbox" id="check-lines"> Mis respuestas tienen entre 3 y 6 líneas cuando la consigna lo requiere.</label>
      <label><input type="checkbox" id="check-vocab"> Usé vocabulario propio de Biología.</label>
      <label><input type="checkbox" id="check-clarity"> Revisé claridad, precisión científica y ortografía.</label>
      <label><input type="checkbox" id="check-criterion"> Comprendí que cada pregunta vale 1 punto exacto y que no hay medios puntos.</label>
      <label><input type="checkbox" id="check-format"> Cuando la consigna pedía explicar, comparar, ejemplificar o citar, cumplí ese formato.</label>
      <label><input type="checkbox" id="check-honor"> Mis respuestas son originales y se basan en la materia trabajada (no las copié de un compañero ni de IA).</label>
    </section>
    <section class="submit-bar">
      <h2>Listo para entregar</h2>
      <p>Cuando termines de responder y revisar tu trabajo, hacé clic en <strong>Finalizar y entregar</strong>. Vas a descargar un archivo con tus respuestas que tenés que adjuntar a tu tarea de Google Classroom.</p>
      <button id="submit-final" type="button">Finalizar y entregar →</button>
    </section>
  </main>
  <div class="modal-overlay" id="confirm-modal" hidden role="dialog" aria-modal="true" aria-labelledby="confirm-title">
    <div class="modal">
      <h2 id="confirm-title">Antes de finalizar</h2>
      <p>Revisá esta lista. Una vez que finalices se descargará tu archivo de respuestas. Podés volver atrás si necesitás corregir algo.</p>
      <ul class="confirm-list" id="confirm-list"></ul>
      <details class="confirm-details" id="confirm-incomplete-wrap" hidden>
        <summary>Ver preguntas con respuesta vacía o muy breve</summary>
        <ol class="incomplete-list" id="confirm-incomplete-list"></ol>
      </details>
      <div class="modal-actions">
        <button class="secondary" id="jump-first-incomplete" type="button" hidden>Ir a la primera obligatoria incompleta</button>
        <button class="secondary" id="cancel-submit" type="button">Volver a revisar</button>
        <button id="confirm-submit" type="button">Finalizar y descargar</button>
      </div>
    </div>
  </div>
  <section class="handoff-screen" id="handoff-screen" hidden aria-labelledby="handoff-title">
    <div class="handoff-card">
      <div class="handoff-icon" aria-hidden="true">✓</div>
      <h2 id="handoff-title">¡Entrega registrada!</h2>
      <p class="handoff-lead">Tu evaluación quedó registrada con tu docente. No tenés que descargar ni subir nada — todo se guardó automáticamente.</p>
      <h3>Resumen</h3>
      <ul class="handoff-summary" id="handoff-summary"></ul>
      <div class="handoff-backend-status" id="handoff-backend-status" data-state="idle" aria-live="polite"></div>
      <div class="handoff-pregrade" id="handoff-pregrade"></div>
      <p class="handoff-grading-info"><strong>Tu docente recibirá la entrega y registrará tu nota</strong> según el criterio TLP (1 punto por ítem, sin parciales, línea de aprobación 80 %).</p>
      <div class="handoff-actions">
        <button class="secondary" id="back-to-test" type="button">Revisar tus respuestas</button>
      </div>
      <p class="handoff-back"><a href="https://evaluacosas.thelaunchpadtlp.education/" class="handoff-back-link"><span aria-hidden="true">←</span> Volver al catálogo de <strong>evaluacosas</strong></a></p>
      <p id="handoff-filename" class="handoff-filename" hidden></p>
      <button id="redownload" type="button" hidden></button>
      <div class="handoff-toast" id="handoff-toast" role="status" aria-live="polite" hidden></div>
    </div>
  </section>
  <script>
const ASSESSMENT_META = ${JSON.stringify({
  title: assessment.title,
  subtitle: assessment.subtitle,
  institution: assessment.institution,
  institutionLong: assessment.institutionLong,
  program: assessment.program,
  course: assessment.course,
  grade: assessment.grade,
  instrument: assessment.instrument,
  source: assessment.source,
  modality: assessment.modality,
  suggestedTime: assessment.suggestedTime,
  schemaVersion: assessment.schemaVersion,
  points: assessment.points,
  evaluationCriteria,
  performanceLevels,
  passingThreshold,
  cognitiveLevelDefinitions,
  cognitiveLevelByQuestion,
  verbGlossary,
  sections: assessment.sections.map((section) => ({
    slug: section.slug,
    axis: section.axis,
    title: section.title,
    questionIds: section.questions.map((question) => question.id),
    commonErrors: section.commonErrors,
    instructions: section.instructions,
    closing: section.closing,
    microreading: section.microreading
  })),
  blueprint: assessment.sections.flatMap((section) => section.questions.map((question) => ({
    id: question.id,
    section: section.slug,
    axis: section.axis,
    prompt: question.prompt,
    type: inferType(question.prompt),
    cognitiveLevel: cognitiveLevelByQuestion[question.id] || null,
    must: question.must,
    avoid: question.avoid
  })))
})};

const canvas = document.getElementById("bio-canvas");
const ctx = canvas.getContext("2d");
let width = 0;
let height = 0;
const particles = Array.from({ length: 72 }, (_, index) => ({
  x: Math.random(),
  y: Math.random(),
  r: 1 + Math.random() * 2.4,
  hue: index % 3,
  speed: .12 + Math.random() * .28
}));

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawCanvas() {
  ctx.clearRect(0, 0, width, height);
  particles.forEach((particle) => {
    particle.y -= particle.speed / Math.max(height, 1);
    if (particle.y < -0.04) {
      particle.y = 1.04;
      particle.x = Math.random();
    }
    const color = particle.hue === 0 ? "57,217,138" : particle.hue === 1 ? "103,209,255" : "255,209,102";
    ctx.beginPath();
    ctx.arc(particle.x * width, particle.y * height, particle.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(" + color + ", .42)";
    ctx.fill();
  });
  requestAnimationFrame(drawCanvas);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawCanvas();

${app}
initAssessment();
</script>
<footer class="bio-site-footer">
  <div class="bio-site-footer-inner">
    <p class="bio-footer-brand"><strong>${esc(assessment.institution)}</strong> · ${esc(assessment.institutionLong)}</p>
    <ul class="bio-footer-links">
      <li><a href="/">Catálogo</a></li>
      <li><a href="/ayuda/estudiantes/">Ayuda</a></li>
      <li><a href="/privacy/">Privacidad</a></li>
      <li><a href="/dashboard/">🔐 Docentes</a></li>
    </ul>
  </div>
</footer>
<script src="/device-view.js" defer></script>
</body>
</html>`;

writeFileSync(join(root, "index.html"), html);
console.log("Built index.html");
