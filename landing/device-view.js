// device-view.js — Multi device-view toggle
// Auto-detect + manual override. Persiste en localStorage.
// Funciona en cualquier surface estática del sistema TLP.
"use strict";
(function () {
  if (window.__tlpDeviceViewMounted) return;
  window.__tlpDeviceViewMounted = true;

  const STORAGE_KEY = "tlp.deviceView.v1";

  const DEVICES = {
    auto:              { label: "Automático",            sub: "detecta dispositivo", icon: "✨", vw: null, vh: null, frame: null,            browser: null,    chrome: null },
    "iphone-safari":   { label: "iPhone · Safari",       sub: "390 × 844",           icon: "📱", vw: 390,  vh: 844,  frame: "phone-ios",    browser: "safari", chrome: "ios-safari" },
    "iphone-chrome":   { label: "iPhone · Chrome",       sub: "390 × 844",           icon: "📱", vw: 390,  vh: 844,  frame: "phone-ios",    browser: "chrome", chrome: "ios-chrome" },
    "iphone-generic":  { label: "iPhone · genérico",     sub: "390 × 844",           icon: "📱", vw: 390,  vh: 844,  frame: "phone-ios",    browser: "generic", chrome: null },
    "ipad-safari":     { label: "iPad · Safari",         sub: "820 × 1180",          icon: "📲", vw: 820,  vh: 1180, frame: "tablet-ios",   browser: "safari", chrome: "ios-safari" },
    "ipad-chrome":     { label: "iPad · Chrome",         sub: "820 × 1180",          icon: "📲", vw: 820,  vh: 1180, frame: "tablet-ios",   browser: "chrome", chrome: "ios-chrome" },
    "ipad-generic":    { label: "iPad · genérico",       sub: "820 × 1180",          icon: "📲", vw: 820,  vh: 1180, frame: "tablet-ios",   browser: "generic", chrome: null },
    "watch":           { label: "Apple Watch",           sub: "198 × 242",           icon: "⌚", vw: 198,  vh: 242,  frame: "watch",        browser: "safari", chrome: null },
    "vision":          { label: "Apple Vision Pro",      sub: "spatial",             icon: "🥽", vw: 1280, vh: 800,  frame: "vision",       browser: "safari", chrome: null },
    "macos-safari":    { label: "macOS · Safari",        sub: "fullscreen",          icon: "💻", vw: null, vh: null, frame: "desktop",      browser: "safari", chrome: "macos-safari" },
    "macos-chrome":    { label: "macOS · Chrome",        sub: "fullscreen",          icon: "💻", vw: null, vh: null, frame: "desktop",      browser: "chrome", chrome: "macos-chrome" },
    "macos-generic":   { label: "macOS · genérico",      sub: "fullscreen",          icon: "💻", vw: null, vh: null, frame: null,           browser: "generic", chrome: null },
    "android-chrome":  { label: "Android · Chrome",      sub: "412 × 915",           icon: "🤖", vw: 412,  vh: 915,  frame: "phone-android", browser: "chrome", chrome: "android-chrome" },
    "android-generic": { label: "Android · genérico",    sub: "412 × 915",           icon: "🤖", vw: 412,  vh: 915,  frame: "phone-android", browser: "generic", chrome: null },
    "tablet-generic":  { label: "Tablet · genérico",     sub: "800 × 1200",          icon: "📲", vw: 800,  vh: 1200, frame: "tablet-generic", browser: "generic", chrome: null },
    "phone-generic":   { label: "Teléfono · genérico",   sub: "360 × 800",           icon: "📱", vw: 360,  vh: 800,  frame: "phone-generic", browser: "generic", chrome: null }
  };

  function detectAuto() {
    const ua = navigator.userAgent || "";
    const platform = navigator.platform || "";
    const isIOS = /iPhone|iPod/.test(ua) || (/Mac/.test(platform) && navigator.maxTouchPoints > 1);
    const isIPad = /iPad/.test(ua) || (/Mac/.test(platform) && navigator.maxTouchPoints > 1 && window.screen.width >= 768);
    const isMac = /Macintosh|Mac OS X/.test(ua) && !isIPad;
    const isAndroid = /Android/.test(ua);
    const isAndroidTablet = isAndroid && window.screen.width >= 768;
    const isChrome = /Chrome|CriOS/.test(ua) && !/Edg|EdgiOS|OPR/.test(ua);
    const isSafari = /Safari/.test(ua) && !isChrome && !/Edg/.test(ua);

    if (isIPad) return isChrome ? "ipad-chrome" : "ipad-safari";
    if (isIOS) return isChrome ? "iphone-chrome" : "iphone-safari";
    if (isMac) return isChrome ? "macos-chrome" : (isSafari ? "macos-safari" : "macos-generic");
    if (isAndroidTablet) return "tablet-generic";
    if (isAndroid) return "android-chrome";
    if ((/Tablet/i.test(ua)) || window.screen.width >= 768) return "tablet-generic";
    return "phone-generic";
  }

  function applyDevice(key) {
    const html = document.documentElement;
    const auto = key === "auto";
    const real = auto ? detectAuto() : key;
    const d = DEVICES[real] || DEVICES.auto;

    if (auto) {
      html.removeAttribute("data-device-frame");
      html.removeAttribute("data-device");
      html.removeAttribute("data-browser");
      html.removeAttribute("data-chrome");
      html.style.removeProperty("--vp-width");
      html.style.removeProperty("--vp-height");
    } else {
      html.setAttribute("data-device", real);
      if (d.frame) html.setAttribute("data-device-frame", d.frame);
      else html.removeAttribute("data-device-frame");
      if (d.browser) html.setAttribute("data-browser", d.browser);
      else html.removeAttribute("data-browser");
      if (d.chrome) html.setAttribute("data-chrome", d.chrome);
      else html.removeAttribute("data-chrome");
      if (d.vw) html.style.setProperty("--vp-width", d.vw + "px");
      else html.style.removeProperty("--vp-width");
      if (d.vh) html.style.setProperty("--vp-height", d.vh + "px");
      else html.style.removeProperty("--vp-height");
    }
    // Detected (for analytics / styling hooks)
    html.setAttribute("data-device-detected", detectAuto());
  }

  function init() {
    const saved = localStorage.getItem(STORAGE_KEY) || "auto";
    applyDevice(saved);
    mountToggle(saved);

    // Re-detect on resize for "auto" mode (responsive autodetect)
    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        const cur = localStorage.getItem(STORAGE_KEY) || "auto";
        if (cur === "auto") applyDevice("auto");
      }, 220);
    });
  }

  function mountToggle(current) {
    const host = document.createElement("div");
    host.className = "tlp-device-toggle";
    host.setAttribute("data-tlp-device-toggle", "1");
    // Persisted collapsed state — default collapsed if user has ever picked something
    const COLLAPSED_KEY = "tlp.deviceView.collapsed";
    const initialCollapsed = localStorage.getItem(COLLAPSED_KEY) === "1" || (current !== "auto");
    if (initialCollapsed) host.setAttribute("data-collapsed", "1");

    host.innerHTML = `
      <button class="tlp-device-toggle-btn" type="button" aria-haspopup="listbox" aria-expanded="false" title="Cambiar visualización (⇧D)">
        <span class="tlp-device-toggle-icon" aria-hidden="true">${DEVICES[current]?.icon || "📱"}</span>
        <span class="tlp-device-toggle-text">
          <span class="tlp-device-toggle-label">${DEVICES[current]?.label || "Vista"}</span>
          <span class="tlp-device-toggle-sub">${DEVICES[current]?.sub || ""}</span>
        </span>
        <span class="tlp-device-toggle-caret" aria-hidden="true">▾</span>
      </button>
      <button class="tlp-device-toggle-collapse" type="button" data-collapse aria-label="Minimizar a icono" title="Minimizar (clic en el icono lo vuelve a abrir)">
        <span aria-hidden="true">✕</span>
      </button>
      <div class="tlp-device-toggle-menu" role="listbox" hidden>
        <header class="tlp-device-toggle-head">
          <div>
            <strong>Visualización</strong>
            <span>Auto-detecta. Podés forzar una vista.</span>
          </div>
          <button type="button" class="tlp-device-toggle-x" data-menu-close aria-label="Cerrar menú">×</button>
        </header>
        <div class="tlp-device-toggle-list">
          ${Object.entries(DEVICES).map(([k, d]) => `
            <button class="tlp-device-toggle-option ${k === current ? "is-active" : ""}" data-key="${k}" role="option" type="button" aria-selected="${k === current}">
              <span class="opt-icon" aria-hidden="true">${d.icon}</span>
              <span class="opt-text">
                <span class="opt-label">${d.label}</span>
                <span class="opt-sub">${d.sub}</span>
              </span>
              ${k === current ? '<span class="opt-check" aria-hidden="true">✓</span>' : ''}
            </button>
          `).join("")}
        </div>
        <footer class="tlp-device-toggle-foot">
          <span>Detectado: <strong data-detected>${detectAuto()}</strong></span>
          <button type="button" class="tlp-device-toggle-reset" data-reset>Resetear a Automático</button>
        </footer>
      </div>
    `;
    document.body.appendChild(host);

    const btn = host.querySelector(".tlp-device-toggle-btn");
    const menu = host.querySelector(".tlp-device-toggle-menu");
    const collapse = () => {
      host.setAttribute("data-collapsed", "1");
      localStorage.setItem(COLLAPSED_KEY, "1");
    };
    const expand = () => {
      host.removeAttribute("data-collapsed");
      localStorage.setItem(COLLAPSED_KEY, "0");
    };
    const open = () => { menu.hidden = false; btn.setAttribute("aria-expanded", "true"); expand(); };
    const close = () => { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); };
    const toggle = () => menu.hidden ? open() : close();

    btn.addEventListener("click", () => {
      // If collapsed, first click opens menu directly. If expanded, toggles menu.
      if (host.hasAttribute("data-collapsed")) { open(); }
      else { toggle(); }
    });
    host.querySelector("[data-collapse]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      close();
      collapse();
    });
    host.querySelector("[data-menu-close]")?.addEventListener("click", (e) => {
      e.stopPropagation();
      close();
      collapse();
    });
    document.addEventListener("click", (e) => {
      if (!host.contains(e.target)) {
        if (!menu.hidden) { close(); collapse(); }
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) { close(); collapse(); }
      if (e.key === "D" && e.shiftKey && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)) {
        e.preventDefault(); toggle();
      }
    });
    host.querySelectorAll("[data-key]").forEach(b => {
      b.addEventListener("click", () => {
        const k = b.dataset.key;
        localStorage.setItem(STORAGE_KEY, k);
        applyDevice(k);
        // After picking, close menu + collapse to icon (con pequeña pausa para feedback visual)
        setTimeout(() => { close(); collapse(); }, 220);
        // Re-render (cheap: replace label)
        const d = DEVICES[k];
        host.querySelector(".tlp-device-toggle-icon").textContent = d.icon;
        host.querySelector(".tlp-device-toggle-label").textContent = d.label;
        host.querySelector(".tlp-device-toggle-sub").textContent = d.sub;
        host.querySelectorAll(".tlp-device-toggle-option").forEach(opt => {
          opt.classList.toggle("is-active", opt.dataset.key === k);
          opt.setAttribute("aria-selected", opt.dataset.key === k ? "true" : "false");
        });
      });
    });
    host.querySelector("[data-reset]")?.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      applyDevice("auto");
      setTimeout(() => { close(); collapse(); }, 220);
      const d = DEVICES.auto;
      host.querySelector(".tlp-device-toggle-icon").textContent = d.icon;
      host.querySelector(".tlp-device-toggle-label").textContent = d.label;
      host.querySelector(".tlp-device-toggle-sub").textContent = d.sub;
      host.querySelectorAll(".tlp-device-toggle-option").forEach(opt => {
        opt.classList.toggle("is-active", opt.dataset.key === "auto");
        opt.setAttribute("aria-selected", opt.dataset.key === "auto" ? "true" : "false");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
