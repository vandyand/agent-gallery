// Novelty pressure (MVP: structural features, SPEC §9.3). A piece that looks
// structurally unlike everything already on the wall earns a diversity bonus;
// near-duplicates are penalized — this is what keeps evolution from collapsing
// onto one winning motif.

const ELEMENT_TYPES = ["path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "g"];

export function featureVector(svg: string): number[] {
  // element-type histogram
  const counts = ELEMENT_TYPES.map((t) => (svg.match(new RegExp(`<${t}[\\s>]`, "gi")) ?? []).length);
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const hist = counts.map((c) => c / total);

  // palette breadth
  const colors = new Set((svg.match(/#[0-9a-f]{3,8}\b/gi) ?? []).map((c) => c.toLowerCase()));
  const gradients = (svg.match(/<(linear|radial)Gradient/gi) ?? []).length;

  return [
    ...hist,
    Math.min(colors.size / 12, 1),
    Math.min(gradients / 6, 1),
    Math.min(total / 150, 1),
  ];
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// 0–10: 10 = unlike anything seen; low = near-duplicate of an existing piece.
export function noveltyScore(vec: number[], priors: number[][]): number {
  if (priors.length === 0) return 7; // baseline for gen 0
  let maxSim = 0;
  for (const p of priors) maxSim = Math.max(maxSim, cosine(vec, p));
  return Math.max(0, Math.min(10, (1 - maxSim) * 10 + 3));
}
