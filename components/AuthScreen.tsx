"use client";

import { useState } from "react";

export default function AuthScreen({ onLogin }: { onLogin: (user: { id: string; email: string; name: string; role: string }) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Sign in failed");
      onLogin(j.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const s = {
    brand: "var(--brand)",
    ink: "var(--ink)",
    muted: "var(--muted)",
    panel: "var(--panel)",
    line: "var(--line)",
    soft: "var(--soft)",
    bg: "var(--bg)",
    red: "rgba(217,109,104,.25)",
    redBg: "rgba(217,109,104,.08)",
    redText: "#b95e5a",
  };

  const inputStyle = {
    width: "100%",
    borderRadius: 11,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: s.line,
    background: "#fff",
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: s.ink,
    outline: "none",
    boxSizing: "border-box",
  } as React.CSSProperties;

  const focusInput = {
    ...inputStyle,
    borderColor: s.brand,
    boxShadow: "0 0 0 3px rgba(23,107,87,.12)",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        background:
          "radial-gradient(circle at 50% 50%, rgba(23,107,87,.10) 0%, rgba(23,107,87,.04) 40%, rgba(243,246,243,.7) 100%)",
        backgroundColor: s.bg,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: s.panel,
          border: "1px solid " + s.line,
          borderRadius: 23,
          boxShadow: "0 20px 60px rgba(23,60,45,.12)",
          padding: "34px 30px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              border: "1px solid " + s.line,
              background: s.soft,
              display: "grid",
              placeItems: "center",
            }}
          >
            <img src="/brand/logo-mark.svg" alt="Shop360" style={{ width: 34, height: 34, display: "block" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-1px", color: s.ink, margin: 0 }}>
              Shop360
            </h1>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.15, textTransform: "uppercase", marginTop: 4, color: s.muted }}>
              Sign in to your workspace
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {error && (
            <div
              style={{
                borderRadius: 10,
                border: "1px solid " + s.red,
                background: s.redBg,
                padding: "10px 12px",
                fontSize: 11,
                fontWeight: 600,
                color: s.redText,
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <label style={{ display: "block", fontSize: 10, fontWeight: 800, letterSpacing: 0.15, textTransform: "uppercase", marginBottom: 4, color: s.muted }}>
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={loading ? focusInput : inputStyle}
            placeholder="you@shop.com"
          />

          <label style={{ display: "block", fontSize: 10, fontWeight: 800, letterSpacing: 0.15, textTransform: "uppercase", marginBottom: 4, color: s.muted }}>
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={loading ? focusInput : inputStyle}
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              borderRadius: 11,
              padding: "12px 14px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.15,
              textTransform: "uppercase",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.55 : 1,
              color: "#fff",
              background: loading ? s.muted : s.brand,
              borderColor: loading ? s.muted : s.brand,
              boxShadow: loading ? "none" : "0 4px 10px rgba(23,107,87,.14)",
              transition: "all .16s",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
