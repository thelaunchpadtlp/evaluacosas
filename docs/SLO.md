# SLO / SLI — Service Level Objectives & Indicators
**Versión**: 1.0 · 2026-05-06

## Métricas que medimos (SLI)

### Disponibilidad
- **Definición**: % de requests HTTP a `/health` del backend que devuelven 200 OK en ventana de 5min
- **Target SLO**: 99.5% mensual
- **Error budget**: 0.5% = ~3h 40min/mes de error budget

### Latencia
- **Definición**: P95 de TTFB de `/admin/whoami` (auth feliz)
- **Target SLO**: < 800ms P95
- **Error budget**: ≤ 5% de requests > 800ms en ventana de 1h

### Integridad de submit
- **Definición**: % de submits que persisten en ≥4 de 5 sinks
- **Target SLO**: 99.95%
- **Error budget**: 1 falla por cada 2000 submits

### Submit success rate
- **Definición**: % de POST /submit que devuelven 200
- **Target SLO**: 99.9%
- **Excluye**: rate-limited (429), validation errors (400)

## Cómo se mide

### Hoy (manual / ad-hoc)
- `curl /health` por cron daily (queda en logs)
- Audit log en Cloud Logging
- QA suite (`tests/qa-satanic.mjs`) corre on-demand

### Próximo paso (Sprint 37+)
- GitHub Action workflow `.github/workflows/uptime.yml` corre cada 5min
- Cloud Monitoring dashboard con uptime check
- Alerta a email si error budget < 25% restante

## Error budget policy

- **Si quedan >50% del error budget**: ship features normalmente
- **Si quedan 25-50%**: priorizar reliability tasks
- **Si quedan <25%**: code freeze + only reliability fixes
- **Si error budget = 0%**: incident postmortem obligatorio

## Métricas que NO medimos (todavía)

- Time to Interactive frontend (necesita Lighthouse CI)
- Real User Monitoring (RUM) — costoso para uso TLP
- Conversion rate (no aplica, no es e-commerce)
- Concurrent users — usar Cloud Run automatic scaling metrics

## Postmortem template

Cualquier outage > 30min genera postmortem en `docs/POSTMORTEMS/<fecha>.md` con:
- Resumen
- Timeline
- Causa raíz
- Mitigación aplicada
- Acciones preventivas
- Lecciones aprendidas
