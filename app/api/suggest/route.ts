import { chat } from "@/engine/llm";
import { MODELS } from "@/engine/models";
import { parseJsonLoose } from "@/engine/util";
import { allowIp } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

// The in-browser "artist generator": invent a diverse starter population of
// style directives (optionally around a theme) to seed a live evolution.
export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (!allowIp(ip).ok) {
    return Response.json({ error: "rate_limited", message: "Give it a minute between suggestions." }, { status: 429 });
  }

  let theme = "";
  try {
    const body = await req.json();
    theme = String(body?.theme ?? "").slice(0, 120);
  } catch {
    /* no theme */
  }

  try {
    const r = await chat({
      model: MODELS.artist,
      system: "You invent personas for generative visual artists. Aesthetics/movements only — never real artists' names.",
      user: [
        `Invent 5 diverse generative-art personas${theme ? ` around the theme: "${theme}"` : ""}.`,
        `Each has a one-word invented name and a vivid one-sentence style directive describing an aesthetic.`,
        `Make the five genuinely different from each other.`,
        `Return ONLY JSON: {"artists":[{"name":"<one word>","styleDirective":"<one sentence>"}]}`,
      ].join("\n"),
      maxTokens: 500,
      temperature: 1.0,
    });
    const parsed = parseJsonLoose<{ artists: { name: string; styleDirective: string }[] }>(r.text);
    const artists = (parsed?.artists ?? [])
      .filter((a) => a?.styleDirective && a.styleDirective.length >= 8)
      .slice(0, 5)
      .map((a) => ({ name: String(a.name).slice(0, 24), styleDirective: String(a.styleDirective).slice(0, 300) }));
    if (!artists.length) return Response.json({ error: "empty", message: "Couldn't generate — try again." }, { status: 502 });
    return Response.json({ artists });
  } catch (e) {
    return Response.json({ error: "failed", message: String(e).slice(0, 160) }, { status: 500 });
  }
}
