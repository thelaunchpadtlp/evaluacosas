const STORAGE_KEY = "tlp_biologia10_integral80_respuestas";
const COMPLETE_MIN_LENGTH = 28;

export function initAssessment() {
  const inputs = document.querySelectorAll("textarea, input");
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  const progressText = document.querySelector("#progress-text");
  const progressFill = document.querySelector("#progress-fill");
  const textareas = Array.from(document.querySelectorAll("textarea[id^='q']"));
  const sectionMeta = (typeof ASSESSMENT_META !== "undefined" && ASSESSMENT_META.sections) ? ASSESSMENT_META.sections : [];

  inputs.forEach((input) => {
    if (saved[input.id] !== undefined) {
      if (input.type === "checkbox") input.checked = Boolean(saved[input.id]);
      else input.value = saved[input.id];
    }
    input.addEventListener("input", () => {
      const next = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      next[input.id] = input.type === "checkbox" ? input.checked : input.value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      updateProgress();
    });
  });

  document.querySelector("#export-json")?.addEventListener("click", () => exportJson());
  document.querySelector("#print-page")?.addEventListener("click", () => window.print());
  document.querySelector("#clear-local")?.addEventListener("click", clearLocal);

  const submitBtn = document.querySelector("#submit-final");
  const confirmModal = document.querySelector("#confirm-modal");
  const confirmList = document.querySelector("#confirm-list");
  const confirmIncompleteWrap = document.querySelector("#confirm-incomplete-wrap");
  const confirmIncompleteList = document.querySelector("#confirm-incomplete-list");
  const cancelSubmit = document.querySelector("#cancel-submit");
  const confirmSubmit = document.querySelector("#confirm-submit");
  const jumpFirstBtn = document.querySelector("#jump-first-incomplete");
  const handoffScreen = document.querySelector("#handoff-screen");
  const handoffFilename = document.querySelector("#handoff-filename");
  const redownload = document.querySelector("#redownload");
  const backToTest = document.querySelector("#back-to-test");

  submitBtn?.addEventListener("click", openConfirmModal);
  cancelSubmit?.addEventListener("click", closeConfirmModal);
  confirmSubmit?.addEventListener("click", () => {
    if (confirmSubmit?.dataset.blocked === "true") return;
    finalizeSubmit();
  });
  jumpFirstBtn?.addEventListener("click", () => {
    const id = Number(jumpFirstBtn.dataset.targetId);
    if (id) {
      closeConfirmModal();
      jumpToQuestion(id);
    }
  });
  redownload?.addEventListener("click", () => exportJson());
  backToTest?.addEventListener("click", returnToTest);
  document.querySelector("#copy-llm-bundle")?.addEventListener("click", copyLlmBundle);
  confirmModal?.addEventListener("click", (event) => {
    if (event.target === confirmModal) closeConfirmModal();
  });

  textareas.forEach((textarea) => textarea.addEventListener("input", () => updateMeta(textarea)));
  textareas.forEach(updateMeta);
  initStudentPicker();
  initSaveAndNext();
  initCoach();
  initNameDerivation();
  initCedulaLookup();
  initAnswerStateButtons();
  ["#student-name", "#student-id", "#student-email", "#student-section", "#teacher-name", "#student-date"].forEach((sel) => {
    document.querySelector(sel)?.addEventListener("input", updateContextBarStatus);
  });
  document.querySelectorAll(".final-check input[type='checkbox']").forEach((cb) => {
    cb.addEventListener("change", updateContextBarStatus);
  });
  updateProgress();
  initContextBar();
  initTeacherToggle();
  initTocPanel();

  function updateMeta(textarea) {
    const meta = document.querySelector(`[data-meta-for="${textarea.id}"]`);
    const indicator = document.querySelector(`.save-indicator[data-for="${textarea.id}"]`);
    const value = textarea.value;
    const trimmed = value.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const lines = value.split(/\n/).filter((line) => line.trim()).length;
    if (meta) meta.textContent = `${words} palabras | ${lines} líneas`;
    if (indicator) {
      const chars = trimmed.length;
      if (chars === 0) {
        indicator.dataset.state = "empty";
        indicator.textContent = "○ Aún no respondida";
      } else if (chars < COMPLETE_MIN_LENGTH) {
        indicator.dataset.state = "partial";
        indicator.textContent = `↻ Borrador guardado · ${chars} caracteres (mínimo recomendado ${COMPLETE_MIN_LENGTH})`;
      } else {
        indicator.dataset.state = "saved";
        indicator.textContent = "✓ Guardada localmente · podés editarla antes del envío final";
      }
    }
  }

  function updateProgress() {
    const complete = textareas.filter((textarea) => textarea.value.trim().length >= COMPLETE_MIN_LENGTH).length;
    const percent = textareas.length ? Math.round((complete / textareas.length) * 100) : 0;
    if (progressText) progressText.textContent = `${complete}/${textareas.length} respuestas con avance`;
    if (progressFill) progressFill.style.width = `${percent}%`;
    updateSectionProgress();
    updateContextBarStatus();
    updateTocDots();
    textareas.forEach(updateMeta);
  }

  function updateTocDots() {
    const tocProgress = document.querySelector("#toc-progress-text");
    let complete = 0;
    textareas.forEach((textarea) => {
      const chars = textarea.value.trim().length;
      let state = "empty";
      if (chars >= COMPLETE_MIN_LENGTH) { state = "substantive"; complete += 1; }
      else if (chars > 0) state = "partial";
      const dot = document.querySelector(`.toc-dot[data-for="${textarea.id}"]`);
      if (dot) {
        dot.dataset.state = state;
        dot.setAttribute("aria-label", `estado: ${state === "empty" ? "vacía" : state === "partial" ? "parcial" : "completa"}`);
      }
    });
    if (tocProgress) tocProgress.textContent = `${complete}/${textareas.length}`;
  }

  function initTocPanel() {
    const fab = document.querySelector("#toc-fab");
    const panel = document.querySelector("#toc-panel");
    const close = document.querySelector("#toc-close");
    const firstIncomplete = document.querySelector("#toc-first-incomplete");
    const nextSection = document.querySelector("#toc-next-section");
    if (!fab || !panel) return;

    let lastFocusBeforeToc = null;

    const open = () => {
      lastFocusBeforeToc = document.activeElement;
      panel.hidden = false;
      fab.dataset.state = "visible-but-still";
      requestAnimationFrame(() => {
        panel.classList.add("open");
        fab.setAttribute("aria-expanded", "true");
        close?.focus();
      });
    };
    const closeFn = () => {
      panel.classList.remove("open");
      fab.setAttribute("aria-expanded", "false");
      delete fab.dataset.state;
      setTimeout(() => { panel.hidden = true; }, 220);
      if (lastFocusBeforeToc && typeof lastFocusBeforeToc.focus === "function") {
        lastFocusBeforeToc.focus();
      }
    };
    const toggle = () => panel.classList.contains("open") ? closeFn() : open();

    // Cursor follow (desktop only): el FAB se inclina sutilmente hacia el cursor.
    if (window.matchMedia && window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let raf = null;
      const onMove = (event) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = null;
          const rect = fab.getBoundingClientRect();
          const fx = rect.left + rect.width / 2;
          const fy = rect.top + rect.height / 2;
          const dx = (event.clientX - fx) / 80; // amortiguado
          const dy = (event.clientY - fy) / 80;
          const clampedX = Math.max(-12, Math.min(12, dx));
          const clampedY = Math.max(-12, Math.min(12, dy));
          fab.style.setProperty("--cursor-dx", clampedX + "px");
          fab.style.setProperty("--cursor-dy", clampedY + "px");
        });
      };
      document.addEventListener("mousemove", onMove, { passive: true });
    }

    // Inyectar acción "Finalizar y entregar" al inicio del panel (atajo desde el mapa)
    const tocBody = document.querySelector("#toc-body");
    if (tocBody && !document.querySelector("#toc-actions")) {
      const actions = document.createElement("div");
      actions.id = "toc-actions";
      actions.className = "toc-section toc-section-primary";
      actions.innerHTML = `
        <h3 class="toc-section-title">Acciones</h3>
        <ul class="toc-questions">
          <li><button type="button" class="toc-q-btn toc-finalize" id="toc-finalize-btn"><span class="toc-q-num">✓</span><span class="toc-q-prompt"><strong>Finalizar y entregar evaluación</strong></span></button></li>
          <li><button type="button" class="toc-q-btn" id="toc-print-btn"><span class="toc-q-num">⎙</span><span class="toc-q-prompt">Imprimir</span></button></li>
        </ul>`;
      tocBody.insertBefore(actions, tocBody.firstChild);
      actions.querySelector("#toc-finalize-btn")?.addEventListener("click", () => {
        closeFn();
        const submitBtn = document.querySelector("#submit-final");
        submitBtn?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => submitBtn?.click(), 400);
      });
      actions.querySelector("#toc-print-btn")?.addEventListener("click", () => {
        closeFn();
        setTimeout(() => window.print(), 250);
      });
    }

    fab.addEventListener("click", toggle);
    close?.addEventListener("click", closeFn);

    panel.querySelectorAll(".toc-q-btn[data-jump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.jump);
        if (id) {
          if (window.matchMedia("(max-width: 720px)").matches) closeFn();
          jumpToQuestion(id);
        }
      });
    });

    firstIncomplete?.addEventListener("click", () => {
      const incomplete = getIncompleteQuestions().filter((q) => {
        const t = document.querySelector(`#q${q.id}`);
        return t && t.dataset.required !== "false";
      });
      if (incomplete.length > 0) {
        if (window.matchMedia("(max-width: 720px)").matches) closeFn();
        jumpToQuestion(incomplete[0].id);
      }
    });

    nextSection?.addEventListener("click", () => {
      const sections = Array.from(document.querySelectorAll(".content-section"));
      const scrollY = window.scrollY + 80;
      const next = sections.find((s) => s.offsetTop > scrollY);
      const target = next || sections[0];
      if (target) {
        if (window.matchMedia("(max-width: 720px)").matches) closeFn();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "?") { event.preventDefault(); toggle(); }
      else if (event.key === "Escape" && panel.classList.contains("open")) { closeFn(); }
      else if (event.key === "j") { jumpToAdjacent(1); }
      else if (event.key === "k") { jumpToAdjacent(-1); }
    });

    updateTocDots();
  }

  function jumpToAdjacent(direction) {
    const cards = Array.from(document.querySelectorAll(".question-card"));
    if (cards.length === 0) return;
    const scrollY = window.scrollY + 100;
    let currentIdx = -1;
    cards.forEach((card, idx) => {
      if (card.offsetTop <= scrollY) currentIdx = idx;
    });
    const targetIdx = Math.max(0, Math.min(cards.length - 1, currentIdx + direction));
    const target = cards[targetIdx];
    if (target) {
      const id = Number(target.id.replace("pregunta-", ""));
      jumpToQuestion(id);
    }
  }

  function initContextBar() {
    const bar = document.querySelector("#context-bar");
    if (!bar) return;
    const back = document.querySelector("#context-bar-back");
    back?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    // Context-bar SIEMPRE visible (eliminado el hide en hero según pedido user)
    bar.dataset.state = "visible";

    const axisEl = document.querySelector("#context-bar-axis");
    const questionEl = document.querySelector("#context-bar-question");

    if ("IntersectionObserver" in window) {
      const sectionObserver = new IntersectionObserver((entries) => {
        const inView = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (inView && axisEl) {
          const slug = inView.target.dataset.section;
          const section = sectionMeta.find((s) => s.slug === slug);
          if (section) axisEl.textContent = `${section.axis} · ${section.title}`;
        }
      }, { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5] });
      document.querySelectorAll(".content-section").forEach((el) => sectionObserver.observe(el));

      const cardObserver = new IntersectionObserver((entries) => {
        const inView = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (inView && questionEl) {
          const id = inView.target.id.replace("pregunta-", "");
          questionEl.textContent = `Pregunta ${id} de ${textareas.length}`;
        }
      }, { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5] });
      document.querySelectorAll(".question-card").forEach((el) => cardObserver.observe(el));
    }

    updateContextBarStatus();
  }

  function updateContextBarStatus() {
    const status = document.querySelector("#context-bar-status");
    if (!status) return;
    const completedCount = textareas.filter((t) => t.value.trim().length >= COMPLETE_MIN_LENGTH).length;
    const studentName = (document.querySelector("#student-name")?.value || "").trim();
    const studentId = (document.querySelector("#student-id")?.value || "").trim();
    const checkBoxes = Array.from(document.querySelectorAll(".final-check input[type='checkbox']"));
    const allChecked = checkBoxes.length > 0 && checkBoxes.every((cb) => cb.checked);
    const allComplete = completedCount === textareas.length && studentName && studentId && allChecked;
    if (allComplete) {
      status.dataset.status = "ready";
      status.textContent = "Listo para finalizar";
    } else {
      status.dataset.status = "incomplete";
      const pct = textareas.length ? Math.round((completedCount / textareas.length) * 100) : 0;
      status.textContent = `En progreso · ${pct}%`;
    }
  }

  function updateSectionProgress() {
    sectionMeta.forEach((section) => {
      const sectionTextareas = textareas.filter((t) => t.dataset.section === section.slug);
      const sectionComplete = sectionTextareas.filter((t) => t.value.trim().length >= COMPLETE_MIN_LENGTH).length;
      const total = sectionTextareas.length || section.questionIds.length;
      const text = document.querySelector(`[data-progress-text="${section.slug}"]`);
      const fill = document.querySelector(`[data-progress-fill="${section.slug}"]`);
      if (text) text.textContent = `${sectionComplete}/${total}`;
      if (fill) fill.style.width = total ? `${Math.round((sectionComplete / total) * 100)}%` : "0%";
    });
  }

  function getIncompleteQuestions() {
    return textareas
      .filter((textarea) => textarea.value.trim().length < COMPLETE_MIN_LENGTH)
      .map((textarea) => {
        const id = Number(textarea.id.replace(/^q/, ""));
        const sectionSlug = textarea.dataset.section || "";
        const section = sectionMeta.find((s) => s.slug === sectionSlug);
        const charCount = textarea.value.trim().length;
        return {
          id,
          slug: sectionSlug,
          axis: section?.axis || "",
          chars: charCount,
          empty: charCount === 0
        };
      })
      .sort((a, b) => a.id - b.id);
  }

  function collectData() {
    const meta = (typeof ASSESSMENT_META !== "undefined") ? ASSESSMENT_META : {};
    const studentInputs = ["student-name", "student-id", "student-email", "student-date", "teacher-name", "student-section"];
    const data = {
      schema: "tlp.biologia10.tarea_integral_80",
      schemaVersion: meta.schemaVersion || "2.1",
      exportedAt: new Date().toISOString(),
      institution: meta.institution || null,
      institutionLong: meta.institutionLong || null,
      program: meta.program || null,
      course: meta.course || null,
      grade: meta.grade || null,
      assessment: {
        title: meta.title || "Biología 10 — Tarea Integral Avanzada",
        subtitle: meta.subtitle || null,
        instrument: meta.instrument || null,
        source: meta.source || null,
        modality: meta.modality || null,
        suggestedTime: meta.suggestedTime || null,
        totalPoints: meta.points || 80,
        evaluationCriteria: meta.evaluationCriteria || null,
        performanceLevels: meta.performanceLevels || null,
        cognitiveLevelDefinitions: meta.cognitiveLevelDefinitions || null
      },
      student: {},
      checks: {},
      answers: {},
      analytics: {
        completeMinLength: COMPLETE_MIN_LENGTH,
        substantiveAnswers: 0,
        emptyAnswers: 0,
        bySection: {},
        byQuestion: {},
        preGrade: {
          disclaimer: PRE_GRADE_DISCLAIMER,
          totalScore: 0,
          totalPossible: textareas.length,
          percentage: 0,
          preliminaryLevel: null,
          passingHeuristic: false,
          passingThreshold: meta.passingThreshold || 80,
          bySection: {}
        }
      },
      blueprint: meta.blueprint || []
    };

    studentInputs.forEach((id) => {
      const input = document.getElementById(id);
      if (input) data.student[id] = input.value;
    });

    document.querySelectorAll(".final-check input[type='checkbox']").forEach((input) => {
      data.checks[input.id] = input.checked;
    });

    sectionMeta.forEach((section) => {
      data.analytics.bySection[section.slug] = {
        axis: section.axis,
        title: section.title,
        total: section.questionIds.length,
        substantive: 0,
        empty: 0
      };
      data.analytics.preGrade.bySection[section.slug] = {
        axis: section.axis,
        title: section.title,
        total: section.questionIds.length,
        score: 0,
        percentage: 0
      };
    });

    const blueprintMap = {};
    (meta.blueprint || []).forEach((entry) => { blueprintMap[entry.id] = entry; });

    textareas.forEach((textarea) => {
      const value = textarea.value;
      const trimmed = value.trim();
      const id = textarea.id;
      const numericId = Number(id.replace(/^q/, ""));
      const sectionSlug = textarea.dataset.section || "";
      const words = trimmed ? trimmed.split(/\s+/).length : 0;
      const lines = value.split(/\n/).filter((line) => line.trim()).length;
      const chars = trimmed.length;
      const isSubstantive = chars >= COMPLETE_MIN_LENGTH;

      const cognitiveLevel = (meta.cognitiveLevelByQuestion || {})[numericId] || null;
      const bp = blueprintMap[numericId];
      const preGrade = computePreGrade(value, bp ? bp.must : [], bp ? bp.avoid : []);
      data.answers[id] = value;
      data.analytics.byQuestion[id] = {
        questionId: numericId,
        section: sectionSlug,
        cognitiveLevel,
        chars,
        words,
        lines,
        substantive: isSubstantive,
        empty: chars === 0,
        preGrade
      };
      data.analytics.preGrade.totalScore += preGrade.score;
      const sectionPre = data.analytics.preGrade.bySection[sectionSlug];
      if (sectionPre) sectionPre.score += preGrade.score;

      if (isSubstantive) data.analytics.substantiveAnswers += 1;
      if (chars === 0) data.analytics.emptyAnswers += 1;
      const sectionStats = data.analytics.bySection[sectionSlug];
      if (sectionStats) {
        if (isSubstantive) sectionStats.substantive += 1;
        if (chars === 0) sectionStats.empty += 1;
      }
    });

    const pg = data.analytics.preGrade;
    pg.percentage = pg.totalPossible > 0 ? Math.round((pg.totalScore / pg.totalPossible) * 1000) / 10 : 0;
    pg.passingHeuristic = pg.percentage >= pg.passingThreshold;
    const levels = meta.performanceLevels || [];
    pg.preliminaryLevel = levels.find((l) => pg.percentage >= l.min && pg.percentage <= l.max) || null;
    Object.values(pg.bySection).forEach((sec) => {
      sec.percentage = sec.total > 0 ? Math.round((sec.score / sec.total) * 1000) / 10 : 0;
    });

    return data;
  }

  function exportJson() {
    const data = collectData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const rawName = (data.student["student-name"] || "estudiante").trim().replace(/[^\w-]+/g, "_");
    const dateStamp = (data.student["student-date"] || new Date().toISOString().slice(0, 10)).replace(/[^\d-]/g, "");
    const filename = `respuestas_biologia10_${rawName || "estudiante"}_${dateStamp}.json`;
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    if (handoffFilename) handoffFilename.textContent = filename;
    return filename;
  }

  let lastFocusBeforeModal = null;
  let lastFocusBeforeHandoff = null;

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (confirmModal && !confirmModal.hidden) {
        closeConfirmModal();
      }
    }
  });

  function openConfirmModal() {
    if (!confirmModal || !confirmList) return;
    lastFocusBeforeModal = document.activeElement;
    const items = buildConfirmItems();
    const blocked = items.some((item) => item.block);
    confirmList.innerHTML = items
      .map((item) => `<li class="${item.ok ? "ok" : (item.block ? "block" : "warn")}" data-mark="${item.ok ? "✓" : (item.block ? "⛔" : "!")}">${item.label}</li>`)
      .join("");
    const incomplete = getIncompleteQuestions();
    if (confirmIncompleteWrap && confirmIncompleteList) {
      if (incomplete.length === 0) {
        confirmIncompleteWrap.hidden = true;
        confirmIncompleteList.innerHTML = "";
      } else {
        confirmIncompleteWrap.hidden = false;
        confirmIncompleteWrap.open = true;
        const blueprint = getBlueprintMap();
        confirmIncompleteList.innerHTML = incomplete
          .map((q) => {
            const status = q.empty ? "vacía" : `${q.chars} caracteres (insuficiente)`;
            const bp = blueprint[q.id];
            const fix = bp && Array.isArray(bp.must) && bp.must[0]
              ? `<div class="incomplete-fix">Tu respuesta debe incluir: <em>${escapeHtml(bp.must[0])}</em>.</div>`
              : "";
            return `<li><a href="#pregunta-${q.id}" data-jump="${q.id}"><strong>Pregunta ${q.id}</strong> — ${escapeHtml(q.axis)}</a> <span class="incomplete-status">${status}</span>${fix}</li>`;
          })
          .join("");
        confirmIncompleteList.querySelectorAll("a[data-jump]").forEach((anchor) => {
          anchor.addEventListener("click", (event) => {
            event.preventDefault();
            const id = anchor.getAttribute("data-jump");
            closeConfirmModal();
            jumpToQuestion(Number(id));
          });
        });
      }
    }
    if (confirmSubmit) {
      confirmSubmit.disabled = blocked;
      confirmSubmit.dataset.blocked = blocked ? "true" : "false";
      confirmSubmit.textContent = blocked
        ? "No se puede finalizar — corregí los faltantes obligatorios"
        : "Finalizar y descargar";
    }
    if (jumpFirstBtn) {
      const firstIncomplete = incomplete[0];
      jumpFirstBtn.hidden = !firstIncomplete;
      jumpFirstBtn.dataset.targetId = firstIncomplete ? firstIncomplete.id : "";
    }
    confirmModal.hidden = false;
    requestAnimationFrame(() => {
      cancelSubmit?.focus();
    });
  }

  function getBlueprintMap() {
    const meta = (typeof ASSESSMENT_META !== "undefined") ? ASSESSMENT_META : {};
    const map = {};
    (meta.blueprint || []).forEach((entry) => { map[entry.id] = entry; });
    return map;
  }

  function jumpToQuestion(id) {
    const target = document.querySelector(`#pregunta-${id}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    const textarea = target.querySelector("textarea");
    if (textarea) {
      setTimeout(() => textarea.focus({ preventScroll: true }), 280);
    }
  }

  function closeConfirmModal() {
    if (confirmModal) confirmModal.hidden = true;
    if (lastFocusBeforeModal && typeof lastFocusBeforeModal.focus === "function") {
      lastFocusBeforeModal.focus();
    }
  }

  function buildConfirmItems() {
    const items = [];
    const requiredAreas = textareas.filter((t) => t.dataset.required !== "false");
    const completedRequired = requiredAreas.filter((t) => t.value.trim().length >= COMPLETE_MIN_LENGTH).length;
    const allRequiredOk = completedRequired === requiredAreas.length && requiredAreas.length > 0;
    items.push({
      ok: allRequiredOk,
      block: !allRequiredOk,
      label: allRequiredOk
        ? `${completedRequired}/${requiredAreas.length} preguntas obligatorias completas (≥${COMPLETE_MIN_LENGTH} caracteres)`
        : `Faltan ${requiredAreas.length - completedRequired} preguntas obligatorias por completar (no se puede finalizar hasta corregir).`
    });
    sectionMeta.forEach((section) => {
      const sectionTextareas = textareas.filter((t) => t.dataset.section === section.slug);
      const sectionComplete = sectionTextareas.filter((t) => t.value.trim().length >= COMPLETE_MIN_LENGTH).length;
      const total = sectionTextareas.length;
      items.push({
        ok: sectionComplete === total && total > 0,
        label: `${section.axis}: ${sectionComplete}/${total} preguntas con avance`
      });
    });
    const fieldChecks = [
      { id: "student-name", label: "Nombre completo", missing: "Falta el nombre completo del estudiante", required: true },
      { id: "student-id", label: "Identificador / cédula", missing: "Falta el identificador o cédula", required: true },
      { id: "student-email", label: "Correo institucional", missing: "Falta el correo institucional o tiene formato inválido", validator: (v) => /\S+@\S+\.\S+/.test(v), required: true },
      { id: "student-date", label: "Fecha", missing: "Falta la fecha", required: true },
      { id: "teacher-name", label: "Profesor/a", missing: "Falta el nombre del profesor/a", required: true },
      { id: "student-section", label: "Sección / grupo", missing: "Falta la sección o grupo", required: true }
    ];
    fieldChecks.forEach((field) => {
      const value = (document.querySelector(`#${field.id}`)?.value || "").trim();
      const isValid = value.length > 0 && (!field.validator || field.validator(value));
      items.push({
        ok: isValid,
        block: !isValid && field.required,
        label: isValid ? `${field.label}: ${value}` : field.missing
      });
    });
    const checkBoxes = Array.from(document.querySelectorAll(".final-check input[type='checkbox']"));
    const checked = checkBoxes.filter((cb) => cb.checked).length;
    const allChecksOk = checked === checkBoxes.length && checkBoxes.length > 0;
    items.push({
      ok: allChecksOk,
      block: !allChecksOk,
      label: allChecksOk
        ? `${checked}/${checkBoxes.length} casillas de declaración marcadas`
        : `Marcá las ${checkBoxes.length - checked} casillas restantes de la declaración final.`
    });
    return items;
  }

  const SUBMIT_ENDPOINT = "https://evaluacosas-submit-handler-441768184201.us-central1.run.app/submit";

  function setAnswerState(questionId, state) {
    // state: "idle" (todavía no respondida), "editing" (textarea activo), "saved" (locked)
    const card = document.querySelector(`#pregunta-${questionId.replace(/^q/, "")}`);
    const textarea = document.getElementById(questionId);
    const btnRespond = card?.querySelector(`[data-action="respond"]`);
    const btnSave = card?.querySelector(`[data-action="save"]`);
    const btnEdit = card?.querySelector(`[data-action="edit"]`);
    const btnNext = card?.querySelector(`.save-and-next`);
    if (!card || !textarea) return;
    card.dataset.answerState = state;
    if (state === "idle") {
      textarea.readOnly = true;
      btnRespond.hidden = false;
      btnSave.hidden = true;
      btnEdit.hidden = true;
      if (btnNext) btnNext.hidden = true;
    } else if (state === "editing") {
      textarea.readOnly = false;
      btnRespond.hidden = true;
      btnSave.hidden = false;
      btnEdit.hidden = true;
      if (btnNext) btnNext.hidden = true;
      setTimeout(() => textarea.focus({ preventScroll: true }), 50);
    } else if (state === "saved") {
      textarea.readOnly = true;
      btnRespond.hidden = true;
      btnSave.hidden = true;
      btnEdit.hidden = false;
      if (btnNext) btnNext.hidden = false;
    }
    try { localStorage.setItem(`evaluacosas:state:${questionId}`, state); } catch {}
  }

  function initAnswerStateButtons() {
    document.querySelectorAll(".answer-state-buttons").forEach((wrap) => {
      const qid = wrap.dataset.for;
      // Restore state desde localStorage
      let state = null;
      try { state = localStorage.getItem(`evaluacosas:state:${qid}`); } catch {}
      const textarea = document.getElementById(qid);
      if (state === "saved" && textarea?.value.trim().length > 0) {
        setAnswerState(qid, "saved");
      } else if (state === "editing") {
        setAnswerState(qid, "idle"); // reset to idle on reload to require explicit click
      } else {
        setAnswerState(qid, "idle");
      }
    });

    document.body.addEventListener("click", (e) => {
      const t = e.target.closest("[data-action]");
      if (!t) return;
      const action = t.dataset.action;
      const qid = t.dataset.target;
      if (!qid || !action) return;
      if (action === "respond") setAnswerState(qid, "editing");
      else if (action === "save") {
        const ta = document.getElementById(qid);
        if (!ta) return;
        const chars = ta.value.trim().length;
        if (chars < COMPLETE_MIN_LENGTH) {
          // permitir guardar como borrador igualmente; pero avisar
          if (chars === 0) { alert("La respuesta está vacía. Escribí algo antes de guardar."); return; }
        }
        setAnswerState(qid, "saved");
        showHandoffToast(`Respuesta de ${qid} guardada localmente. Podés editarla cuando quieras.`);
      } else if (action === "edit") {
        setAnswerState(qid, "editing");
      }
    });
  }

  function initSaveAndNext() {
    document.querySelectorAll(".save-and-next").forEach((btn) => {
      btn.addEventListener("click", () => {
        const fromId = Number(btn.dataset.nextFrom);
        const nextId = fromId + 1;
        const target = document.querySelector(`#pregunta-${nextId}`);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => target.querySelector("textarea")?.focus({ preventScroll: true }), 280);
        } else {
          // Last question — scroll to submit
          document.querySelector("#submit-final")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });
  }

  const COACH_TIPS = [
    "💡 Recordá: cada respuesta puntúa 1 punto solo si cubre todos los criterios 'Debe incluir'. Sin medias tintas.",
    "🎯 Si dudás, mirá la mini-rúbrica del ítem (panel azul) — te dice exactamente cómo se evalúa.",
    "📚 Las microlecturas de cada eje (azul-grisáceo arriba) te recuerdan los conceptos clave del programa MEP.",
    "✋ Antes de finalizar, revisá los 'errores comunes' del eje. Te ahorran perder puntos por confusión típica.",
    "🧠 Si la pregunta dice 'compará', necesitás MENCIONAR los dos elementos y al menos UNA semejanza/diferencia.",
    "📝 Tus respuestas se autoguardan localmente. Podés cerrar y volver al examen sin perder progreso.",
    "⏱ Tiempo sugerido: 180–240 minutos. Es una tarea de rango de examen, no un quiz rápido.",
    "🌱 La línea de aprobación TLP es 80 %. Apuntá a cubrir todos los criterios desde el primer intento.",
    "🔄 Podés saltar entre preguntas con el botón 'Mapa' (esquina inferior derecha).",
    "✏️ Si una pregunta pide 'explicá', mostrá la RELACIÓN entre causa y consecuencia. No basta definir.",
    "🎓 Vocabulario propio de Biología: 'fitness', 'alelo', 'nicho', 'flujo génico', 'codominancia'… úsalos cuando aplique.",
    "🔬 Los ejemplos costarricenses (manglares, corredores biológicos, SINAC) suman puntos cuando la consigna pide ejemplo.",
    "🚫 Evitá frases vacías como 'porque sí' o 'para vivir mejor'. Reemplazalas por causa biológica concreta."
  ];

  function initCoach() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const coach = document.createElement("aside");
    coach.id = "coach";
    coach.className = "coach";
    coach.innerHTML = `
      <button class="coach-close" type="button" aria-label="Ocultar coach">×</button>
      <p class="coach-msg" id="coach-msg" aria-live="polite"></p>`;
    document.body.appendChild(coach);
    let idx = Math.floor(Math.random() * COACH_TIPS.length);
    let dismissed = sessionStorage.getItem("evaluacosas:coach-dismissed") === "1";
    let interval = null;
    const showTip = () => {
      const msg = document.getElementById("coach-msg");
      if (msg) msg.textContent = COACH_TIPS[idx];
      idx = (idx + 1) % COACH_TIPS.length;
    };
    const start = () => {
      if (dismissed) { coach.style.display = "none"; return; }
      coach.classList.add("show");
      showTip();
      if (interval) clearInterval(interval);
      interval = setInterval(showTip, 22000);
    };
    coach.querySelector(".coach-close")?.addEventListener("click", () => {
      coach.classList.remove("show");
      dismissed = true;
      try { sessionStorage.setItem("evaluacosas:coach-dismissed", "1"); } catch {}
      if (interval) clearInterval(interval);
    });
    setTimeout(start, 4500);
  }

  function initNameDerivation() {
    const fields = ["#student-first-name", "#student-second-name", "#student-first-surname", "#student-second-surname"]
      .map((s) => document.querySelector(s)).filter(Boolean);
    const fullName = document.querySelector("#student-name");
    if (!fullName) return;
    const sync = () => {
      const parts = fields.map((f) => f.value.trim()).filter(Boolean);
      fullName.value = parts.join(" ");
      fullName.dispatchEvent(new Event("input", { bubbles: true }));
    };
    fields.forEach((f) => f.addEventListener("input", sync));
  }

  function initCedulaLookup() {
    const input = document.querySelector("#student-cedula");
    const btn = document.querySelector("#cedula-lookup-btn");
    const status = document.querySelector("#cedula-lookup-status");
    if (!input || !btn) return;

    const splitFullName = (fullName) => {
      // El padrón TSE devuelve: { firstname, lastname1, lastname2 } o { nombre, primer_apellido, segundo_apellido }
      // Fallback: parsear el string completo en 4 partes intentando 2 nombres + 2 apellidos
      const tokens = String(fullName || "").trim().split(/\s+/);
      if (tokens.length === 0) return ["", "", "", ""];
      if (tokens.length === 1) return [tokens[0], "", "", ""];
      if (tokens.length === 2) return [tokens[0], "", tokens[1], ""];
      if (tokens.length === 3) return [tokens[0], "", tokens[1], tokens[2]];
      // 4+: primero, segundo, primer apellido, segundo apellido (los extras se pegan al segundo apellido)
      return [tokens[0], tokens[1], tokens[2], tokens.slice(3).join(" ")];
    };

    const fillFields = (parts) => {
      const map = ["#student-first-name", "#student-second-name", "#student-first-surname", "#student-second-surname"];
      map.forEach((sel, i) => {
        const el = document.querySelector(sel);
        if (el) {
          el.value = parts[i] || "";
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
    };

    btn.addEventListener("click", async () => {
      const raw = (input.value || "").replace(/\D+/g, "");
      if (!raw || raw.length < 9) {
        status.textContent = "Ingresá una cédula válida (9 dígitos).";
        status.dataset.state = "error";
        return;
      }
      status.textContent = "Consultando Padrón Electoral del TSE…";
      status.dataset.state = "loading";
      try {
        const ctrl = new AbortController();
        const tm = setTimeout(() => ctrl.abort(), 14000);
        const r = await fetch(`https://evaluacosas-submit-handler-441768184201.us-central1.run.app/cedula/${raw}`, { signal: ctrl.signal });
        clearTimeout(tm);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (!data.ok) throw new Error(data.error || "respuesta inválida");
        const { firstName, secondName, firstSurname, secondSurname, fullName, source } = data;
        if (firstSurname || firstName) {
          fillFields([firstName, secondName, firstSurname, secondSurname]);
        } else {
          fillFields(splitFullName(fullName));
        }
        // Auto-set student-id como cédula
        const idEl = document.querySelector("#student-id");
        if (idEl && !idEl.value) { idEl.value = raw; idEl.dispatchEvent(new Event("input", { bubbles: true })); }
        status.textContent = `✓ ${fullName} · fuente: ${source || "TSE"}`;
        status.dataset.state = "success";
      } catch (err) {
        status.textContent = "No pudimos consultar el TSE en este momento. Llená los nombres manualmente.";
        status.dataset.state = "error";
        console.warn("[evaluacosas] cedula lookup failed:", err);
      }
    });
  }

  function initStudentPicker() {
    const picker = document.querySelector("#student-picker");
    const nameInput = document.querySelector("#student-name");
    const emailInput = document.querySelector("#student-email");
    if (!picker) return;
    // Restore prior selection if already saved
    const savedEmail = localStorage.getItem("evaluacosas:lastEmail") || "";
    if (savedEmail) {
      const opt = Array.from(picker.options).find((o) => o.value === savedEmail);
      if (opt) picker.value = savedEmail;
    }
    picker.addEventListener("change", () => {
      const v = picker.value;
      if (!v) return;
      if (v === "__other__") {
        if (nameInput) { nameInput.disabled = false; nameInput.placeholder = "Escribí tu nombre completo"; nameInput.focus(); }
        if (emailInput) { emailInput.disabled = false; emailInput.placeholder = "tu.correo@..."; emailInput.value = ""; }
        nameInput.value = "";
        return;
      }
      const opt = picker.options[picker.selectedIndex];
      const ds = opt?.dataset || {};
      // Auto-fill 4 campos si la opción los trae
      const firstNameEl = document.querySelector("#student-first-name");
      const secondNameEl = document.querySelector("#student-second-name");
      const firstSurnameEl = document.querySelector("#student-first-surname");
      const secondSurnameEl = document.querySelector("#student-second-surname");
      if (firstNameEl) firstNameEl.value = ds.firstName || "";
      if (secondNameEl) secondNameEl.value = ds.secondName || "";
      if (firstSurnameEl) firstSurnameEl.value = ds.firstSurname || "";
      if (secondSurnameEl) secondSurnameEl.value = ds.secondSurname || "";
      [firstNameEl, secondNameEl, firstSurnameEl, secondSurnameEl].forEach((el) => el?.dispatchEvent(new Event("input", { bubbles: true })));
      // Nombre completo derivado se llena via initNameDerivation()
      if (emailInput) { emailInput.value = v; emailInput.disabled = true; emailInput.dispatchEvent(new Event("input", { bubbles: true })); }
      try { localStorage.setItem("evaluacosas:lastEmail", v); } catch {}
    });
  }

  function finalizeSubmit() {
    closeConfirmModal();
    const data = collectData();
    const slot5m = Math.floor(Date.now() / 300000);
    const studentKey = `${data.student?.["student-name"] || ""}|${data.student?.["student-id"] || ""}|${data.student?.["student-date"] || ""}|${slot5m}`;
    const clientDocId = `${data.assessment?.title?.slice(0, 16).replace(/[^\w-]+/g, "_") || "exam"}__${cheapHash(studentKey)}`;
    data.clientDocId = clientDocId;

    populateHandoffSummary();

    if (handoffScreen) {
      lastFocusBeforeHandoff = document.activeElement;
      handoffScreen.hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Backend submit (entrega oficial). El estudiante NO descarga nada
    // a menos que el backend falle — descarga es solo respaldo.
    sendToBackend(data).catch((err) => {
      console.warn("[evaluacosas] backend POST failed:", err?.message || err);
      // Fallback: forzar descarga local para que el estudiante tenga el archivo
      const filename = exportJsonFromData(data);
      showHandoffToast(`No pudimos registrar tu entrega en este momento. Bajamos un respaldo (${filename}). Avisá a tu docente o reintentá refrescando.`);
    });
  }

  async function sendToBackend(data) {
    const status = document.querySelector("#handoff-backend-status");
    if (status) {
      status.dataset.state = "sending";
      status.innerHTML = '<span class="spinner" aria-hidden="true"></span> Guardando entrega en el servidor…';
    }
    let attempt = 0;
    const maxAttempts = 3;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 25000);
        const resp = await fetch(SUBMIT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          signal: ctrl.signal
        });
        clearTimeout(timeout);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const result = await resp.json();
        if (status) renderBackendStatus(status, result);
        return result;
      } catch (err) {
        if (attempt >= maxAttempts) {
          if (status) {
            status.dataset.state = "failed";
            status.innerHTML = '<strong>Servidor inaccesible.</strong> Tu archivo se descargó OK — subilo manualmente a Google Classroom como respaldo.';
          }
          throw err;
        }
        // Backoff: 2s, 5s
        await new Promise((r) => setTimeout(r, attempt * 3000));
      }
    }
  }

  function renderBackendStatus(status, result) {
    const sinks = result?.summary || {};
    const okCount = Object.values(sinks).filter((s) => s.ok).length;
    const totalCount = Object.keys(sinks).length || 0;
    const allOk = okCount === totalCount && totalCount > 0;
    status.dataset.state = allOk ? "ok" : "partial";
    const list = Object.entries(sinks)
      .map(([k, v]) => {
        const icon = v.ok ? "✓" : "✗";
        const idem = v.idempotent ? ` (${v.idempotent})` : "";
        return `<li class="${v.ok ? "ok" : "fail"}">${icon} ${escapeHtml(k)}${idem}</li>`;
      })
      .join("");
    status.innerHTML = `
      <div class="backend-status-head"><strong>${allOk ? "✓ Entrega registrada en el servidor" : "⚠ Entrega registrada parcialmente"}</strong> · ${okCount}/${totalCount} destinos</div>
      <ul class="backend-status-sinks">${list}</ul>
      ${result.docId ? `<p class="backend-status-docid">ID de entrega: <code>${escapeHtml(result.docId)}</code></p>` : ""}`;
  }

  function cheapHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
    return ("00000000" + (h >>> 0).toString(36)).slice(-10);
  }

  function exportJsonFromData(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const rawName = (data.student?.["student-name"] || "estudiante").trim().replace(/[^\w-]+/g, "_");
    const dateStamp = (data.student?.["student-date"] || new Date().toISOString().slice(0, 10)).replace(/[^\d-]/g, "");
    const filename = `respuestas_biologia10_${rawName || "estudiante"}_${dateStamp}.json`;
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    if (handoffFilename) handoffFilename.textContent = filename;
    return filename;
  }

  function populateHandoffSummary() {
    const summary = document.querySelector("#handoff-summary");
    if (!summary) return;
    const completedCount = textareas.filter((t) => t.value.trim().length >= COMPLETE_MIN_LENGTH).length;
    const completeSections = sectionMeta.filter((section) => {
      const sec = textareas.filter((t) => t.dataset.section === section.slug);
      return sec.length > 0 && sec.every((t) => t.value.trim().length >= COMPLETE_MIN_LENGTH);
    }).length;
    const studentName = (document.querySelector("#student-name")?.value || "").trim();
    const checkBoxes = Array.from(document.querySelectorAll(".final-check input[type='checkbox']"));
    const checked = checkBoxes.filter((cb) => cb.checked).length;
    const lines = [
      studentName ? `Estudiante: <strong>${escapeHtml(studentName)}</strong>` : "",
      `Preguntas con respuesta sustantiva: <strong>${completedCount}/${textareas.length}</strong>`,
      `Ejes con cobertura completa: <strong>${completeSections}/${sectionMeta.length}</strong>`,
      `Casillas de declaración marcadas: <strong>${checked}/${checkBoxes.length}</strong>`
    ].filter(Boolean);
    summary.innerHTML = lines.map((l) => `<li>${l}</li>`).join("");

    const preGradeBox = document.querySelector("#handoff-pregrade");
    const data = collectData();
    const pg = data.analytics.preGrade;
    if (preGradeBox) {
      const status = pg.passingHeuristic ? "supera el umbral heurístico" : "no supera el umbral heurístico";
      const levelLabel = pg.preliminaryLevel ? pg.preliminaryLevel.label : "—";
      preGradeBox.innerHTML = `
        <h3>Pre-calificación heurística (referencia)</h3>
        <div class="pregrade-row"><span>Puntaje preliminar</span><strong>${pg.totalScore}/${pg.totalPossible}</strong></div>
        <div class="pregrade-row"><span>Porcentaje</span><strong>${pg.percentage}%</strong></div>
        <div class="pregrade-row"><span>Nivel preliminar</span><strong>${escapeHtml(levelLabel)}</strong></div>
        <div class="pregrade-row"><span>Umbral TLP (${pg.passingThreshold}%)</span><strong class="${pg.passingHeuristic ? "ok" : "warn"}">${status}</strong></div>
        <p class="pregrade-disclaimer">${escapeHtml(pg.disclaimer)}</p>`;
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  const STOPWORDS_ES = new Set([
    "el","la","los","las","un","una","unos","unas","de","del","al","a","ante","bajo","con","contra","desde","durante","en","entre","hacia","hasta","mediante","para","por","segun","sin","sobre","tras","y","e","ni","o","u","pero","aunque","sino","si","no","que","cuando","donde","como","cual","cuales","cuanta","cuanto","cuantos","cuantas","quien","quienes","mientras","porque","pues","mas","muy","mucho","mucha","muchos","muchas","poco","poca","pocos","pocas","todo","toda","todos","todas","otro","otra","otros","otras","mismo","misma","mismos","mismas","tan","tanto","tanta","tantos","tantas","cada","ya","aun","tambien","solo","tambien","ese","esa","esos","esas","este","esta","estos","estas","aquel","aquella","aquellos","aquellas","ser","estar","haber","fue","fueron","es","son","era","eran","ha","han","hay","habia","habian","sea","sean","seran","tuvo","tuvieron","tienen","tiene","tener","hace","hacen","hizo","hicieron","puede","pueden","podia","podian","debe","deben","debia","debian","sus","su","mi","mis","tu","tus","sus","nos","nuestro","nuestra","nuestros","nuestras","yo","tu","el","ella","nosotros","ustedes","ellos","ellas","se","le","les","lo","las","los","me","te","ese","esa","esto","eso","aquel","aqui","ahi","alli","ahora","entonces","luego","despues","antes","despues"
  ]);

  function deburr(text) {
    return String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  function tokenize(text) {
    return deburr(text)
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !STOPWORDS_ES.has(w));
  }

  function extractMustTokens(mustEntry) {
    return Array.from(new Set(tokenize(mustEntry)));
  }

  function answerCoversMust(answerNorm, mustEntry) {
    const tokens = extractMustTokens(mustEntry);
    if (tokens.length === 0) return true;
    const hits = tokens.filter((t) => answerNorm.includes(t));
    // umbral: ≥1 token clave si solo hay 1-2; ≥2 si hay 3-4; ≥⌈n/3⌉ otherwise
    const minHits = tokens.length <= 2 ? 1 : Math.max(2, Math.ceil(tokens.length / 3));
    return hits.length >= minHits;
  }

  function findAvoidViolations(answerNorm, avoidList) {
    if (!Array.isArray(avoidList)) return [];
    const violations = [];
    avoidList.forEach((avoidEntry) => {
      // Extraemos frases prohibidas concretas de avoidEntry (lo que está entre comillas si lo hay,
      // sino tokens cortos significativos). En la práctica chequeamos si la respuesta contiene
      // alguna frase de 3+ palabras consecutivas tomada del avoid (sin stopwords).
      const tokens = tokenize(avoidEntry);
      if (tokens.length === 0) return;
      // Match por ngrama de 2-3 tokens consecutivos significativos
      for (let n = Math.min(3, tokens.length); n >= 2; n--) {
        for (let i = 0; i + n <= tokens.length; i++) {
          const phrase = tokens.slice(i, i + n).join(" ");
          if (answerNorm.includes(phrase)) {
            violations.push({ phrase, source: avoidEntry });
            return;
          }
        }
      }
    });
    return violations;
  }

  function computePreGrade(answer, must, avoid) {
    if (!answer || answer.trim().length < COMPLETE_MIN_LENGTH) {
      return {
        score: 0,
        reason: answer && answer.trim().length > 0
          ? `Respuesta demasiado breve (${answer.trim().length} caracteres). Mínimo heurístico: ${COMPLETE_MIN_LENGTH}.`
          : "Sin respuesta.",
        mustCoverage: { covered: 0, total: Array.isArray(must) ? must.length : 0 },
        avoidViolations: []
      };
    }
    const answerNorm = deburr(answer);
    const mustList = Array.isArray(must) ? must : [];
    const covered = mustList.filter((m) => answerCoversMust(answerNorm, m)).length;
    const requiredCoverage = Math.max(1, Math.ceil(mustList.length * 2 / 3));
    const avoidViolations = findAvoidViolations(answerNorm, avoid);

    if (avoidViolations.length > 0) {
      return {
        score: 0,
        reason: `Aparece literalmente una frase del bloque "No hacer" (${avoidViolations[0].phrase}). Revisar criterio.`,
        mustCoverage: { covered, total: mustList.length },
        avoidViolations
      };
    }
    if (covered < requiredCoverage) {
      return {
        score: 0,
        reason: `Cobertura insuficiente de criterios "Debe incluir" (${covered}/${mustList.length}; mínimo heurístico ${requiredCoverage}).`,
        mustCoverage: { covered, total: mustList.length },
        avoidViolations: []
      };
    }
    return {
      score: 1,
      reason: `Cobertura aceptable de criterios (${covered}/${mustList.length}); sin violaciones detectadas heurísticamente.`,
      mustCoverage: { covered, total: mustList.length },
      avoidViolations: []
    };
  }

  const PRE_GRADE_DISCLAIMER = "Pre-calificación heurística automática (sin IA). Apoyo de pre-revisión. NO sustituye la calificación humana del docente.";

  const LLM_PROMPT_TEMPLATE = `Sos un calificador académico experto que aplica el SKILL TLP/Piqui — Parte II (Calificación, Retroalimentación y Análisis) — al instrumento de evaluación incluido como JSON al final de este mensaje.

Reglas obligatorias:
1. Criterio binario: cada pregunta vale 1 punto exacto. No hay medios puntos ni puntos parciales. Una respuesta correcta recibe 1/1; incorrecta, vaga, contradictoria o no verificable recibe 0/1.
2. Identificación documental por cada ítem: número, eje (sección), tipo de consigna, nivel cognitivo, transcripción literal del enunciado y de la respuesta, respuesta esperada, veredicto, puntaje, análisis, corrección si corresponde, comentario didáctico.
3. Tres capas separadas: capa A (ítem literal), capa B (respuesta literal del estudiante), capa C (análisis del corrector). No mezclar.
4. Errores ortográficos o de digitación NO se penalizan si el concepto es inequívoco; sí cuando cambian el concepto.
5. Acreditá "Correcta con matiz" cuando el núcleo es correcto pero hay imprecisión menor; nunca para regalar puntos.
6. Identificá errores conceptuales recurrentes (skill §38: confundir hábitat con nicho, deriva con flujo génico, fundador con cuello de botella, eras con periodos, etc.).
7. Detectá progreso si hay evidencias en las respuestas; usá tono profesional, cálido, exigente, motivador, no infantilizante ni sarcástico.
8. La estructura del documento de calificación debe seguir la plantilla TLP §35:
   - Encabezado institucional (institución, curso, grado, estudiante, instrumento, fuente, puntaje total, criterio).
   - Resultado general (puntos obtenidos / posibles, porcentaje, nivel de desempeño según escala TLP — passing TLP es 80%).
   - Criterio de conteo aplicado.
   - Resumen general de desempeño.
   - Corrección detallada por ítem (los 80, con el formato base).
   - Ítems no acreditados (lista aparte con motivo).
   - Resumen por sección.
   - Resumen numérico final.
   - Fortalezas observadas (específicas, no genéricas).
   - Aspectos por mejorar (concretos).
   - Patrones de desempeño (transversales).
   - Evidencias de progreso (si aplica).
   - Recomendaciones de aprendizaje (accionables).
   - Comentario final (humano, profesional, motivador).
9. Niveles de desempeño TLP: 95–100% Excelente · 90–94 Muy alto · 85–89 Bueno · 80–84 Aceptable (línea de aprobación) · 70–79 No alcanzado por margen estrecho · 60–69 No alcanzado · <60 Insuficiente.
10. NO uses lenguaje de IA ni referencias a tu naturaleza ("como modelo", "como ChatGPT", "según mi análisis", etc.). El documento final debe poder pegarse como retroalimentación institucional.

El JSON adjunto incluye:
- Datos del estudiante.
- Las 80 respuestas exactas (objeto "answers").
- "blueprint": criterios "Debe incluir" (must) y "No hacer" (avoid) por pregunta + tipo + nivel cognitivo.
- "analytics.byQuestion": métricas por pregunta + una pre-calificación heurística automática (preGrade) que NO sustituye tu juicio — usala como hint, no como veredicto. Usala para detectar rápidamente las respuestas vacías, muy breves o que disparan avoid literal.
- "analytics.preGrade": resumen heurístico (porcentaje preliminar, nivel preliminar). Reemplazalo con tu calificación humana definitiva.

Formato de salida esperado: documento Markdown listo para copiar y pegar a Google Docs / Classroom, sin rastro de proceso. Empezá directamente con el encabezado.

JSON DEL EXAMEN:
\`\`\`json
{{JSON}}
\`\`\``;

  async function copyLlmBundle() {
    const data = collectData();
    const bundle = LLM_PROMPT_TEMPLATE.replace("{{JSON}}", JSON.stringify(data, null, 2));
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(bundle);
        copied = true;
      }
    } catch (err) { /* fallback below */ }
    if (!copied) {
      const ta = document.createElement("textarea");
      ta.value = bundle;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try { copied = document.execCommand("copy"); } catch (err) { copied = false; }
      document.body.removeChild(ta);
    }
    showHandoffToast(copied
      ? "Copiado al portapapeles. Pegalo en el LLM de tu preferencia (Claude / Gemini / ChatGPT / Perplexity)."
      : "No se pudo copiar automáticamente. Descargá el JSON con el botón \"Volver a descargar\" y pegalo manualmente.");
  }

  function showHandoffToast(message) {
    const toast = document.querySelector("#handoff-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add("show");
    clearTimeout(showHandoffToast._t);
    showHandoffToast._t = setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => { toast.hidden = true; }, 220);
    }, 5500);
  }

  function initTeacherToggle() {
    const toggle = document.querySelector("#teacher-toggle");
    const banner = document.querySelector("#teacher-banner");
    if (!toggle) return;

    const apply = (enabled) => {
      document.body.classList.toggle("teacher-view", enabled);
      toggle.textContent = enabled ? "Vista estudiante" : "Vista docente";
      toggle.setAttribute("aria-pressed", enabled ? "true" : "false");
      if (banner) banner.hidden = !enabled;
      if (enabled) {
        if (!window.location.hash.includes("vista-docente")) {
          history.replaceState(null, "", `${window.location.pathname}#vista-docente`);
        }
      } else if (window.location.hash.includes("vista-docente")) {
        history.replaceState(null, "", window.location.pathname);
      }
    };

    if (window.location.hash.includes("vista-docente")) apply(true);

    toggle.addEventListener("click", () => {
      apply(!document.body.classList.contains("teacher-view"));
    });
  }

  function returnToTest() {
    if (handoffScreen) handoffScreen.hidden = true;
    if (lastFocusBeforeHandoff && typeof lastFocusBeforeHandoff.focus === "function") {
      lastFocusBeforeHandoff.focus();
    } else {
      submitBtn?.focus();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearLocal() {
    const ok = window.confirm("Esto borra las respuestas guardadas en este navegador para esta evaluación.");
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    inputs.forEach((input) => {
      if (input.type === "checkbox") input.checked = false;
      else input.value = "";
    });
    updateProgress();
  }
}
