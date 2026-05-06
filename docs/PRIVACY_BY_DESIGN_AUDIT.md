# Privacy by Design Audit
**Versión**: 1.0 · 2026-05-06
**Auditor**: Joaquín Muñoz · TLP

## Los 7 principios (GDPR Art. 25 / Ann Cavoukian)

### 1. Proactivo, no reactivo
- ✅ Privacy considerada en diseño desde el inicio (no parche)
- ✅ DPIA realizado antes de scaling (DPIA_2026.md)
- ✅ Audit log estructurado en backend desde Sprint 32

### 2. Privacidad por defecto
- ✅ Cero cookies de marketing/tracking
- ✅ Cero analytics terceros
- ✅ Cédula es OPCIONAL (no requerida)
- ✅ Datos almacenados en cuenta institucional TLP, no en proveedores genéricos

### 3. Privacidad embebida en el diseño
- ✅ OAuth con dominio restriction (no cuentas externas)
- ✅ Allowlist explícita de docentes (ALLOWED_TEACHERS)
- ✅ Backend solo expone /admin/* tras auth
- ✅ JSON export en formato propio (data portability nativa)

### 4. Funcionalidad completa — win/win
- ✅ Privacidad NO sacrifica funcionalidad: todas las features funcionan sin tracking
- ✅ Backups redundantes NO requieren reducir privacidad

### 5. Seguridad end-to-end durante todo el lifecycle
- ✅ TLS in transit (HTTPS only, HSTS preload apex)
- ✅ Encryption at rest (GCP AES-256 default)
- ✅ Datos in-flight a sub-procesadores con DPAs
- ✅ Audit log de cada acceso /admin/*
- ⚠️ Pendiente: encryption client-side adicional (overkill para esta escala)

### 6. Visibilidad y transparencia
- ✅ Privacy policy publicada (`/privacy/`)
- ✅ Terms publicados (`/terms/`)
- ✅ Sub-procesadores listados (SUBPROCESSORS.md)
- ✅ DPA registry (DPA_REGISTRY.md)
- ✅ Sitemap auto-actualizable
- ✅ Source code abierto (excepto entregas privadas)

### 7. Respeto por la privacidad del usuario — user-centric
- ✅ DSAR procedure documentado y operacional
- ✅ Right to erasure ejecutable (manual, ≤7 días)
- ✅ Right to access via JSON export
- ⚠️ Endpoint /data-export pendiente (Sprint 37)
- ✅ Email contacto visible y monitoreado

## Áreas de mejora (gaps identificados)

### Auto-anonymize después de retention period
**Estado**: pendiente
**Plan**: Sprint 38 — script que detecta entregas > 2 años y anonimiza nombres + cédula, manteniendo respuestas para análisis agregado

### Endpoint público de data-export
**Estado**: pendiente
**Plan**: Sprint 37 — endpoint `GET /data-export?email=...&token=...` que el usuario puede usar self-service

### Cookie consent banner
**Estado**: no aplicable (no usamos cookies)
**Mitigación**: notice explícita en privacy/

### Children's Privacy banner
**Estado**: parcial
**Plan**: agregar banner discreto en home indicando que el servicio es para uso institucional TLP

### Differential privacy en analytics
**Estado**: no aplicable (no hacemos analytics)

## Frecuencia de re-audit

- **Ad-hoc**: ante cualquier cambio material de procesamiento
- **Anual**: review completo
- **Próxima fecha**: 2027-05-06

## Conclusión

evaluacosas cumple con **5/7 principios fully**, **2/7 partially** (gaps menores documentados con plan). Es un sistema **privacy-first by construction**, no por compliance reactivo.

## Referencias
- [DPIA_2026.md](./DPIA_2026.md)
- [DPA_REGISTRY.md](./DPA_REGISTRY.md)
- [DSAR_PROCEDURE.md](./DSAR_PROCEDURE.md)
- [SUBPROCESSORS.md](./SUBPROCESSORS.md)
