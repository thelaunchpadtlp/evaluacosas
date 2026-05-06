# RTO / RPO — Recovery Time and Point Objectives
**Versión**: 1.0 · 2026-05-06

## Definiciones

- **RTO (Recovery Time Objective)**: tiempo máximo aceptable de indisponibilidad antes de restaurar
- **RPO (Recovery Point Objective)**: máxima pérdida de datos aceptable medida en tiempo

## Objetivos por componente

| Componente | RTO | RPO | Estrategia |
|---|---|---|---|
| GitHub Pages (catálogo, dashboard) | 1h | 0 | Pages reploys auto desde repo |
| Cloud Run backend | 2h | 0 | Multi-revision, instant rollback |
| Firestore submits | 4h | 24h | Daily exports a GCS |
| Cloud Storage | 4h | 0 | Cross-region replication built-in |
| GitHub mirror repo | 24h | 0 | Es una réplica adicional |
| Supabase | 24h | 24h | Daily snapshots |
| Linear issues | 48h | 0 | Réplica adicional |
| Apex (Next.js) | 2h | 0 | Cloud Run multi-revision |
| OAuth Client | 1h | — | Reconfiguración manual |
| DNS / Cloudflare | 24h | 0 | DNS records bajo control |

## Procedimientos de restauración

### Outage Cloud Run backend
```bash
# Rollback al revision anterior conocida buena
gcloud run services update-traffic evaluacosas-submit-handler \
  --region us-central1 --project thelaunchpadtlplabsuniverse \
  --to-revisions evaluacosas-submit-handler-00010-rs5=100
```

### Restauración Firestore desde backup
```bash
# Listar exports
gcloud storage ls gs://evaluacosas-firestore-backups/ \
  --project thelaunchpadtlplabsuniverse

# Restaurar (a un namespace diferente para validar primero)
gcloud firestore import gs://evaluacosas-firestore-backups/<EXPORT> \
  --project thelaunchpadtlplabsuniverse
```

### Pérdida total de un sink
Los otros 4 sinks tienen el dato. Re-ejecutar el sync no destructivo entre sinks:
```bash
node services/submit-handler/scripts/replay-sinks.mjs --from=cloud-storage --to=firestore
```
(script todavía no implementado; queda en Sprint 37)

### Pérdida de Pages (GitHub down)
Servicio degradado pero no destruido. El backend funciona. Las entregas se pueden hacer via curl directo al backend (si hay acceso). Los datos persisten en sinks.

## Backup integrity test (frecuencia: trimestral)

Próxima fecha: **2026-08-06**

Procedimiento:
1. Tomar el último export de Firestore
2. Restaurar a un proyecto sandbox (`tlp-universe-01`)
3. Verificar que `submits/<docId>` aleatorios coinciden con producción
4. Documentar resultado en `docs/BACKUP_RESTORE_TEST_<fecha>.md`

## Referencias
- [SLA.md](./SLA.md)
- [SLO.md](./SLO.md)
- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)
