# Roadmap · evaluacosas

## Estado actual: producción operativa (2026-05-06)

✅ Etapas A-H completas
✅ Etapa F (Macro-merge GCP) — F.1 + F.2 hechos
✅ Etapa G (UX evolucionada examen) — G.1 + G.2 hechos
⚙️ Etapa E (Audit GitHub + Cloud cleanup) — en curso

## Sprints en cola (orden recomendado de ejecución)

### 🟡 Sprint X — Fix device-view toggle (DONE)
Bug del botón cerrar/minimizar.

### 🟢 Sprint 29 — F.3 Dashboard cross-project GCP en apex
**Objetivo**: Sección "GCP Health" en `/registry/` que muestra costo, servicios activos, alertas, sync diario.
**Esfuerzo**: ~60 min
**Bloquea**: ninguno
**Beneficio**: visibilidad costo-operación sin Console.

### 🟢 Sprint 30 — G.3 Help drawer del estudiante
**Objetivo**: Drawer integrado en biology-10 con tabs (cómo responder, mini rúbricas, atajos, FAQ, glosario MEP, si me trabo).
**Esfuerzo**: ~30 min
**Bloquea**: ninguno
**Beneficio**: estudiantes auto-suficientes, reducir consultas.

### 🟢 Sprint 31 — G.4 Mejoras UX por ítem
**Objetivo**: Anillo progreso, spring animations save, smart resume, atajos g/s/n, badge borrador local, modo concentración.
**Esfuerzo**: ~45 min
**Bloquea**: ninguno
**Beneficio**: experiencia premium tipo Apple/iOS.

### 🟢 Sprint 32 — Sprint 18 Fase A backend hardening
**Objetivo**: Crear `/terms/`, `/ayuda/problemas/`, `/ayuda/privacidad/`. Audit log middleware + rate limiting en submit-handler.
**Esfuerzo**: ~45 min
**Bloquea**: ninguno
**Beneficio**: compliance + protección anti-abuso.

### 🟢 Sprint 33 — Cleanup final
**Objetivo**: Wire highlight() en EntityCard apex, remove unused haystackFor, MEMORY.md updates, ROADMAP.md + CHANGELOG.md mantenidos.
**Esfuerzo**: ~30 min
**Bloquea**: nada
**Beneficio**: deuda técnica = 0.

## Backlog post-roadmap (futuro)

### Operación
- F.3 dashboard GCP cross-project con cron (Sprint 29)
- F.4 archivar proyectos dormidos (con OK explícito)
- F.5 consolidar billing accounts duplicadas
- Email automático al docente al recibir entrega
- Apps Script Drive→Classroom (sincronización)
- Classroom API directa (post-OAuth interactive)

### UX
- G.3, G.4 (Sprints 30 + 31)
- G.5 modo "review" para que docente itere sobre la entrega
- G.6 voice input (Whisper o similar) para respuestas
- G.7 export a PDF firmado de entrega + grading

### Catálogo
- 2da evaluacosa (Matemáticas? Historia? a definir)
- Plantilla genérica `evaluacosa-template/` para rapid-create

### Apex
- Sprint 22 cleanup — wire highlight() en EntityCard
- Cron registry-sync deploy + Cloud Scheduler
- Universe Live Status (uptime + latencia per service)

### Compliance
- Sprint 32 (terms + privacy + audit log + rate limit)
- GDPR-style data export endpoint
- Auto-anonymize tras 2 años

## Política de prioridades
1. **Bugs en producción** primero (cero downtime)
2. **UX visible al usuario** segundo
3. **Operacional invisible** tercero
4. **Refactor / cleanup** último

## Cómo se mantiene este roadmap
- Cada sprint completado mueve su entrada de "en cola" a CHANGELOG.md
- Cualquier nuevo backlog item se agrega aquí
- Update por commit en cada cierre de sprint
