import fs from "node:fs";
import path from "node:path";
import Shop360App from "@/components/Shop360App";

// The original app's markup and scripts, copied verbatim from the Shop360 HTML file.
// Read once at build/request time on the server.
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

  return <Shop360App markup={markup} scripts={scripts} />;
}
