// Load .env.local into process.env for engine scripts run via tsx.
// (Next.js loads it for the app automatically; standalone scripts don't.)
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const f = join(process.cwd(), ".env.local");
if (existsSync(f)) {
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
