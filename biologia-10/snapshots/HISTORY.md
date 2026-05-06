# Snapshots — Historial

## Política

Esta carpeta guarda copias HTML de hitos para recuperar del proyecto en caso de sesión interrumpida.

## Estado actual

- `001_full_80_built.html` — primera build completa con 80 preguntas (pre-restructuración 2026-05-05).
- `002_pre_submit_flow.html` — versión post-restructuración antes de agregar el flujo "Finalizar y entregar" (SHA-256 `0028f9b0…`, 101 684 B).
- `003_pre_skill_v1.html` — versión con flujo "Finalizar y entregar" pero antes de aplicar el skill TLP/Piqui (SHA-256 `9f184cae…`, 111 902 B).
- `004_post_skill_v1.html` — primera capa del skill aplicada: encabezado institucional ampliado, criterio de calificación visible, 6 niveles de desempeño, errores comunes por eje, badge de tipo por verbo, progreso por eje, declaración final ampliada (7 casillas), JSON enriquecido con analytics (SHA-256 `20f7b5fc…`).
- `005_post_phase2_canonical_header.html` — Fase 2 del skill v2: encabezado canónico TLP/GEA/MEP (institución + Centro Educativo GEA acreditado MEP + curso personalizado por tutorías + materia/grado), modalidad híbrida declarada, tiempo sugerido, tarjetas-meta del instrumento (instrumento, modalidad, tiempo, fuente). schemaVersion 2.0 → 2.1 (SHA-256 `f1226f51…`).
- `006_post_phase3_cognitive.html` — Fase 3 del skill v2: nivel cognitivo (Bloom-like) por pregunta. 6 niveles usados: Comprender (26), Comparar (20), Analizar (16), Aplicar (8), Justificar (7), Transferir (3). Badge cognitivo en cada card y panel "Balance cognitivo del instrumento" en evaluation-framework. JSON exportado incluye `cognitiveLevel` por pregunta y `cognitiveLevelDefinitions` (SHA-256 `6c21bb66…`).
- `007_post_phase4_section_guides.html` — Fase 4 del skill v2: indicaciones de eje (qué habilidad evalúa, qué evitar) antes de las preguntas y cierre de eje (recordatorio anti-confusión) después de las preguntas. Validate exige instructions y closing por sección con mínimo 80 caracteres. Resultado por eje: microreading → errores comunes → indicaciones → preguntas → cierre (SHA-256 `3b82b13b…`).
- `008_post_phase5_verb_glossary.html` — Fase 5 del skill v2: glosario "Cómo leer las consignas" con 10 entradas (Identificación, Explicación, Comparación, Análisis, Aplicación, Clasificación, Reflexión/Bioética, Cálculo, Descripción, Respuesta abierta), cada una con verbos asociados, qué pide y ejemplo. Tooltip nativo en cada badge de tipo de pregunta. skill §23 (SHA-256 `30f4e890…`).
- `009_post_phase6_submit_blueprint.html` — Fase 6 del skill v2: submit-flow institucional. Modal pre-revisión valida 6 campos institucionales (nombre, ID, email con formato, fecha, profesor, sección). Pantalla de éxito reescrita con tono institucional + resumen final (preguntas sustantivas, ejes con cobertura, casillas marcadas). JSON exportado incluye `blueprint` completo de las 80 preguntas (id, sección, eje, prompt, type, cognitiveLevel, must, avoid) — facilita calificación con un solo archivo (SHA-256 `ca7a0a68…`).
- `010_post_phase7_context_bar.html` — Fase 7 del skill v2: barra contextual sticky que aparece al scrollear pasado el hero. Muestra eje actual (IntersectionObserver), pregunta actual, y pill de estado que cambia a "Listo para finalizar" cuando 80/80 preguntas + 6 datos institucionales + todas las casillas están completos. Botón "↑ Inicio" para volver al top. Responsive (oculta el contador de pregunta en mobile) (SHA-256 `691bb24c…`).
- `011_post_phase8_a11y.html` — Fase 8 del skill v2: accesibilidad. Skip-to-content link, `:focus-visible` consistente con outline + glow, focus management en modal (focus al cancel-submit al abrir, retorna al disparador al cerrar), ESC cierra el modal, focus management en handoff (focus al redownload, retorno al cerrar), respeta `prefers-reduced-motion` (SHA-256 `5391512d…`).
- `012_post_phase9_teacher_view.html` — Fase 9 del skill v2: vista docente imprimible. Botón "Vista docente" en la barra de acciones + URL hash `#vista-docente`. En vista docente: banner naranja con instrucciones, cada pregunta agrega casilla "Veredicto / Puntaje / Observación", textarea se reduce, declaración final atenuada. Print en vista docente queda como guía de calificación lista para corregir a mano. `page-break-inside: avoid` en cards para impresión limpia (SHA-256 `e4b612bc…`).
- `013_skill_v2_final.html` — **Cierre del skill v2 (Fase 10)**. Idéntico a 012 (SHA-256 `e4b612bc…`). 315 551 B. Marca el estado final del instrumento con todas las capas del skill TLP/Piqui aplicadas.

## Cloudmandate — Etapa A (instrumento)

- `014_pre_etapa_A.html` — Marca de inicio de la Etapa A del cloudmandate. Idéntico a 013 (SHA-256 `e4b612bc…`).
- `015_post_A1_passing80.html` — Passing grade TLP recalibrado a 80%: 7 niveles con flag `passing`, fila pivote visualmente marcada en la tabla. schemaVersion 2.1 → 2.2 (SHA-256 `7e43c92f…`).
- `016_post_A2_anti_skip.html` — Obligatoriedad explícita: badges "Obligatoria" + asteriscos, modal pre-revisión con bloqueo del botón Finalizar cuando faltan obligatorias / datos / casillas; botón "Ir a la primera obligatoria pendiente"; sugerencia de cómo corregir tomada del `must[0]` (SHA-256 `df7b2524…`).
- `017_post_A3_toc.html` — Menú TOC flotante: FAB "Mapa" (bottom-right), drawer derecho con las 80 preguntas agrupadas por eje, indicador de estado (vacía/parcial/completa), atajos `?` toggle, `j/k` navegación, `Esc` cierra. Botones rápidos "Primera obligatoria pendiente" y "Siguiente eje" (SHA-256 `b31c39a1…`).
- `018_post_A4_cross_device.html` — Compatibilidad iOS/iPad/Mac/Android/ChromeOS. Meta tags PWA-ish (theme-color, apple-mobile-web-app-*, manifest inline), inputs ≥16px (anti-zoom iOS), 100svh para drawers, `-webkit-backdrop-filter` en todos los blur, `safe-area-inset` en FAB, layout mobile robusto (botones full-width, FAB compacto sin label) (SHA-256 `9c974f43…`).
- `019_post_A5_pregrade.html` — Pre-calificación determinística (sin IA): heurística por pregunta de cobertura de `must` (keyword tokens ≥4 letras sin stopwords; umbral ⌈2/3⌉) + violación literal de `avoid` (n-gramas de 2-3 tokens) + longitud mínima. Score 0/1 con razón explícita. Resumen pre-calificación en handoff con disclaimer destacado: total/posible, %, nivel preliminar, status TLP 80%. JSON exportado incluye `analytics.preGrade` por pregunta y total (SHA-256 `db1464d1…`).
- `020_post_A6_llm_share.html` — Share-link LLM. Botón "📋 Copiar JSON + prompt de calificación" copia al clipboard un bundle con (a) el JSON completo del examen y (b) un prompt-template extenso basado en la Parte II del skill TLP/Piqui (criterio binario, identificación documental, capas literales, estructura del documento de calificación, tono institucional, niveles TLP con passing 80%). 4 links a Claude/Gemini/ChatGPT/Perplexity. Toast con feedback. Fallback a `execCommand("copy")` en navegadores sin Clipboard API (SHA-256 `775ae30c…`).
- `021_etapa_A_final.html` — **Cierre Etapa A del cloudmandate**. Idéntico a 020 (SHA-256 `775ae30c…`). 421 702 B. Instrumento alineado con cloudmandate §21–§27 (passing 80%, anti-skip con explicación de corrección, navegación failproof, cross-device).

## Snapshots eliminados durante la restructuración (registro)

- `000_initial_index.html` — shell vacío inicial de 37 líneas. Eliminado por no tener valor histórico.
- `002_polished_final.html` — md5 `4c9cdf3e8e82ea138fc440835e119ebc`, idéntico al `deliverable/` actual. Eliminado por redundancia.
- `999_google_drive_placeholder_ignore.html` — placeholder dataless de Google Drive (no tenía contenido). Ya había sido movido fuera de la carpeta principal antes del 2026-05-05. Registrado aquí para preservar el dato histórico.

## Convención para nuevos snapshots

Usar prefijos numéricos correlativos:

```text
002_short_description.html
003_short_description.html
```

(El `002_` queda libre porque el snapshot anterior con ese número fue eliminado por ser duplicado.)

