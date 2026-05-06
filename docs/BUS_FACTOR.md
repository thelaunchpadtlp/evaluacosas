# Bus Factor Analysis
**Versión**: 1.0 · 2026-05-06
**Bus factor actual**: **1**

## Qué es

"Bus factor" mide cuántas personas pueden desaparecer (literalmente, atropelladas por un autobús) antes de que el proyecto colapse. Bus factor = 1 significa que si Joaquín desaparece, el proyecto se vuelve no-operable inmediatamente.

## Por qué es 1

Joaquín es:
- Único Owner del Workspace TLP en Google
- Único admin de la organización GitHub `thelaunchpadtlp`
- Único holder de los API tokens y credenciales operativas (Cloudflare, GCP, Supabase, Linear, Gemini)
- Único con conocimiento operativo del macroproyecto
- Único contacto técnico para alumnos/docentes

## Riesgos

| Escenario | Probabilidad | Impacto | Mitigación actual |
|---|---|---|---|
| Joaquín pierde laptop | Media | Bajo (Keychain reproducible desde GCP Secrets) | iCloud + GCP Secret Manager backups |
| Cuenta Google comprometida | Baja | Catastrófico | 2FA hardware key + Workspace admin protection |
| Joaquín no disponible 1 semana | Alta | Medio (queda servicio en piloto auto) | Documentación robusta en docs/ |
| Joaquín no disponible 1 mes | Media | Alto (no se pueden agregar docentes nuevos, no rotaciones, etc.) | Ninguna formal |
| Joaquín desaparece definitivamente | Baja | Existencial | Ninguna formal |

## Plan para reducir bus factor a 2+

### Fase 1 — Documentación (✅ hecho)
- Todo el sistema documentado en `docs/` y `~/.claude/projects/.../memory/`
- Procedimientos paso a paso para tareas comunes
- Comandos en HANDOFF
- Memorias persistentes con context

### Fase 2 — Credenciales compartidas (TODO Sprint 38)
- Mover tokens de Keychain personal a 1Password compartido o GCP Secret Manager con IAM compartido
- Designar segundo "owner backup" (ej. otro docente senior TLP)
- Workspace: agregar otro Super Admin

### Fase 3 — Operadores formados (TODO Sprint 39)
- Capacitar 1-2 personas en runbooks
- Drills periódicos para mantener conocimiento

### Fase 4 — Continuidad legal (TODO 2026)
- Contrato/acuerdo institucional que defina sucesión en caso de incidente extremo
- Repositorio dejado a Centro Educativo GEA

## Acciones inmediatas posibles

1. Crear segundo Workspace Super Admin (Joaquín tarda 2 min en hacerlo)
2. Compartir 1Password vault con `clouddrive@thelaunchpadtlp.education` (cuenta de servicio)
3. Documentar en este archivo el handoff procedure

## Why this file exists

Si estás leyendo esto y Joaquín no está disponible: este documento es el punto de partida. Los demás archivos en `docs/` te dicen qué hacer.
