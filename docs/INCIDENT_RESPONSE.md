# Incident Response Playbook
**Versión**: 1.0 · 2026-05-06

## Severidades

| Sev | Definición | Tiempo respuesta inicial | Comunicación |
|---|---|---|---|
| **SEV-1** | Outage total + sin entregas posibles | 15 min | Email a TLP + status page |
| **SEV-2** | Outage parcial / un componente caído | 1 hora | Email a TLP |
| **SEV-3** | Degradación menor / latencia alta | 4 horas | Internal note |
| **SEV-4** | Bug cosmético / no afecta uso | next sprint | Solo issue |

## Contactos

- **Lead**: Joaquín Antonio Muñoz Ortiz · `joaquin.munoz@thelaunchpadtlp.education`
- **GCP**: Console de `thelaunchpadtlplabsuniverse`
- **Cloudflare**: portal con `cloudflare@thelaunchpadtlp.education`
- **GitHub**: org `thelaunchpadtlp`

## Playbook por escenario

### Escenario A: Backend caído (Cloud Run 5xx)
1. Verificar `gcloud run services describe evaluacosas-submit-handler --region us-central1`
2. Logs: `gcloud logging read "resource.type=cloud_run_revision" --limit=50`
3. Si crash loop: rollback inmediato a revision anterior conocida buena
4. Si depende de Firestore/GCS: verificar status de servicios Google
5. Si OAuth roto: verificar `ADMIN_OAUTH_CLIENT_ID` en env vars

### Escenario B: Pages 404
1. Verificar `gh api repos/thelaunchpadtlp/evaluacosas/pages` → status enabled
2. Workflow runs: `gh run list --repo thelaunchpadtlp/evaluacosas --limit 5`
3. Si último deploy falló: re-trigger desde Actions UI
4. CNAME: verificar `CNAME` en raíz repo + DNS Cloudflare

### Escenario C: OAuth Sign-In rompe (invalid_client)
1. Verificar `dashboard/config.json` tiene client_id correcto
2. Verificar Cloud Run env var `ADMIN_OAUTH_CLIENT_ID` coincide
3. Verificar JS origins del cliente OAuth en GCP Console incluye el origin
4. Si cliente fue borrado: crear nuevo con script `~/.tlp-tools/tlp-set-oauth-client-id.sh`

### Escenario D: Una entrega no llegó a un sink
- No es SEV-1: hay 4 sinks más con el dato
- Investigar logs: buscar `audit_log` con docId
- Replay manual via script (Sprint 37 pendiente)

### Escenario E: Suspected breach / cuenta comprometida
1. **Inmediato**: revocar OAuth Client en GCP Console
2. Quitar email comprometido de `ALLOWED_TEACHERS`
3. Rotar API keys (Gemini, Cloudflare, GitHub PAT)
4. Audit log review last 30 days
5. Notificar a estudiantes afectados según GDPR Art. 33 (≤72h)
6. Postmortem obligatorio

## Postmortem template

```markdown
# Postmortem — <título>
**Fecha**: <YYYY-MM-DD>
**Sev**: <1|2|3|4>
**Duración**: <inicio - fin>

## Resumen
<2-3 oraciones>

## Timeline (UTC)
- HH:MM detección
- HH:MM mitigación
- HH:MM resolución

## Causa raíz
<5-whys>

## Mitigación aplicada
<...>

## Acciones preventivas
- [ ] ...
- [ ] ...

## Lecciones
<...>
```

## Drills

- **Q1 2026**: simular Cloud Run rollback (TODO)
- **Q2 2026**: simular Firestore restore (TODO)
- **Q3 2026**: simular OAuth client compromise (TODO)
- **Q4 2026**: full DR exercise (TODO)
