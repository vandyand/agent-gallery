// OpenRouter client with honest cost accounting.
//
// One key routes to every model we use. We keep a price table (fetched live
// from OpenRouter, cached to disk) and compute USD per call from token usage —
// this is the cog-eval cost-table concept, rebuilt public (SPEC §10).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OR_BASE = "https://openrouter.ai/api/v1";
const CACHE_DIR = join(process.cwd(), "engine", ".cache");
const PRICE_CACHE = join(CACHE_DIR, "prices.json");

export type Usage = { prompt: number; completion: number };
export type LlmResult = {
  text: string;
  usage: Usage;
  costUsd: number;
  model: string;
  ms: number;
};

type PriceMap = Record<string, { prompt: number; completion: number }>;
let PRICES: PriceMap | null = null;

function key(): string {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) throw new Error("OPENROUTER_API_KEY not set (see .env.local)");
  return k;
}

export async function loadPrices(): Promise<PriceMap> {
  if (PRICES) return PRICES;
  if (existsSync(PRICE_CACHE)) {
    try {
      PRICES = JSON.parse(readFileSync(PRICE_CACHE, "utf8"));
      return PRICES!;
    } catch {
      /* refetch */
    }
  }
  const res = await fetch(`${OR_BASE}/models`, {
    headers: { Authorization: `Bearer ${key()}` },
  });
  const body = await res.json();
  const map: PriceMap = {};
  for (const m of body.data ?? []) {
    map[m.id] = {
      prompt: Number(m.pricing?.prompt ?? 0),
      completion: Number(m.pricing?.completion ?? 0),
    };
  }
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(PRICE_CACHE, JSON.stringify(map));
  PRICES = map;
  return map;
}

export function priceOf(model: string): { prompt: number; completion: number } {
  const p = PRICES?.[model];
  return p ?? { prompt: 0, completion: 0 };
}

export type ChatArgs = {
  model: string;
  system?: string;
  user: string;
  images?: string[]; // data URLs (data:image/png;base64,...) for vision judges
  maxTokens?: number;
  temperature?: number;
};

export async function chat(args: ChatArgs): Promise<LlmResult> {
  await loadPrices();
  const content: unknown =
    args.images && args.images.length
      ? [
          { type: "text", text: args.user },
          ...args.images.map((url) => ({ type: "image_url", image_url: { url } })),
        ]
      : args.user;

  const messages = [
    ...(args.system ? [{ role: "system", content: args.system }] : []),
    { role: "user", content },
  ];

  const t0 = Date.now();
  let res: Response;
  let body: {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    error?: { message?: string };
  };
  // one retry on transient failure
  for (let attempt = 0; ; attempt++) {
    res = await fetch(`${OR_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key()}`,
        "content-type": "application/json",
        "HTTP-Referer": "https://agent-gallery.vercel.app",
        "X-Title": "The Evolving Gallery",
      },
      body: JSON.stringify({
        model: args.model,
        messages,
        max_tokens: args.maxTokens ?? 2000,
        temperature: args.temperature ?? 0.9,
      }),
    });
    body = await res.json();
    if (res.ok && body.choices?.[0]?.message) break;
    if (attempt >= 1) {
      throw new Error(`OpenRouter ${res.status}: ${body.error?.message ?? "no choices"} (${args.model})`);
    }
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }

  const ms = Date.now() - t0;
  const text = body.choices?.[0]?.message?.content ?? "";
  const usage: Usage = {
    prompt: body.usage?.prompt_tokens ?? 0,
    completion: body.usage?.completion_tokens ?? 0,
  };
  const price = priceOf(args.model);
  const costUsd = usage.prompt * price.prompt + usage.completion * price.completion;
  return { text, usage, costUsd, model: args.model, ms };
}
