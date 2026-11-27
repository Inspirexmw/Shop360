"use client";

import { useEffect, useState } from "react";

export default function LoadScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      p += Math.random() * 10;
      if (p >= 100) {
        p = 100;
        setProgress(p);
        clearInterval(id);
      } else {
        setProgress(p);
      }
    }, 140);
    return () => clearInterval(id);
  }, []);

  const s = {
    bg: "var(--bg)",
    brand: "var(--brand)",
    ink: "var(--ink)",
    muted: "var(--muted)",
    soft: "var(--soft)",
    line: "var(--line)",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 50% 50%, rgba(23,107,87,.12) 0%, rgba(23,107,87,.04) 45%, rgba(243,246,243,.9) 100%)",
        backgroundColor: s.bg,
      }}
    >
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: 96,
            height: 96,
            boxSizing: "border-box",
            borderRadius: 24,
            border: "4px solid " + s.line,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img src="/brand/logo-mark.svg" alt="Shop360" style={{ width: 60, height: 60, display: "block" }} />
        </div>
        <div style={{ marginTop: 32, fontSize: 30, fontWeight: 900, letterSpacing: "-1.5px", color: s.ink, textAlign: "center" }}>
          Shop360
        </div>
        <p
          style={{
            marginTop: 10,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.15,
            textTransform: "uppercase",
            color: s.muted,
            textAlign: "center",
          }}
        >
          Initializing workspace
        </p>
      </div>

      <div
        style={{
          marginTop: 44,
          width: 300,
          height: 9,
          borderRadius: "9999px",
          background: s.soft,
          border: "1px solid " + s.line,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: "9999px",
            width: progress + "%",
            background: s.brand,
            boxShadow: "0 0 14px rgba(23,107,87,.45)",
          }}
        ></div>
      </div>

      <div
        style={{
          marginTop: 26,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.15,
          textTransform: "uppercase",
          color: s.muted,
        }}
      >
        Connecting to Neon · Loading state · Verifying session
      </div>
    </div>
  );
}
