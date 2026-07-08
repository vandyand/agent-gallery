# Retro — The Evolving Gallery

Built end-to-end in one `/goal` run (plan → implement P0–P3 → deploy → validate).

## TL;DR (forward inference)

The demo succeeds because it makes an abstract competency — "I build agent systems
that measure themselves and provably improve" — *visible and shareable* as art.
The single highest-leverage decision was making the optimizer **critic-steered**:
artists repaint while seeing their own prior critiques. That one in-context loop
is what turned a flat, noisy fitness signal into a real climb (critic quality
5.4 → 6.5 over 8 generations) — and it's the honest embodiment of measure→improve,
not a staged animation.

## What worked

- **Vertical slice first (P0).** One genome → SVG → guard → rasterize → page,
  proven before building a population. Caught the resvg/DOMPurify/OpenRouter
  integration early and cheaply.
- **OpenRouter over a single-vendor SDK.** One key gave a genuinely diverse
  3-provider judge panel *and* a live price table for honest cost accounting —
  the cost story fell out for free.
- **Precomputed-but-real data.** Running the engine offline and committing the
  output (SVGs + PNGs + JSON) meant a static, secret-free Vercel deploy with a
  full wall on first paint — the btc-live replay pattern, applied again.
- **Guard as a first-class feature.** Treating the reliability layer as visible
  UI (rejected drawer + a guard checklist on every piece) turned "boring
  validation" into the differentiator the positioning needed.

## What surprised me

- **The first evolution run went DOWN, not up.** Diagnosis, not panic: novelty
  was measured against a growing hall-of-fame, so it decayed every generation and
  masked the real quality gain. Fix: novelty = intra-generation diversity only.
  Lesson — when a metric trends the wrong way, decompose it before touching the
  optimizer.
- **Critic-steered mutation alone wasn't enough** to climb; the climb needed the
  feedback fed into the *artist's* next painting (in-context refinement), not just
  the genome's directive. The generator, not the selector, was where the signal
  lived.
- **Higher token budget removed all rejections.** At 8000 tokens nothing
  truncated, emptying the reliability drawer. Landed at 6000 as an honest middle:
  most dense art survives, a few genuinely fail. Don't over-tune away the failures
  you're trying to showcase.

## Empirical metrics (live 8-generation run)

| Metric | Value |
|---|---|
| Critic quality (gen 0 → 7) | 5.4 → 6.5 |
| Blended fitness (gen 0 → 7) | 4.38 → 4.98 |
| Novelty (gen 0 → 7) | 4.2 → 3.0 (converging) |
| Pieces generated / rejected | 64 / 2 |
| Model A/B | Haiku $0.022/pc @ 5.1 · Sonnet $0.044/pc @ 5.5 |
| Total engine spend | $1.58 |
| Deploy | static, zero runtime secrets |

## Deviations from the spec / process

- **Stack:** SPEC said Python/FastAPI backend; used TypeScript full-stack for a
  single-repo, single-deploy portfolio piece (same competency, simpler deploy).
- **Live "Evolve" button:** public button replays the precomputed real run with
  staged progress (safe, free, instant) rather than firing live API calls.
- **No PR/CI polish phase:** this is direct-to-branch portfolio work, not a
  PR workflow, so `/feature polish`'s CI-review loop was replaced by continuous
  build + live end-to-end validation.

## Open follow-ups

- Repo is **private**; make public to enable the portfolio "Source" link (matches
  the other demos).
- Portfolio case study is committed locally (`content/projects/the-evolving-gallery.mdx`,
  `order: 1`) but not yet pushed/deployed — pending the user's call on featured
  ordering and publish timing.
- Votes are in-memory; wire Vercel KV if live human-in-the-loop selection is wanted.
- Optional: p5.js-in-sandbox as a second medium; image-embedding novelty if mode
  collapse becomes visible over longer runs.
