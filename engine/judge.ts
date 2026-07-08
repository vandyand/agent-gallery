// The critic panel — vision judges. Each survivor is rasterized; every critic
// looks at the actual image through its own lens and scores it 0–10 with a
// one-line verdict. Diverse providers = genuinely different eyes (SPEC §4.3).

import { chat } from "./llm";
import { MODELS } from "./models";
import { pool, parseJsonLoose, clamp } from "./util";
import type { Critique } from "./types";

function judgeSystem(lens: string): string {
  return [
    `You are a sharp, working art critic reviewing one piece of generative art through a single lens: ${lens}.`,
    `You are discerning. Most work is competent-but-forgettable and lands 4–6.`,
    `Reserve 8–10 for work that genuinely succeeds on ${lens}; give 0–3 to work that fails on it.`,
    `Respond with ONLY JSON: {"score": <number 0-10>, "one_line": "<one vivid sentence>"}.`,
  ].join("\n");
}

export type JudgeInput = { pieceId: string; png: Buffer };

export async function judgePanel(inputs: JudgeInput[]): Promise<Record<string, Critique[]>> {
  const out: Record<string, Critique[]> = {};
  for (const inp of inputs) out[inp.pieceId] = [];

  // one task per (piece × judge)
  const tasks = inputs.flatMap((inp) =>
    MODELS.judges.map((j) => ({ inp, j })),
  );

  await pool(tasks, 5, async ({ inp, j }) => {
    const dataUrl = `data:image/png;base64,${inp.png.toString("base64")}`;
    let critique: Critique;
    try {
      const r = await chat({
        model: j.model,
        system: judgeSystem(j.lens),
        user: `Judge this artwork on "${j.lens}". Return only the JSON.`,
        images: [dataUrl],
        maxTokens: 200,
        temperature: 0.4,
      });
      const parsed = parseJsonLoose<{ score: number; one_line: string }>(r.text);
      critique = {
        lens: j.lens,
        judgeModel: j.model,
        score: parsed ? clamp(Number(parsed.score), 0, 10) : 5,
        oneLine: parsed?.one_line?.slice(0, 200) ?? "(no verdict)",
        costUsd: r.costUsd,
      };
    } catch (e) {
      critique = { lens: j.lens, judgeModel: j.model, score: 5, oneLine: `(judge error)`, costUsd: 0 };
      void e;
    }
    out[inp.pieceId].push(critique);
  });

  return out;
}
