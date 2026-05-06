# SLA — Service Level Agreement
**Servicio**: evaluacosas TLP
**Versión**: 1.0 · 2026-05-06
**Audiencia**: docentes y estudiantes TLP

## Compromiso de disponibilidad

**Uptime mensual objetivo**: **99.5%**
- Permite hasta ~3h 40min de indisponibilidad por mes
- Aplica a: catálogo (`/`), evaluacosas individuales (`/<slug>/`), dashboard del docente (`/dashboard/`), centro de ayuda (`/ayuda/`)

**No aplica** a:
- Mantenimiento programado anunciado con ≥48h de anticipación
- Fallos de Google Cloud / GitHub Pages / Cloudflare aguas arriba (verificable via status pages oficiales)
- Pérdida de conectividad del usuario final
- Eventos de fuerza mayor

## Tiempos de respuesta

| Tipo | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) |
|---|---|---|
| Outage total | 4 horas | 24 horas |
| Outage parcial (1 sink) | 30 minutos | 0 (otros sinks tienen el dato) |
| Outage backend | 2 horas | 0 (Pages estático sigue funcionando) |
| Pérdida de cuenta admin | 1 hora | — |

## Compromiso de retención

- Entregas activas: durante el ciclo lectivo + 2 años de archivo histórico
- Logs técnicos: 30 días
- Cache TSE: 24h máximo

## Cómo reportar incidentes

- Email: `joaquin.munoz@thelaunchpadtlp.education`
- Asunto: `[INCIDENTE] <descripción corta>`
- Tiempo de respuesta inicial: ≤24h hábiles

## Cómo verificar uptime real

- Status page (próximamente): `https://status.thelaunchpadtlp.education/`
- Health endpoint público: `https://evaluacosas-submit-handler-441768184201.us-central1.run.app/health`

## Compensación por incumplimiento

Como servicio académico interno gratuito de TLP, no hay compensación monetaria. En caso de outage prolongado durante una evaluación crítica:
- El docente decide reprogramar o aceptar entregas con plazo extendido
- TLP comunica oficialmente el incidente y la mitigación

## Referencias

- [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) — playbook de incidentes
- [RTO_RPO.md](./RTO_RPO.md) — detalle de recuperación
- [SLO.md](./SLO.md) — métricas internas
