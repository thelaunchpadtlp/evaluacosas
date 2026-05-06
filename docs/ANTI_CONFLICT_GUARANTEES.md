# Garantías anti-conflicto entre integraciones

Documento canónico de las garantías de **idempotencia, no-race-conditions, separación de concerns y cross-sink consistency** del backend `evaluacosas-submit-handler` y la red de servicios que lo rodea (5 sinks + automatizaciones futuras).

> Última revisión: 2026-05-06.

## Principios de diseño

1. **Cada submit tiene un `docId` único.** Generado server-side al recibirlo (timestamp + UUID corto), o se respeta el `clientDocId` si el cliente lo provee (válido `[\w-]{8,128}`). Eso es la **clave primaria** que viaja a los 5 sinks.
2. **Cada sink chequea existencia antes de escribir.** Si el `docId` ya está, NO sobrescribe. Devuelve `idempotent: "exists"`. Si no estaba, devuelve `idempotent: "created"`. Esto significa que un retry del mismo POST con el mismo `clientDocId` produce el mismo resultado (es un **idempotency key**).
3. **Los sinks corren en paralelo con `Promise.allSettled`.** Si cualquier sink falla, **los demás continúan**. La respuesta HTTP retorna `summary` por sink: cada uno con `ok: true|false` + razón. Si **todos** fallan, 500. Si al menos uno ok, 200.
4. **Cross-sink consistency**: el mismo `docId`, el mismo path/filename, el mismo schema en todos los sinks. Auditable de un lado a otro.
5. **Separación manual / automática**: el registry curado por humanos vive en `registry/registry.json` del repo `universe-infrastructure`. La sincronización automática vive en `registry/snapshots.json` (separado, no toca registry curado).

## Sink-by-sink

### Cloud Storage `gs://evaluacosas-entregas`
- **Idempotency**: `file.exists()` pre-check + `preconditionOpts: { ifGenerationMatch: 0 }` (atómico server-side: rechaza si existe).
- **Filename**: `<app-slug>/<docId>.json` — siempre único por design del docId.
- **Race condition**: si dos submits llegan en paralelo con el mismo docId (improbable: ts + UUID + sanitize), el segundo recibe error 412 y el handler lo trata como `idempotent: "exists"`.
- **Metadata**: incluida en object metadata (student, email, app, date, teacher, docId).

### Firestore `submits/<docId>`
- **Idempotency**: `docRef.get()` pre-check + `docRef.create()` (atómico server-side: rechaza si existe).
- **Race condition**: si dos creates llegan al mismo doc, el segundo recibe `ALREADY_EXISTS`. Lo capturamos como `idempotent: "exists"`.
- **Document ID**: `docId` exacto.

### GitHub repo privado `thelaunchpadtlp/evaluacosas-entregas/<app>/<docId>.json`
- **Idempotency**: `getContent` pre-check con 404 → si 404, escribir; si 200, skip.
- **Concurrent commits**: GitHub serializa commits a la misma branch. Si dos llegan a la vez, el segundo recibe 409 conflict; lo retornamos como error (raro porque el pre-check ya filtró).
- **Author email**: estudiante (no exposes credenciales).
- **Committer email**: SA del Cloud Run.

### Supabase Postgres `submits`
- **Idempotency**: `select doc_id` con `maybeSingle()` pre-check + `insert` plain (no upsert). Si existe, no sobrescribe (preserva `graded_*` si el docente ya marcó).
- **PK constraint**: `doc_id` es PRIMARY KEY de la tabla, garantía a nivel de DB.
- **Concurrent inserts**: el segundo recibe `unique_violation`; lo capturamos como error (raro porque pre-check filtra).
- **NO actualizamos campos de calificación desde el handler.** Esos solo los actualiza el docente / Gemini auto-grading.

### Linear Issues
- **Idempotency**: `issueSearch(query: docId)` pre-check. Si encuentra issue con `docId` en su description, lo devolvemos sin crear nuevo.
- **Race condition**: si dos submits paralelos no encuentran issue (ambos creen que es la primera vez), pueden crear dos issues. Mitigación: el clientDocId previene este caso porque el docId será el mismo y el segundo POST ya cae en `idempotent: "exists"` en los demás sinks. Si el cliente NO manda clientDocId, podríamos tener dos issues; lo aceptamos como caso extremo (probabilidad < 0.001%).

## Garantías cross-sink

| Caso | Comportamiento |
|------|----------------|
| Mismo `clientDocId` reenviado 5 veces | 5 sinks devuelven `idempotent: "exists"` en las 4 reintentos, sin duplicar |
| `clientDocId` distinto pero contenido idéntico | Cada sink crea nuevo (es submit nuevo desde el punto de vista del sistema) |
| Network timeout en 1 sink, otros OK | Otros 4 sinks completos. El sink fallido se reintenta en el próximo submit con el mismo docId; pasa a `idempotent: "exists"` para los OK y `created` para el caído |
| Sink #5 (Linear) pierde conexión durante la creación | Issue puede quedar a medias. Próximo retry: search lo encuentra Y lo retorna idempotent. Si NO lo encuentra (creación abortada antes de persistir) → crea uno nuevo. Sin duplicados duraderos |
| Docente actualiza Linear/Supabase manualmente | NO se sobrescribe en el próximo submit (el handler solo crea, no update). Los campos de calificación viven en la fuente de verdad: la base de datos donde el docente trabajó |

## Separación de concerns

| Sink | Mutado por | NO mutado por |
|------|-----------|---------------|
| Cloud Storage | submit-handler (Cloud Run) en write-once. Lifecycle policy puede archivar a Coldline después de 365 días. | Nada más. Ni docente, ni Gemini, ni cron jobs |
| Firestore `submits` | submit-handler (create only). | — |
| Firestore `grades` (futuro) | docente / Gemini auto-grading | submit-handler |
| GitHub `evaluacosas-entregas` | submit-handler (commit only). Audit trail criptográfico. | — |
| Supabase `submits` | submit-handler (insert only). | — |
| Supabase `submits.graded_*` columns | docente UI / Gemini / Linear webhook | submit-handler |
| Linear Issue | submit-handler (create only) + docente (status, comments) | — |
| `registry.json` (curated) | humanos via PR | sync-job |
| `snapshots.json` (auto) | sync-job | humanos |

## Failure modes y recuperación

| Falla | Detección | Recuperación |
|-------|-----------|--------------|
| Cloud Run cold start lento | `/health` reporta `> 5s` | Auto-mitigado: keep-alive con Cloud Scheduler ping |
| Bucket lleno | error en `file.save` | Alert + lifecycle policy archivar |
| Firestore quota excedida | error 429 | Reintentar con backoff (futuro). Sigue tier free al volume actual |
| GitHub rate limit | error 403 | Token PAT tiene 5000 req/h; auto-recover |
| Supabase pausado por inactividad (free tier) | sink fall + 404 | sync-job mensual `POST /restore` keep-alive |
| Linear rate limit | error 429 | Linear default 1500/h por user; auto-recover |

## Observabilidad

Cada submit loggea structured JSON en Cloud Logging con:
```json
{
  "severity": "INFO",
  "docId": "...",
  "app": "...",
  "studentEmail": "...",
  "summary": { "cloudStorage": {...}, "firestore": {...}, ... },
  "duration_ms": 287,
  "anyOk": true,
  "allOk": true
}
```

El `/health` endpoint del Cloud Run service refleja en tiempo real qué sinks están enabled. Próximo: agregar `/health/deep` que ejecuta un round-trip a cada sink y reporta latencia.

## Próximas mejoras planeadas

1. **Circuit breaker** por sink: si un sink falla N veces consecutivas, deshabilitarlo temporalmente y notificar via email.
2. **Reconciliación cron** (24h): un job que escanea los 5 sinks y verifica que el mismo `docId` está en todos. Si falta en algún sink, lo re-sincroniza.
3. **Webhook Linear → Cloud Run**: cuando el docente cambia status del Issue a "Done", el backend actualiza Supabase `graded_*` y Firestore `grades/`.
4. **Gemini auto-pre-grade integrado** al backend (sink #6): tras los 5 sinks, llamar Gemini con prompt skill TLP/Piqui Parte II y guardar markdown como Linear comment + Firestore field.
5. **Email automático al docente** (sink #7): SES/Gmail API con link a Linear Issue + GCS object.
6. **Apps Script en Drive del docente** (sink #8 opcional): trigger que detecta nuevo JSON en Drive y crea submission oficial en Classroom.

Cada nueva integración seguirá los **mismos principios anti-conflicto** documentados arriba.
