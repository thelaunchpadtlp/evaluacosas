const ecosystemArt = `
<svg viewBox="0 0 320 220" role="img" aria-label="Ecosistema costarricense">
  <defs>
    <linearGradient id="ecoSky" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#67d1ff"/>
      <stop offset="1" stop-color="#39d98a"/>
    </linearGradient>
  </defs>
  <rect width="320" height="220" rx="8" fill="rgba(255,255,255,.06)"/>
  <circle cx="260" cy="42" r="22" fill="#ffd166"/>
  <path d="M0 155 C70 112 105 148 155 108 C207 66 244 104 320 64 V220 H0 Z" fill="url(#ecoSky)" opacity=".22"/>
  <path d="M0 172 C75 136 139 168 202 124 C245 94 279 116 320 96 V220 H0 Z" fill="#39d98a" opacity=".28"/>
  <path d="M67 180 V88" stroke="#8a5a34" stroke-width="10" stroke-linecap="round"/>
  <path d="M67 105 C32 100 28 62 67 55 C105 62 106 101 67 105 Z" fill="#39d98a"/>
  <path d="M73 118 C39 122 36 88 70 76 C109 82 112 118 73 118 Z" fill="#1fbf75"/>
  <path d="M186 171 C202 146 224 146 239 171 C226 180 202 181 186 171 Z" fill="#67d1ff" opacity=".7"/>
  <path d="M229 168 l22 -15 l-4 16 l4 16 Z" fill="#67d1ff" opacity=".7"/>
  <path d="M118 172 c18 -36 39 -34 58 0" fill="none" stroke="#f2a65a" stroke-width="6" stroke-linecap="round"/>
  <circle cx="143" cy="149" r="7" fill="#f7f7f0"/>
</svg>`;

const geneticsArt = `
<svg viewBox="0 0 320 220" role="img" aria-label="ADN y biotecnologia">
  <rect width="320" height="220" rx="8" fill="rgba(255,255,255,.06)"/>
  <path d="M116 28 C210 72 112 146 204 192" fill="none" stroke="#67d1ff" stroke-width="5"/>
  <path d="M204 28 C112 72 210 146 116 192" fill="none" stroke="#ff8d8d" stroke-width="5"/>
  <g stroke="#eef6ff" stroke-width="3" opacity=".86">
    <path d="M137 44 H183"/><path d="M124 68 H196"/><path d="M122 94 H198"/>
    <path d="M132 120 H188"/><path d="M148 146 H172"/><path d="M134 172 H186"/>
  </g>
  <rect x="38" y="140" width="70" height="42" rx="7" fill="#39d98a" opacity=".22" stroke="#39d98a"/>
  <path d="M54 160 h38 M73 148 v24" stroke="#39d98a" stroke-width="5" stroke-linecap="round"/>
  <circle cx="260" cy="66" r="32" fill="#ffd166" opacity=".18" stroke="#ffd166"/>
  <path d="M245 66 h30 M260 51 v30" stroke="#ffd166" stroke-width="4" stroke-linecap="round"/>
</svg>`;

const evolutionArt = `
<svg viewBox="0 0 320 220" role="img" aria-label="Evolucion y origen de la vida">
  <rect width="320" height="220" rx="8" fill="rgba(255,255,255,.06)"/>
  <path d="M42 168 C84 125 116 132 154 90 C196 44 242 44 282 76" fill="none" stroke="#67d1ff" stroke-width="5" stroke-linecap="round"/>
  <g fill="#39d98a">
    <circle cx="54" cy="157" r="7"/><circle cx="103" cy="129" r="8"/><circle cx="153" cy="92" r="9"/><circle cx="207" cy="61" r="8"/><circle cx="273" cy="74" r="7"/>
  </g>
  <path d="M72 184 C98 164 125 164 151 184 C128 195 98 195 72 184 Z" fill="#ffd166" opacity=".55"/>
  <path d="M103 180 c13 -13 27 -13 41 0" fill="none" stroke="#08111f" stroke-width="5" stroke-linecap="round"/>
  <path d="M208 154 c20 -18 50 -18 70 0 c-20 18 -50 18 -70 0 Z" fill="#ff8d8d" opacity=".42"/>
  <path d="M236 153 l18 -11 l-3 11 l3 11 Z" fill="#ff8d8d" opacity=".72"/>
</svg>`;

export const verbGlossary = [
  { type: "Identificación", verbs: "identificá / nombrá / citá", expects: "Una respuesta breve y exacta. El término preciso del programa, no un sinónimo aproximado.", examples: "“Identificá el campo de estudio de la Biología.”" },
  { type: "Explicación", verbs: "explicá / describí / fundamentá", expects: "Una oración o párrafo breve que muestre la relación entre causa, mecanismo y consecuencia. No basta con definir.", examples: "“Explicá cómo actúa la selección natural sobre poblaciones.”" },
  { type: "Comparación", verbs: "compará / diferenciá / contrastá / distinguí", expects: "Mencionar al menos dos elementos y al menos una semejanza o diferencia explícita. No respondas un solo lado.", examples: "“Compará deriva genética y selección natural.”" },
  { type: "Análisis", verbs: "analizá / interpretá / evaluá / discutí", expects: "Examinar componentes de un caso e inferir una relación causal o una conclusión apoyada en evidencia.", examples: "“Analizá el experimento de Miller-Urey indicando qué demostró y cuáles son sus límites.”" },
  { type: "Aplicación", verbs: "diseñá / proponé / aplicá / formulá / construí", expects: "Usar un concepto en una situación nueva: diseñar un experimento, proponer una acción, construir un cruce. No respondas con teoría general.", examples: "“Diseñá un experimento para evaluar cómo la temperatura influye en la germinación.”" },
  { type: "Clasificación", verbs: "clasificá / ordená / jerarquizá", expects: "Organizar elementos según criterios explícitos. Indicá el criterio que usaste.", examples: "“Clasificá los niveles de biodiversidad genética, de especies y de ecosistemas.”" },
  { type: "Reflexión / Bioética", verbs: "reflexioná / valorá / posicioná", expects: "Tomar posición con marcos de derechos, evidencia, regulación y proporcionalidad de riesgo. No respondas con opinión sin marco.", examples: "“Evaluá los dilemas éticos de la manipulación genética en seres humanos.”" },
  { type: "Cálculo", verbs: "calculá / estimá", expects: "Realizar una operación numérica indicando datos y fórmula. Justificá los pasos cuando corresponda.", examples: "“Calculá la proporción fenotípica de un cruce monohíbrido.”" },
  { type: "Descripción", verbs: "describí / caracterizá", expects: "Caracterizar con rasgos observables o conceptuales. Más detalle que identificar, menos relación causal que explicar.", examples: "“Describí la estructura del ADN.”" },
  { type: "Respuesta abierta", verbs: "—", expects: "Pregunta abierta sin verbo dominante; respondé con oración completa, vocabulario propio de Biología y conexión con la consigna.", examples: "Cualquier pregunta que no encaje claramente en otro tipo." }
];

export const cognitiveLevelDefinitions = [
  { key: "recordar", label: "Recordar", description: "Reconocer o nombrar un concepto a partir del vocabulario trabajado." },
  { key: "comprender", label: "Comprender", description: "Explicar con palabras propias el significado de un proceso, relación o estructura." },
  { key: "comparar", label: "Comparar", description: "Distinguir o contrastar dos o más conceptos identificando semejanzas, diferencias o efectos distintos." },
  { key: "aplicar", label: "Aplicar", description: "Usar un concepto, modelo o procedimiento (cruce, cálculo, diseño experimental) en una situación nueva." },
  { key: "analizar", label: "Analizar", description: "Examinar los componentes de un caso para identificar relaciones causales, mecanismos o consecuencias." },
  { key: "justificar", label: "Justificar / Argumentar", description: "Dar razones explícitas de por qué una afirmación, evidencia o decisión es válida, importante o éticamente sostenible." },
  { key: "interpretar", label: "Interpretar", description: "Inferir significado a partir de datos, gráficos, esquemas o evidencia presentada." },
  { key: "transferir", label: "Transferir / Integrar", description: "Conectar varios conceptos o ejes para resolver un problema integrador o explicar un fenómeno multidimensional." }
];

export const cognitiveLevelByQuestion = {
  1: "comprender",  2: "aplicar",     3: "comprender",  4: "comparar",    5: "analizar",
  6: "comprender",  7: "comprender",  8: "comparar",    9: "comparar",   10: "analizar",
 11: "comparar",   12: "analizar",   13: "comprender", 14: "comprender", 15: "comparar",
 16: "aplicar",    17: "analizar",   18: "justificar", 19: "analizar",   20: "aplicar",
 21: "comprender", 22: "justificar", 23: "analizar",   24: "comprender", 25: "comparar",
 26: "analizar",   27: "aplicar",
 28: "comprender", 29: "comprender", 30: "comprender", 31: "comparar",   32: "aplicar",
 33: "aplicar",    34: "comparar",   35: "comprender", 36: "comparar",   37: "comprender",
 38: "analizar",   39: "comprender", 40: "comparar",   41: "analizar",   42: "justificar",
 43: "transferir", 44: "comparar",   45: "comprender", 46: "aplicar",    47: "analizar",
 48: "comparar",   49: "comparar",   50: "justificar", 51: "analizar",   52: "comprender",
 53: "comprender", 54: "justificar",
 55: "comprender", 56: "analizar",   57: "comparar",   58: "comprender", 59: "comparar",
 60: "comprender", 61: "analizar",   62: "comparar",   63: "comprender", 64: "justificar",
 65: "comparar",   66: "comprender", 67: "comprender", 68: "comparar",   69: "comparar",
 70: "analizar",   71: "comprender", 72: "comparar",   73: "comprender", 74: "analizar",
 75: "comprender", 76: "aplicar",    77: "analizar",   78: "justificar", 79: "transferir",
 80: "transferir"
};

export const performanceLevels = [
  { min: 95, max: 100, label: "Excelente", description: "Dominio sobresaliente del contenido y de las habilidades evaluadas.", passing: true, tier: "approved-high" },
  { min: 90, max: 94, label: "Muy alto", description: "Dominio fuerte; comprensión consolidada con detalles menores por pulir.", passing: true, tier: "approved-high" },
  { min: 85, max: 89, label: "Bueno", description: "Dominio adecuado con áreas específicas por reforzar.", passing: true, tier: "approved" },
  { min: 80, max: 84, label: "Aceptable (línea de aprobación TLP)", description: "Aprobado con margen mínimo. Conviene reforzar las áreas frágiles antes de avanzar al siguiente bloque.", passing: true, tier: "approved-min" },
  { min: 70, max: 79, label: "No alcanzado por margen estrecho", description: "Comprensión parcial; refuerzo focalizado en los temas con menor desempeño y reentrega cuando corresponda.", passing: false, tier: "below-near" },
  { min: 60, max: 69, label: "No alcanzado", description: "Refuerzo importante; comprensión fragmentada. Requiere repaso guiado por el docente.", passing: false, tier: "below" },
  { min: 0, max: 59, label: "Insuficiente", description: "Requiere intervención académica estructurada y reentrega tras refuerzo dirigido.", passing: false, tier: "below-far" }
];

export const passingThreshold = 80; // Política TLP: passing grade institucional.

export const evaluationCriteria = {
  scheme: "binario",
  pointsPerItem: 1,
  totalItems: 80,
  partialPoints: false,
  rules: [
    "Cada pregunta vale 1 punto exacto. No hay medios puntos ni puntos parciales.",
    "Una respuesta correcta recibe 1/1; una respuesta incorrecta, vaga, contradictoria o no verificable recibe 0/1.",
    "Si una pregunta pide varios elementos esenciales y falta uno indispensable, la respuesta puede recibir 0 aunque otros elementos estén bien.",
    "Errores menores de ortografía, tildes o digitación no se penalizan si el concepto es inequívoco.",
    "Si la consigna pide un formato específico (explicar, comparar, ejemplificar, citar), debe cumplirse el formato.",
    "Una respuesta con palabras propias se acredita si conserva el núcleo conceptual correcto."
  ]
};

export const assessment = {
  title: "Biología 10 — Tarea Integral Avanzada",
  subtitle: "Procesos de la vida y sus entornos · Décimo Año",
  institution: "The Launch Pad — TLP",
  institutionLong: "Centro Educativo GEA, acreditado ante el MEP",
  program: "Curso personalizado e individualizado por tutorías",
  course: "Biología",
  grade: "Décimo / 10°",
  instrument: "Tarea Integral Avanzada — 80 preguntas",
  source: "Programa MEP de Biología 10 (3 ejes)",
  modality: "Híbrida (texto didáctico de entrada + ítems exigentes)",
  suggestedTime: "180–240 minutos como tarea domiciliaria",
  schemaVersion: "2.2",
  points: 80,
  evaluationCriteria,
  performanceLevels,
  sections: [
    {
      slug: "eje-1",
      axis: "Eje I",
      title: "Seres vivos en entornos saludables",
      art: ecosystemArt,
      microreading: "Este eje analiza la Biología como ciencia y la relación entre las formas de vida, sus adaptaciones y el entorno biofísico. Incluye especie, población, biodiversidad, nicho, hábitat, interacciones ecológicas, factores ambientales, conservación y amenazas a la biodiversidad. En el contexto costarricense, estos conceptos se vuelven concretos al estudiar bosques, manglares, corredores biológicos, áreas protegidas y comunidades locales.",
      instructions: "En esta sección, identificá relaciones organismo–ambiente y distinguí con claridad hábitat (lugar) y nicho (función). Cuando un caso describa cómo una especie sobrevive en un entorno, no respondas que “se acostumbra” o que “se adapta porque quiere”: la adaptación es un proceso evolutivo de poblaciones. Conectá cada concepto con un ejemplo concreto, preferiblemente costarricense.",
      closing: "Antes de continuar, revisá que tus respuestas: (1) usen un ejemplo concreto cuando se pidió uno; (2) distingan especie / población / comunidad / ecosistema sin tratarlos como sinónimos; (3) en amenazas a la biodiversidad, expliquen el mecanismo (deforestación → fragmentación → pérdida de hábitat → extinción local), no solo la consecuencia.",
      commonErrors: [
        "Decir que los organismos “se adaptan porque quieren” o “se acostumbran al ambiente”: la adaptación es un proceso evolutivo de poblaciones, no una decisión individual.",
        "Confundir hábitat con nicho ecológico: hábitat es el lugar donde vive una especie; nicho es su rol funcional (qué come, cuándo, cómo se relaciona).",
        "Usar especie y población como sinónimos: especie es un grupo reproductivamente compatible; población es un conjunto de individuos de la misma especie en un área y momento dados.",
        "Reducir biodiversidad solo a “muchas especies” y olvidar la diversidad genética dentro de poblaciones y la diversidad de ecosistemas.",
        "Confundir interacciones interespecíficas (mutualismo, comensalismo, depredación, parasitismo, competencia): identificar correctamente quién gana, quién pierde y quién no se ve afectado.",
        "Listar amenazas a la biodiversidad sin explicar el mecanismo (deforestación → pérdida de hábitat → fragmentación → extinción local)."
      ],
      questions: [
        {
          id: 1,
          prompt: "Identificá el campo de estudio de la Biología y explicá por qué se considera una ciencia.",
          must: ["Objeto de estudio: seres vivos, sus procesos, relaciones y evolución", "Uso de observación, hipótesis, experimentación, evidencia y revisión", "Ejemplo de una pregunta biológica que pueda investigarse científicamente"],
          avoid: ["No reducir la Biología a memorizar nombres de seres vivos", "No confundir ciencia con opinión personal", "No omitir el papel de la evidencia"]
        },
        {
          id: 2,
          prompt: "Explicá cómo se diseña una investigación biológica sencilla a partir de una observación del entorno.",
          must: ["Observación inicial y pregunta investigable", "Hipótesis, variables, control y recolección de datos", "Conclusión basada en resultados y no en suposiciones"],
          avoid: ["No presentar una receta sin explicar el propósito de cada paso", "No confundir hipótesis con conclusión", "No omitir el control de variables"]
        },
        {
          id: 3,
          prompt: "Explicá qué se entiende por adaptación biológica y por qué aumenta la probabilidad de supervivencia o reproducción.",
          must: ["Definición de adaptación como rasgo heredable favorecido en un ambiente", "Relación con supervivencia, reproducción y éxito en el hábitat", "Ejemplo concreto en planta, animal u otro organismo"],
          avoid: ["No confundir adaptación evolutiva con aprendizaje individual", "No decir solo que el organismo se acostumbra", "No usar ejemplos sin explicar su ventaja"]
        },
        {
          id: 4,
          prompt: "Diferenciá adaptaciones morfológicas, fisiológicas y conductuales usando ejemplos claros.",
          must: ["Adaptación morfológica como estructura corporal", "Adaptación fisiológica como funcionamiento interno", "Adaptación conductual o etológica como comportamiento"],
          avoid: ["No mezclar los tres tipos sin distinguirlos", "No poner solo un ejemplo para todos", "No omitir la relación con el ambiente"]
        },
        {
          id: 5,
          prompt: "Analizá dos adaptaciones de animales tropicales y explicá cómo se relacionan con depredación, alimentación o clima.",
          must: ["Dos organismos o grupos animales concretos", "Rasgo adaptativo y función ecológica", "Relación con presión ambiental como depredadores, alimento, humedad o temperatura"],
          avoid: ["No limitarse a describir apariencia", "No afirmar que la adaptación aparece por necesidad inmediata", "No omitir el efecto sobre supervivencia o reproducción"]
        },
        {
          id: 6,
          prompt: "Explicá cómo las plantas presentan adaptaciones para captar luz, conservar agua o evitar herbívoros.",
          must: ["Ejemplo de adaptación en hojas, raíces, tallos, cutícula, espinas o sustancias químicas", "Relación con luz, agua, suelo o herbivoría", "Comparación entre ambientes como bosque húmedo, bosque seco o zona costera"],
          avoid: ["No responder solo que las plantas hacen fotosíntesis", "No omitir el factor ambiental", "No confundir adaptación vegetal con cuidado humano"]
        },
        {
          id: 7,
          prompt: "Describí cómo factores ambientales climáticos, energéticos y de sustrato influyen en las poblaciones.",
          must: ["Factores climáticos como temperatura, lluvia, luz o viento", "Factores energéticos como disponibilidad de alimento", "Factores de sustrato como agua, suelo, aire o salinidad"],
          avoid: ["No tratar los factores como elementos aislados sin relación", "No confundir clima con tiempo atmosférico de un día", "No omitir consecuencias sobre distribución o abundancia"]
        },
        {
          id: 8,
          prompt: "Diferenciá especie, población y comunidad ecológica con ejemplos costarricenses.",
          must: ["Definición de especie", "Definición de población como individuos de la misma especie en un área", "Definición de comunidad como conjunto de poblaciones que interactúan"],
          avoid: ["No confundir especie con especia", "No usar población como sinónimo de cantidad total de animales", "No omitir ejemplos"]
        },
        {
          id: 9,
          prompt: "Explicá la diferencia entre hábitat y nicho ecológico, e indicá por qué ambos conceptos son necesarios.",
          must: ["Hábitat como lugar físico donde vive el organismo", "Nicho como función, recursos, condiciones e interacciones", "Ejemplo donde dos especies compartan hábitat pero no nicho"],
          avoid: ["No usar hábitat y nicho como sinónimos", "No responder solo que el nicho es donde vive", "No omitir interacciones bióticas y factores abióticos"]
        },
        {
          id: 10,
          prompt: "Analizá cómo los seres vivos modifican su ambiente y también son afectados por él.",
          must: ["Ejemplo de organismo que transforma el ambiente", "Ejemplo de factor ambiental que limita o favorece una población", "Relación recíproca entre organismo y entorno"],
          avoid: ["No presentar al ambiente como algo pasivo", "No hablar solo de contaminación humana", "No omitir efectos sobre otras especies"]
        },
        {
          id: 11,
          prompt: "Compará mutualismo, competencia y depredación como interacciones ecológicas.",
          must: ["Definición de cada interacción", "Efecto sobre las poblaciones involucradas", "Ejemplo concreto de al menos dos interacciones"],
          avoid: ["No confundir depredación con parasitismo", "No reducir mutualismo a ayuda voluntaria", "No omitir consecuencias ecológicas"]
        },
        {
          id: 12,
          prompt: "Analizá cómo la relación depredador-presa puede influir en la diversidad de una comunidad.",
          must: ["Papel de cadenas o redes tróficas", "Control de tamaños poblacionales y equilibrio ecológico", "Posible coevolución entre depredadores y presas"],
          avoid: ["No describir una persecución sin análisis", "No afirmar que el depredador siempre elimina a la presa", "No omitir el efecto sobre otras especies"]
        },
        {
          id: 13,
          prompt: "Explicá la capacidad de carga de un ecosistema y su relación con factores limitantes.",
          must: ["Definición de capacidad de carga", "Factores limitantes como alimento, espacio, agua, refugio o enfermedades", "Consecuencia de superar la capacidad de carga"],
          avoid: ["No confundir capacidad de carga con número máximo deseado por humanos", "No omitir cambios en crecimiento poblacional", "No responder solo con una cifra"]
        },
        {
          id: 14,
          prompt: "Describí los niveles de biodiversidad genética, de especies y de ecosistemas.",
          must: ["Biodiversidad genética dentro de poblaciones", "Biodiversidad de especies en una comunidad", "Biodiversidad de ecosistemas en un territorio"],
          avoid: ["No mezclar los niveles sin definirlos", "No omitir su importancia para resiliencia", "No usar biodiversidad solo como cantidad de animales"]
        },
        {
          id: 15,
          prompt: "Explicá la diferencia entre diversidad alfa, beta y gamma con ejemplos aplicables a Costa Rica.",
          must: ["Diversidad alfa dentro de un sitio", "Diversidad beta como recambio entre sitios", "Diversidad gamma como diversidad regional total"],
          avoid: ["No confundir alfa, beta y gamma con niveles genéticos", "No responder sin ejemplos", "No omitir su utilidad para comparar ambientes"]
        },
        {
          id: 16,
          prompt: "Explicá cómo índices como Shannon o Simpson ayudan a evaluar la salud de un ecosistema.",
          must: ["Relación entre riqueza de especies y abundancia relativa", "Interpretación de valores altos o bajos", "Uso para monitoreo y toma de decisiones"],
          avoid: ["No confundir índice con simple conteo de individuos", "No explicar solo una fórmula sin interpretación", "No omitir limitaciones del muestreo"]
        },
        {
          id: 17,
          prompt: "Analizá por qué las especies endémicas requieren atención especial en conservación.",
          must: ["Definición de especie endémica", "Distribución geográfica limitada y riesgo de pérdida irreversible", "Ejemplo o situación relacionada con Costa Rica"],
          avoid: ["No confundir endémica con invasora", "No decir solo que es una especie bonita o rara", "No omitir el riesgo global de extinción"]
        },
        {
          id: 18,
          prompt: "Explicá por qué Costa Rica se considera un país megadiverso y qué responsabilidad implica.",
          must: ["Alta biodiversidad en poco territorio", "Factores como clima, relieve, posición geográfica y variedad de ecosistemas", "Responsabilidad de conservación, investigación y uso sostenible"],
          avoid: ["No presentar megadiversidad como simple abundancia sin contexto", "No omitir relación entre área y diversidad", "No ignorar amenazas actuales"]
        },
        {
          id: 19,
          prompt: "Analizá tres servicios ecosistémicos que la biodiversidad brinda a las comunidades humanas.",
          must: ["Servicio de provisión, regulación, soporte o cultural", "Ejemplos como agua, polinización, control de erosión, alimentos o recreación", "Relación entre conservación y bienestar humano"],
          avoid: ["No reducir la biodiversidad a turismo", "No listar servicios sin explicar su beneficio", "No separar ambiente y sociedad como si no interactuaran"]
        },
        {
          id: 20,
          prompt: "Identificá una amenaza a la biodiversidad en tu comunidad y proponé dos acciones concretas para reducirla.",
          must: ["Amenaza específica como contaminación, fragmentación, cambio climático, cacería o invasoras", "Causa y consecuencia ecológica", "Dos acciones realistas con justificación"],
          avoid: ["No culpar de forma general sin análisis", "No proponer acciones vagas como cuidar la naturaleza", "No omitir actores responsables o posibles"]
        },
        {
          id: 21,
          prompt: "Explicá cómo la fragmentación del hábitat afecta poblaciones silvestres.",
          must: ["División de hábitats continuos en parches", "Aislamiento, menor flujo genético y mayor vulnerabilidad", "Consecuencias como borde, mortalidad vial o pérdida de recursos"],
          avoid: ["No confundir fragmentación con pérdida total de hábitat", "No omitir efectos genéticos", "No responder solo que hay menos espacio"]
        },
        {
          id: 22,
          prompt: "Discutí la importancia de los corredores biológicos para la conservación de la biodiversidad.",
          must: ["Conectividad entre parches o áreas protegidas", "Flujo genético, movimiento, dispersión y recolonización", "Ejemplo de corredor biológico o caso costarricense"],
          avoid: ["No confundir corredor biológico con carretera", "No decir que reemplaza áreas protegidas", "No omitir su función frente a fragmentación"]
        },
        {
          id: 23,
          prompt: "Analizá cómo una especie invasora puede alterar un ecosistema nativo.",
          must: ["Definición de especie invasora", "Mecanismos como competencia, depredación, enfermedad o alteración del hábitat", "Ejemplo o consecuencia ecológica"],
          avoid: ["No confundir invasora con endémica o migratoria natural", "No afirmar que toda especie extranjera es invasora", "No omitir el efecto sobre especies nativas"]
        },
        {
          id: 24,
          prompt: "Explicá el papel de las áreas protegidas y del SINAC en la conservación costarricense.",
          must: ["Función de parques nacionales, reservas, refugios u otras categorías", "Protección de hábitats, especies y procesos ecológicos", "Relación con investigación, educación y participación comunitaria"],
          avoid: ["No reducir áreas protegidas a turismo", "No presentar la conservación como responsabilidad de una sola institución", "No omitir conflictos o desafíos de manejo"]
        },
        {
          id: 25,
          prompt: "Compará biomas o ecosistemas costarricenses como bosque húmedo, bosque seco, manglar, páramo o arrecife.",
          must: ["Características climáticas o físicas de al menos dos ambientes", "Factores como temperatura, precipitación, salinidad, altitud o suelo", "Adaptaciones de organismos en esos ambientes"],
          avoid: ["No confundir bioma con una sola especie", "No limitarse a características visuales", "No omitir factores ambientales"]
        },
        {
          id: 26,
          prompt: "Analizá las funciones ecosistémicas de los manglares costarricenses más allá de servir como hábitat.",
          must: ["Vivero de peces y refugio de biodiversidad", "Protección costera, filtración de contaminantes o retención de sedimentos", "Almacenamiento de carbono azul y beneficio comunitario"],
          avoid: ["No reducir manglares a árboles en agua salada", "No mencionar un solo servicio", "No omitir amenazas como rellenos, contaminación o tala"]
        },
        {
          id: 27,
          prompt: "Diseñá un experimento para evaluar cómo la temperatura influye en la germinación de semillas.",
          must: ["Variable independiente, dependiente y variables controladas", "Grupo control, repeticiones y registro de datos", "Conclusión esperada basada en evidencia"],
          avoid: ["No cambiar varias variables al mismo tiempo", "No omitir repeticiones", "No concluir antes de observar resultados"]
        }
      ]
    },
    {
      slug: "eje-2",
      axis: "Eje II",
      title: "Genética, herencia y biotecnología",
      art: geneticsArt,
      microreading: "Este eje estudia la variabilidad genética, la estructura y replicación del ADN, la expresión de la información hereditaria, las mutaciones, la meiosis, la herencia mendeliana y no mendeliana, el código genético y aplicaciones biotecnológicas. También exige valorar beneficios, riesgos, regulación y dilemas éticos de intervenir material genético en medicina, agricultura, investigación y sociedad.",
      instructions: "En esta sección, mantené la jerarquía ADN > cromosoma > gen > alelo y usá los términos con precisión. Cuando construyás cruces genéticos, indicá explícitamente genotipos y fenotipos. Si el caso describe codominancia, dominancia incompleta, herencia ligada al sexo o poligénica, no apliques el patrón mendeliano simple sin matizar. En biotecnología, ponderá beneficios, riesgos, marco regulatorio y dilemas éticos — no respondas con opinión sin marco.",
      closing: "Antes de continuar, revisá que tus respuestas: (1) no traten “toda mutación” como perjudicial — pueden ser neutras, deletéreas o beneficiosas según ambiente y rasgo; (2) no confundan transcripción (ADN→ARN) con traducción (ARN→proteína); (3) distingan CRISPR (edición de secuencia presente) de transgénesis (introducción de gen externo); (4) en bioética, citen consentimiento informado, regulación, evidencia y proporcionalidad de riesgo, no solo intuición.",
      commonErrors: [
        "Confundir la jerarquía ADN > cromosoma > gen > alelo: un cromosoma contiene muchos genes; un gen es una secuencia de ADN; un alelo es una variante de ese gen.",
        "Mezclar mitosis y meiosis o sus fases: mitosis genera dos células idénticas (somáticas); meiosis genera cuatro gametos haploides con recombinación.",
        "Suponer que toda mutación es perjudicial: una mutación puede ser neutra, deletérea o beneficiosa según el ambiente y el rasgo afectado.",
        "Confundir transcripción (ADN → ARN) con traducción (ARN → proteína).",
        "Tratar CRISPR y transgénesis como si fueran lo mismo: CRISPR edita una secuencia ya presente; la transgénesis introduce un gen externo al genoma.",
        "Reducir la bioética a “opinión personal” sin marcos de derechos, regulación, riesgo y consentimiento informado.",
        "Aplicar herencia mendeliana cuando el caso describe codominancia, dominancia incompleta, herencia ligada al sexo o poligénica."
      ],
      questions: [
        {
          id: 28,
          prompt: "Describí la estructura del ADN y explicá cómo su replicación conserva la información genética.",
          must: ["Nucleótidos, bases nitrogenadas, doble hélice y complementariedad", "Replicación semiconservativa con separación de hebras", "Papel de enzimas como helicasa y ADN polimerasa"],
          avoid: ["No confundir replicación con transcripción", "No decir solo que el ADN se copia", "No omitir bases complementarias"]
        },
        {
          id: 29,
          prompt: "Explicá el dogma central de la biología molecular relacionando ADN, ARN y proteínas.",
          must: ["Transcripción de ADN a ARNm", "Traducción en ribosomas con tARN, codones y aminoácidos", "Relación entre secuencia genética y proteína funcional"],
          avoid: ["No mezclar transcripción con traducción", "No omitir ribosomas o código genético", "No presentar el proceso como magia celular"]
        },
        {
          id: 30,
          prompt: "Explicá los experimentos de Mendel y las leyes de segregación e independencia.",
          must: ["Uso de guisantes y rasgos contrastantes", "Ley de segregación de alelos", "Ley de distribución independiente y proporciones esperadas"],
          avoid: ["No presentar las leyes como universales sin excepciones", "No omitir generación F1 o F2", "No confundir segregación con mutación"]
        },
        {
          id: 31,
          prompt: "Diferenciá genotipo y fenotipo usando un ejemplo donde el ambiente influya en la expresión del rasgo.",
          must: ["Genotipo como composición genética", "Fenotipo como rasgo observable o medible", "Ejemplo con influencia ambiental como nutrición, luz, temperatura o salud"],
          avoid: ["No usar los términos como sinónimos", "No confundir genes con cromosomas completos", "No omitir interacción gen-ambiente"]
        },
        {
          id: 32,
          prompt: "Construí e interpretá un cruce monohíbrido para explicar proporciones genotípicas y fenotípicas.",
          must: ["Uso correcto de alelos parentales y cuadro de Punnett", "Proporción genotípica 1:2:1 cuando aplica", "Proporción fenotípica 3:1 en dominancia completa"],
          avoid: ["No confundir genotipo con fenotipo", "No sumar porcentajes incorrectamente", "No omitir explicación de F1 o F2"]
        },
        {
          id: 33,
          prompt: "Explicá la distribución independiente con un cruce dihíbrido y sus límites.",
          must: ["Dos rasgos heredados simultáneamente", "Proporción fenotípica 9:3:3:1 si los genes no están ligados", "Excepciones como ligamiento génico o epistasis"],
          avoid: ["No aplicar 9:3:3:1 a cualquier caso", "No ignorar genes ligados", "No confundir dihíbrido con dos cruces separados"]
        },
        {
          id: 34,
          prompt: "Contrastá herencia dominante y recesiva definiendo homocigoto y heterocigoto.",
          must: ["Alelo dominante y alelo recesivo", "Homocigoto y heterocigoto", "Ejemplo humano o de otro organismo con genotipo y fenotipo"],
          avoid: ["No decir que dominante significa mejor o más común", "No omitir símbolos de alelos", "No confundir rasgo recesivo con rasgo desaparecido"]
        },
        {
          id: 35,
          prompt: "Explicá la herencia ligada al sexo y por qué ciertos rasgos recesivos ligados al X aparecen más en varones.",
          must: ["Genes ubicados en cromosoma X", "Hemicigosis en varones y mujeres portadoras", "Ejemplo como daltonismo o hemofilia con proporciones por sexo"],
          avoid: ["No confundir sexo biológico con género social", "No tratar herencia ligada al sexo como autosómica", "No omitir el papel de cromosomas X e Y"]
        },
        {
          id: 36,
          prompt: "Diferenciá codominancia y dominancia incompleta usando ejemplos concretos.",
          must: ["Codominancia como expresión simultánea de ambos alelos", "Dominancia incompleta como fenotipo intermedio", "Ejemplos como grupo sanguíneo AB y flores de color intermedio"],
          avoid: ["No decir que ambos casos son mezcla simple", "No confundir AB con dominancia incompleta", "No omitir genotipos posibles"]
        },
        {
          id: 37,
          prompt: "Explicá la herencia poligénica y por qué produce variación continua.",
          must: ["Participación de varios genes en un rasgo", "Distribución continua de fenotipos", "Ejemplos como estatura, color de piel o masa corporal con influencia ambiental"],
          avoid: ["No aplicar proporciones mendelianas simples", "No omitir ambiente", "No confundir poligénico con múltiples alelos en un solo gen"]
        },
        {
          id: 38,
          prompt: "Analizá cómo la meiosis contribuye a la variabilidad genética en poblaciones.",
          must: ["Entrecruzamiento o recombinación", "Distribución independiente de cromosomas", "Diferencia con mitosis y relación con gametos"],
          avoid: ["No describir solo división celular sin variabilidad", "No confundir meiosis con fecundación", "No omitir reducción cromosómica"]
        },
        {
          id: 39,
          prompt: "Explicá el papel de las mutaciones como fuente de variación genética y evolución.",
          must: ["Mutación como cambio en ADN", "Generación de nuevos alelos", "Efectos posibles: perjudicial, neutro o beneficioso según ambiente"],
          avoid: ["No afirmar que todas las mutaciones son malas", "No confundir mutación con adaptación directa", "No omitir relación con selección natural"]
        },
        {
          id: 40,
          prompt: "Diferenciá mutaciones puntuales y cromosómicas con ejemplos de cada tipo.",
          must: ["Mutación puntual como sustitución, inserción o deleción de bases", "Mutación cromosómica como deleción, duplicación, inversión, translocación o no disyunción", "Ejemplo y consecuencia de cada nivel"],
          avoid: ["No mezclar nivel molecular y cromosómico", "No confundir mutación con epigenética", "No omitir efecto posible en proteínas o fenotipo"]
        },
        {
          id: 41,
          prompt: "Analizá una enfermedad genética identificando gen, mutación y patrón de herencia.",
          must: ["Enfermedad concreta como fibrosis quística, anemia falciforme, Huntington o síndrome de Down", "Gen o alteración cromosómica implicada cuando corresponda", "Patrón de herencia o mecanismo de aparición"],
          avoid: ["No confundir enfermedad genética con infección", "No describir síntomas sin genética", "No omitir si la mutación es germinal, cromosómica o puntual"]
        },
        {
          id: 42,
          prompt: "Explicá qué significa que el código genético sea casi universal y por qué apoya el origen común de la vida.",
          must: ["Relación entre codones y aminoácidos compartida por organismos", "Evidencia de ancestro común", "Excepciones menores como variantes mitocondriales"],
          avoid: ["No confundir código genético con información ética o legal", "No decir que es idéntico en absolutamente todos los casos", "No omitir aplicaciones biotecnológicas"]
        },
        {
          id: 43,
          prompt: "Analizá el Proyecto Genoma Humano considerando objetivos, descubrimientos y dilemas éticos.",
          must: ["Objetivo de secuenciar el genoma humano y periodo 1990-2003", "Hallazgos como número aproximado de genes y variación genética", "Privacidad, discriminación genética y acceso a información"],
          avoid: ["No decir que resolvió todas las enfermedades", "No omitir dilemas sociales", "No confundir genoma con una prueba de ADN aislada"]
        },
        {
          id: 44,
          prompt: "Explicá qué es la biotecnología moderna y cómo se diferencia de usos tradicionales de organismos.",
          must: ["Uso de organismos, células, enzimas o material genético para producir bienes o soluciones", "Diferencia entre fermentación tradicional e ingeniería genética moderna", "Aplicación en medicina, agricultura, ambiente o industria"],
          avoid: ["No confundir biotecnología con computación", "No mencionar solo un producto sin proceso", "No omitir beneficios y riesgos"]
        },
        {
          id: 45,
          prompt: "Describí cómo enzimas de restricción, ligasa y plásmidos permiten crear ADN recombinante.",
          must: ["Corte de ADN en secuencias específicas", "Unión de fragmentos mediante ADN ligasa", "Plásmidos como vectores en bacterias"],
          avoid: ["No presentar el ADN recombinante como mezcla al azar", "No omitir vectores", "No confundir enzima de restricción con enzima digestiva común"]
        },
        {
          id: 46,
          prompt: "Explicá cómo PCR y electroforesis pueden usarse para identificar ADN en contextos forenses o médicos.",
          must: ["PCR como amplificación de fragmentos de ADN", "Electroforesis como separación por tamaño", "Interpretación de patrones como STR o bandas"],
          avoid: ["No decir que PCR inventa ADN nuevo sin molde", "No omitir controles o contaminación", "No confundir identificación genética con certeza absoluta sin análisis"]
        },
        {
          id: 47,
          prompt: "Analizá ventajas y preocupaciones de los organismos genéticamente modificados en agricultura.",
          must: ["Cómo se introduce o edita un rasgo", "Beneficios como resistencia a plagas, rendimiento o nutrición", "Riesgos o debates sobre ambiente, dependencia económica, regulación o biodiversidad"],
          avoid: ["No presentar OGM como totalmente buenos o malos sin evidencia", "No confundir OGM con selección artificial tradicional", "No omitir regulación y evaluación de riesgo"]
        },
        {
          id: 48,
          prompt: "Compará clonación reproductiva y clonación terapéutica usando el caso de Dolly como referencia.",
          must: ["Transferencia nuclear de célula somática", "Diferencia entre producir un organismo y generar tejidos o células", "Limitaciones como baja eficiencia, epigenética y dilemas éticos"],
          avoid: ["No afirmar que un clon es una copia idéntica en personalidad", "No confundir clonación con gemelos idénticos naturales", "No omitir bienestar animal o riesgos"]
        },
        {
          id: 49,
          prompt: "Diferenciá terapia génica somática y edición germinal, valorando beneficios y riesgos.",
          must: ["Somática afecta células del paciente y no se hereda", "Germinal afecta gametos o embriones y puede heredarse", "Beneficios médicos, riesgos técnicos y dilemas éticos"],
          avoid: ["No tratar ambas como equivalentes", "No ignorar herencia a futuras generaciones", "No prometer curas garantizadas"]
        },
        {
          id: 50,
          prompt: "Explicá cómo funciona CRISPR-Cas9 y por qué genera debates bioéticos.",
          must: ["Guía de ARN, corte de ADN por Cas9 y reparación celular", "Aplicaciones potenciales en salud, agricultura o investigación", "Debates sobre seguridad, acceso, embriones, mejora humana o consentimiento"],
          avoid: ["No describir CRISPR como tijeras mágicas sin mecanismo", "No omitir errores fuera de objetivo", "No presentar edición genética como siempre aceptable"]
        },
        {
          id: 51,
          prompt: "Analizá una aplicación médica de la biotecnología como insulina recombinante, vacunas de ARN o anticuerpos monoclonales.",
          must: ["Explicación básica del proceso biotecnológico", "Beneficio para diagnóstico, prevención o tratamiento", "Limitaciones como costo, acceso, almacenamiento o seguridad"],
          avoid: ["No nombrar la aplicación sin explicar funcionamiento", "No confundir vacuna de ARN con modificación permanente del ADN humano", "No omitir impacto social"]
        },
        {
          id: 52,
          prompt: "Explicá qué es la epigenética y cómo puede modificar la expresión génica sin cambiar la secuencia del ADN.",
          must: ["Mecanismos como metilación de ADN, histonas o ARN no codificante", "Influencia de ambiente, desarrollo o dieta en expresión génica", "Diferencia entre cambio epigenético y mutación"],
          avoid: ["No afirmar que la epigenética cambia siempre el ADN", "No usarla para justificar herencia de cualquier rasgo adquirido", "No omitir reversibilidad o regulación"]
        },
        {
          id: 53,
          prompt: "Describí la interferencia de ARN y su potencial terapéutico.",
          must: ["ARN pequeño que reconoce ARNm complementario", "Silenciamiento o degradación del mensaje antes de traducirse", "Aplicación posible en enfermedades genéticas, virus o investigación"],
          avoid: ["No confundir ARN interferente con antibiótico", "No omitir complementariedad de bases", "No presentar la técnica como libre de efectos secundarios"]
        },
        {
          id: 54,
          prompt: "Evaluá los dilemas éticos de la manipulación genética en seres humanos.",
          must: ["Distinción entre tratamiento y mejora", "Riesgos de desigualdad, eugenesia, consentimiento y efectos hereditarios", "Necesidad de regulación, evidencia y deliberación pública"],
          avoid: ["No responder solo desde miedo o entusiasmo", "No ignorar beneficios terapéuticos reales", "No omitir quiénes podrían verse afectados"]
        }
      ]
    },
    {
      slug: "eje-3",
      axis: "Eje III",
      title: "Origen, evolución y continuidad de la vida",
      art: evolutionArt,
      microreading: "Este eje conecta el origen de la vida con la evolución biológica y la diversificación de especies. Integra teorías sobre química prebiótica, tiempo geológico, evidencias evolutivas, Lamarck, Darwin, neodarwinismo, mecanismos de cambio en poblaciones, especiación, extinción y el impacto humano sobre la trayectoria evolutiva de la biodiversidad. Como escribió Dobzhansky en 1973: “Nada tiene sentido en biología excepto a la luz de la evolución”.",
      instructions: "En esta sección, identificá con precisión cuál mecanismo evolutivo describe cada caso (selección natural, deriva genética, flujo génico, mutación, apareamiento no aleatorio). No supongas que todo cambio en una población es selección natural. Distinguí Lamarck (uso/desuso, herencia de caracteres adquiridos — desactualizada) de Darwin (selección natural sobre variación heredable preexistente). Cuando una pregunta pida evidencia evolutiva, especificá si es paleontológica, anatómica comparada, embriológica, molecular o biogeográfica.",
      closing: "Antes de continuar, revisá que tus respuestas: (1) usen vocabulario evolutivo preciso (homólogas vs análogas; precigótico vs poscigótico; fundador vs cuello de botella; direccional vs estabilizadora vs disruptiva); (2) no atribuyan a las bacterias “acostumbrarse” al antibiótico — sobreviven y se reproducen las que ya tenían resistencia heredable; (3) cuando se piden periodos del tiempo geológico (Cámbrico, Jurásico…) no respondas con eras (Paleozoica, Mesozoica…); (4) incluyan el mecanismo, no solo el resultado.",
      commonErrors: [
        "Confundir flujo génico (movimiento real de alelos entre poblaciones) con deriva génica (cambios al azar en frecuencias por muestreo finito).",
        "Confundir efecto fundador (alelos sesgados al colonizar) con cuello de botella (alelos perdidos por reducción drástica): ambos son deriva pero por causas distintas.",
        "Decir que las bacterias “se acostumbran” al antibiótico: sobreviven y se reproducen las que ya tenían resistencia heredable.",
        "Confundir selección direccional, estabilizadora y disruptiva: cuál favorece un extremo, cuál favorece la media, cuál favorece ambos extremos.",
        "Mezclar aislamiento precigótico (antes de la fecundación: temporal, conductual, mecánico) y poscigótico (después: inviabilidad o esterilidad del híbrido).",
        "Confundir estructuras homólogas (mismo origen evolutivo, distinta función) con análogas (origen distinto, función similar por convergencia).",
        "Atribuir a Darwin ideas de Lamarck (uso/desuso, herencia de caracteres adquiridos) o viceversa.",
        "Tratar idealismo, fijismo y creacionismo como sinónimos: son marcos pre-evolutivos distintos con fundamentos diferentes.",
        "Citar eras (Paleozoica, Mesozoica…) cuando la consigna pide periodos (Cámbrico, Jurásico…) del tiempo geológico.",
        "Confundir tipos de evidencia evolutiva (paleontológica, anatómica comparada, embriológica, molecular, biogeográfica)."
      ],
      questions: [
        {
          id: 55,
          prompt: "Explicá la teoría de síntesis prebiótica de Oparin-Haldane y su importancia para estudiar el origen de la vida.",
          must: ["Tierra primitiva, atmósfera y fuentes de energía", "Formación gradual de moléculas orgánicas en un caldo primordial", "Importancia como explicación química previa a las primeras células"],
          avoid: ["No confundir origen de la vida con evolución de especies ya formadas", "No atribuir el proceso a generación espontánea moderna", "No omitir condiciones ambientales primitivas"]
        },
        {
          id: 56,
          prompt: "Analizá el experimento de Miller-Urey indicando qué demostró y cuáles son sus límites.",
          must: ["Simulación de gases y descargas eléctricas", "Producción de aminoácidos u otras moléculas orgánicas", "Limitaciones sobre composición atmosférica y salto de moléculas a células"],
          avoid: ["No decir que creó vida", "No omitir su valor como evidencia experimental", "No presentar el experimento como prueba definitiva de todo el origen de la vida"]
        },
        {
          id: 57,
          prompt: "Compará dos teorías o hipótesis sobre el origen de la vida distintas de la síntesis prebiótica.",
          must: ["Panspermia, mundo de ARN, fuentes hidrotermales o hierro-sulfuro", "Fortalezas y evidencias disponibles", "Limitaciones o preguntas sin resolver"],
          avoid: ["No mezclar hipótesis sin diferenciarlas", "No confundir panspermia con evolución darwiniana", "No omitir evaluación crítica"]
        },
        {
          id: 58,
          prompt: "Explicá cómo la escala del tiempo geológico ayuda a comprender la continuidad y diversificación de la vida.",
          must: ["Tiempo profundo y secuencia de eras o eones", "Aparición de primeros organismos y grandes cambios biológicos", "Relación con fósiles, extinciones y diversificación"],
          avoid: ["No tratar la historia de la vida como si ocurriera en poco tiempo", "No omitir registro fósil", "No confundir edad de la Tierra con edad de la humanidad"]
        },
        {
          id: 59,
          prompt: "Compará las propuestas de Lamarck y Darwin sobre la evolución.",
          must: ["Uso y desuso y herencia de caracteres adquiridos en Lamarck", "Variación heredable y selección natural en Darwin", "Razón por la cual la explicación darwiniana fue fortalecida por evidencia posterior"],
          avoid: ["No caricaturizar a Lamarck sin explicar", "No decir que Darwin explicó genética mendeliana directamente", "No confundir selección natural con azar puro"]
        },
        {
          id: 60,
          prompt: "Explicá cómo actúa la selección natural sobre poblaciones.",
          must: ["Variación heredable entre individuos", "Diferencias de supervivencia y reproducción", "Cambio de frecuencias alélicas o rasgos en generaciones"],
          avoid: ["No decir que los individuos evolucionan durante su vida", "No presentar la selección como intención de la naturaleza", "No omitir éxito reproductivo"]
        },
        {
          id: 61,
          prompt: "Analizá el registro fósil como evidencia de evolución.",
          must: ["Fósiles en estratos y datación relativa o absoluta", "Formas transicionales o secuencias de cambio", "Relación con extinciones y aparición de grupos"],
          avoid: ["No decir que un fósil aislado prueba todo", "No omitir condiciones de fosilización", "No confundir fósiles con organismos vivos antiguos"]
        },
        {
          id: 62,
          prompt: "Diferenciá estructuras homólogas, análogas y vestigiales como evidencias evolutivas.",
          must: ["Homología como origen común con posible función distinta", "Analogía como función similar por convergencia", "Vestigialidad como rasgo heredado con función reducida o modificada"],
          avoid: ["No confundir semejanza superficial con parentesco", "No usar solo ejemplos humanos", "No omitir relación con ancestro común"]
        },
        {
          id: 63,
          prompt: "Explicá cómo la biogeografía aporta evidencia sobre la evolución.",
          must: ["Distribución de especies en continentes e islas", "Endemismo, aislamiento y deriva continental o barreras geográficas", "Ejemplo como Galápagos, Australia, Isla del Coco o istmo de Panamá"],
          avoid: ["No describir mapas sin explicación evolutiva", "No omitir historia geológica", "No confundir distribución actual con origen exacto"]
        },
        {
          id: 64,
          prompt: "Analizá cómo la biología molecular y la embriología comparada apoyan el origen común.",
          must: ["Comparación de ADN, proteínas o genes conservados", "Similitudes embrionarias entre grupos relacionados", "Interpretación como evidencia independiente de parentesco"],
          avoid: ["No decir que similitud molecular significa igualdad total", "No omitir divergencia acumulada", "No confundir embriología con desarrollo idéntico"]
        },
        {
          id: 65,
          prompt: "Diferenciá evolución convergente y divergente con ejemplos.",
          must: ["Convergencia en linajes no cercanos con presiones similares", "Divergencia desde ancestro común hacia formas distintas", "Ejemplos como tiburón-delfín, pinzones, mamíferos o plantas"],
          avoid: ["No confundir convergencia con parentesco cercano", "No omitir presión selectiva", "No usar ejemplos sin explicar rasgos"]
        },
        {
          id: 66,
          prompt: "Describí mecanismos de aislamiento reproductivo que pueden llevar a la especiación.",
          must: ["Aislamientos prezigóticos como temporal, conductual, ecológico o mecánico", "Aislamientos postzigóticos como inviabilidad o esterilidad híbrida", "Reducción del flujo génico y acumulación de diferencias"],
          avoid: ["No confundir aislamiento reproductivo con migración simple", "No omitir antes o después de fecundación", "No presentar especiación como evento instantáneo"]
        },
        {
          id: 67,
          prompt: "Explicá la radiación adaptativa usando el caso de los pinzones de Darwin u otro ejemplo válido.",
          must: ["Ancestro común", "Ocupación de nichos distintos", "Divergencia de rasgos por selección e aislamiento"],
          avoid: ["No presentar los picos como diseño deliberado", "No omitir nichos alimentarios", "No confundir radiación adaptativa con migración de una sola especie sin cambio"]
        },
        {
          id: 68,
          prompt: "Compará deriva genética y selección natural como mecanismos evolutivos.",
          must: ["Deriva como cambio aleatorio en frecuencias alélicas", "Selección como cambio no aleatorio relacionado con aptitud", "Importancia del tamaño poblacional"],
          avoid: ["No decir que ambas son lo mismo", "No omitir azar en deriva", "No confundir deriva con migración"]
        },
        {
          id: 69,
          prompt: "Explicá el efecto fundador y el cuello de botella como casos de deriva genética.",
          must: ["Efecto fundador por nueva población iniciada por pocos individuos", "Cuello de botella por reducción drástica del tamaño poblacional", "Pérdida de variabilidad genética"],
          avoid: ["No confundir con selección artificial", "No omitir poblaciones pequeñas", "No presentar reducción genética como siempre beneficiosa"]
        },
        {
          id: 70,
          prompt: "Analizá cómo el flujo génico puede aumentar diversidad o impedir diferenciación entre poblaciones.",
          must: ["Migración e intercambio de alelos", "Aumento de variabilidad en una población receptora", "Homogeneización genética si el flujo es constante"],
          avoid: ["No confundir flujo génico con flujo de energía", "No hablar solo de movimiento físico sin alelos", "No omitir relación con adaptación local"]
        },
        {
          id: 71,
          prompt: "Explicá la selección sexual y cómo puede favorecer rasgos costosos para la supervivencia.",
          must: ["Competencia por pareja o elección de pareja", "Rasgos que aumentan éxito reproductivo aunque tengan costos", "Ejemplo como cantos, colores, cortejo, astas o plumajes"],
          avoid: ["No separar selección sexual totalmente de selección natural", "No explicar el rasgo solo por belleza", "No omitir reproducción diferencial"]
        },
        {
          id: 72,
          prompt: "Diferenciá selección estabilizadora, direccional y disruptiva.",
          must: ["Estabilizadora favorece fenotipos intermedios", "Direccional desplaza la población hacia un extremo", "Disruptiva favorece extremos y reduce intermedios"],
          avoid: ["No usar nombres sin explicar", "No omitir efecto sobre distribución de rasgos", "No confundir selección disruptiva con extinción"]
        },
        {
          id: 73,
          prompt: "Explicá qué aportó la síntesis moderna o neodarwinismo a la teoría evolutiva.",
          must: ["Integración de Darwin con genética mendeliana", "Poblaciones, frecuencias alélicas, mutación, recombinación, selección, deriva y flujo génico", "Aportes de biología de poblaciones, sistemática y genética"],
          avoid: ["No decir que reemplazó por completo a Darwin", "No omitir genética", "No confundir neodarwinismo con una teoría no científica"]
        },
        {
          id: 74,
          prompt: "Analizá un ejemplo de coevolución entre plantas y polinizadores o entre depredadores y presas.",
          must: ["Definición de coevolución como selección recíproca", "Rasgos de ambas especies que se influyen mutuamente", "Importancia para biodiversidad y redes ecológicas"],
          avoid: ["No presentar coevolución como acuerdo voluntario", "No omitir las dos partes de la interacción", "No confundir con convivencia casual"]
        },
        {
          id: 75,
          prompt: "Explicá la teoría endosimbiótica y su relación con el origen de células eucariotas.",
          must: ["Origen bacteriano de mitocondrias y cloroplastos", "Evidencias como ADN circular, ribosomas 70S, doble membrana y división independiente", "Papel de Margulis y simbiosis integrada"],
          avoid: ["No tratarla como hipótesis marginal sin evidencia", "No confundir con simbiosis temporal entre organismos actuales", "No omitir orgánulos principales"]
        },
        {
          id: 76,
          prompt: "Explicá cómo se construyen e interpretan árboles filogenéticos o cladogramas.",
          must: ["Uso de homologías, sinapomorfías o datos moleculares", "Nodos como ancestros comunes y ramas como linajes", "Diferencia entre parentesco evolutivo y similitud superficial"],
          avoid: ["No leer el árbol como escala de progreso", "No asumir que una especie actual viene de otra especie actual", "No omitir ancestro común"]
        },
        {
          id: 77,
          prompt: "Analizá una extinción masiva como la K-Pg y sus consecuencias evolutivas.",
          must: ["Causa o evidencia principal como impacto de asteroide y cambios ambientales", "Extinción de muchos grupos y supervivencia de otros", "Radiación adaptativa posterior de linajes sobrevivientes"],
          avoid: ["No reducirla a que murieron dinosaurios", "No omitir cambios ecológicos globales", "No confundir extinción masiva con extinción local"]
        },
        {
          id: 78,
          prompt: "Explicá cómo la resistencia antibiótica en bacterias demuestra selección natural en tiempo real.",
          must: ["Variación genética previa por mutaciones", "Antibiótico como presión selectiva", "Reproducción diferencial de bacterias resistentes y problema médico"],
          avoid: ["No decir que las bacterias deciden volverse resistentes", "No omitir uso excesivo o incorrecto de antibióticos", "No confundir resistencia con inmunidad humana"]
        },
        {
          id: 79,
          prompt: "Analizá cómo las actividades humanas afectan la diversificación y extinción de especies.",
          must: ["Fragmentación, contaminación, cambio climático, cacería, invasoras o sobreexplotación", "Efectos sobre selección, deriva, flujo génico y tamaños poblacionales", "Consecuencias para biodiversidad y propuestas de mitigación"],
          avoid: ["No decir solo que el ser humano destruye todo", "No separar impacto ecológico de procesos evolutivos", "No omitir soluciones o responsabilidad social"]
        },
        {
          id: 80,
          prompt: "Integrá mutación, recombinación, selección natural, deriva genética y flujo génico para explicar la diversidad de especies.",
          must: ["Mutación y recombinación como fuentes de variación", "Selección, deriva y flujo génico como fuerzas que cambian frecuencias", "Acumulación de diferencias, aislamiento y especiación a largo plazo"],
          avoid: ["No explicar cada factor de forma aislada", "No presentar la evolución como una línea de progreso", "No omitir tiempo, poblaciones y ambiente"]
        }
      ]
    }
  ]
};
