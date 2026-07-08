# Architecture decisions (auto-resolved under /goal)

Resolves SPEC §9 open questions + stack, with rationale, so the build is auditable.

| # | Decision | Rationale |
|---|----------|-----------|
| Stack | **Next.js 15 (App Router, TypeScript) full-stack**, single Vercel project. Engine in TypeScript. | Matches sibling portfolio demos (one repo, one deploy). Deviates from SPEC's "Python/FastAPI" — the competency shown is identical; single-deploy simplicity wins for a portfolio piece. |
| LLM gateway | **OpenRouter** (one key already on box; `ANTHROPIC_API_KEY` is not). | Multi-model routing (Claude Haiku artists + a 3-provider vision judge panel), and a live pricing API that directly realizes the cog-eval cost-table story (§10). |
| Models | Artists: `anthropic/claude-haiku-4.5`. Judge panel (diverse, cheap, vision): `anthropic/claude-haiku-4.5` + `google/gemini-2.5-flash` + `openai/gpt-4o-mini`. Mutation/crossover: haiku. A/B "expensive" tier: `anthropic/claude-sonnet-4.5`. | §6/§8 cost guardrails; genuinely diverse critics = 3 providers. |
| Data / persistence | Evolution is **real but precomputed offline** into committed static data (`public/data` + `public/gallery/*.svg|png`). App reads it statically. Votes + optional live evolve via API routes. | Vercel serverless can't persist SQLite; multi-gen runs exceed serverless timeouts. Precompute = real data, instant full wall (§8 no cold-start), trivial deploy — the btc-live replay pattern. Data IS real (the engine produced it). |
| §9.1 Medium | **SVG** | Deterministic, sanitizable, easy thumbnails (§9.1 chosen). |
| §9.2 Judges | **Vision judges** — rasterize SVG→PNG (resvg), judge the image with cheap multimodal models. | Judging art needs to see it; guard-first means only survivors get judged, keeping cost low (§9.2 rec). |
| §9.3 Novelty | **Structural SVG features** (element counts, palette, complexity) cosine distance for MVP. | §9.3 "start structural, upgrade if mode collapse." |
| §9.4 Genome | **Hybrid**: NL `styleDirective` + numeric knobs. | SPEC §9.4 chosen. |
| Sanitizer | **DOMPurify (SVG profile)** in the engine, resvg for rasterize. | The credible security tool, not homegrown regex — the reliability story told with the real tool. |
| Live "Evolve" (public) | Public button **replays the next precomputed generation** with live progress; a genuinely-live bounded evolve exists behind it (rate-limited, cheap, capped). | Safe/free/instant for visitors; real data behind it (§8 cost caps). |
