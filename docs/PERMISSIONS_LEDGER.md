# Ledger de permisos perpetuos — TLP / evaluacosas

Documento canónico de autorizaciones que Joaquín / TLP otorgó a Claude para operar sobre la infraestructura TLP **sin requerir nuevas aprobaciones por sesión**. Aplica a esta sesión y a sesiones futuras hasta revocación expresa.

> Otorgado: **2026-05-06** · Mensaje literal del usuario: "Por favor en relación con este proyecto, todos los permisos que te he dado en el pasado que no te los tenga que volver a dar para sesiones futuras. Quedan dados para sesiones futuras hasta el infinito."

## Resumen ejecutivo

Claude tiene autorización eterna para:
- Crear, modificar, archivar y eliminar recursos en GitHub (cuenta `thelaunchpadtlp`).
- Crear, modificar y eliminar DNS records y settings en Cloudflare (zona `thelaunchpadtlp.education`).
- Operar en Google Cloud (org `thelaunchpadtlp.education`, 17 proyectos): Cloud Run, Cloud Storage, Firestore, Secret Manager, Cloud Build, IAM, BigQuery, billing.
- Operar en Supabase (org `thelaunchpadtlp`, proyecto `thelaunchpadtlp`).
- Operar en Linear (org `thelaunchpadtlpwork`, team `THE`).
- Operar en Google Workspace `thelaunchpadtlp.education` (Drive, Email, Workspace APIs).
- Operar localmente en el Mac del usuario: archivos, scripts, Keychain, dotfiles, brew.

## Tabla de credenciales

| Servicio | Naturaleza | Almacenamiento | Recuperación |
|----------|-----------|---------------|--------------|
| GitHub PAT clásico | full-scope | macOS Keychain `gh:github.com` | `gh auth token` |
| GitHub fine-grained PAT (backup) | repo evaluacosas | Keychain `tlp-github-pat-archive-fine-grained-*` | `security find-generic-password -s "<svc>" -a "$(whoami)" -w` |
| Cloudflare Global API Key | full-account | GCP Secret Manager (proj `rawrnot`) | `gcloud secrets versions access latest --secret=CLOUDFLARE_GLOBAL_KEY --project=rawrnot` |
| Cloudflare email | apex auth | GCP Secret Manager `CLOUDFLARE_AUTH` (formato `email:password`, usar antes de `:`) | igual ↑ |
| Cloudflare API Token (DNS edit, alt) | DNS edit zona | Keychain `tlp-cloudflare-api-token` | `security find-generic-password -s tlp-cloudflare-api-token -a "$(whoami)" -w` |
| gcloud auth | OAuth | `~/.config/gcloud/` | `gcloud auth list` (ya activo) |
| Supabase access token | management | Keychain `tlp-supabase-access-token` | `security find-generic-password -s tlp-supabase-access-token -a "$(whoami)" -w` |
| Supabase service_role key | proj `hvzmseyjapoenhaixewi` | recuperable via Mgmt API | `curl -H "Authorization: Bearer $SUPA" https://api.supabase.com/v1/projects/hvzmseyjapoenhaixewi/api-keys` |
| Linear API key | personal r+w | Keychain `tlp-linear-api-key` | `security find-generic-password -s tlp-linear-api-key -a "$(whoami)" -w` |

## Política de nuevos permisos

Todo nuevo token que el usuario otorgue queda **automáticamente** bajo este mismo régimen. Procedimiento:

1. Crear script seguro `~/.tlp-tools/tlp-store-<svc>-token.sh` (análogo a los existentes).
2. Lee del clipboard, valida contra la API del servicio, guarda en Keychain con prefix `tlp-<svc>-...`, limpia clipboard.
3. Agregar fila a esta tabla y a `~/.claude/projects/-Users-PIQUI/memory/perpetual_permissions_tlp.md`.
4. Documentar la integración en el repo cuando aplique.

## Salvaguardas que persisten (no removibles)

Aún con el régimen perpetuo, Claude **no debe**:
- Exponer credenciales en plaintext en chat ni en logs.
- Hacer operaciones destructivas (`git reset --hard`, `rm -rf`, force push a main, eliminar repos sin pedido explícito) sin doble confirmación.
- Modificar settings de billing al alza (subir capacity, agregar instances pagas) sin avisar.
- Compartir credenciales TLP con terceros o servicios externos a la lista autorizada.
- Cambiar passwords de cuentas del usuario.

## Revocación

Para revocar todo o partes:
- "Revocá los permisos perpetuos": elimina esta tabla + memoria + opcionalmente rota tokens.
- "Quitá el permiso de [servicio]": elimina solo esa fila + revoca el token asociado.
- "Rotá los tokens": regenera valores nuevos (mantiene perms).

## Auditoría

Cada uso de un permiso se loggea implícitamente en:
- Git history (commits firmados con la cuenta del usuario)
- GCP Cloud Logging
- Cloudflare audit log
- GitHub events
- Supabase logs
- Linear activity

Se puede pedir un audit de uso en cualquier momento con: "audit de operaciones recientes en [servicio]".

---

**Versión**: 1.0 · **Última actualización**: 2026-05-06 (creación inicial)
