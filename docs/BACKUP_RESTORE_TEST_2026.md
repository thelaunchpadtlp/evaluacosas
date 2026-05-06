# Backup Restore Test — 2026-05-06
**Tester**: Joaquín · **Status**: ✅ pass (verificación parcial)

## Objetivo

Verificar que los 5 sinks redundantes son **recuperables** (no solo escribibles).

## Procedimiento ejecutado

### Sink 1: Cloud Storage `evaluacosas-entregas`
```bash
gcloud storage ls gs://evaluacosas-entregas/ --project=thelaunchpadtlplabsuniverse
```
- ✅ Bucket accesible
- ✅ Files presentes
- ✅ Download de un file aleatorio funciona

### Sink 2: Firestore `submits`
```bash
gcloud firestore export gs://evaluacosas-firestore-backups/test-2026-05-06 \
  --project=thelaunchpadtlplabsuniverse --collection-ids=submits
```
- ⚠️ Bucket de backups no creado todavía. Pendiente crear `evaluacosas-firestore-backups`
- ✅ Datos en Firestore confirmados via API `/admin/submits`

### Sink 3: GitHub mirror `evaluacosas-entregas` (privado)
```bash
gh repo view thelaunchpadtlp/evaluacosas-entregas
```
- ✅ Repo accesible
- ✅ Commits de submits presentes
- ✅ Clone funciona

### Sink 4: Supabase `submits` table
- ✅ Tabla accesible via dashboard Supabase
- ✅ Rows presentes

### Sink 5: Linear issues
- ✅ Issues con tag `[docId]` accesibles
- ✅ Búsqueda funciona

## Restauración cross-sink

**Hipotético**: si Firestore se corrompe, ¿podemos repoblar desde Cloud Storage?

- Cloud Storage tiene los JSONs originales
- Firestore puede reimportar via `gcloud firestore import`
- ✅ **Posible** pero no automatizado todavía (script en Sprint 37)

## Acciones derivadas

- [ ] Sprint 37: crear `evaluacosas-firestore-backups` bucket + cron daily export
- [ ] Sprint 37: script `replay-sinks.mjs` para sync entre sinks
- [ ] Sprint 38: drill completo end-to-end (simular pérdida de Firestore + restaurar)

## Conclusión

✅ **Pass parcial**: los 5 sinks contienen los datos. La restauración formal automatizada está pendiente pero el path manual está documentado.

## Próxima fecha de test
**2026-08-06** (trimestral)
