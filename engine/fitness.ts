// Fitness = the selection signal. A transparent weighted blend of the critic
// panel, human votes, and novelty — the weights are shown in the UI (SPEC §4.5).

import type { Critique, Fitness } from "./types";

export const DEFAULT_WEIGHTS = { critics: 0.7, human: 0.15, novelty: 0.15 };

export function meanCritics(critics: Critique[]): number {
  if (!critics.length) return 0;
  return critics.reduce((s, c) => s + c.score, 0) / critics.length;
}

export function computeFitness(
  pieceId: string,
  critics: Critique[],
  votes: number,
  maxVotes: number,
  novelty: number,
  weights = DEFAULT_WEIGHTS,
): Fitness {
  const critMean = meanCritics(critics);
  const human = maxVotes > 0 ? (votes / maxVotes) * 10 : 0;
  const total = weights.critics * critMean + weights.human * human + weights.novelty * novelty;
  return { pieceId, critics: critMean, human, novelty, total };
}
