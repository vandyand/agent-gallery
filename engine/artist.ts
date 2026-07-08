// An artist: genome -> a single self-contained SVG artwork.

import { chat } from "./llm";
import type { Genome } from "./types";

export function artistSystem(g: Genome): string {
  return [
    `You are ${g.name}, a generative visual artist working purely in hand-written SVG.`,
    `Your aesthetic identity (your "style genome"), which you must express faithfully:`,
    `"${g.styleDirective}"`,
    ``,
    `You care about composition, negative space, and color relationships. You are not`,
    `decorative for its own sake — every piece should feel intentional.`,
  ].join("\n");
}

export function artistUser(g: Genome): string {
  const { paletteSize, complexity, symmetry, strokeFill } = g.params;
  const elementBudget = Math.round(12 + complexity * 120); // 12..132
  return [
    `Produce ONE artwork as a single self-contained SVG.`,
    ``,
    `Hard rules (a validator will reject violations):`,
    `- Root <svg> with viewBox="0 0 1000 1000" and xmlns="http://www.w3.org/2000/svg".`,
    `- No <script>, no on* event attributes, no <foreignObject>, no external URLs`,
    `  (no http/https href, no <image>, no remote fonts). Everything self-contained.`,
    `- Use roughly ${paletteSize} distinct colors.`,
    `- Aim for about ${elementBudget} drawable elements (shapes/paths).`,
    `- Symmetry bias: ${symmetry.toFixed(2)} (0 = asymmetric/organic, 1 = strongly symmetric).`,
    `- Stroke vs fill: ${strokeFill.toFixed(2)} (0 = line-work heavy, 1 = solid fills).`,
    `- Keep total size under 45 KB.`,
    ``,
    `Compose deliberately. Use <rect>, <circle>, <ellipse>, <path>, <polygon>,`,
    `<line>, <g>, <linearGradient>/<radialGradient> as needed. A background is fine.`,
    ``,
    ...(g.feedback && g.feedback.length
      ? [
          ``,
          `The critics reviewed your previous piece. Address this feedback directly in a NEW piece —`,
          `keep your style identity, but fix what they faulted:`,
          ...g.feedback.map((f) => `  · ${f.lens} (${f.score}/10): ${f.oneLine}`),
        ]
      : []),
    ``,
    `Return ONLY the complete SVG markup — start with "<svg" and end with "</svg>".`,
    `No prose, no explanation, no markdown fences.`,
  ].join("\n");
}

// Pull an <svg>...</svg> out of a model response (strip fences/prose).
export function extractSvg(text: string): string | null {
  const fenced = text.replace(/^```(?:svg|xml|html)?\s*/i, "").replace(/```\s*$/i, "");
  const m = fenced.match(/<svg[\s\S]*<\/svg>/i);
  return m ? m[0].trim() : null;
}

export async function paint(g: Genome) {
  const result = await chat({
    model: g.model,
    system: artistSystem(g),
    user: artistUser(g),
    maxTokens: 6000,
    temperature: g.temperature,
  });
  const svg = extractSvg(result.text);
  return { svg, result, promptUsed: artistUser(g) };
}
