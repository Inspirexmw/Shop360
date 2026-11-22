"use client";

import { useEffect } from "react";
import { normalizeRole, type RbacPolicy } from "@/lib/roles";

type LegacyScript = { id: string | null; code: string };
type RbacWindow = Window & {
  SHOP360_ROLE?: string;
  SHOP360_RBAC?: RbacPolicy;
  SHOP360_ROLE_LABELS?: Record<string, string>;
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
  policy,
}: {
  markup: string;
  scripts: LegacyScript[];
  user: { id: string; email: string; name: string; role: string } | null;
  policy: RbacPolicy;
}) {
  useEffect(() => {
    const w = window as RbacWindow;
    const role = user ? normalizeRole(user.role, policy.roles) : "cashier";
    w.SHOP360_ROLE = role;
    w.SHOP360_RBAC = policy;
    w.SHOP360_ROLE_LABELS = policy.labels;
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
      if (roleEl) roleEl.textContent = policy.labels[role] || role;
    }
  }, [scripts, user, policy]);

  return (
    <div
      id="shop360-root"
      style={{ display: "contents" }}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
