# Capacity Planning
**Versión**: 1.0 · 2026-05-06

## Carga actual

- **Estudiantes**: ~12 activos
- **Evaluaciones disponibles**: 1 (biology-10)
- **Submits/mes esperados**: ~50 (12 estudiantes × 1-4 evaluaciones)
- **Docentes con dashboard**: 1 (Joaquín)
- **Visitas únicas/mes esperadas**: ~150-300

## Capacidad con free tier actual

| Recurso | Free tier | Uso estimado | Headroom |
|---|---|---|---|
| Cloud Run requests | 2M/mes gratis | ~5K/mes | 400× |
| Cloud Run CPU-seconds | 180K/mes gratis | ~300/mes | 600× |
| Firestore reads | 50K/día gratis | ~500/día | 100× |
| Firestore writes | 20K/día gratis | ~200/día | 100× |
| Firestore storage | 1GB gratis | <100MB | 10× |
| Cloud Storage | 5GB gratis | <500MB | 10× |
| Gemini Flash | 1500/día gratis | ~50/día | 30× |
| Supabase | 500MB DB + 1GB bandwidth | <50MB | 10× |
| Linear | 250 issues / 10 users | <100 | 2.5× |
| GitHub Pages | 100GB bandwidth/mes | <1GB | 100× |
| Cloudflare | unlimited | — | ∞ |

**Conclusión**: capacidad para crecer **10×** sin cambiar plan. 100× con upgrades modestos.

## Escenarios de crecimiento

### 10× (120 estudiantes, 5 evaluaciones)
- Submits/mes: ~3000
- Aún dentro de free tier
- Costo estimado: $0/mes
- Bottleneck: ninguno

### 100× (1200 estudiantes, 20 evaluaciones)
- Submits/mes: ~120K
- Sale de free tier en Firestore (writes diarias)
- Cloud Run aún OK
- Gemini puede salirse (60/día → 6000/día)
- **Estimado**: $30-80/mes
- **Bottleneck**: Gemini grading rate-limit (paid tier resuelve)

### 1000× (12K estudiantes — escala MEP nacional)
- Submits/mes: ~1.2M
- Cloud Run paid: ~$50/mes
- Firestore paid: ~$100/mes
- Gemini paid: ~$200/mes
- Cloudflare paid: ~$25/mes
- **Estimado**: $400-600/mes
- **Bottleneck**: equipo humano para soporte (no técnico)

## Triggers de upgrade

- **Cuando >50 entregas/día**: monitor Firestore writes diarias
- **Cuando >100 docentes**: considerar autoscaling Cloud Run min-instances
- **Cuando >1000 visitas/día**: activar Cloudflare CDN paid tier
- **Cuando Gemini > 1000/día**: paid tier ($0.30/1M input tokens)

## Métricas a monitorear

- Cloud Run latencia P95 — alerta si > 1s
- Firestore reads/writes diarias — alerta si > 80% del free tier
- Cloud Storage cantidad — alerta si > 500MB
- Concurrent users en backend — alerta si > 80 (free tier limit)
- Bandwidth Pages — alerta si > 50GB/mes

## Capacity reviews

- **Mensual**: rev de free tier consumption
- **Trimestral**: capacity planning para próximo trimestre
- **Anual**: revisión completa de escalado

## Referencias
- [SLA.md](./SLA.md) · [SLO.md](./SLO.md) · [HANDOFF_2026-05-06_v2.md](./HANDOFF_2026-05-06_v2.md)
