# evaluacosas

Macro-proyecto de **The Launch Pad — TLP** que aloja todas las apps web educativas (instrumentos de evaluación, prácticas, quizzes) servidas como sitios estáticos en GitHub Pages bajo el subdominio `evaluacosas.thelaunchpadtlp.education`.

## Apps

| App | Ruta | Descripción |
|-----|------|-------------|
| `biologia-10` | `biologia-10/` | Tarea Integral Avanzada de Biología 10 (80 preguntas, 3 ejes MEP) — instrumento canónico TLP/Piqui v2 + cloudmandate Etapa A. |

> Nuevas apps se agregan como subcarpetas hermanas de `biologia-10/`. Cada app es autocontenida (`src/`, `scripts/`, `package.json`, build artifact `index.html`, `snapshots/`). El workflow de GitHub Actions ejecuta validate + build de cada app modificada y publica todo a Pages.

## URLs

- **Producción**: https://evaluacosas.thelaunchpadtlp.education/<app>/  (tras configurar CNAME)
- **GitHub Pages directo**: https://thelaunchpadtlp.github.io/evaluacosas/<app>/

## Cómo agregar una app

1. Creá una subcarpeta hermana: `mkdir nueva-app && cp -R biologia-10/{src,scripts,package.json} nueva-app/`.
2. Adaptá el contenido en `nueva-app/src/`.
3. `cd nueva-app && node scripts/validate.mjs && node scripts/build.mjs`.
4. Commit y push. El workflow despliega automáticamente.

## Cómo trabajar localmente

```bash
cd biologia-10
node scripts/validate.mjs   # valida estructura
node scripts/build.mjs       # genera index.html
open index.html              # ve el resultado
```

No hay dependencias externas (Node.js puro).

## Política de calificación TLP

- Criterio binario: 1 punto por ítem, sin parciales.
- Passing grade: **80 %** (umbral institucional TLP).
- Niveles de desempeño: 95–100 Excelente · 90–94 Muy alto · 85–89 Bueno · **80–84 Aceptable (línea de aprobación)** · 70–79 No alcanzado por margen estrecho · 60–69 No alcanzado · <60 Insuficiente.
- Skill maestro de calificación: ver el material institucional `skill.rtf` en el Drive del proyecto fuente (no replicado aquí por privacidad).

## Stack

- HTML + CSS + JS vanilla (sin frameworks).
- Build determinístico Node.js (`scripts/build.mjs`) que ensambla `index.html` desde `src/{questions.js, styles.css, app.js}`.
- Validate determinístico que verifica estructura, schemaVersion, niveles, balance cognitivo, glosario, etc.
- GitHub Actions: en cada push a `main`, ejecuta validate + build de cada app y despliega el árbol completo a GitHub Pages.

## Costos

- GitHub Pages: gratis ilimitado.
- GitHub Actions: gratis para repos públicos.
- Subdominio CNAME: gratis (depende del DNS del dominio padre).
- **Costo total recurrente: $0**.

## Autoría

The Launch Pad — TLP / Centro Educativo GEA, acreditado ante el MEP.
Curso personalizado e individualizado por tutorías.
