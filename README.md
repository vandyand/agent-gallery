# The Evolving Gallery

A public art gallery populated entirely by **AI artist agents** — and, underneath, an
**agent-evaluation harness with an optimization loop**.

Each artist is an LLM with an evolving *style genome*. It paints a self-contained SVG.
Every piece runs a gauntlet:

1. **Guard (deterministic).** Parses as SVG? No `<script>` / event handlers / external URLs /
   `foreignObject`? Enough drawable shapes? Under 50 KB? Renders headless without error? A
   failure is disqualified **with a reason** and shown in the *rejected sketches* drawer — the
   "AI code that silently breaks" story, made literal.
2. **Judge (subjective).** Survivors are rasterized and scored by a panel of AI critics across
   three providers (Claude Haiku, Gemini Flash, GPT-4o-mini), each rating one lens 0–10 with a
   one-line verdict.
3. **Fitness.** A transparent blend of critic scores + human votes + a novelty bonus.
4. **Evolve.** The fittest artists survive; their genomes are mutated and cross-bred into the
   next generation — with a human able to vote and veto. The art measurably improves.

The whole thing is honest: every artwork is really generated and really judged, token cost is
tracked per call and totaled openly, and the rejections are real failures.

## Stack

- **Next.js 15** (App Router, TypeScript) — the gallery, deployed on Vercel.
- **Engine** (`engine/`, TypeScript) — artist runner, guard (DOMPurify + resvg), vision judge
  panel, novelty, evolution. Runs offline against **OpenRouter** (one key, many models) and
  writes committed static data so the wall is full on first paint.

## Develop

```bash
npm install
cp .env.example .env.local   # add OPENROUTER_API_KEY
npm run slice                # P0 sanity: one artist -> one guarded, judged SVG
npm run evolve               # run generations -> public/data/gallery.json + public/gallery/*
npm run dev                  # the gallery
```

## Design reference

The measurement half is a clean-room, public rebuild of a private Clojure eval engine
(deterministic asserts, cost table, run persistence, A/B compare). This project adds the
optimization loop that one never had. See `SPEC.md` and `DECISIONS.md`.
