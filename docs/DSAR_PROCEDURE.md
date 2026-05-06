# DSAR — Data Subject Access Request Procedure
**Versión**: 1.0 · 2026-05-06

## Qué es un DSAR

Un Data Subject Access Request es un pedido formal de un sujeto de datos (estudiante, docente) ejerciendo sus derechos:
- Acceso (Art. 15 GDPR / Art. 7 Ley 8968 CR)
- Rectificación (Art. 16 GDPR)
- Borrado (Art. 17 GDPR)
- Portabilidad (Art. 20 GDPR)
- Limitación (Art. 18 GDPR)
- Oposición (Art. 21 GDPR)

## Cómo enviar un DSAR

**Email**: `joaquin.munoz@thelaunchpadtlp.education`
**Asunto**: `[DSAR] <derecho> · <tu nombre>`
**Cuerpo** debe incluir:
- Tu nombre completo
- Email institucional (o cédula si no tenés email)
- Derecho que ejercés (acceso / borrado / etc.)
- Motivo (opcional)

## Procesamiento

### Plazos
- Acuse de recibo: ≤24h hábiles
- Verificación de identidad: ≤7 días
- Resolución: ≤30 días (máximo legal)
- Caso complejo: hasta 2 meses con notificación

### Verificación de identidad
1. El email debe coincidir con el de la entrega/cuenta
2. Si no, pedimos prueba (cédula scan, comunicación institucional)
3. NO ejecutamos DSARs sin identificación

### Resolución por tipo

**Acceso (Art. 15)**:
- Generamos export JSON con todos los datos asociados al sujeto
- Entregamos via email cifrado o handoff presencial
- Incluye: entregas, calificaciones, audit log relevante, sub-procesadores

**Rectificación (Art. 16)**:
- Corregimos en los 5 sinks
- Notificamos cuando esté completo

**Borrado (Art. 17)**:
- Eliminamos en los 5 sinks
- Excepción: registros académicos legalmente requeridos por MEP CR (~5 años post-curso)
- Anonimizamos en lugar de borrar si requiere retención legal

**Portabilidad (Art. 20)**:
- JSON estructurado machine-readable
- Mismos datos que "Acceso" pero con schema documentado

**Limitación (Art. 18)**:
- Marcamos los datos como "frozen" — no se procesan más, pero no se borran
- Útil mientras se resuelve una disputa

**Oposición (Art. 21)**:
- Pausamos cualquier nuevo processing
- Si el processing es necesario para cumplimiento de contrato (matrícula), explicamos legal basis y referimos a Anexo A del contrato

## Excepciones legítimas para denegar

Por GDPR Art. 12(5) y Ley 8968 CR Art. 11:
- Solicitud manifiestamente infundada o excesiva (DSARs reincidentes idénticos)
- Imposible verificar identidad
- Cumplimiento legal de retención (registros académicos MEP)

## Registro interno

Cada DSAR se registra (sin datos personales) en `docs/DSAR_LOG.md`:
- Fecha de recepción
- Tipo
- Resultado (atendido / denegado con justificación)
- Plazo de respuesta efectivo

## Apelación

Si no estás conforme con la resolución:
- Apelar a: dirección de Centro Educativo GEA
- O acudir a PRODHAB Costa Rica: https://www.prodhab.go.cr/

## Métricas

- DSAR recibidos / mes (target: < 5)
- Tiempo medio de respuesta (target: < 14 días)
- Tasa de denegaciones legítimas (target: < 5%)
