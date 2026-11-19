"use client";

import { useEffect, useState } from "react";
import LoadScreen from "@/components/LoadScreen";
import AuthScreen from "@/components/AuthScreen";
import Shop360App from "@/components/Shop360App";

type FlowStep = "load" | "auth" | "dashboard";
type SessionUser = { id: string; email: string; name: string; role: string };

export default function FlowManager({
  markup,
  scripts,
}: {
  markup: string;
  scripts: { id: string | null; code: string }[];
}) {
  const [step, setStep] = useState<FlowStep>("load");
  const [user, setUser] = useState<SessionUser | null>(null);

  // The session lives in an httpOnly cookie. /api/auth/me restores it without any token in browser storage.
  useEffect(() => {
    const timer = new Promise((r) => setTimeout(r, 1800));
    const session = fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j?.user ? (j.user as SessionUser) : null))
      .catch(() => null);
    Promise.all([timer, session]).then(([, u]) => {
      if (u) {
        setUser(u);
        setStep("dashboard");
      } else {
        setStep("auth");
      }
    });
  }, []);

  if (step === "load") return <LoadScreen />;
  if (step === "auth")
    return <AuthScreen onLogin={(u: SessionUser) => { setUser(u); setStep("dashboard"); }} />;
  return <Shop360App markup={markup} scripts={scripts} user={user} />;
}
