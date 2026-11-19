"use client";

import { useEffect, useState } from "react";
import LoadScreen from "@/components/LoadScreen";
import AuthScreen from "@/components/AuthScreen";
import Shop360App from "@/components/Shop360App";

type FlowStep = "load" | "auth" | "dashboard";

export default function FlowManager({
  markup,
  scripts,
}: {
  markup: string;
  scripts: { id: string | null; code: string }[];
}) {
  const [step, setStep] = useState<FlowStep>("load");

  useEffect(() => {
    const t = setTimeout(() => setStep("auth"), 1800);
    return () => clearTimeout(t);
  }, []);

  if (step === "load") return <LoadScreen />;
  if (step === "auth")
    return <AuthScreen onLogin={() => setStep("dashboard")} />;
  return <Shop360App markup={markup} scripts={scripts} />;
}
