// Zero-dependency run store for The Evolving Gallery.
//
// Runs on the Hetzner box, ISOLATED from the teardown Supabase stack (which does
// `supabase db reset` every 2h) — plain JSON files under ./data, never touched
// by that reset. Fronted by Caddy TLS at gallery-api.vandykeportfolio.com and
// called only server-to-server from the Vercel app (bearer token on writes).
//
//   GET    /health
//   GET    /runs          -> list summaries (public)
//   GET    /runs/:id      -> full run (public)
//   POST   /runs          -> save a run (Bearer)   { name, generations, population, forkedFrom }
//   DELETE /runs/:id      -> delete (Bearer)

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 8790;
const TOKEN = process.env.GALLERY_STORE_TOKEN || "";
const MAX_RUNS = Number(process.env.GALLERY_MAX_RUNS || 300);
const MAX_BODY = 12 * 1024 * 1024; // 12 MB
const DATA = path.join(__dirname, "data");
const INDEX = path.join(DATA, "index.json");

fs.mkdirSync(DATA, { recursive: true });
if (!fs.existsSync(INDEX)) fs.writeFileSync(INDEX, "[]");

const readIndex = () => {
  try {
    return JSON.parse(fs.readFileSync(INDEX, "utf8"));
  } catch {
    return [];
  }
};
const writeIndex = (x) => fs.writeFileSync(INDEX, JSON.stringify(x));
const send = (res, code, obj) => {
  res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": "*" });
  res.end(JSON.stringify(obj));
};
const authed = (req) => TOKEN && (req.headers.authorization || "") === `Bearer ${TOKEN}`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const parts = url.pathname.split("/").filter(Boolean);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,DELETE",
      "access-control-allow-headers": "authorization,content-type",
    });
    return res.end();
  }

  if (url.pathname === "/health") return send(res, 200, { ok: true, runs: readIndex().length });

  // /runs
  if (parts[0] === "runs" && parts.length === 1) {
    if (req.method === "GET") {
      return send(res, 200, { runs: readIndex().sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
    }
    if (req.method === "POST") {
      if (!authed(req)) return send(res, 401, { error: "unauthorized" });
      let body = "";
      let tooBig = false;
      req.on("data", (c) => {
        body += c;
        if (body.length > MAX_BODY) {
          tooBig = true;
          req.destroy();
        }
      });
      req.on("end", () => {
        if (tooBig) return send(res, 413, { error: "too_large" });
        try {
          const run = JSON.parse(body);
          const id = crypto.randomBytes(6).toString("hex");
          const createdAt = new Date().toISOString();
          const rec = {
            id,
            name: String(run.name || "Untitled run").slice(0, 80),
            createdAt,
            gens: (run.generations || []).length,
            forkedFrom: run.forkedFrom || null,
          };
          fs.writeFileSync(
            path.join(DATA, id + ".json"),
            JSON.stringify({ ...rec, generations: run.generations || [], population: run.population || [] }),
          );
          let idx = readIndex();
          idx.push(rec);
          // evict oldest beyond the cap
          if (idx.length > MAX_RUNS) {
            idx.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
            const drop = idx.slice(0, idx.length - MAX_RUNS);
            for (const d of drop) {
              try {
                fs.unlinkSync(path.join(DATA, d.id + ".json"));
              } catch {}
            }
            idx = idx.slice(idx.length - MAX_RUNS);
          }
          writeIndex(idx);
          return send(res, 200, { id, ...rec });
        } catch (e) {
          return send(res, 400, { error: "bad_run", message: String(e) });
        }
      });
      return;
    }
  }

  // /runs/:id
  if (parts[0] === "runs" && parts.length === 2) {
    const id = parts[1].replace(/[^a-f0-9]/g, "");
    const file = path.join(DATA, id + ".json");
    if (req.method === "GET") {
      if (!fs.existsSync(file)) return send(res, 404, { error: "not_found" });
      return send(res, 200, JSON.parse(fs.readFileSync(file, "utf8")));
    }
    if (req.method === "DELETE") {
      if (!authed(req)) return send(res, 401, { error: "unauthorized" });
      try {
        fs.unlinkSync(file);
      } catch {}
      writeIndex(readIndex().filter((r) => r.id !== id));
      return send(res, 200, { ok: true });
    }
  }

  send(res, 404, { error: "not_found" });
});

server.listen(PORT, () => console.log("gallery-store listening on :" + PORT));
