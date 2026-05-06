# Roadmap · evaluacosas

## Estado actual: producción operativa expandida (2026-05-06 mid-sesión)

✅ Etapas A-H completas
✅ Etapa F (Macro-merge GCP) — F.1 + F.2 + F.3 hechos
✅ Etapa G (UX evolucionada examen) — G.1 + G.2 + G.3 + G.4 hechos
⚙️ Etapa E (Audit GitHub + Cloud cleanup) — en curso
🔄 **Sprint 34 (QA suite)** en construcción

## Sprints completados esta sesión

| # | Sprint | Status |
|---|---|---|
| 17 | Hero welcome message | ✅ |
| 18 | OAuth Client ID + plan exhaustivo | ✅ |
| 19 | UX checklists + Liquid Glass | ✅ |
| 20 | Dashboard discoverability | ✅ |
| 21 | Design System unificado | ✅ |
| 22 | Hybrid AI+heuristic search | ✅ |
| 23 | Multi device-view toggle | ✅ |
| 24 | F.1 GCP audit | ✅ |
| 25 | F.2 GCP labels | ✅ |
| 26 | G.1 design tokens biology-10 | ✅ |
| 27 | G.2 device-view biology-10 | ✅ |
| 28 | Sitemap auto-actualizable | ✅ |
| X | Fix device-view toggle | ✅ |
| 29 | F.3 GCP Health dashboard apex | ✅ |
| 30 | G.3 Help drawer estudiante | ✅ |
| 31 | G.4 UX por ítem (ring, atajos, focus) | ✅ |
| 32 | Backend hardening (audit + rate-limit) | ✅ |
| 33 | Cleanup + ROADMAP/CHANGELOG | ✅ (en progreso) |
| 34 | QA Suite cientos de criterios | ✅ 99% |
| 35 | Cloudflare security headers en apex | ✅ |

## Sprints en cola post-QA

### Sprint 34 — QA Suite cientos de criterios (en curso)
Framework de tests con runner automático + reportes markdown + auto-fix.

### F.4 — GitHub Action cron daily para gcp-health-sync
Service account read-only + scheduler. ~30 min.

### G.5 — Modo "review" para docente
Iterar sobre la entrega con anotaciones inline. ~60 min.

### G.6 — Voice input
Whisper.cpp o Web Speech API para respuestas habladas. ~90 min.

### G.7 — Export PDF firmado
Entrega + grading como PDF con QR code de verificación. ~60 min.

### Catálogo
- 2da evaluacosa (Matemáticas? Historia?) — a definir
- Plantilla genérica `evaluacosa-template/` para rapid-create

### Apex
- Sprint 22 cleanup — wire highlight() en EntityCard (low priority)
- Universe Live Status (uptime + latencia per service)

### Compliance
- GDPR-style data export endpoint
- Auto-anonymize tras 2 años

## Política de prioridades
1. **Bugs en producción** primero
2. **UX visible** segundo
3. **Operacional invisible** tercero
4. **Refactor / cleanup** último

## Cómo se mantiene este roadmap
- Cada sprint completado mueve su entrada a CHANGELOG.md
- Update por commit en cada cierre
