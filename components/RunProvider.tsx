"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Genome } from "@/engine/types";
import type { LivePiece } from "@/engine/live";
import { adaptFeatured, adaptStored, serializeRun, svgToUrl, type Run, type RunGenome } from "@/lib/run";
import { clientSeed } from "@/lib/liveFlow";

type LibItem = { id: string; name: string; gens: number; createdAt: string };
type LogLine = { artist: string; ok: boolean; reason?: string };

type RunCtx = {
  run: Run | null;
  loading: boolean;
  library: LibItem[];
  isLive: boolean;
  population: RunGenome[];
  running: boolean;
  phase: string | null;
  log: LogLine[];
  error: string | null;
  saving: boolean;
  saveMsg: string | null;
  selectedPieceId: string | null;
  selectFeatured: () => void;
  openSaved: (id: string) => Promise<void>;
  newRun: (directives: { name: string; styleDirective: string }[]) => void;
  fork: (src: Run, genIndex: number) => void;
  forkActive: (genIndex: number) => void;
  addMember: (name: string, directive: string) => void;
  removeMember: (id: string) => void;
  evolve: () => Promise<void>;
  save: (name: string) => Promise<void>;
  select: (pieceId: string | null) => void;
  refreshLibrary: () => Promise<void>;
};

const Ctx = createContext<RunCtx | null>(null);
export const useRun = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRun must be used inside <RunProvider>");
  return c;
};

export function RunProvider({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState<Run | null>(null);
  const featuredRef = useRef<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [library, setLibrary] = useState<LibItem[]>([]);
  const [population, setPopulation] = useState<RunGenome[]>([]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

  const isLive = run?.source === "live";

  const refreshLibrary = useCallback(async () => {
    try {
      const r = await fetch("/api/runs");
      const j = await r.json();
      setLibrary(j.runs ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/data/gallery.json");
        const fr = adaptFeatured(await r.json());
        featuredRef.current = fr;
        setRun(fr);
      } catch {
        setError("Could not load the featured gallery.");
      }
      setLoading(false);
    })();
    refreshLibrary();
  }, [refreshLibrary]);

  const selectFeatured = useCallback(() => {
    if (featuredRef.current) {
      setRun(featuredRef.current);
      setPopulation([]);
      setSelectedPieceId(null);
      setError(null);
      setSaveMsg(null);
    }
  }, []);

  const openSaved = useCallback(async (id: string) => {
    setSelectedPieceId(null);
    setError(null);
    setSaveMsg(null);
    try {
      const r = await fetch(`/api/runs/${id}`);
      if (!r.ok) return setError("Couldn't open that run.");
      setRun(adaptStored(await r.json(), "saved"));
      setPopulation([]);
    } catch {
      setError("Couldn't open that run.");
    }
  }, []);

  const newRun = useCallback((directives: { name: string; styleDirective: string }[]) => {
    const seeds = directives.filter((d) => d.styleDirective.trim().length >= 8).map((d) => clientSeed(d.name, d.styleDirective));
    if (seeds.length < 2) return;
    setRun({ id: "live", name: "New run", source: "live", generations: [], genomeById: Object.fromEntries(seeds.map((g) => [g.id, g as RunGenome])) });
    setPopulation(seeds as RunGenome[]);
    setSelectedPieceId(null);
    setError(null);
    setSaveMsg(null);
  }, []);

  const fork = useCallback((src: Run, genIndex: number) => {
    const gens = src.generations.slice(0, genIndex + 1).map((g) => ({ n: g.n, pieces: g.pieces.map((p) => ({ ...p })) }));
    const genomeById = { ...src.genomeById };
    const survivors = gens[genIndex]?.pieces.filter((p) => !p.disqualified) ?? [];
    const pop = survivors.map((p) => genomeById[p.genomeId]).filter(Boolean) as RunGenome[];
    setRun({ id: "live", name: `Fork of ${src.name}`, source: "live", generations: gens, genomeById });
    setPopulation(pop);
    setSelectedPieceId(null);
    setError(null);
    setSaveMsg(null);
  }, []);

  const forkActive = useCallback((genIndex: number) => { if (run) fork(run, genIndex); }, [run, fork]);

  const addMember = useCallback((name: string, directive: string) => {
    if (directive.trim().length < 8) return;
    const g = clientSeed(name, directive);
    setRun((r) => (r ? { ...r, genomeById: { ...r.genomeById, [g.id]: g as RunGenome } } : r));
    setPopulation((p) => (p.length >= 6 ? p : [...p, g as RunGenome]));
  }, []);

  const removeMember = useCallback((id: string) => {
    setPopulation((p) => (p.length <= 2 ? p : p.filter((g) => g.id !== id)));
  }, []);

  const evolve = useCallback(async () => {
    if (!run || population.length < 2 || running) return;
    setRunning(true);
    setError(null);
    setLog([]);
    setPhase("starting");
    try {
      const res = await fetch("/api/evolve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ genomes: population }) });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        setError(j.message || `The live engine returned ${res.status}.`);
        setPhase(null);
        setRunning(false);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let gotDone = false;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.replace(/^data:\s?/, "").trim();
          if (!line) continue;
          let e: Record<string, unknown>;
          try {
            e = JSON.parse(line);
          } catch {
            continue;
          }
          if (e.type === "start") setPhase("painting");
          else if (e.type === "painted") setLog((l) => [...l, { artist: e.artist as string, ok: e.ok as boolean, reason: e.reason as string }]);
          else if (e.type === "judging") setPhase("judging");
          else if (e.type === "done") {
            gotDone = true;
            const pieces = e.pieces as LivePiece[];
            const nextGenomes = e.nextGenomes as Genome[];
            setRun((r) => {
              if (!r) return r;
              const gi = r.generations.length;
              const newGen = {
                n: gi,
                pieces: pieces.map((p) => ({
                  id: p.id,
                  genomeId: p.genomeId,
                  artist: p.artist,
                  gen: gi,
                  art: p.svg ? svgToUrl(p.svg) : "",
                  svg: p.svg,
                  op: p.op,
                  fit: Number((p.fit ?? 0).toFixed(2)),
                  critics: Number((p.critics ?? 0).toFixed(2)),
                  critiques: (p.critiques ?? []).map((c) => ({ lens: c.lens, score: c.score, oneLine: c.oneLine })),
                  disqualified: !p.guardOk,
                  reason: p.reason,
                })),
              };
              const genomeById = { ...r.genomeById };
              for (const ng of nextGenomes) genomeById[ng.id] = ng as RunGenome;
              return { ...r, generations: [...r.generations, newGen], genomeById };
            });
            setPopulation(nextGenomes as RunGenome[]);
            setPhase(null);
          } else if (e.type === "error") setError(e.message as string);
        }
      }
      if (!gotDone) setError("The live run didn’t finish — it may have hit the time limit. Try again, or trim the population to 3–4 artists.");
    } catch (err) {
      setError(String(err));
    }
    setPhase(null);
    setRunning(false);
  }, [run, population, running]);

  const save = useCallback(async (name: string) => {
    if (!run || !run.generations.length || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(serializeRun({ ...run, name: name || run.name })) });
      const j = await res.json();
      if (res.ok && j.id) {
        setRun((r) => (r ? { ...r, id: j.id, name: name || r.name } : r));
        setSaveMsg("saved");
        refreshLibrary();
      } else setSaveMsg(j.message || j.error || "save failed");
    } catch (e) {
      setSaveMsg(String(e));
    }
    setSaving(false);
  }, [run, saving, refreshLibrary]);

  const select = useCallback((id: string | null) => setSelectedPieceId(id), []);

  return (
    <Ctx.Provider
      value={{ run, loading, library, isLive, population, running, phase, log, error, saving, saveMsg, selectedPieceId, selectFeatured, openSaved, newRun, fork, forkActive, addMember, removeMember, evolve, save, select, refreshLibrary }}
    >
      {children}
    </Ctx.Provider>
  );
}
