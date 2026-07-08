// The reliability layer, made literal. Every generated SVG runs this gauntlet
// before it can reach the wall. Failures are disqualified WITH A REASON and
// shown in the "rejected sketches" drawer — the "AI code that doesn't silently
// break" story on display (SPEC §4 step 2).

import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import { Resvg } from "@resvg/resvg-js";
import type { GuardCheck, GuardResult } from "./types";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window as unknown as Parameters<typeof createDOMPurify>[0]);

const MIN_ELEMENTS = 5;
const MAX_BYTES = 50 * 1024;
const DRAWABLE = ["path", "rect", "circle", "ellipse", "line", "polyline", "polygon"];

// Patterns an attacker (or a hallucinating model) could smuggle in. Presence =
// hard reject; we don't silently clean, because the rejection IS the story.
const UNSAFE: { name: string; re: RegExp }[] = [
  { name: "<script>", re: /<script[\s>]/i },
  { name: "event handler (on*=)", re: /\son\w+\s*=/i },
  { name: "<foreignObject>", re: /<foreignObject[\s>]/i },
  { name: "external URL", re: /(?:href|src)\s*=\s*["']?\s*(?:https?:|\/\/)/i },
  { name: "<image> ref", re: /<image[\s>]/i },
  { name: "javascript: URI", re: /javascript\s*:/i },
];

export type GuardOutput = {
  guard: GuardResult;
  sanitizedSvg?: string; // present only when guard.ok
  png?: Buffer; // rasterized thumbnail, present only when guard.ok
};

function fail(checks: GuardCheck[], reason: string, bytes = 0, elements = 0): GuardOutput {
  return { guard: { ok: false, checks, reason, bytes, elements } };
}

export function guard(rawSvg: string | null): GuardOutput {
  const checks: GuardCheck[] = [];

  if (!rawSvg) {
    return fail([{ name: "produced SVG", ok: false, detail: "no <svg> found in output" }], "no SVG in model output");
  }

  const bytes = Buffer.byteLength(rawSvg, "utf8");

  // 1. size budget
  const sizeOk = bytes <= MAX_BYTES;
  checks.push({ name: "under 50 KB", ok: sizeOk, detail: `${(bytes / 1024).toFixed(1)} KB` });
  if (!sizeOk) return fail(checks, `too large (${(bytes / 1024).toFixed(1)} KB)`, bytes);

  // 2. safety scan (defense: reject, don't silently clean)
  for (const u of UNSAFE) {
    const bad = u.re.test(rawSvg);
    checks.push({ name: `no ${u.name}`, ok: !bad });
    if (bad) return fail(checks, `unsafe: contains ${u.name}`, bytes);
  }

  // 3. well-formed XML/SVG
  const doc = new window.DOMParser().parseFromString(rawSvg, "image/svg+xml");
  const parseErr = doc.querySelector("parsererror");
  const root = doc.documentElement;
  const wellFormed = !parseErr && root && root.nodeName.toLowerCase() === "svg";
  checks.push({ name: "parses as SVG", ok: !!wellFormed });
  if (!wellFormed) return fail(checks, "malformed SVG (XML parse error)", bytes);

  // 4. has a viewBox
  const hasViewBox = !!root.getAttribute("viewBox");
  checks.push({ name: "has viewBox", ok: hasViewBox });
  if (!hasViewBox) return fail(checks, "missing viewBox", bytes);

  // 5. enough drawable content
  const elements = DRAWABLE.reduce((n, tag) => n + doc.getElementsByTagName(tag).length, 0);
  const enough = elements >= MIN_ELEMENTS;
  checks.push({ name: `>= ${MIN_ELEMENTS} shapes`, ok: enough, detail: `${elements} shapes` });
  if (!enough) return fail(checks, `too few shapes (${elements})`, bytes, elements);

  // 6. sanitize (defense in depth) — must survive with content intact
  const sanitizedSvg = DOMPurify.sanitize(rawSvg, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
  const sanitizedElements = DRAWABLE.reduce(
    (n, tag) =>
      n + new window.DOMParser().parseFromString(sanitizedSvg, "image/svg+xml").getElementsByTagName(tag).length,
    0,
  );
  const survived = sanitizedElements >= MIN_ELEMENTS && /<svg[\s>]/i.test(sanitizedSvg);
  checks.push({ name: "survives sanitizer", ok: survived });
  if (!survived) return fail(checks, "emptied by sanitizer", bytes, elements);

  // 7. renders headless without error
  let png: Buffer;
  try {
    const r = new Resvg(sanitizedSvg, {
      fitTo: { mode: "width", value: 640 },
      background: "rgba(255,255,255,1)",
    });
    png = Buffer.from(r.render().asPng());
    checks.push({ name: "renders (resvg)", ok: true });
  } catch (e) {
    checks.push({ name: "renders (resvg)", ok: false, detail: String(e).slice(0, 120) });
    return fail(checks, "render error", bytes, elements);
  }

  return { guard: { ok: true, checks, bytes, elements }, sanitizedSvg, png };
}
