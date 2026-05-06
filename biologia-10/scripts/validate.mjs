import { assessment, performanceLevels, evaluationCriteria, cognitiveLevelDefinitions, cognitiveLevelByQuestion, verbGlossary, passingThreshold, mepMapByQuestion } from "../src/questions.js";

let failures = 0;
const questions = assessment.sections.flatMap((section) => section.questions);

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

if (assessment.points !== 80) fail("assessment.points debe ser 80");
if (questions.length !== 80) fail(`se esperaban 80 preguntas y hay ${questions.length}`);

questions.forEach((question, index) => {
  const expected = index + 1;
  if (question.id !== expected) fail(`pregunta ${expected} tiene id ${question.id}`);
  if (!question.prompt) fail(`pregunta ${expected} no tiene prompt`);
  if (!Array.isArray(question.must) || question.must.length < 3) fail(`pregunta ${expected} debe tener al menos 3 criterios must`);
  if (!Array.isArray(question.avoid) || question.avoid.length < 3) fail(`pregunta ${expected} debe tener al menos 3 criterios avoid`);
});

const requiredAssessmentFields = ["title", "subtitle", "institution", "institutionLong", "program", "course", "grade", "instrument", "source", "modality", "suggestedTime", "schemaVersion", "evaluationCriteria", "performanceLevels", "sections"];
requiredAssessmentFields.forEach((key) => {
  if (assessment[key] === undefined || assessment[key] === null || assessment[key] === "") {
    fail(`assessment.${key} no está definido`);
  }
});

const expectedSchemaVersion = "2.2";
if (assessment.schemaVersion !== expectedSchemaVersion) fail(`schemaVersion esperada "${expectedSchemaVersion}" — actual "${assessment.schemaVersion}"`);

if (passingThreshold !== 80) fail(`passingThreshold debe ser 80 (política TLP) — actual ${passingThreshold}`);

if (!Array.isArray(performanceLevels) || performanceLevels.length !== 7) {
  fail(`performanceLevels debe contener 7 niveles tras la calibración TLP 80%. Actual: ${performanceLevels?.length}`);
} else {
  performanceLevels.forEach((level, index) => {
    if (typeof level.min !== "number" || typeof level.max !== "number") fail(`performanceLevels[${index}] debe tener min y max numéricos`);
    if (!level.label || !level.description) fail(`performanceLevels[${index}] debe tener label y description`);
    if (typeof level.passing !== "boolean") fail(`performanceLevels[${index}] debe tener passing (boolean) según umbral TLP`);
    if (!level.tier) fail(`performanceLevels[${index}] debe tener tier`);
  });
  const approvedAt80 = performanceLevels.find((l) => l.min === 80 && l.passing === true);
  if (!approvedAt80) fail("Debe existir un nivel con min=80 y passing=true (línea de aprobación TLP).");
}

if (!evaluationCriteria || evaluationCriteria.scheme !== "binario" || evaluationCriteria.pointsPerItem !== 1 || evaluationCriteria.totalItems !== 80 || evaluationCriteria.partialPoints !== false) {
  fail("evaluationCriteria debe ser binario, 1 punto por ítem, 80 ítems totales, sin parciales");
}
if (!Array.isArray(evaluationCriteria?.rules) || evaluationCriteria.rules.length < 4) {
  fail("evaluationCriteria.rules debe contener al menos 4 reglas");
}

assessment.sections.forEach((section) => {
  if (!Array.isArray(section.commonErrors) || section.commonErrors.length < 3) {
    fail(`section "${section.slug}" debe tener al menos 3 commonErrors`);
  }
  if (!section.instructions || section.instructions.length < 80) {
    fail(`section "${section.slug}" debe tener instructions de al menos 80 caracteres`);
  }
  if (!section.closing || section.closing.length < 80) {
    fail(`section "${section.slug}" debe tener closing de al menos 80 caracteres`);
  }
  if (!section.microreading || section.microreading.length < 100) {
    fail(`section "${section.slug}" debe tener microreading de al menos 100 caracteres`);
  }
});

if (!Array.isArray(cognitiveLevelDefinitions) || cognitiveLevelDefinitions.length < 6) {
  fail("cognitiveLevelDefinitions debe contener al menos 6 niveles");
}

if (!mepMapByQuestion || typeof mepMapByQuestion !== "object") {
  fail("mepMapByQuestion no está definido");
} else {
  questions.forEach((question) => {
    const m = mepMapByQuestion[question.id];
    if (!m || !m.eje || !m.subtema) {
      fail(`pregunta ${question.id} no tiene mapeo MEP completo (eje + subtema)`);
    }
    if (!Array.isArray(m?.concepts) || m.concepts.length < 2) {
      fail(`pregunta ${question.id} debe tener al menos 2 conceptos MEP`);
    }
  });
}

if (!Array.isArray(verbGlossary) || verbGlossary.length < 8) {
  fail("verbGlossary debe contener al menos 8 entradas");
} else {
  verbGlossary.forEach((entry, index) => {
    if (!entry.type || !entry.verbs || !entry.expects) {
      fail(`verbGlossary[${index}] debe tener type, verbs y expects`);
    }
  });
}
const validCognitiveKeys = new Set(cognitiveLevelDefinitions.map((d) => d.key));
const cognitiveCounts = {};
questions.forEach((question) => {
  const level = cognitiveLevelByQuestion[question.id];
  if (!level) {
    fail(`pregunta ${question.id} no tiene cognitiveLevel asignado`);
    return;
  }
  if (!validCognitiveKeys.has(level)) {
    fail(`pregunta ${question.id} tiene cognitiveLevel "${level}" desconocido`);
    return;
  }
  cognitiveCounts[level] = (cognitiveCounts[level] || 0) + 1;
});

if (failures > 0) process.exit(1);
console.log(`OK: ${questions.length} preguntas validadas.`);
console.log(`OK: encabezado institucional, criterio de calificación (${evaluationCriteria.scheme}, ${evaluationCriteria.totalItems} ítems), ${performanceLevels.length} niveles de desempeño, errores comunes en ${assessment.sections.length} ejes.`);
console.log(`OK: balance cognitivo — ${cognitiveLevelDefinitions.map((d) => `${d.label}: ${cognitiveCounts[d.key] || 0}`).filter((s) => !s.endsWith(": 0")).join(" · ")}.`);
console.log(`OK: glosario de verbos de consigna con ${verbGlossary.length} entradas (skill §23).`);
console.log(`OK: mapeo MEP — ${Object.keys(mepMapByQuestion).length} preguntas mapeadas a subtemas del programa MEP de Biología 10.`);
