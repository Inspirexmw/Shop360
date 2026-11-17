"use client";

import { useEffect } from "react";

type LegacyScript = { id: string | null; code: string };

// Runs the original Shop360 scripts once, in their original document order.
// Classic scripts share the global scope, so the functions and globals they declare
// remain available to the inline onclick="..." handlers in the markup.
let scriptsStarted = false;

export default function Shop360App({
  markup,
  scripts,
}: {
  markup: string;
  scripts: LegacyScript[];
}) {
  useEffect(() => {
    if (scriptsStarted) return;
    scriptsStarted = true;
    for (const s of scripts) {
      const el = document.createElement("script");
      if (s.id) el.id = s.id;
      el.textContent = s.code;
      document.body.appendChild(el);
    }
  }, [scripts]);

  return (
    <div
      id="shop360-root"
      style={{ display: "contents" }}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
