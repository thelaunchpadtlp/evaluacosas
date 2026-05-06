# Database migrations

evaluacosas usa **Firestore** (schema-less por diseño) como base principal y **Supabase Postgres** como sink redundante.

## Firestore migrations

Firestore no requiere migrations al estilo SQL porque cada documento puede tener cualquier estructura. Cuando cambiamos el schema:

1. Nuevos campos se agregan opcionales en el código (con `??` defaults)
2. Backfill se hace via script en `scripts/migrations/<fecha>_<descripcion>.mjs`
3. Documentamos en este folder

## Supabase Postgres migrations

Cuando agregamos/cambiamos tablas en el sink Supabase:

1. Crear archivo `<YYYYMMDD>_<slug>.sql` con el SQL
2. Ejecutar manualmente via Supabase dashboard
3. Documentar en `CHANGELOG.md`

## Migrations actuales

- `20260423_create_submits_table.sql` — schema inicial submits (en Supabase, no committed por privacidad)
- `20260506_add_audit_log_collection.sql` — Sprint 36 audit_log persistente en Firestore (auto via código, no SQL)

## Migrations pendientes

- Auto-anonymize después de 2 años (Sprint 38)
- Index secundario en submits.payload.student.email (para /data-export)
