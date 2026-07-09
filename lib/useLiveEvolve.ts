"use client";

import { useCallback, useState } from "react";
import type { Genome } from "@/engine/types";
import type { LivePiece } from "@/engine/live"; // type-only — no server code bundled

export type RunBody = { genomes?: Genome[] } | { directives?: { name: string; styleDirective: string }[] };

export function useLiveEvolve(initial: Genome[] = []) {
  const [population, setPopulation] = useState<Genome[]>(initial);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [log, setLog] = useState<{ artist: string; ok: boolean; reason?: string }[]>([]);
  const [pieces, setPieces] = useState<LivePiece[]>([]);
  const [genNum, setGenNum] = useState<number | null>(null);
  const [runs, setRuns] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (body: RunBody) => {
    setRunning(true);
    setError(null);
    setLog([]);
    setPhase("starting");
    try {
      const res = await fetch("/api/evolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
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
          if (e.type === "start") {
            setPhase("painting");
            setPieces([]);
            setGenNum(e.gen as number);
          } else if (e.type === "painted") {
            setLog((l) => [...l, { artist: e.artist as string, ok: e.ok as boolean, reason: e.reason as string }]);
          } else if (e.type === "judging") {
            setPhase("judging");
          } else if (e.type === "done") {
            setPieces(e.pieces as LivePiece[]);
            setPopulation(e.nextGenomes as Genome[]);
            setGenNum(e.gen as number);
            setPhase(null);
            setRuns((r) => r + 1);
          } else if (e.type === "error") {
            setError(e.message as string);
          }
        }
      }
    } catch (err) {
      setError(String(err));
    }
    setPhase(null);
    setRunning(false);
  }, []);

  return { population, setPopulation, running, phase, log, pieces, genNum, runs, error, run };
}
