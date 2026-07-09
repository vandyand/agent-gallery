"use client";

import { useCallback, useRef, useState } from "react";
import type { Genome } from "@/engine/types";
import { clientSeed, buildLiveFlow, type LiveGen } from "@/lib/liveFlow";

export function useWorkbench() {
  const [population, setPopulation] = useState<Genome[]>([]);
  const [generations, setGenerations] = useState<LiveGen[]>([]);
  const genomeMap = useRef<Map<string, Genome>>(new Map());
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [log, setLog] = useState<{ artist: string; ok: boolean; reason?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const init = useCallback((genomes: Genome[], runName = "") => {
    genomeMap.current = new Map(genomes.map((g) => [g.id, g]));
    setPopulation(genomes);
    setGenerations([]);
    setError(null);
    setRunId(null);
    setName(runName);
    setStarted(true);
  }, []);

  const startFresh = useCallback(
    (directives: { name: string; styleDirective: string }[]) => {
      init(directives.map((d) => clientSeed(d.name, d.styleDirective)));
    },
    [init],
  );

  const reset = useCallback(() => {
    genomeMap.current = new Map();
    setPopulation([]);
    setGenerations([]);
    setStarted(false);
    setError(null);
    setRunId(null);
    setName("");
  }, []);

  const addMember = useCallback((n: string, styleDirective: string) => {
    if (styleDirective.trim().length < 8) return;
    const g = clientSeed(n, styleDirective);
    genomeMap.current.set(g.id, g);
    setPopulation((p) => (p.length >= 6 ? p : [...p, g]));
  }, []);

  const removeMember = useCallback((id: string) => {
    setPopulation((p) => (p.length <= 2 ? p : p.filter((g) => g.id !== id)));
  }, []);

  // Fork: rewind to generation gi and continue from its survivors.
  const forkFromGeneration = useCallback(
    (gi: number) => {
      const gen = generations[gi];
      if (!gen) return;
      const genomes = gen.pieces
        .filter((p) => p.guardOk)
        .map((p) => genomeMap.current.get(p.genomeId))
        .filter((g): g is Genome => !!g);
      if (!genomes.length) return;
      setPopulation(genomes);
      setGenerations(generations.slice(0, gi + 1));
      setRunId(null); // it's a new branch
    },
    [generations],
  );

  const evolve = useCallback(async () => {
    if (population.length < 2 || running) return;
    setRunning(true);
    setError(null);
    setLog([]);
    setPhase("starting");
    try {
      const res = await fetch("/api/evolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ genomes: population }),
      });
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
            const nextGenomes = e.nextGenomes as Genome[];
            for (const ng of nextGenomes) genomeMap.current.set(ng.id, ng);
            setGenerations((g) => [...g, { pieces: e.pieces as LiveGen["pieces"] }]);
            setPopulation(nextGenomes);
            setPhase(null);
          } else if (e.type === "error") setError(e.message as string);
        }
      }
    } catch (err) {
      setError(String(err));
    }
    setPhase(null);
    setRunning(false);
  }, [population, running]);

  const flow = buildLiveFlow(generations, genomeMap.current);

  return {
    population,
    generations,
    flow,
    running,
    phase,
    log,
    error,
    name,
    setName,
    runId,
    setRunId,
    started,
    init,
    startFresh,
    reset,
    addMember,
    removeMember,
    forkFromGeneration,
    evolve,
    genomeMap,
  };
}
