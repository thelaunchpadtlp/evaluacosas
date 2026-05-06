# source/ — Subproyecto fuente

Subproyecto Node modular que compila la evaluación de Biología 10 (80 preguntas) en un HTML autocontenido. Diseño minimalista (gradiente oscuro + canvas de partículas, sin Google Sign-in) hecho originalmente por Codex.

El HTML público vive en `../deliverable/TLP_Biologia_10_Tarea_Integral_Avanzada_80_Preguntas.html`.

---

## Estructura

```
source/
├── package.json                 type: module
├── src/
│   ├── questions.js             banco canónico de 80 preguntas (ÚNICA fuente)
│   ├── styles.css               diseño visual y layout responsivo
│   └── app.js                   autosave, progreso, exportar JSON, imprimir
├── scripts/
│   ├── validate.mjs             verifica integridad del banco
│   └── build.mjs                compila src/* + index.html autocontenido
├── index.html                   build artifact (no editar a mano)
└── snapshots/
    ├── 001_full_80_built.html   versión histórica
    └── HISTORY.md
```

---

## Workflow

```sh
cd source
node scripts/validate.mjs    # debe imprimir: OK: 80 preguntas validadas.
node scripts/build.mjs       # genera index.html
```

Para publicar el resultado al entregable público:

```sh
cp index.html ../deliverable/TLP_Biologia_10_Tarea_Integral_Avanzada_80_Preguntas.html
```

El archivo público se abre directamente en navegador. **No requiere servidor local ni puerto.**

---

## Reglas de edición

- Editar **siempre** en `src/`. Nunca en `index.html` (es generado).
- Los IDs de pregunta deben ser secuenciales 1–80.
- Cada pregunta requiere `prompt`, ≥3 `must`, ≥3 `avoid`.
- Los SVG por sección viven en `questions.js` (`ecosystemArt`, `geneticsArt`, `evolutionArt`).
- Tras editar: validar → buildear → (si entrega) copiar a `../deliverable/`.
- Snapshot tras hito: `snapshots/00N_descripcion_corta.html` (ver `snapshots/HISTORY.md`).
- Nombres de archivo público: sin espacios.

---

## Verificación de salud (después de cualquier cambio)

```sh
node scripts/validate.mjs                # banco íntegro
node scripts/build.mjs                   # build sin errores
diff index.html ../deliverable/TLP_Biologia_10_Tarea_Integral_Avanzada_80_Preguntas.html
```

Si el `diff` no es vacío y querés publicar el cambio: copiar `index.html` sobre el deliverable.
