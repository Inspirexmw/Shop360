import fs from "node:fs";
import path from "node:path";
import FlowManager from "@/components/FlowManager";

const legacyDir = path.join(process.cwd(), "legacy");

export default function Page() {
  const meta = JSON.parse(
    fs.readFileSync(path.join(legacyDir, "meta.json"), "utf-8"),
  ) as { scripts: { file: string; id: string | null }[] };

  const markup = fs.readFileSync(path.join(legacyDir, "body.html"), "utf-8");

  const scripts = meta.scripts.map((s) => ({
    id: s.id,
    code: fs.readFileSync(path.join(legacyDir, "scripts", s.file), "utf-8"),
  }));

  return <FlowManager markup={markup} scripts={scripts} />;
}
