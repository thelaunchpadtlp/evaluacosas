# Changelog · evaluacosas

Todas las versiones notables del proyecto. Formato: [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- **Sprint 29** — GCP Health Dashboard cross-project en apex `/registry/gcp-health/`. Sync script + JSON snapshot + API + UI con stats, filters, search, expand-cards, links a Console GCP. Re-sync manual; cron diario diferido a F.4.
- **Sprint 28** — Sitemap robusto auto-actualizable: `scripts/build-sitemap.mjs` + `/sitemap/` HTML interactivo + `sitemap.xml` para crawlers + `robots.txt`. Auto-update en CI/CD.
- **Sprint 27** — Device-view toggle inyectado en biology-10 generated HTML.
- **Sprint 26** — Design tokens uniformes en biology-10 (SF Pro stack, squircle radii, glass blur, safe-area, spring easings, globalnav + footer cross-link).
- **Sprint 25** — Etiquetado uniforme GCP: 5/7 proyectos TLP con `tlp_owner`, `tlp_project`, `tlp_env`, `tlp_cost_center` via Cloud Resource Manager v3 API.
- **Sprint 24** — Audit completo de 17 proyectos GCP en `docs/GCP_AUDIT_2026-05-06.md`.
- **Sprint 23** — Multi device-view toggle universal (16 vistas, auto-detect + manual override).
- **Sprint 22** — Hybrid AI+heuristic search en dashboard del docente y apex registry.
- **Sprint 21** — Design system unificado en `docs/DESIGN_SYSTEM.md`.
- **Sprint 20** — Centro de ayuda `/ayuda/` + sub-páginas + dashboard discoverability.
- **Sprint 19** — Apple Liquid Glass tokens (macOS Tahoe / iOS 26 / iPadOS 26 / visionOS).
- **Sprint 18** — OAuth Web App Client ID configurado.
- **Sprint 17** — Hero welcome message en landing.
- Switch user + interactive tour + integrated help drawer en dashboard del docente.

### Fixed
- **Sprint X** — Device-view toggle: el botón ✕ no minimizaba ni cerraba. Reescrito con event delegation single-handler + corner ✕ siempre visible (no hover-only).
- CORS: backend ahora permite header `Authorization` (bloqueaba todas las requests de admin).
- Backend env var rename: `OAUTH_CLIENT_ID` → `ADMIN_OAUTH_CLIENT_ID`.

### Changed
- Sprint 22 — Búsqueda apex rediseñada como hero conspicuo con magnifying glass SVG + IA button con gradient.

### Security
- Sprint 18 — IAP-managed OAuth client reemplazado por Web App OAuth client con JS origins explícitos.

## [1.0.0] — 2026-04 (estado inicial pre-sesión)

### Added
- Etapas A-H completadas (skill v2, GitHub Pages, subdomain, Cloud Run + 5 sinks, etc.).
- Biology-10 con 80 ítems, criterios MEP, pre-grading determinístico.
- Dashboard del docente básico.
- Catálogo en landing.
