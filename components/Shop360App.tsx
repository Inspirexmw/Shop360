"use client";

import { useEffect } from "react";
import { clientRbacPolicy, normalizeRole, ROLE_LABELS } from "@/lib/roles";

type LegacyScript = { id: string | null; code: string };
type RbacWindow = Window & {
  SHOP360_ROLE?: string;
  SHOP360_RBAC?: typeof clientRbacPolicy;
  SHOP360_ROLE_LABELS?: typeof ROLE_LABELS;
  SHOP360_PAGE?: string;
  SHOP360_INTENT?: string;
};

// Runs the original Shop360 scripts once, in their original document order.
// Classic scripts share the global scope, so the functions and globals they declare
// remain available to the inline onclick="..." handlers in the markup.
let scriptsStarted = false;

export default function Shop360App({
  markup,
  scripts,
  user,
}: {
  markup: string;
  scripts: LegacyScript[];
  user: { id: string; email: string; name: string; role: string } | null;
}) {
  useEffect(() => {
    const w = window as RbacWindow;
    const role = user ? normalizeRole(user.role) : "cashier";
    w.SHOP360_ROLE = role;
    w.SHOP360_RBAC = clientRbacPolicy;
    w.SHOP360_ROLE_LABELS = ROLE_LABELS;
    w.SHOP360_PAGE = "dashboard";
    w.SHOP360_INTENT = "general";
    document.body.dataset.shop360Role = role;

    if (scriptsStarted) return;
    scriptsStarted = true;
    for (const s of scripts) {
      const el = document.createElement("script");
      if (s.id) el.id = s.id;
      el.textContent = s.code;
      document.body.appendChild(el);
    }
    if (user) {
      const nameEl = document.getElementById("userName");
      const roleEl = document.getElementById("userRole");
      if (nameEl) nameEl.textContent = user.name;
      if (roleEl) roleEl.textContent = ROLE_LABELS[role];
    }
  }, [scripts, user]);

  return (
    <div
      id="shop360-root"
      style={{ display: "contents" }}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
