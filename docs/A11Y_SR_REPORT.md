# Screen Reader Test Report
**Versión**: 1.0 · 2026-05-06
**Tester**: Joaquín Muñoz · macOS 25.5 + iOS 26

## Cobertura

| Asistente | Sistema | Cobertura |
|---|---|---|
| VoiceOver | macOS Tahoe | ✅ Smoke test |
| VoiceOver | iOS 26 | ✅ Smoke test |
| TalkBack | Android 14 | ⏳ Pendiente |
| NVDA | Windows | ⏳ Pendiente |
| JAWS | Windows | ⏳ Pendiente |

## Smoke test VoiceOver macOS — landing

### Página `/`
- [x] Skip-to-content lee como primer elemento ✓
- [x] Globalnav anuncia "Navegación principal" + items ✓
- [x] Hero h1 lee "evaluacosas" con énfasis ✓
- [x] Welcome strip lee como bloque "Bienvenido a la central…" ✓
- [x] Catálogo grid: cada card lee título + descripción + estado ✓
- [x] Footer columns lee secciones agrupadas correctamente ✓

### Issues encontrados
- ⚠️ Algunos botones decorativos (canvas) no tienen role suficiente — aceptable porque son aria-hidden
- ✅ Skip link funciona correctamente

## Smoke test VoiceOver iOS — biology-10
- [x] Globalnav anuncia bien
- [x] Cada question card anuncia número + tipo + texto + status
- [x] Mini rúbricas se anuncian al expandir
- [x] Botones Responder/Guardar/Editar leen correctamente

## Cosas verificadas
- ✅ Lang declarado en español → VoiceOver Spanish voice
- ✅ Touch targets ≥ 44px → tap accuracy buena
- ✅ Focus visible en navegación por VO+arrows
- ✅ Aria-current en current page

## Plan de testing más completo

- [ ] Q3 2026: TalkBack Android (priority since muchos estudiantes pueden tener Android)
- [ ] Q4 2026: NVDA en Windows
- [ ] 2027: JAWS si hay usuario que lo requiera

## Audit con axe DevTools

Pendiente — Sprint 38 incluye correr axe-core programáticamente y commitear `tests/results/axe-report.json`.
