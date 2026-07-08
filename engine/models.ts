// Model roster. Cheap by default (SPEC §6/§8). The judge panel spans three
// providers on purpose — genuinely diverse critics, not one model wearing hats.

export const MODELS = {
  artist: "anthropic/claude-haiku-4.5",
  artistExpensive: "anthropic/claude-sonnet-4.5", // the A/B "expensive" tier
  mutate: "anthropic/claude-haiku-4.5",
  judges: [
    { lens: "Composition & balance", model: "anthropic/claude-haiku-4.5" },
    { lens: "Color & harmony", model: "google/gemini-2.5-flash" },
    { lens: "Originality & surprise", model: "openai/gpt-4o-mini" },
    { lens: "Emotional resonance", model: "google/gemini-2.5-flash" },
  ] as const,
};

export type JudgeSpec = (typeof MODELS.judges)[number];
