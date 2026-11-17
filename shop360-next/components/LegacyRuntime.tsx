"use client";

import { useEffect } from "react";

/**
 * Boots the Shop360 application engine (the original inline scripts, unchanged)
 * once the server-rendered markup is in the DOM. Scripts load in order:
 *   1. shop360-core.js            — state, POS, inventory, finance, reports, modals…
 *   2. shop360-theme-controls.js  — light/dark switch, sidebar collapse, mobile drawer
 *   3. shop360-mobile-nav.js      — bottom navigation on small screens
 * They are classic scripts so their top-level functions stay global — the markup's
 * inline handlers (onclick="openSettings()" etc.) depend on that.
 */
const SCRIPTS = [
  "/legacy/shop360-core.js",
  "/legacy/shop360-theme-controls.js",
  "/legacy/shop360-mobile-nav.js",
];

declare global {
  interface Window {
    __shop360Booted?: boolean;
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = false;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Shop360: failed to load ${src}`));
    document.head.appendChild(el);
  });
}

export default function LegacyRuntime() {
  useEffect(() => {
    if (window.__shop360Booted) return; // guards React Strict Mode's double effect
    window.__shop360Booted = true;

    // Inline handlers that the original HTML declared on these two elements.
    document.getElementById("notifPanel")?.setAttribute("onclick", "event.stopPropagation()");
    document
      .getElementById("modalBackdrop")
      ?.setAttribute("onclick", "if(event.target===this)closeModal()");

    (async () => {
      for (const src of SCRIPTS) await loadScript(src);
    })().catch(console.error);
  }, []);

  return null;
}
