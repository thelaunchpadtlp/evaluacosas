# Changelog · evaluacosas

Todas las versiones notables del proyecto. Formato: [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- **Sprint 33** — ROADMAP.md y CHANGELOG.md como artefactos vivos. Reference docs.
- **Sprint 32** — Backend hardening: rate limiting (100/min IP global, 200/min admin), audit log estructurado por evento (admin_auth_ok/error/blocked/rate_limited), ALLOWED_TEACHERS allowlist explícita verificada en cada admin request. Páginas legales: `/terms/`, `/ayuda/problemas/`, `/ayuda/privacidad/`.
- **Sprint 31** — Mejoras UX por ítem en biology-10: progress ring SVG con gradient, smart resume scroll, atajos g/Cmd+S/Cmd+N, badge "borrador local" auto-fade, modo concentración con fade nav/footer.
- **Sprint 30** — Help drawer integrado del estudiante en biology-10: 6 tabs (Cómo responder, Mini rúbricas, Atajos, FAQ, Glosario MEP, Si me trabo), botón ? en globalnav, atajo ? sin conflicto con TOC.
- **Sprint 29** — GCP Health Dashboard cross-project en apex `/registry/gcp-health/`. Sync script + JSON snapshot + API + UI con stats, filters, search, expandable cards, links a Console GCP. Re-sync manual.
- **Sprint 28** — Sitemap robusto auto-actualizable: `scripts/build-sitemap.mjs` + `/sitemap/` HTML interactivo + `sitemap.xml` para crawlers + `robots.txt`.
- **Sprint 27** — Device-view toggle inyectado en biology-10 generated HTML.
- **Sprint 26** — Design tokens uniformes en biology-10 (SF Pro stack, squircle radii, glass blur, safe-area, spring easings, globalnav + footer cross-link).
- **Sprint 25** — Etiquetado uniforme GCP: 5/7 proyectos TLP via Cloud Resource Manager v3 API.
- **Sprint 24** — Audit completo de 17 proyectos GCP en `docs/GCP_AUDIT_2026-05-06.md`.
- **Sprint 23** — Multi device-view toggle universal (16 vistas, auto-detect + manual override).
- **Sprint 22** — Hybrid AI+heuristic search en dashboard del docente y apex registry.
- **Sprint 21** — Design system unificado en `docs/DESIGN_SYSTEM.md`.
- **Sprint 20** — Centro de ayuda `/ayuda/` + dashboard discoverability.
- **Sprint 19** — Apple Liquid Glass tokens (macOS Tahoe / iOS 26 / iPadOS 26 / visionOS).
- **Sprint 18** — OAuth Web App Client ID configurado.
- **Sprint 17** — Hero welcome message en landing.
- Switch user + interactive tour + integrated help drawer en dashboard del docente.

### Fixed
- **Sprint X** — Device-view toggle: el botón ✕ no minimizaba ni cerraba. Reescrito con event delegation single-handler + corner ✕ siempre visible (no hover-only).
- CORS: backend ahora permite header `Authorization`.
- Backend env var rename: `OAUTH_CLIENT_ID` → `ADMIN_OAUTH_CLIENT_ID`.

### Changed
- Sprint 22 — Búsqueda apex rediseñada como hero conspicuo con magnifying glass SVG + IA button.

### Security
- **Sprint 32** — Rate limiting + audit log + ALLOWED_TEACHERS allowlist explícita en backend.
- Sprint 18 — IAP-managed OAuth client reemplazado por Web App OAuth client con JS origins explícitos.

### Documentation
- ROADMAP.md, CHANGELOG.md mantenidos
- HANDOFF_2026-05-06.md
- GCP_AUDIT_2026-05-06.md
- GCP_HEALTH_BLUEPRINT.md (universe-infrastructure)
- DESIGN_SYSTEM.md
- PLAN_OAUTH_DASHBOARD.md
- PLAN_TSE_INTEGRATION.md
- 7 memorias persistentes en `~/.claude/projects/.../memory/`

## [1.0.0] — 2026-04 (estado inicial pre-sesión)

### Added
- Etapas A-H completadas.
- Biology-10 con 80 ítems, criterios MEP, pre-grading determinístico.
- Dashboard del docente básico.
- Catálogo en landing.
