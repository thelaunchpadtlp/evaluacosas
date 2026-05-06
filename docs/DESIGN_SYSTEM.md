# Design System unificado · evaluacosas TLP
**Versión**: 1.0 — 2026-05-06
**Filosofía**: Apple Liquid Glass (macOS Tahoe / iOS 26 / iPadOS 26 / visionOS 26) + WCAG 2.1 AA + checklist.design + ux-checklist.com

---

## 0. Principios

1. **Consistencia visual por tokens**: nada hardcoded, todo via custom properties.
2. **Liquid Glass**: superficies con `backdrop-filter` blur+saturate, hairlines 0.5–1px, squircles, profundidad por sombra.
3. **Una nav, un footer, un patrón**: la navegación, el footer, el sign-in y los atajos se ven idénticos en todas las superficies.
4. **Privacidad por diseño**: sin tracking de terceros en ninguna superficie.
5. **Accesibilidad ≥ AA**: focus visible, touch ≥44px, keyboard nav, reduced motion, dark+light, `prefers-color-scheme`.
6. **Performance**: backdrop-filter solo en surfaces, no global. Lazy-load fonts. CSS variables, no JS para themes.

---

## 1. Design tokens (canonical)

### Color
```css
--bg: #07111d;           /* Background base (dark) */
--bg-2: #0c1620;
--bg-3: #102018;
--surface: rgba(255, 255, 255, 0.08);
--surface-strong: rgba(255, 255, 255, 0.14);
--glass-tint: rgba(255, 255, 255, 0.06);
--glass-tint-strong: rgba(255, 255, 255, 0.12);
--line: rgba(255, 255, 255, 0.18);
--hairline: rgba(255, 255, 255, 0.12);

--text: #eef6ff;
--muted: #a9bacf;

--accent: #39d98a;       /* Verde TLP — primario */
--accent-2: #67d1ff;     /* Celeste — secundario */
--accent-3: #c4a7ff;     /* Lila — terciario */
--danger: #ff8d8d;
--warning: #ffd166;
```

### Light mode (override con `:root.allow-light`)
```css
--bg: #f4f6fb;
--text: #0c1422;
--muted: #506178;
--glass-tint: rgba(255, 255, 255, 0.6);
```

### Glass
```css
--glass-blur: 32px;
--glass-blur-strong: 48px;
--glass-saturate: 180%;
```

### Squircles
```css
--r-xs: 8px;
--r-sm: 12px;
--r-md: 18px;
--r-lg: 24px;
--r-xl: 32px;
--r-pill: 999px;
```

### Spacing (scale)
```css
--sp-1: 4px;    --sp-2: 8px;    --sp-3: 12px;
--sp-4: 16px;   --sp-5: 24px;   --sp-6: 32px;
--sp-7: 48px;   --sp-8: 64px;
```

### Easing + duration
```css
--ease-spring: cubic-bezier(0.32, 0.72, 0, 1);
--ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--dur-fast: 150ms;
--dur-base: 280ms;
--dur-slow: 480ms;
```

### Safe areas (iPhone notched / iPad / visionOS)
```css
--safe-top: env(safe-area-inset-top, 0px);
--safe-right: env(safe-area-inset-right, 0px);
--safe-bottom: env(safe-area-inset-bottom, 0px);
--safe-left: env(safe-area-inset-left, 0px);
```

### Shadow
```css
--shadow: 0 24px 80px rgba(0, 0, 0, 0.32);
--shadow-elevated: 0 30px 100px rgba(0, 0, 0, 0.5);
```

---

## 2. Typography

Stack canónico (Apple SF Pro primero, fallback Inter, system-ui):
```css
font-family:
  "SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont,
  "Inter", ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif;
font-feature-settings: "ss01", "cv11";
text-rendering: optimizeLegibility;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

Headings: `letter-spacing: -0.01em` (más Apple-like).
Mono: `ui-monospace, "SF Mono", Menlo, monospace`.

### Sizes
- Hero h1: `clamp(3.5rem, 13vw, 11rem)`
- Section h2: `clamp(1.4rem, 1rem + 1vw, 2rem)`
- Body: `1rem` (mobile 16px = no-zoom)
- Caption: `0.82rem`
- Eyebrow: `0.72rem` uppercase letterspacing 0.08em

---

## 3. Componentes canónicos

### 3.1 GlobalNav (sticky liquid glass top bar)
**Presente en**: landing, dashboard, ayuda, sub-pages, biology-10 (pendiente).

```html
<nav class="globalnav" aria-label="Navegación principal">
  <div class="globalnav-inner">
    <a class="globalnav-brand" href="/">
      <span class="globalnav-mark" aria-hidden="true">✺</span>
      <span class="globalnav-name">evaluacosas <span class="globalnav-sub">TLP</span></span>
    </a>
    <ul class="globalnav-links" role="list">
      <li><a href="/">Inicio</a></li>
      <li><a href="/#catalog">Catálogo</a></li>
      <li><a href="/ayuda/">Ayuda</a></li>
      <li><a class="globalnav-dashboard" href="/dashboard/">🔐 Docentes</a></li>
    </ul>
  </div>
</nav>
```

Reglas:
- `position: sticky; top: var(--safe-top)`
- Glass: `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate))`
- Border bottom: `1px solid var(--hairline)`
- En mobile (<720px): nombre se oculta, solo mark.
- `aria-current="page"` en link de la página actual.

### 3.2 Footer (4 columnas + tech disclaimer)
**Presente en**: landing, ayuda. **Pendiente**: dashboard, biology-10.

```html
<footer class="site-footer">
  <div class="site-footer-inner">
    <div class="footer-grid">
      <div class="footer-col footer-col-brand">…</div>
      <div class="footer-col"><h4>Estudiantes</h4>…</div>
      <div class="footer-col"><h4>Docentes</h4>…</div>
      <div class="footer-col"><h4>Privacidad</h4>…</div>
    </div>
    <p class="footer-tech">…</p>
  </div>
</footer>
```

### 3.3 Card (cualquier surface)
- `border-radius: var(--r-lg)`
- `border: 1px solid var(--hairline)`
- `background: var(--glass-tint)`
- `backdrop-filter: blur(20px) saturate(140%)`
- Hover: `transform: translateY(-2px); box-shadow: var(--shadow-elevated)`
- Transition: `var(--dur-base) var(--ease-spring)`

### 3.4 Button (3 variantes)
- **Primary**: `background: var(--text); color: var(--bg); border-radius: var(--r-pill);`
- **Ghost**: `background: rgba(white,0.12); border: 1px solid rgba(white,0.22)`
- **Accent**: `background: linear-gradient(135deg, var(--accent), #2bb478)`
- **Min height: 44px** (touch target)
- **Transition**: `transform var(--dur-fast) var(--ease-spring)`

### 3.5 Input/Search
- `border-radius: var(--r-pill)` para search; `var(--r-md)` para text.
- `background: var(--glass-tint)`, `backdrop-filter: blur(20px)`.
- Focus: border `var(--accent-2)`, glow `box-shadow: 0 0 0 4px color-mix(in oklab, var(--accent-2) 22%, transparent)`.
- Min font-size `16px` (anti zoom iOS).

### 3.6 Modal
- Overlay: `background: rgba(2,6,12,0.78); backdrop-filter: blur(14px) saturate(140%)`
- Card: `border-radius: var(--r-xl); animation: modal-slide var(--dur-base) var(--ease-spring)`
- Close on `Esc`, click outside, button.
- Focus trap.

### 3.7 FAB (Mapa)
- `border-radius: var(--r-pill)`
- Sticky/fixed bottom-right respetando safe-area.
- Glass + accent tint.
- Aparece en landing y biology-10 con menú TOC.

### 3.8 Toc-panel
- Slide-in desde la derecha.
- `border-radius: var(--r-xl) 0 0 var(--r-xl)`
- Atajo `?` global.
- Cursor-follow desktop.

### 3.9 Skip-to-content
- Posición absoluta `top:8px; left:8px`
- Visible solo on focus (`:focus → translateY(0)`)

### 3.10 Empty / Loading / Error states
**Estructura común**:
```html
<div class="dash-empty-state">
  <span class="dash-empty-icon" aria-hidden="true">⏳</span>
  <p>Mensaje claro</p>
  <button>Acción de recovery</button>
</div>
```

---

## 4. Iconografía

- Emoji nativos del sistema (Apple-rendered en macOS/iOS).
- SVGs inline para iconos críticos: lock, shield, search, chevron.
- Stroke-width: `1.6`; line-cap+join: `round`.

---

## 5. Microcopy patterns

| Caso | Patrón |
|---|---|
| Loading | "Cargando…" (puntos suspensivos) |
| Empty | "Aún no hay [X]." |
| Error 401 | "Tu sesión expiró, volvé a entrar." |
| Error 403 | "No tenés permisos. Contactá al administrador." |
| Error 5xx | "Error del servidor. Reportá si persiste." |
| Network | "Sin conexión. Reintentando…" |
| Confirm | "¿Estás seguro?" + cancel-default |
| Success | "Listo." (corto, no exclamaciones) |

Tono general: **directo, en voseo costarricense, sin marketing-speak**.

---

## 6. Atajos de teclado (canon)

Globales en todas las superficies:
- `?` → abrir/cerrar mapa o atajos
- `Esc` → cerrar overlay (modal, toc, popover)
- `j` / `k` o `↓` / `↑` → navegar items
- `Enter` → activar item enfocado
- `r` → refrescar (solo en surfaces con datos en vivo)
- `/` → enfocar búsqueda

---

## 7. Inventario de superficies

| Surface | URL | Estado design system |
|---|---|---|
| Landing | `/` | ✅ v1.0 — completa |
| Catálogo | `/#catalog` | ✅ — sección de landing |
| Welcome | `/#welcome` | ✅ — bloque de landing |
| Para docentes | `/#teachers-callout` | ✅ — bloque de landing |
| Dashboard | `/dashboard/` | ✅ v1.0 — completa |
| Ayuda hub | `/ayuda/` | ✅ v1.0 — completa |
| Ayuda dashboard | `/ayuda/dashboard/` | ✅ v1.0 |
| Ayuda estudiantes | `/ayuda/estudiantes/` | ✅ v1.0 |
| Ayuda problemas | `/ayuda/problemas/` | ⚠️ pendiente create |
| Ayuda privacidad | `/ayuda/privacidad/` | ⚠️ redirect a /privacy/ |
| Privacy | `/privacy/` | ✅ v1.0 |
| Terms | `/terms/` | ⚠️ pendiente create |
| Biology-10 | `/biologia-10/` | ⚠️ generado por build.mjs — aligning tokens en próximo build |
| Future evaluacosas | `/<slug>/` | Plantilla en build.mjs |
| JMO Universe (apex) | `https://thelaunchpadtlp.education/` | 🔵 separate Next.js — sync futuro |

---

## 8. Plan de unificación restante

### Fase 1 — Inmediato (ahora)
1. ✅ Globalnav consistente en landing/dashboard/ayuda
2. ✅ Footer-grid en landing + ayuda
3. ✅ Tokens design system en landing.css y dashboard.css
4. ✅ Auth gate friendly en dashboard
5. ⚠️ Crear `/terms/` (similar a /privacy/)
6. ⚠️ Crear `/ayuda/problemas/` (FAQs)

### Fase 2 — Build.mjs unificado (próximo deploy biology-10)
1. Inyectar globalnav en cada evaluacosa generada
2. Reemplazar tokens locales por canon
3. Footer con links cruzados a /, /ayuda/, /dashboard/
4. Match focus rings + spring easings

### Fase 3 — Componentes compartidos (futuro)
1. Extraer `shared/design-system.css` con tokens + componentes base
2. Cada surface importa el shared y agrega su específico
3. Considerar Web Components para nav/footer reutilizables

### Fase 4 — Apex (JMO Universe)
1. Sync paleta + tokens hacia el dashboard apex
2. Cross-link en globalnav del apex a evaluacosas
3. Branding consistente

---

## 9. Quality gates

Antes de cada release:
- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Lighthouse Best Practices ≥ 95
- [ ] Lighthouse SEO ≥ 90
- [ ] axe DevTools sin errores
- [ ] Test en Safari macOS, Safari iOS, Chrome Android, Firefox
- [ ] Reduced motion respetado
- [ ] Keyboard nav completa
- [ ] Print preview legible
- [ ] HSTS Preload válido
- [ ] OG Cards verificados (LinkedIn, Twitter, WhatsApp)

---

## 10. Decisiones documentadas

| Decisión | Razón |
|---|---|
| SF Pro stack first | Apple devices renderizan nativo; otros caen a Inter sin pérdida significativa |
| Squircle 18-32px | Match Apple recent design |
| Spring easing 0.32,0.72,0,1 | Apple-like overshoot mínimo |
| Glass 32px / 48px / 180% saturate | Match macOS Tahoe Liquid Glass |
| Hairline 1px var(--hairline) | Más fino y elegante que borders gruesos |
| Min touch 44px | iOS Human Interface Guidelines |
| Focus ring outline 2px + glow 4px | WCAG AA + visibilidad |
| `--safe-*` env() | iPhone notched + iPad portrait + visionOS |
