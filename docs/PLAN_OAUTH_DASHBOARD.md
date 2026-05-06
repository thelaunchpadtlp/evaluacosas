# Plan exhaustivo — OAuth Client ID para dashboard del docente
**Fecha**: 2026-05-06
**Sprint**: 18
**Pensamiento**: systems + complex systems
**Filosofía**: investigar → planear → simular → ejecutar → verificar → operar

---

## 0. Contexto verificado (snapshot)

| Variable | Valor |
|---|---|
| Proyecto GCP | `thelaunchpadtlplabsuniverse` (#441768184201) |
| Organization | `thelaunchpadtlp.education` (ID 5021746943, customer `C02fuc8hm`) |
| Cuenta activa | `joaquin.munoz@thelaunchpadtlp.education` (Workspace owner) |
| OAuth clients existentes en proyecto | 0 (verificado con `gcloud iam oauth-clients list`) |
| Backend Cloud Run | `evaluacosas-submit-handler` rev `00010-rs5`, status `ok`, todos sinks `enabled` |
| Frontend dashboard | https://evaluacosas.thelaunchpadtlp.education/dashboard/ → HTTP 200 |
| Dominio verificado | `thelaunchpadtlp.education` (Workspace) |
| Subdominios DNS | apex, `www`, `evaluacosas`, `www.evaluacosas` con HTTPS y redirects |

## 1. Mapa del sistema (complex systems)

```
┌──────────────────────────────────────────────────────────────────┐
│                  USUARIO DOCENTE (Workspace)                     │
│              joaquin.munoz@thelaunchpadtlp.education             │
└───────────────────┬──────────────────────────────────────────────┘
                    │ navega a
                    ▼
┌──────────────────────────────────────────────────────────────────┐
│   FRONTEND  evaluacosas.thelaunchpadtlp.education/dashboard/     │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  1. Carga config.json → CLIENT_ID                        │  │
│   │  2. Carga GIS https://accounts.google.com/gsi/client     │  │
│   │  3. google.accounts.id.initialize({client_id, hd})       │  │
│   │  4. Renderiza botón Sign-In                              │  │
│   │  5. Recibe ID token (JWT) firmado por Google             │  │
│   │  6. Token client OAuth2 → access_token Gemini (opcional) │  │
│   │  7. Fetch /admin/* con Authorization: Bearer <id_token>  │  │
│   └──────────────────────────────────────────────────────────┘  │
└───────────────────┬──────────────────────────────────────────────┘
                    │ HTTPS + JWT en header
                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND  Cloud Run evaluacosas-submit-handler                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ requireAdmin middleware:                                  │   │
│  │  - OAuth2Client.verifyIdToken({audience: CLIENT_ID})      │   │
│  │  - Verifica payload.hd === 'thelaunchpadtlp.education'    │   │
│  │  - Verifica payload.email_verified === true               │   │
│  │  - Verifica payload.email ∈ ALLOWED_TEACHERS              │   │
│  │  - Adjunta req.admin = { email, sub, name, iat, exp }     │   │
│  │ Endpoints protegidos:                                     │   │
│  │  /admin/whoami, /admin/submits, /admin/submit/:docId,     │   │
│  │  /admin/grade/:docId                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────┬──────────────────────────────────────────────┘
                    │ lee Firestore, llama Gemini, etc.
                    ▼
┌──────────────────────────────────────────────────────────────────┐
│  DEPENDENCIAS  Firestore · GCS · GitHub · Supabase · Linear      │
│                Gemini API (free tier OR OAuth Workspace)         │
└──────────────────────────────────────────────────────────────────┘
```

### Flujos críticos
- **Flujo A** — Login: Frontend → GIS popup → Google → ID token → Backend verify → JSON con submits
- **Flujo B** — Re-grade: Frontend → token client → Google OAuth → access_token → POST /admin/grade con header X-Gemini-Access-Token → Backend llama Gemini con OAuth Bearer
- **Flujo C** — Logout: Frontend → google.accounts.id.disableAutoSelect() + clear localStorage

### Modos de falla (FMEA — Failure Mode and Effects Analysis)
| Modo | Causa | Efecto | Severidad | Mitigación |
|---|---|---|---|---|
| ID token expirado | TTL 1h | 401 al llamar /admin/* | Media | Re-login automático |
| ID token con `aud` distinto | Cliente ID mismatch (env mismatch) | 401 | Alta | Documentar CLIENT_ID en config.json + meta tag + check |
| `hd` claim faltante | Cuenta personal Gmail intentó login | 403 | Alta | Backend rechaza, frontend hd hint |
| `email_verified=false` | Estado anómalo | 403 | Baja | Backend rechaza explicit |
| Email no en allowlist | Estudiante o externo logró login | 403 | Alta | ALLOWED_TEACHERS env var en Cloud Run |
| GIS library bloqueada | Adblock, CSP, network | UI sin botón | Media | Detectar carga, fallback con instrucción |
| Token client falla | Usuario rechaza scope generative-language | /admin/grade sin oauth | Baja | Fallback API key project (free tier) |
| Browser bloquea third-party cookies | Safari ITP, Firefox Strict | One Tap no funciona | Media | Botón explicit, no One Tap |
| Cliente ID filtrado | Si fuera secret (no lo es) | N/A | Nula | OAuth client_id es público por diseño |
| CSRF en endpoints | Falta Origin/Referer check | Hipótetico | Baja | ID token en Authorization no en cookie → CSRF inmune |
| Replay de ID token | Token robado | Acceso por hasta 1h | Media | TLS only, no log de tokens |
| MITM | TLS strip | Token interceptado | Baja | HSTS Preload, TLS 1.3 |
| Crash backend | OOM, timeout | Dashboard vacío | Media | Cloud Run min-instances=0, 512Mi ya |
| Cuota Gemini agotada | >1500 req/día | Auto-grade falla | Baja | Fallback OAuth Workspace |
| Domain hijack | Comprometer Cloudflare | Catastrófico | Alta | 2FA + audit log |

## 2. Decisiones de arquitectura (con justificación)

### 2.1 Tipo de OAuth Client
- **Decisión**: `Web application`
- **Alternativas descartadas**: Desktop (no aplica), Android/iOS (no es app nativa), TVs/Limited Input (no aplica)
- **Justificación**: dashboard es SPA en navegador

### 2.2 Tipo de OAuth Consent Screen
- **Decisión**: `Internal`
- **Alternativas descartadas**: External (requeriría verificación si pasa de testing, expone más superficie)
- **Justificación**:
  - Toda la cuenta docente y estudiantes son del Workspace `thelaunchpadtlp.education`
  - `Internal` limita usuarios al Workspace → seguridad por construcción
  - `Internal` no requiere proceso de verificación de Google
  - `Internal` no tiene límite de 100 testing users
  - `Internal` no requiere logo en formato específico ni privacy URL pública
  - Cualquier estudiante o docente del Workspace puede usar la app sin friction adicional

### 2.3 Estrategia de identificación
- **Decisión**: ID token (JWT) verificado server-side con `google-auth-library`
- **Alternativas descartadas**: cookies de sesión (overkill), session storage en backend (Firestore session = costo + complejidad)
- **Justificación**: stateless, escala automático con Cloud Run, no requiere base de datos de sesiones

### 2.4 Estrategia de autorización (allowlist de docentes)
- **Decisión**: env var `ALLOWED_TEACHERS` en Cloud Run con lista de emails separados por coma. Inicialmente: `joaquin.munoz@thelaunchpadtlp.education`
- **Alternativas descartadas**:
  - "Cualquiera del Workspace": permitiría a estudiantes ver entregas (privacidad ❌)
  - Grupo de Workspace `docentes@`: requiere Admin SDK + service account con domain-wide delegation (complejidad ❌, por ahora)
  - Hardcoded en código: dificulta agregar profesores (mantenibilidad ❌)
- **Justificación**: simple, audit-friendly, fácil agregar profesores rotando env var sin redeploy de código (Cloud Run nuevo revision sí pero sin git change)

### 2.5 Scopes solicitados
| Scope | Para qué | Cuándo |
|---|---|---|
| `openid` | OIDC ID token | Login (siempre) |
| `email` | Email del docente | Login (siempre) |
| `profile` | Nombre, foto | Login (siempre) |
| `https://www.googleapis.com/auth/cloud-platform` | Llamar Gemini con cuota Workspace del docente | Solo si docente activa "re-graduar con mi cuenta" |

**Decisión**: scopes mínimos necesarios. NO pedir `cloud-platform` por default (aumenta friction en consent). Pedirlo solo cuando el docente activa el botón.

### 2.6 Authorized JavaScript origins
Lista de origins (todos los orígenes desde donde se llamará GIS):
1. `https://evaluacosas.thelaunchpadtlp.education`
2. `https://www.evaluacosas.thelaunchpadtlp.education`
3. `https://thelaunchpadtlp.education`
4. `https://www.thelaunchpadtlp.education`
5. `http://localhost:8080` (dev)
6. `http://localhost:3000` (dev)
7. `http://localhost:5173` (dev — Vite default)
8. `http://127.0.0.1:8080` (dev)

**Justificación**: el dashboard es accesible desde el subdominio Y desde el path `/evaluacosas/dashboard/` del apex (porque hay redirect Cloudflare). Todos los origins que sirven el HTML deben estar autorizados o GIS rechaza.

### 2.7 Authorized redirect URIs
**Decisión**: NINGUNA inicialmente.
- GIS popup mode no requiere redirect URI
- Token client popup mode tampoco
- Si en el futuro hacemos server-side OAuth flow (Apps Script, Classroom Sync), agregamos en su momento

### 2.8 Token storage en frontend
- **ID token**: solo en memoria (closure variable). NO en localStorage, NO en sessionStorage, NO en cookie.
- **Justificación**: minimiza ventana de exfiltración por XSS. El precio es que recargar la pestaña requiere re-login (acceptable para dashboard de uso esporádico).
- **Refresh**: GIS no expone refresh tokens en flujo cliente → re-login cuando expira (1h)

### 2.9 CORS en backend
Endpoints `/admin/*` deben aceptar requests con `Authorization` header desde los origins autorizados:
- Allowed origins: lista exacta (NO `*`)
- Allowed methods: `GET, POST, OPTIONS`
- Allowed headers: `Authorization, Content-Type, X-Gemini-Access-Token`
- Credentials: false (no usamos cookies)
- Max-age: 3600

## 3. Procedimiento operacional (paso a paso, ejecución humana asistida)

### Paso 1 — Configurar OAuth Consent Screen (una sola vez)
1. Abrir https://console.cloud.google.com/auth/branding?project=thelaunchpadtlplabsuniverse
2. Si pregunta tipo: elegir **Internal**
3. Completar:
   - **App name**: `evaluacosas TLP — Dashboard del docente`
   - **User support email**: `joaquin.munoz@thelaunchpadtlp.education`
   - **App logo** (opcional): subir si hay (recomendado 120x120 PNG)
   - **App domain**:
     - Application home page: `https://evaluacosas.thelaunchpadtlp.education/`
     - Application privacy policy: `https://evaluacosas.thelaunchpadtlp.education/privacy/`
     - Application terms of service: `https://evaluacosas.thelaunchpadtlp.education/terms/`
   - **Authorized domains**: `thelaunchpadtlp.education`
   - **Developer contact information**: `joaquin.munoz@thelaunchpadtlp.education`
4. **Scopes** → Add or remove scopes:
   - `openid`
   - `…/auth/userinfo.email`
   - `…/auth/userinfo.profile`
   - (cloud-platform se agregará en sprint posterior cuando habilitemos OAuth Gemini)
5. Save and continue.

### Paso 2 — Crear OAuth Client ID
1. Abrir https://console.cloud.google.com/auth/clients?project=thelaunchpadtlplabsuniverse
2. **+ Create Client**
3. Application type: **Web application**
4. Name: `evaluacosas-dashboard-web`
5. Authorized JavaScript origins: pegar los 8 origins listados en 2.6
6. Authorized redirect URIs: dejar vacío
7. Create
8. **Copiar el Client ID** (formato `441768184201-xxxxxx.apps.googleusercontent.com`)
9. (No copiar el client secret — para SPA no se usa)

### Paso 3 — Configurar el frontend
1. Editar `/Users/PIQUI/Code/evaluacosas/dashboard/config.json`:
   ```json
   {
     "googleClientId": "441768184201-XXXX.apps.googleusercontent.com",
     "backendUrl": "https://evaluacosas-submit-handler-441768184201.us-central1.run.app",
     "allowedDomain": "thelaunchpadtlp.education"
   }
   ```
2. Verificar que `dashboard/index.html` tiene `<meta name="google-signin-client_id" content="...">` también (fallback)
3. Commit + push → GitHub Pages deploy

### Paso 4 — Configurar el backend
1. Setear env var `OAUTH_CLIENT_ID` en Cloud Run:
   ```bash
   gcloud run services update evaluacosas-submit-handler \
     --region us-central1 \
     --project thelaunchpadtlplabsuniverse \
     --update-env-vars OAUTH_CLIENT_ID=441768184201-XXXX.apps.googleusercontent.com,ALLOWED_TEACHERS=joaquin.munoz@thelaunchpadtlp.education,ALLOWED_DOMAIN=thelaunchpadtlp.education
   ```
2. Verificar /health responde y `/admin/whoami` ya no devuelve 503

### Paso 5 — Smoke test E2E
1. Abrir incógnito Chrome → https://evaluacosas.thelaunchpadtlp.education/dashboard/
2. Click Sign-In → popup → elegir cuenta `joaquin.munoz@`
3. Verificar tabla de submits carga
4. Click una entrega → modal con payload
5. Cerrar pestaña → reabrir → verificar que pide login otra vez (token solo en memoria)

## 4. Sistema de pruebas (QA con 100+ criterios)

### 4.1 Funcional — Login (12 criterios)
- [ ] F-1: Botón Sign-In aparece al cargar dashboard sin sesión
- [ ] F-2: Click abre popup Google
- [ ] F-3: Popup pre-filtra cuentas `@thelaunchpadtlp.education` cuando hd hint funciona
- [ ] F-4: Login exitoso oculta botón y muestra UI del dashboard
- [ ] F-5: Login exitoso muestra nombre + email del docente arriba
- [ ] F-6: Recargar pestaña pide login otra vez (token en memoria)
- [ ] F-7: Logout limpia UI y muestra botón de nuevo
- [ ] F-8: Intentar login con cuenta personal Gmail → frontend rechaza con mensaje claro
- [ ] F-9: Cancelar popup deja UI estable (no error visible)
- [ ] F-10: Login funciona en pestaña incógnita
- [ ] F-11: Login persiste durante una sesión de uso normal (≥30min sin re-login)
- [ ] F-12: Después de 1h sin actividad, próxima request devuelve 401 → frontend re-login

### 4.2 Funcional — Listado de submits (10 criterios)
- [ ] L-1: GET /admin/submits con token válido → 200 + array
- [ ] L-2: Tabla muestra: timestamp, estudiante, examen, score pre-grade, sinks status
- [ ] L-3: Tabla ordenable por columna (al menos timestamp, score)
- [ ] L-4: Búsqueda por nombre/email/cédula filtra
- [ ] L-5: Paginación si >50 submits (no carga 1000 en una vez)
- [ ] L-6: Refresh button recarga lista
- [ ] L-7: Empty state si no hay submits ("Aún no hay entregas")
- [ ] L-8: Loading skeleton durante fetch
- [ ] L-9: Error state si backend caído (con retry button)
- [ ] L-10: Lista incluye solo entregas del backend (no del estudiante local)

### 4.3 Funcional — Detalle de submit (8 criterios)
- [ ] D-1: Click row abre modal o panel con payload completo
- [ ] D-2: Modal muestra todas las respuestas
- [ ] D-3: Modal muestra los criterios MEP por ítem
- [ ] D-4: Modal muestra pre-calificación heurística
- [ ] D-5: Modal muestra calificación Gemini si existe
- [ ] D-6: Botón "Descargar JSON" funcional
- [ ] D-7: Botón "Re-graduar con Gemini" disparable
- [ ] D-8: Esc cierra modal

### 4.4 Funcional — Re-grade (6 criterios)
- [ ] R-1: Click "Re-graduar" pide token client OAuth scope cloud-platform
- [ ] R-2: Si docente acepta, llama POST /admin/grade/:docId con X-Gemini-Access-Token
- [ ] R-3: Si docente rechaza, fallback usa API key del proyecto (con warning)
- [ ] R-4: Backend persiste grade en Firestore grades/<docId>
- [ ] R-5: Linear comment se postea con la calificación
- [ ] R-6: UI muestra el grade tras éxito

### 4.5 Security — Authentication (15 criterios)
- [ ] S-1: Backend rechaza request sin Authorization header → 401
- [ ] S-2: Backend rechaza Bearer no-JWT → 401
- [ ] S-3: Backend rechaza JWT firmado por otra entidad → 401
- [ ] S-4: Backend rechaza JWT con `aud` ≠ CLIENT_ID → 401
- [ ] S-5: Backend rechaza JWT con `iss` ≠ accounts.google.com → 401
- [ ] S-6: Backend rechaza JWT expirado → 401
- [ ] S-7: Backend rechaza JWT con `email_verified=false` → 403
- [ ] S-8: Backend rechaza JWT con `hd` ≠ ALLOWED_DOMAIN → 403
- [ ] S-9: Backend rechaza email no en ALLOWED_TEACHERS → 403
- [ ] S-10: Mismatch CLIENT_ID frontend vs backend → 401 con mensaje claro
- [ ] S-11: Token enviado en query string es ignorado (solo header)
- [ ] S-12: No hay log de tokens en stdout/stderr/Cloud Logging
- [ ] S-13: TLS 1.2+ obligatorio (HSTS preload)
- [ ] S-14: Cloud Run sirve solo HTTPS (HTTP redirect)
- [ ] S-15: Cookies no usadas → CSRF inherent inmune

### 4.6 Security — Authorization (10 criterios)
- [ ] A-1: Estudiante (no en ALLOWED_TEACHERS) logueado → 403 al pedir /admin/submits
- [ ] A-2: Mensaje 403 no revela ALLOWED_TEACHERS a usuarios no autorizados
- [ ] A-3: Audit log en Cloud Logging cada acceso /admin/* con email + IP + endpoint
- [ ] A-4: Rate limit de 100 req/min por IP en /admin/* (anti-abuso)
- [ ] A-5: Rate limit de 1000 req/día por email (anti-scraping)
- [ ] A-6: /admin/grade tiene rate limit más estricto: 50/día por email (Gemini cuota)
- [ ] A-7: docId no enumerable: solo accesible si está en lista del usuario
- [ ] A-8: PII en logs sanitized (email truncado en logs no críticos)
- [ ] A-9: Borrado de cuenta del docente → ALLOWED_TEACHERS update procedure documented
- [ ] A-10: Workspace policy alignment: solo IPs corporativas (futuro, no MVP)

### 4.7 Security — Frontend (8 criterios)
- [ ] FS-1: CSP header en index.html restringe sources (script-src 'self' accounts.google.com)
- [ ] FS-2: SRI en GIS script (si Google publica integrity)
- [ ] FS-3: No hay innerHTML con user input (XSS-proof)
- [ ] FS-4: localStorage no contiene tokens
- [ ] FS-5: sessionStorage no contiene tokens
- [ ] FS-6: Cookies no contienen tokens
- [ ] FS-7: console.log de payloads NO en producción
- [ ] FS-8: Errores muestran mensaje user-friendly, no stack traces

### 4.8 Privacy + GDPR/MEP compliance (10 criterios)
- [ ] P-1: Privacy policy publicada en /privacy/ (link desde consent screen)
- [ ] P-2: Política aclara: solo docentes ven entregas
- [ ] P-3: Política aclara: datos en GCP us-central1 + Supabase + Linear
- [ ] P-4: Política aclara: retención (¿1 año? ¿2?)
- [ ] P-5: Estudiante puede pedir borrado de su entrega (procedure documentado)
- [ ] P-6: Logs no contienen datos sensibles más allá de email del docente
- [ ] P-7: No hay tracking de terceros (Google Analytics, etc.)
- [ ] P-8: Cookies de Google Sign-In son first-party (accounts.google.com)
- [ ] P-9: Confirmación de consentimiento del estudiante para almacenar respuestas
- [ ] P-10: Disposición de datos al cerrar curso documentada

### 4.9 Cross-browser + cross-device (15 criterios)
- [ ] B-1: Chrome 120+ macOS — login + listado funciona
- [ ] B-2: Safari 17+ macOS — login + listado funciona
- [ ] B-3: Firefox 120+ macOS — login + listado funciona (con cookies third-party)
- [ ] B-4: Edge 120+ — funciona
- [ ] B-5: Chrome iOS — funciona
- [ ] B-6: Safari iOS — funciona
- [ ] B-7: Chrome Android — funciona
- [ ] B-8: iPad Safari — funciona
- [ ] B-9: iPhone landscape — UI no rota
- [ ] B-10: Tablet portrait — UI legible
- [ ] B-11: 320px width — UI usable (mínimo)
- [ ] B-12: 4K display — UI escala
- [ ] B-13: Modo oscuro respeta tokens
- [ ] B-14: Modo claro (si user prefiere) legible
- [ ] B-15: Print stylesheet razonable (al menos sin overflow)

### 4.10 Performance (12 criterios)
- [ ] PR-1: Time to first byte (TTFB) <500ms para HTML
- [ ] PR-2: Largest Contentful Paint (LCP) <2s
- [ ] PR-3: First Input Delay (FID) <100ms
- [ ] PR-4: Cumulative Layout Shift (CLS) <0.1
- [ ] PR-5: GIS script lazy-loaded (no bloquea render)
- [ ] PR-6: Fetch /admin/submits <1s con 100 entregas
- [ ] PR-7: Fetch /admin/submits <3s con 1000 entregas
- [ ] PR-8: No memory leak con uso prolongado (1h)
- [ ] PR-9: Bundle JS <100KB compressed
- [ ] PR-10: Cold start Cloud Run <3s
- [ ] PR-11: Warm Cloud Run response <200ms
- [ ] PR-12: Gemini grading <30s p95

### 4.11 Accessibility — WCAG 2.1 AA (15 criterios)
- [ ] AC-1: Botón Sign-In tiene aria-label
- [ ] AC-2: Modal cierra con Esc
- [ ] AC-3: Focus trap en modal
- [ ] AC-4: Tab order lógico
- [ ] AC-5: Contraste color ≥4.5:1 texto
- [ ] AC-6: Contraste ≥3:1 elementos UI grandes
- [ ] AC-7: Tabla con thead/tbody y scope="col"
- [ ] AC-8: Botones con texto visible o aria-label
- [ ] AC-9: Error messages anunciados a screen reader (aria-live)
- [ ] AC-10: Links con texto descriptivo (no "click aquí")
- [ ] AC-11: Imágenes con alt
- [ ] AC-12: Skip-to-content link
- [ ] AC-13: Lang declarado en html
- [ ] AC-14: Heading hierarchy (h1 → h2 → h3)
- [ ] AC-15: Fieldsets/legends en formularios

### 4.12 Idempotency + concurrency (8 criterios)
- [ ] I-1: Doble click Sign-In no crea dos sesiones
- [ ] I-2: Doble click Refresh no duplica request
- [ ] I-3: Re-graduar la misma entrega 2x no crea 2 documentos en grades/ (upsert)
- [ ] I-4: Concurrent fetches no causan race conditions
- [ ] I-5: Network blip durante grading no deja entrega en estado inconsistente
- [ ] I-6: Refrescar mientras carga no rompe state
- [ ] I-7: Backend tolera ID token reusado dentro de TTL
- [ ] I-8: Logout durante request en curso no causa error visible

### 4.13 Error handling + observabilidad (12 criterios)
- [ ] E-1: 401 → frontend muestra "Tu sesión expiró, volvé a entrar" + botón
- [ ] E-2: 403 → "No tenés permisos. Contactá joaquin.munoz@…"
- [ ] E-3: 429 → "Demasiadas solicitudes, esperá un momento"
- [ ] E-4: 500 → "Error del servidor. Reportá si persiste."
- [ ] E-5: Network error → "Sin conexión. Reintentando…"
- [ ] E-6: Timeout → "El servidor tardó demasiado"
- [ ] E-7: Cloud Logging captura cada error backend con stack
- [ ] E-8: Métrica `admin_request_count` por endpoint
- [ ] E-9: Métrica `admin_auth_failures` con label de motivo
- [ ] E-10: Alerta si auth_failures >100/h
- [ ] E-11: Alerta si admin_5xx >5/min
- [ ] E-12: Sentry/Cloud Error Reporting wired para frontend

### 4.14 Disaster recovery + rollback (8 criterios)
- [ ] DR-1: Si CLIENT_ID se compromete: rotación documentada (crear nuevo, actualizar config, deploy)
- [ ] DR-2: Si OAuth screen se borra: backup de config en docs/OAUTH_CONSENT_BACKUP.md
- [ ] DR-3: Cloud Run rev anterior reachable con `gcloud run services update-traffic`
- [ ] DR-4: GitHub Pages rollback con git revert (siempre disponible)
- [ ] DR-5: Firestore daily export configurado (gs://… cada 24h)
- [ ] DR-6: GCS lifecycle policy para retención
- [ ] DR-7: Procedimiento de recover documentado paso a paso
- [ ] DR-8: RTO (recovery time objective) ≤4h establecido

### 4.15 Documentation (8 criterios)
- [ ] DC-1: Plan exhaustivo en docs/PLAN_OAUTH_DASHBOARD.md (este archivo)
- [ ] DC-2: README dashboard actualizado con setup
- [ ] DC-3: Permission ledger registra OAuth client creation
- [ ] DC-4: Anti-conflict guarantees actualizadas
- [ ] DC-5: Privacy policy en /privacy/
- [ ] DC-6: Terms en /terms/
- [ ] DC-7: Diagrama de arquitectura
- [ ] DC-8: Runbook para "agregar nuevo docente"

### 4.16 Cost (5 criterios)
- [ ] C-1: OAuth gratuito (sin costo)
- [ ] C-2: Verificación gratis (Internal type)
- [ ] C-3: Cloud Run requests dentro de free tier
- [ ] C-4: Firestore reads dentro de free tier (50k/día)
- [ ] C-5: Logging dentro de free tier (50GB/mes)

**Total: 162 criterios numerados**

## 5. Simulaciones (mental + automated dry-run)

### Simulación 1 — Happy path
1. Joaquín abre `/dashboard/`. Frontend carga config.json. CLIENT_ID es `441768184201-abc123.apps.googleusercontent.com`.
2. GIS library carga. Botón Sign-In aparece.
3. Click → popup → Google muestra `joaquin.munoz@` (única cuenta del Workspace en este browser).
4. Click → popup cierra. Frontend recibe credential (JWT).
5. Frontend hace `fetch('/admin/whoami', {Authorization: 'Bearer ' + jwt})`.
6. Backend verifica:
   - `audience` = client_id ✓
   - `iss` = `accounts.google.com` ✓
   - `email_verified` = true ✓
   - `hd` = `thelaunchpadtlp.education` ✓
   - email ∈ `ALLOWED_TEACHERS` ✓
   - exp > now ✓
7. Backend devuelve `{email: 'joaquin.munoz@…', name: 'Joaquín Muñoz', ...}`.
8. Frontend muestra nombre + tabla.
9. Frontend hace `fetch('/admin/submits', ...)`. Backend devuelve 12 entregas.
10. Joaquín hace click en una. Modal abre.
11. Joaquín hace click "Re-graduar". Frontend pide token client.
12. Token client devuelve access_token Gemini.
13. Frontend `POST /admin/grade/<docId>` con `X-Gemini-Access-Token`.
14. Backend llama Gemini con OAuth Bearer del docente.
15. Resultado: grading aparece en modal en ~15s.
✅ Resultado: éxito

### Simulación 2 — Estudiante intenta acceder
1. Estudiante abre `/dashboard/`.
2. Botón Sign-In aparece.
3. Click → popup → estudiante elige `anyssa.salazar@…`.
4. Frontend recibe JWT.
5. Frontend hace `/admin/whoami`.
6. Backend verifica:
   - `hd` = `thelaunchpadtlp.education` ✓ (es del Workspace)
   - email ∈ `ALLOWED_TEACHERS` ✗ (no está)
7. Backend devuelve `403 {error: 'not_a_teacher'}`.
8. Frontend muestra "No tenés permisos para acceder al dashboard. Si crees que esto es un error, escribí a joaquin.munoz@…"
✅ Resultado: bloqueado correctamente

### Simulación 3 — Atacante con JWT robado
1. Atacante captura JWT de Joaquín por cualquier medio.
2. Atacante hace request con ese JWT.
3. Backend verifica firma → ✓ (firma de Google es válida).
4. Backend deja pasar. **Riesgo durante 1h.**
5. Mitigación: TLS+HSTS, no log tokens, sesión corta, alertas por IP rara.

**Mejora futura**: bind token a User-Agent + IP + fingerprint en Firestore.

### Simulación 4 — Cliente ID rotated
1. Hipotético: filtración pública del CLIENT_ID (no es secreto, pero hipotéticamente).
2. Atacante registra origin malicioso… NO PUEDE: Google solo permite origins autorizados.
3. Atacante hostea su propio dashboard con mismo CLIENT_ID en `https://evaluacosas.thelaunchpadtlp.education` → necesita el dominio, lo cual requiere DNS.
✅ Resultado: ataque no viable sin compromise DNS.

### Simulación 5 — Workspace admin desactiva la app
1. Admin del Workspace puede revocar la app desde Admin Console.
2. Todos los tokens activos se revocan en 1h max.
3. Login nuevo falla con "App restricted by your administrator".
✅ Resultado: kill switch operacional.

## 6. Procedimientos de runbook

### Agregar nuevo docente
1. Editar env var `ALLOWED_TEACHERS` en Cloud Run:
   ```bash
   gcloud run services update evaluacosas-submit-handler \
     --region us-central1 \
     --update-env-vars ALLOWED_TEACHERS=joaquin.munoz@thelaunchpadtlp.education,nuevo.profe@thelaunchpadtlp.education
   ```
2. Verificar con `/admin/whoami` que el nuevo docente puede acceder.
3. Documentar el cambio en `docs/PERMISSIONS_LEDGER.md`.

### Rotar CLIENT_ID (incident response)
1. Crear nuevo OAuth Client en GCP Console.
2. Actualizar `dashboard/config.json` con nuevo client_id.
3. Actualizar Cloud Run env var `OAUTH_CLIENT_ID`.
4. Commit + push + deploy.
5. Borrar OAuth Client viejo en GCP Console.
6. Documentar incidente en `docs/INCIDENTS.md`.

### Quitar acceso a un docente (offboarding)
1. Quitar email de `ALLOWED_TEACHERS`.
2. Sus tokens activos expirarán en 1h.
3. Para revocar inmediato: Workspace admin revoca la app para ese usuario.

## 7. Dependencias bloqueantes para arrancar

| # | Dependencia | Acción del user | Acción de Claude | Estado |
|---|---|---|---|---|
| 1 | OAuth Consent Screen configurado | Click en Console + completar formulario | Documentar paso a paso | Pendiente acción usuario |
| 2 | OAuth Client ID creado | Click en Console + copiar ID | Recibir ID y configurar | Pendiente paso 1 |
| 3 | `dashboard/config.json` con CLIENT_ID | — | Editar + commit + push | Pendiente paso 2 |
| 4 | Cloud Run env vars | — | `gcloud run services update …` | Pendiente paso 2 |
| 5 | Privacy + Terms pages | — | Crear `/privacy/` y `/terms/` | Pendiente |
| 6 | Audit log middleware | — | Agregar a server.js | Pendiente |
| 7 | Rate limiting middleware | — | Agregar a server.js | Pendiente |
| 8 | CORS config explicit | — | Refinar en server.js | Pendiente |
| 9 | Smoke test E2E | Opcional | Curl + verificar | Pendiente paso 4 |
| 10 | QA checklist completo | Opcional | Marcar uno por uno | Pendiente |

## 8. Plan de ejecución concreto (cuando el user dé luz verde)

**Fase A** — Pre-flight (Claude, sin user):
- [x] A.1 Investigar entorno GCP (hecho)
- [ ] A.2 Crear `/privacy/` y `/terms/` con contenido inicial
- [ ] A.3 Agregar audit log middleware a server.js
- [ ] A.4 Agregar rate limiting middleware
- [ ] A.5 Refinar CORS allowlist
- [ ] A.6 Preparar `dashboard/config.json` con placeholders
- [ ] A.7 Documentar `OAUTH_CONSENT_BACKUP.md` con la config exacta
- [ ] A.8 Commit + push

**Fase B** — Setup interactivo (user, ~10 min):
- [ ] B.1 User: configurar OAuth Consent Screen
- [ ] B.2 User: crear OAuth Client ID
- [ ] B.3 User: pegar el CLIENT_ID copiado en Claude
- [ ] B.4 Claude: actualizar config.json + Cloud Run
- [ ] B.5 Claude: deploy + verificar /health

**Fase C** — Smoke test:
- [ ] C.1 User: abrir dashboard en incógnito + login
- [ ] C.2 Verificar tabla carga
- [ ] C.3 Verificar modal funciona
- [ ] C.4 Verificar logout

**Fase D** — QA exhaustivo:
- [ ] D.1 Recorrer los 162 criterios de la sección 4
- [ ] D.2 Documentar fallos en `docs/QA_REPORT_DASHBOARD.md`
- [ ] D.3 Fix-loop hasta 100% pass

**Fase E** — Hand-off:
- [ ] E.1 Runbook completo
- [ ] E.2 Permission ledger actualizado
- [ ] E.3 Memory persistente actualizada con OAuth client metadata
- [ ] E.4 Reporte final for-dummies al user

## 9. Riesgos identificados + mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| User no completa setup en Console | Media | Alto | Guía paso a paso con screenshots descritos |
| CLIENT_ID mal copiado (typo) | Baja | Alto | Validación regex en config.json + check en startup backend |
| Origins faltantes | Media | Medio | Lista exhaustiva en sección 2.6 |
| Workspace admin policy bloquea Internal apps | Baja | Alto | Admin = mismo user → puede ajustar |
| Cuota OAuth excedida (free) | Nula | — | Internal apps no tienen quota relevante |
| Browser bloquea third-party | Media | Medio | GIS popup, no One Tap como primario |

## 10. Métricas de éxito

- ✅ Login de Joaquín funciona en Chrome/Safari/Firefox
- ✅ /admin/whoami devuelve 200
- ✅ Tabla muestra al menos 1 entrega real
- ✅ Modal abre y muestra payload completo
- ✅ Re-grade dispara llamada a Gemini
- ✅ Estudiante (no profe) recibe 403 limpio
- ✅ Tiempo total setup user-side ≤10 min
- ✅ 0 errores 5xx durante smoke test
- ✅ 0 logs de tokens en Cloud Logging
- ✅ Latencia p95 /admin/* <500ms

---

**Próximo paso**: Confirmación del user para arrancar Fase A (Claude trabaja solo, sin friction). Después coordina Fase B con el user.
