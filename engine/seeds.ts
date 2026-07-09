// Generation 0 — a diverse starter population so the first-time visitor sees a
// full, varied wall instantly (SPEC §8 no cold-start). Invented artist personas;
// style directives describe aesthetics/movements (not copyrightable) — all art
// is generated original at runtime.

import { MODELS } from "./models";
import type { Genome } from "./types";

type Seed = { name: string; styleDirective: string; params: Genome["params"] };

const SEEDS: Seed[] = [
  {
    name: "Bauhau",
    styleDirective:
      "brutalist geometric forms — hard rectangles and circles in a muted 4-color palette with heavy negative space and one bold diagonal",
    params: { paletteSize: 4, complexity: 0.3, symmetry: 0.4, strokeFill: 0.85 },
  },
  {
    name: "Seraphine",
    styleDirective:
      "mystic organic symmetry — botanical spirals and mandala petals in soft dawn pastels, delicate and radiant",
    params: { paletteSize: 6, complexity: 0.7, symmetry: 0.95, strokeFill: 0.4 },
  },
  {
    name: "Moiré",
    styleDirective:
      "op-art line fields — dense concentric and interfering stroke patterns in high-contrast black and white with a single electric accent",
    params: { paletteSize: 3, complexity: 0.8, symmetry: 0.7, strokeFill: 0.05 },
  },
  {
    name: "Quadra",
    styleDirective:
      "rule-based color grid — a lattice of flat color blocks following a hidden algorithm, primary palette, crisp and systematic",
    params: { paletteSize: 5, complexity: 0.5, symmetry: 0.6, strokeFill: 1.0 },
  },
  {
    name: "Cadence",
    styleDirective:
      "lyrical jazz abstraction — floating overlapping shapes with improvisational energy in a warm amber-teal-rust palette",
    params: { paletteSize: 6, complexity: 0.6, symmetry: 0.2, strokeFill: 0.7 },
  },
  {
    name: "Umbra",
    styleDirective:
      "soft color-field minimalism — two or three large brooding rectangles of luminous color with feathered edges and quiet tension",
    params: { paletteSize: 3, complexity: 0.15, symmetry: 0.5, strokeFill: 1.0 },
  },
  {
    name: "Tessel",
    styleDirective:
      "interlocking tessellation — a repeating tiled motif that fits together seamlessly, tonal monochrome with subtle value shifts",
    params: { paletteSize: 4, complexity: 0.75, symmetry: 0.85, strokeFill: 0.6 },
  },
  {
    name: "Vesper",
    styleDirective:
      "obsessive dot fields — infinity-net polka patterns swelling and receding across the plane in bold red, white and black",
    params: { paletteSize: 3, complexity: 0.9, symmetry: 0.3, strokeFill: 0.9 },
  },
];

let counter = 0;
export function genomeId(): string {
  counter += 1;
  return `g${Date.now().toString(36)}${counter.toString(36)}`;
}

// Build a single gen-0 seed genome from a name + directive (init-flow / live).
export function makeSeed(name: string, styleDirective: string, params?: Partial<Genome["params"]>): Genome {
  return {
    id: genomeId(),
    name: name.slice(0, 24) || "Untitled",
    styleDirective: styleDirective.slice(0, 400),
    params: {
      paletteSize: params?.paletteSize ?? 5,
      complexity: params?.complexity ?? 0.5,
      symmetry: params?.symmetry ?? 0.5,
      strokeFill: params?.strokeFill ?? 0.7,
    },
    lineage: { parents: [], generation: 0, op: "seed" },
    model: MODELS.artist,
    temperature: 0.95,
  };
}

export function seedGenomes(): Genome[] {
  return SEEDS.map((s) => ({
    id: genomeId(),
    name: s.name,
    styleDirective: s.styleDirective,
    params: s.params,
    lineage: { parents: [], generation: 0, op: "seed" },
    model: MODELS.artist,
    temperature: 0.95,
  }));
}
