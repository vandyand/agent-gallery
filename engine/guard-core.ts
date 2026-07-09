// Pure-JS guard for the SERVERLESS path (live evolve). No native resvg, no
// jsdom — so the API bundle stays light and portable. It runs the same safety +
// structure checks as the full offline guard; it just skips the headless render
// (the browser renders the sanitized SVG via <img>, which never executes script)
// and the heavyweight DOMPurify pass (the regex safety reject below is a hard
// fail on any dangerous construct).

import type { GuardCheck, GuardResult } from "./types";

const MIN_ELEMENTS = 5;
const MAX_BYTES = 50 * 1024;
const DRAWABLE = ["path", "rect", "circle", "ellipse", "line", "polyline", "polygon"];

const UNSAFE: { name: string; re: RegExp }[] = [
  { name: "<script>", re: /<script[\s>]/i },
  { name: "event handler (on*=)", re: /\son\w+\s*=/i },
  { name: "<foreignObject>", re: /<foreignObject[\s>]/i },
  { name: "external URL", re: /(?:href|src)\s*=\s*["']?\s*(?:https?:|\/\/)/i },
  { name: "<image> ref", re: /<image[\s>]/i },
  { name: "javascript: URI", re: /javascript\s*:/i },
];

export function extractSvg(text: string): string | null {
  const fenced = text.replace(/^```(?:svg|xml|html)?\s*/i, "").replace(/```\s*$/i, "");
  const m = fenced.match(/<svg[\s\S]*<\/svg>/i);
  return m ? m[0].trim() : null;
}

export type CoreResult = { guard: GuardResult; svg?: string };

function fail(checks: GuardCheck[], reason: string, bytes = 0, elements = 0): CoreResult {
  return { guard: { ok: false, checks, reason, bytes, elements } };
}

export function guardCore(rawText: string | null): CoreResult {
  const checks: GuardCheck[] = [];
  const svg = rawText ? extractSvg(rawText) : null;
  if (!svg) return fail([{ name: "produced SVG", ok: false }], "no SVG in model output");

  const bytes = Buffer.byteLength(svg, "utf8");
  const sizeOk = bytes <= MAX_BYTES;
  checks.push({ name: "under 50 KB", ok: sizeOk, detail: `${(bytes / 1024).toFixed(1)} KB` });
  if (!sizeOk) return fail(checks, `too large (${(bytes / 1024).toFixed(1)} KB)`, bytes);

  for (const u of UNSAFE) {
    const bad = u.re.test(svg);
    checks.push({ name: `no ${u.name}`, ok: !bad });
    if (bad) return fail(checks, `unsafe: contains ${u.name}`, bytes);
  }

  const hasSvgTag = /<svg[\s>]/i.test(svg) && /<\/svg>/i.test(svg);
  checks.push({ name: "well-formed <svg>", ok: hasSvgTag });
  if (!hasSvgTag) return fail(checks, "malformed SVG", bytes);

  const hasViewBox = /viewBox\s*=/.test(svg);
  checks.push({ name: "has viewBox", ok: hasViewBox });
  if (!hasViewBox) return fail(checks, "missing viewBox", bytes);

  const elements = DRAWABLE.reduce((n, tag) => n + (svg.match(new RegExp(`<${tag}[\\s>]`, "gi")) ?? []).length, 0);
  const enough = elements >= MIN_ELEMENTS;
  checks.push({ name: `>= ${MIN_ELEMENTS} shapes`, ok: enough, detail: `${elements} shapes` });
  if (!enough) return fail(checks, `too few shapes (${elements})`, bytes, elements);

  return { guard: { ok: true, checks, bytes, elements }, svg };
}
