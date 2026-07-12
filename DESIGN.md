---
product: "The Evolving Gallery"
owner: "Andrew VanDyke"
status: "active"
last_reviewed: "2026-07-11"
implementation_roots:
  - "app/"
  - "components/"
  - "lib/run.ts"
tokens:
  color:
    canvas: "#0b0a0d"
    surface: "#17161c"
    surface_2: "#1d1b22"
    text: "#ece7f2"
    muted_text: "#a49fb0"
    faint_text: "#6f6a7d"
    border: "#2a2731"
    primary: "#c9a24b"   # gold (accent)
    primary_2: "#e0c074"
    live: "#6cc58f"      # green — a live/editable run
    danger: "#e2686f"
    matte: "#f4f1ea"     # gallery matte behind art
  radius:
    sm: "4px"
    card: "10px"
    pill: "999px"
---

# The Evolving Gallery — Design Contract

## Audience And Jobs

- **Primary user:** a portfolio visitor — a prospective client, technical peer, or recruiter.
- **Context and constraints:** arrives cold with no instructions; likely on desktop but a meaningful share on mobile; may spend 60 seconds or several minutes.
- **Primary job:** understand that this is an AI art gallery whose quality *measurably improves* (an eval harness + optimizer in disguise), be impressed, and ideally drive one evolution themselves.
- **Success means:** they grok the concept, see the fitness curve climb, and — if they engage — successfully fork or create a run and evolve at least one generation, with the art visibly changing.

## Experience Principles

1. **One active "run" is the spine.** Every view (wall, evolution graph, lineage, rejected, piece detail) renders the currently-selected run. Switching/forking/creating a run changes all of them at once.
2. **Passive first, interactive on demand.** A visitor can just watch the featured run evolve; the create/fork path is offered, never forced.
3. **Honest status.** Real model calls, real cost, real guard rejections — shown, not staged. Live actions always report progress and failure.

### Avoid

- A generic SaaS/marketing chrome on what is a work-focused tool.
- Hiding the required next step behind advanced config.
- Treating the run switcher as a power-user afterthought — it is the core mechanic and must read as such.

## Critical Journeys

### J1 · Land → understand → watch it evolve
- **Entry:** `/` (home). **Actions:** read hero → "Watch it evolve →" → `/evolution`. **Feedback:** the generational flow graph + climbing fitness curve. **Completion:** the concept lands; next action = fork or create. **Recovery:** n/a (read-only). **Evidence:** browser walkthrough + desktop/mobile screenshots.

### J2 · Fork → evolve → save
- **Entry:** `/evolution` on the featured (read-only) run. **Actions:** "⑂ Fork & evolve" → edit population → "Evolve → gen N" → "Save to library". **Feedback:** the graph *keeps its history* and a green "Editing … — your live run" card appears; live SSE progress during evolve; a new generation column with lineage edges; "✓ saved". **Completion:** a saved run in the library. **Recovery:** switch runs / start over via the header switcher; a timed-out run shows an explicit error.

### J3 · Create your own run
- **Entry:** home "Design your own ✨" or switcher "＋ New run". **Actions:** edit/✨suggest a population → "Paint generation 0" → evolve → save. **Feedback:** same live editor + graph as J2. **Completion:** a run with generations. **Recovery:** start over.

### J4 · Switch / inspect / trace lineage
- **Entry:** header run switcher (Featured / saved runs / New). **Actions:** pick a run; click any piece → inspect overlay; go to `/lineage`, pick a masterpiece → family tree. **Feedback:** all views reflect the active run; overlay shows art + critics + genome + "fork from here". **Evidence:** overlay opens for featured/saved/live pieces alike.

## Information Architecture And Language

- **Navigation model:** persistent header = brand + **run switcher** + nav (Gallery / Evolution / Lineage / Rejected / How it works). On ≤760px the nav drops to its own horizontally-scrollable row; the switcher menu is viewport-pinned.
- **Core objects:** *run* (featured | saved | live), *generation*, *piece*, *genome/style directive*, *population*, *critique*, *fitness*.
- **User-facing verbs:** watch, fork, evolve, save, inspect, trace, switch.
- **Terms to avoid in UI:** "cockpit", raw jargon without a gloss. "Genome" and "population" are kept but always shown next to plain-language context.

## Visual System

- **Typography:** Fraunces (serif display) for headings/gallery voice; Inter for UI; JetBrains Mono for data/labels.
- **Density:** museum-calm on the wall; denser on the evolution cockpit (graph + controls). One primary (gold) action per decision point.
- **Color roles:** gold = primary/featured accent; **green = live/editable run** (switcher dot + live-editor card border/heading); danger red = rejected/error; matte cream frames the art.
- **Responsive behavior:** verified at 390px and 1440px. No horizontal page overflow. Flow graph height reduces to 400px on mobile; it pans/zooms with an on-screen hint.

## Component Contracts

### Run switcher (header)
- Labeled **RUN · \<name\> ▾**; dot is gold for featured/saved, green for a live run.
- Menu groups: Featured · Your runs · ＋ New run. On mobile, `position: fixed` within viewport margins.

### Primary action (`.btn.gold`)
- One per decision point (Watch it evolve / Fork & evolve / Evolve → gen N / Paint gen 0 / Save).
- States: rest, hover, focus-visible, **disabled** (during a live run / <2 artists), **loading** (spinner + phase text + per-artist log).

### Live-evolve feedback
- Progress: spinner + "Artists are painting… / critics scoring…" + ✓/✗ per artist.
- Success: new generation column appended to the graph (continuous with carried history).
- Error: explicit inline message ("didn't finish — try again, or trim the population"); never a silent stall.

### Piece inspect overlay
- Opens from any wall/graph/lineage click for the active run. Art + fitness + critics + style genome + "⑂ Fork from gen N". Dismiss via ✕ or backdrop.

## Validation

Evidence-based per `~/.claude/skills/ux/references/validation.md`: browser walkthroughs of J1–J4 at desktop + mobile, horizontal-overflow assertion (== 0), switcher-menu-within-viewport assertion, live-evolve append + error states, keyboard access on card/overlay. Re-run the affected journey after any UI change.
