# Disaster Recovery Runbook — Tested
**Versión**: 1.0 · 2026-05-06

## Status

- Runbook escrito: ✅
- Drill ejecutado completo: ⚠️ pendiente Sprint 38
- Procedimientos individuales verificados: ✅ (ver BACKUP_RESTORE_TEST_2026.md)

## Escenarios DR

### DR-1: Cloud Run service deleted
**Probabilidad**: muy baja · **Impacto**: alto (backend caído)
**Procedure**:
```bash
cd ~/Code/evaluacosas/services/submit-handler
gcloud run deploy evaluacosas-submit-handler \
  --source . --region us-central1 \
  --project thelaunchpadtlplabsuniverse \
  --allow-unauthenticated
```
**RTO**: 5 min · **Verified**: sí, hicimos múltiples redeploys exitosos

### DR-2: GitHub Pages corrupted
**Probabilidad**: muy baja · **Impacto**: alto (frontend caído)
**Procedure**:
1. Verify `gh api repos/thelaunchpadtlp/evaluacosas/pages` status
2. Re-trigger workflow: `gh workflow run deploy.yml`
3. If repo corrupted: re-push from local
**RTO**: 10 min · **Verified**: parcial (deploys regulares)

### DR-3: Firestore data lost
**Probabilidad**: extremadamente baja · **Impacto**: alto
**Procedure**:
1. Confirm loss via Cloud Console
2. Identify last known export in `gs://evaluacosas-firestore-backups/`
3. `gcloud firestore import gs://...`
4. Verify counts match expectation
**RTO**: 1h · **Verified**: NO (drill pendiente Sprint 38)

### DR-4: All 5 sinks unavailable simultaneously
**Probabilidad**: ~zero (Google Cloud + GitHub + Supabase + Linear todos caídos)
**Procedure**:
1. Wait for upstream recovery (most likely)
2. Local cache de estudiantes (localStorage) preserva entregas in-progress
3. Once 1 sink recovers, replay
**RTO**: depends on upstream

### DR-5: OAuth Client deleted
**Probabilidad**: baja · **Impacto**: medio (dashboard inaccesible, backend sigue)
**Procedure**:
1. Crear nuevo Web App OAuth Client en GCP Console
2. Ejecutar `bash ~/.tlp-tools/tlp-set-oauth-client-id.sh <new-id>`
3. Verificar /admin/whoami con cuenta válida
**RTO**: 10 min · **Verified**: sí, lo hicimos esta sesión

### DR-6: Cloudflare DNS broken
**Probabilidad**: muy baja · **Impacto**: total (sitio inaccesible por dominio)
**Procedure**:
1. Cloudflare dashboard → DNS records
2. Restore from backup (pending — Sprint 38: dump records to git)
3. TTL bajo permite recovery rápido
**RTO**: 30 min · **Verified**: NO

### DR-7: Joaquín perdido (bus factor 1)
**Probabilidad**: baja · **Impacto**: existencial
**Procedure**: ver [BUS_FACTOR.md](./BUS_FACTOR.md)

## Drill schedule

| Trimestre | Drill | Status |
|---|---|---|
| Q2 2026 | DR-1 Cloud Run rollback | ✅ implícito en deploys regulares |
| Q3 2026 | DR-3 Firestore restore | ⏳ pendiente |
| Q4 2026 | DR-6 DNS restore | ⏳ pendiente |
| Q1 2027 | Full DR exercise | ⏳ pendiente |

## Lecciones aprendidas (esta sesión)

- Backend redeploys son rápidos (< 3 min) gracias a Dockerfile multi-stage
- Pages deploys son rápidos (< 2 min) si CI verde
- OAuth recovery es manual pero documentado (script + 2 min de gcloud)
- Cloud Run revisions permiten rollback instantáneo

## Referencias
- [BACKUP_RESTORE_TEST_2026.md](./BACKUP_RESTORE_TEST_2026.md)
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
- [BUS_FACTOR.md](./BUS_FACTOR.md)
- [RTO_RPO.md](./RTO_RPO.md)
