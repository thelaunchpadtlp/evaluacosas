# Alerting
**Versión**: 1.0 · 2026-05-06

## Estado actual: alerts manuales / ad-hoc

No hay PagerDuty ni Opsgenie. Los alerts dependen de:
1. Joaquín revisando Cloud Run logs ocasionalmente
2. QA suite (`tests/qa-runner.mjs`) corrida ocasional
3. GitHub Actions email-on-fail por defecto
4. Email del docente cuando el estudiante reporta un problema

## Alerts configurados

### GitHub Actions email-on-failure
- Workflow `deploy.yml` falla → email a Joaquín automático
- Cobertura: ✅

### Cloud Logging
- Console-based audit log en Cloud Run
- No alerts proactivos configurados todavía

### Cloudflare
- DDoS protection automático
- Bot fight mode activo
- No alerts custom

## Alerts pendientes (Sprint 37+)

### Críticos (SEV-1 trigger)
- [ ] `/health` devuelve no-200 por > 5min → email
- [ ] Cloud Run revision en estado UNHEALTHY → email
- [ ] Error rate Cloud Run > 5% en ventana 5min → email
- [ ] Pages deploy falla 2 veces consecutivas → email

### Altos (SEV-2 trigger)
- [ ] Latencia P95 > 2s por > 10min
- [ ] Firestore writes daily > 80% del free tier
- [ ] Audit log: ≥10 fallos auth en ventana 10min (posible ataque)

### Medios (SEV-3 trigger)
- [ ] Gemini calls > 1200/día (cerca del free tier)
- [ ] Cloud Storage > 4GB
- [ ] Linear issues no clasificados > 50

### Compliance
- [ ] Backup older than 48h sin nuevo
- [ ] Cert expiration < 30 días (lo manejan GitHub Pages + Cloudflare auto, pero verificar)

## Implementación recomendada

### Opción A: Cloud Monitoring Alerts (free tier OK)
```bash
gcloud alpha monitoring policies create \
  --policy-from-file=alerting-policies.yaml \
  --project=thelaunchpadtlplabsuniverse
```

### Opción B: GitHub Actions cron de health-check
```yaml
# .github/workflows/healthcheck.yml
name: Health check
on:
  schedule: [{ cron: "*/15 * * * *" }]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS https://evaluacosas-submit-handler-441768184201.us-central1.run.app/health || exit 1
```

### Opción C: External uptime (gratis hasta cierto punto)
- UptimeRobot: 50 monitors free
- Pingdom: paid
- Better Stack (Logtail): paid

## Cómo recibir alerts

- Email: joaquin.munoz@thelaunchpadtlp.education
- Frecuencia máxima: 5/hora (anti-flood)
- Aggregación: similar alerts dentro de 30min se agrupan

## Métricas de éxito de alerting

- True positive rate ≥ 90%
- False positive rate < 10%
- MTTA (Mean Time To Acknowledge) < 5min para SEV-1
- Pager fatigue: < 2 páginas/semana de bajo valor
