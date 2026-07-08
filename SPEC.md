# The Evolving Gallery — build spec

*Working title options: **Provenance** (art-provenance + genetic lineage double meaning), **Darwin's Atelier**, **Selective Pressure**, **The Curated Machine**. Pick later.*

Last updated: 2026-07-08 (Andrew + Claude)

## 1. What it is (one paragraph)

A public, live art gallery populated entirely by **artist agents**. Each artist is an LLM with an evolving "style genome" that generates a piece of code-based visual art (SVG). Every piece is scored by a panel of **AI art critics** (multi-lens rubric) *and* by human visitors (votes). An **evolutionary optimizer** then breeds the next generation: the fittest artists survive, mutate, and cross-breed into new artists, and the gallery's art visibly improves and diversifies generation over generation. A visitor watches the fitness curve climb, browses the current wall, reads the critics' commentary, votes on favorites, and can trace any masterpiece's family tree back to its ancestors.

## 2. Why this demo (positioning)

This is the flagship portfolio piece. It is fun and shareable on the surface, but underneath it demonstrates the exact competencies the highest-converting Upwork jobs are asking for:

- **Agent orchestration** — a population of agents run, judged, and bred on a schedule.
- **LLM code-generation with reliability guards** — artists emit SVG code; the harness catches broken or unsafe output before it ever reaches the wall (this is the "AI code that doesn't silently break" story, made literal).
- **Evaluation harness / judge panel** — deterministic asserts + a multi-critic LLM rubric. This is a clean-room, public rebuild of the private cog-eval measurement engine.
- **Iterative improvement / optimization loop** — the half cog-eval never had: propose → evaluate → select, with human-in-the-loop. Same genetic-evolution + judge-panel + human-final-say idea pitched for the AI Narrative job.
- **Cost-awareness** — tokens/$ tracked per generation and shown honestly.
- **Full-stack polish** — Next.js gallery front, Python/FastAPI engine back.

Serious message to a client reading it: *this person builds agent systems that measure themselves and get provably better, and won't rot silently.* Delivered on art instead of a boring enterprise workflow, so people actually remember it.

**Public-safe:** clean-room. No Ascolais references, no private data, all art is original and generated at runtime. cog-eval is the private proof-of-prior-art and design reference only.

## 3. Core domain model

- **Genome** — an artist's heritable identity:
  - `style_directive` (natural-language aesthetic identity — the main heritable trait; e.g. "brutalist geometric forms in a muted 4-color palette with heavy negative space")
  - `params` (a few numeric knobs: palette size, complexity budget, symmetry bias, stroke-vs-fill ratio)
  - `lineage` (parent genome id(s), generation number)
- **Artist** — a genome + the LLM call config (model, temperature). Produces Pieces.
- **Piece** — one artwork:
  - `svg` (the generated SVG source, sanitized)
  - `thumbnail` (rendered raster for fast gallery loads)
  - `genome_id`, `generation`, `prompt_used`, `tokens`, `cost`, `render_ok`, `sanitized_ok`
- **Critique** — one judge's verdict on a Piece: `lens`, `score` (0–10), `one_line`.
- **Fitness** — aggregate score for a Piece: weighted blend of critic scores + human votes + novelty bonus.
- **Vote** — a human like/upvote on a Piece (feeds selection).
- **Generation** — a batch: population of artists → pieces → critiques → fitness → selection → offspring.

## 4. The pipeline (one generation)

1. **Generate** — for each artist in the population, call the LLM: "You are an artist. Your style: {style_directive}. Produce a single self-contained SVG (viewBox 0 0 1000 1000, no scripts, no external refs) expressing your style. Return only the SVG." Collect tokens/cost.
2. **Guard (deterministic asserts — the reliability layer)** — for each piece:
   - parses as valid XML/SVG
   - passes sanitizer: no `<script>`, no `on*` handlers, no external `href`/`image` to remote URLs, no `foreignObject`
   - within size budget (e.g. < 50 KB)
   - has a valid `viewBox` and ≥ N drawable elements
   - renders headless without error (rasterize to thumbnail)
   - **Fail → piece is disqualified with a reason** (shown in a "rejected sketches" drawer — this IS the reliability story on display).
3. **Judge (LLM critic panel)** — 3–4 critics, each a distinct lens, score surviving pieces 0–10 with a one-line critique:
   - *Composition & balance*
   - *Color & harmony*
   - *Originality / novelty*
   - *Emotional resonance*
   - (Judges see the rendered image if using a vision model, or the SVG source + a description otherwise — see Open Questions.)
4. **Novelty pressure** — embed each piece (image or SVG-feature embedding); penalize pieces too similar to existing hall-of-fame pieces to prevent mode collapse. Diversity bonus for genuinely new directions.
5. **Fitness** — `fitness = w_critics * mean(critic_scores) + w_human * normalized_votes + w_novelty * novelty` (weights configurable; shown in UI).
6. **Select** — top-k artists survive; parents sampled by fitness (tournament or roulette).
7. **Reproduce** — build the next population:
   - **Mutation** — LLM rewrites a surviving genome's `style_directive` with a small aesthetic shift ("evolve this style directive: nudge it toward more organic forms, keep its core identity").
   - **Crossover** — LLM blends two parent directives into a coherent child identity ("merge these two artistic styles into one new style that inherits from both").
   - carry `lineage` forward.
8. **Persist** — save generation, pieces, critiques, fitness, genomes. Update hall-of-fame.

Human votes accumulated between generations are folded into fitness at step 5 of the *next* run — that is the human-in-the-loop selection pressure.

## 5. Frontend (Next.js) — the money shot

Pages / components:
- **Gallery wall** (home) — current generation's pieces as a masonry grid of rendered SVGs. Hover → fitness + per-lens critic scores. Click → detail.
- **Piece detail** — big render, the full critic panel (each judge's one-liner is fun to read), fitness breakdown, genome/style directive, "vote" button, lineage link.
- **Evolve control** — a prominent "Evolve next generation" button (human-triggered so a visitor makes it happen live), with a progress stream (generating → guarding → judging → breeding).
- **Fitness-over-generations chart** — the climbing curve. Also a cost-per-generation bar and a cost↔quality scatter (cheap model vs expensive).
- **Lineage / family tree** — trace a top piece back through mutations and crossovers to gen 0. Visually striking, communicates "evolution" instantly.
- **Rejected sketches drawer** — pieces that failed the guard, with the failure reason. This is the reliability layer made visible and is a differentiator, not an afterthought.
- **Hall of fame** — all-time best pieces across every generation.

Stack: Next.js + TypeScript, Vercel deploy, Recharts or visx for charts, SVG rendered inside sanitized/isolated containers, optimistic vote UI.

## 6. Backend (Python/FastAPI) — the engine

- **Artist runner** — Anthropic + OpenAI SDKs; default to a cheap model (Haiku / gpt-4o-mini) so a full generation is a few cents; cost tracked per call. Model is configurable per artist (part of the cost↔quality story).
- **Sanitizer + renderer** — SVG sanitize (allowlist elements/attrs; strip scripts/handlers/remote refs) and headless rasterize to thumbnail (e.g. `resvg`/`cairosvg` or a headless-browser fallback for tricky SVG).
- **Judge panel** — parallel critic calls, rubric-constrained (schema output: `{score, one_line}`), majority/mean aggregate.
- **Novelty** — image or feature embedding + cosine distance against hall-of-fame.
- **Evolution engine** — selection, mutation, crossover (LLM-driven genome ops), lineage bookkeeping.
- **Persistence** — Postgres (or SQLite for MVP): genomes, pieces (SVG as text), critiques, fitness, votes, generations. Diffable run history (cog-eval's EDN-run + compare idea, ported to rows).
- **Job orchestration** — a generation run is a background task with a progress stream (SSE/websocket) the frontend subscribes to.

## 7. Build phases

**Phase 0 — skeleton (½ day)**
Repo scaffold, FastAPI + Next.js, DB schema, one hardcoded genome, one LLM call producing one SVG, rendered on a page. Prove the loop end-to-end with N=1.

**Phase 1 — MVP: measure (2–3 days)**
- Population of ~8 artists with seed genomes.
- Full guard layer (sanitize + render + asserts) with rejected-sketches drawer.
- Judge panel (3 critics, rubric output) → fitness.
- Gallery wall + piece detail + critic panels.
- One generation runs on demand; results persisted.
- *Deliverable: a gallery of judged, safe AI art with visible scoring. Proves the measurement/reliability half.*

**Phase 2 — flagship: evolve (3–4 days)**
- Selection + mutation + crossover engine.
- Multi-generation runs; fitness-over-generations chart climbing.
- Human voting folded into selection.
- Lineage family tree.
- Novelty pressure.
- Live "Evolve next generation" button with progress stream.
- *Deliverable: the money shot — art visibly improving generation over generation, human-in-the-loop.*

**Phase 3 — polish + lead magnet (1–2 days)**
- Cost dashboard, hall of fame, model A/B (Haiku vs Sonnet), share cards (OG images of top pieces).
- **Stretch:** let a visitor submit their own `style_directive` and watch it get bred and optimized — turns the demo into a lead capture.

## 8. Cost / safety guardrails

- Cap population size and generations-per-hour; default cheap model; hard per-day $ ceiling on the API keys.
- All artist output passes the sanitizer before storage or render; SVG only, no script execution client-side.
- Rate-limit the public "Evolve" and vote buttons; queue rather than run unbounded generations.
- Seed a small starter population so first-time visitors see a full wall instantly (no cold-start blank gallery).

## 9. Open questions (resolve before/early in build)

1. **Medium:** SVG (chosen — deterministic, safe-able, prints, easy thumbnails) vs p5.js/canvas in a sandboxed iframe (more dynamic/generative, riskier). Recommend SVG for MVP; p5.js-in-sandbox as a later medium option.
2. **Do judges see the image or the code?** Vision-model judges (score the rendered raster — truer to "art") cost more; text judges (score the SVG source) are cheaper but blind to visual gestalt. Recommend vision judges on the cheap tier, with a text-only fallback.
3. **Novelty embedding:** image embeddings (CLIP-style) vs cheap SVG-structural features. Start structural, upgrade to image embeddings if mode collapse shows.
4. **Genome representation:** pure natural-language directive (max creativity, LLM-mutatable) vs structured params (cleaner crossover). Chosen: hybrid — NL directive + a few numeric knobs.
5. **Determinism:** fix seeds/temperature for reproducible generations, or embrace stochasticity? Recommend a "reproduce this generation" mode for the eval story, stochastic by default for variety.

## 10. Reuse from cog-eval (design reference, private — do NOT reference publicly)

- Scenario/assertion → here becomes guard-asserts on pieces.
- Cost table + OpenRouter live-price fallback → port the concept for the cost dashboard.
- Run persistence + A/B compare (improved/regressed/unchanged) → generation-to-generation diff.
- Config fingerprinting (hash of config + resolved prompt) → genome fingerprinting for lineage/dedup.
