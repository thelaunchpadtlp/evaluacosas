# Plan de integración con Registro Civil del TSE de Costa Rica

## Estado actual (2026-05-06)

**Implementado**: campo de cédula en el formulario del estudiante con botón "Buscar en TSE" que llama a `apis.gometa.org/cedulas/<cedula>` (API comunitaria gratuita) con fallback robusto a entrada manual de los 4 campos del nombre.

**Pendiente**: upgrade a un proveedor con SLA cuando el volumen lo justifique.

## Por qué no hay API oficial directa del TSE

El TSE de Costa Rica **no expone una API REST oficial pública** para consultas individuales. La información del Registro Civil se distribuye principalmente como:
- **Padrón Electoral descargable** (snapshot bulk, actualizaciones periódicas) en https://www.tse.go.cr/padron_electoral.htm
- Convenios institucionales bilaterales con bancos, gobierno y otras entidades autorizadas

Para apps externas, el mercado ha generado intermediarios privados que reexponen estos datos vía APIs comerciales.

## Opciones evaluadas

| Proveedor | Tipo | Costo | Endpoint sugerido | Notas |
|-----------|------|-------|-------------------|-------|
| **gometa.org** | Comunitario gratuito | $0 | `https://apis.gometa.org/cedulas/<cedula>` | Sin SLA. Confiable pero puede caer. **Default actual.** |
| **Verifik** | Comercial | Por consumo | `https://api.verifik.co/v2/cr/identity/<cedula>` | Cobertura múltiple LATAM. Auth con API key. |
| **ApifyConnect TSE** | Comercial | Por consumo | API personalizada | Foco específico Costa Rica. |
| **Neodatos / Credid.net** | Comercial | Por consumo + buró de crédito | Variable | Combina TSE + buró. Útil para evaluación financiera, no para uso académico TLP. |
| **API UCA** | Académica/independiente | Variable | Consulta por cédula | Mantenimiento variable. |
| **Padrón Electoral local** | Self-hosted | $0 (mantenimiento) | Descargar CSV, indexar en Cloud SQL/Firestore | Máximo control pero require updates periódicos. |

## Arquitectura propuesta para el upgrade

Cuando se decida el upgrade, sustituir la llamada directa del frontend por un endpoint del backend que actúa como proxy + caché:

```
[Frontend] ─POST /api/cedula─> [Cloud Run /cedula]
                                    ├─> Cache Firestore (24h)
                                    ├─> Proveedor primario (Verifik o Apify)
                                    └─> Fallback gometa.org si primario falla
```

### Beneficios del proxy backend
1. **Una sola API key** centralizada en Secret Manager (no expuesta al frontend).
2. **Cache** de 24h por cédula → reduce costo y tiempo de respuesta.
3. **Multi-proveedor** con failover automático.
4. **Rate limiting** por sesión / IP / email.
5. **Audit log** de cada consulta (compliance + debugging).
6. **Protección contra scraping** del padrón.

### Schema de respuesta normalizada
```json
{
  "ok": true,
  "cedula": "123456789",
  "firstName": "...",
  "secondName": "...",
  "firstSurname": "...",
  "secondSurname": "...",
  "fullName": "...",
  "source": "verifik|gometa|cache",
  "cachedAt": "ISO",
  "consentNote": "Consulta a Padrón Electoral público para validación académica TLP."
}
```

## Política de privacidad y consentimiento

Antes de cualquier consulta TSE, el estudiante debe:
1. **Ver explícitamente** que su cédula se va a consultar contra el Padrón Electoral.
2. **Consentir** con un click (botón "Buscar en TSE" — ya implementado).
3. Solo se almacenan los nombres derivados, **no la cédula** persistente en analytics públicas.

La cédula se guarda solo en el campo `student.id` del JSON de la entrega, accesible al docente pero no expuesto públicamente.

## Criterios para hacer el upgrade

Considerar mover de gometa.org a un proveedor con SLA cuando:
- Más de **100 entregas/mes**
- Reportes de fallos del lookup gometa
- Disputa académica donde se necesite trazabilidad cripto-firmada del lookup
- Requerimiento institucional MEP/Workspace de proveedor verificado

## Personas con datos verificados manualmente (2026-05-06)

Hasta el upgrade, el array `tlpStudents` contiene los datos compartidos directamente por el usuario:

| Email | Nombre completo |
|-------|-----------------|
| joaquin.munoz@... | Joaquín Antonio Muñoz Ortiz |
| anyssa.salazar@... | Anyssa Salazar O'Donnell |
| josejoaquin.ortiz@... | Jose Joaquín Ortiz Cordero |
| mariajose.ortiz@... | María José Ortiz Echeverría |
| maripaz.ortiz@... | María Paz Ortiz Echeverría |
| sebastian.villalobos@... | Sebastián Villalobos Chacón |
| marisol.ortiz@... | Marisol Ortiz Echeverría |
| carlosenrique.ortiz@... | Carlos Enrique Ortiz Cordero |
| julieta.chan@... | Julieta Chan Blanco |
| marcela.rojas@... | Marcela Rojas |
| lorna.martinez@... | Lorna Martínez Aguilar |
| diego.escalante@... | Diego Escalante Madrigal |

## Acciones inmediatas (sin costo)

Ninguna requerida. El campo TSE actual (`apis.gometa.org`) es opcional y los 12 estudiantes predefinidos ya tienen sus 4 campos auto-fill al elegirse desde el dropdown.
