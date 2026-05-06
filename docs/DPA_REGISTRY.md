# Data Processing Agreements (DPA) Registry
**Versión**: 1.0 · 2026-05-06
**Controller**: The Launch Pad — TLP / Joaquín Antonio Muñoz Ortiz

## Sub-procesadores y DPAs

Listado de servicios que procesan datos en nombre de TLP. Cada uno tiene su propio DPA público.

### Google Cloud Platform
- **Servicio**: Cloud Run, Firestore, Cloud Storage, Gemini API, OAuth
- **DPA**: https://cloud.google.com/terms/data-processing-addendum
- **Localización**: us-central1, us-east1
- **Subprocesadores Google**: ver https://cloud.google.com/terms/subprocessors
- **Last reviewed**: 2026-05-06

### Google Workspace (TLP)
- **Servicio**: cuentas docente, OAuth identity
- **DPA**: https://workspace.google.com/terms/dpa_terms.html
- **Last reviewed**: 2026-05-06

### Cloudflare
- **Servicio**: DNS, CDN, WAF, security headers
- **DPA**: https://www.cloudflare.com/cloudflare-customer-dpa/
- **Last reviewed**: 2026-05-06

### GitHub (Microsoft)
- **Servicio**: code repos, Pages hosting, mirror privado
- **DPA**: https://docs.github.com/en/site-policy/privacy-policies/github-data-protection-agreement
- **Last reviewed**: 2026-05-06

### Supabase
- **Servicio**: Postgres database (sink redundante)
- **DPA**: https://supabase.com/legal/dpa
- **Last reviewed**: 2026-05-06

### Linear
- **Servicio**: issue tracking (sink redundante de submits)
- **DPA**: https://linear.app/dpa
- **Last reviewed**: 2026-05-06

### TSE Costa Rica (vía gometa.org / Apify)
- **Servicio**: lookup de cédulas en Padrón Electoral público
- **DPA**: N/A (datos de padrón son públicos por ley CR)
- **Datos consultados**: cédula → nombres
- **NO se envían**: respuestas, emails, otros datos sensibles
- **Last reviewed**: 2026-05-06

## Lista pública de sub-procesadores

Ver [SUBPROCESSORS.md](./SUBPROCESSORS.md).

## Procedimiento para agregar nuevo sub-procesador

1. Documentar el servicio + propósito en este archivo
2. Verificar el DPA del proveedor cumple con GDPR/Ley 8968 CR
3. Notificar a estudiantes/docentes 30 días antes de la integración
4. Actualizar privacy policy
5. Agregar a SUBPROCESSORS.md
6. Commit con descripción del cambio

## Procedimiento para retirar un sub-procesador

1. Migrar/eliminar datos según retention policy
2. Confirmar deletion del proveedor
3. Actualizar este registro
4. Si es sink crítico, mantener al menos 4 sinks operacionales

## Auditoría

- Anual: revisión de DPAs vigentes
- Ad-hoc: cuando el proveedor cambia DPA materially
- Próxima revisión: 2027-05-06
