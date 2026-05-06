# On-Call Rotation
**Versión**: 1.0 · 2026-05-06

## Estado actual: bus factor = 1

**Único oncall**: Joaquín Antonio Muñoz Ortiz
- Email: joaquin.munoz@thelaunchpadtlp.education
- Disponibilidad: best-effort, no 24/7
- Cobertura: lunes a viernes durante el ciclo lectivo

## Riesgo bus factor

Si Joaquín no está disponible:
- **Crítico**: nadie más tiene credenciales activas de GCP/Cloudflare/GitHub admin
- **Mitigación parcial**: documentación pública en `docs/` permite a un nuevo admin retomar con la cuenta institucional Workspace transferida
- **Plan formal**: Sprint 38+ — designar segundo oncall, transferir tokens en 1Password compartido

## Escalation path (cuando haya 2+)

1. Primary on-call (resuelve o decide escalar)
2. Backup on-call (si primary no responde en 15 min para SEV-1)
3. Lead Joaquín (decisión final si ambos escalan)

## Herramientas mínimas para oncall

- macOS con gcloud, gh, security (Keychain) configurados
- Acceso a GCP Console, GitHub web, Cloudflare dashboard
- Slack o equivalente para comms internas

## Procedimiento de handoff entre oncall

(N/A hoy. Plantilla para futuro.)

```
Handoff <fecha>:
- Issues activos: ...
- En vuelo deploys: ...
- Risks: ...
- Próxima sesión QA: ...
```

## Cómo se contacta a oncall en SEV-1

- Email + asunto `[SEV-1]`
- WhatsApp / iMessage personal de Joaquín (no público)

## Hours / días no cubiertos

- Vacaciones: anunciadas con 1 semana de antelación, code freeze parcial
- Domingos / feriados: best-effort
- Madrugada (00:00-07:00 CR): best-effort

## Métricas oncall (para futuro)

- MTTR (Mean Time To Resolve) — objetivo < 2h SEV-1
- Page rate — objetivo < 2 páginas SEV-1/mes
- Burnout protection — objetivo < 5h on-call activa por persona/mes
