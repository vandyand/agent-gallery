import { NextResponse } from "next/server";
import { recordVote, getVotes } from "@/lib/votes";

// Human votes feed selection pressure. Persisted to a small KV so they survive
// across the deployment; folded into the next generation's fitness.
export async function POST(req: Request) {
  try {
    const { pieceId, delta } = await req.json();
    if (typeof pieceId !== "string") {
      return NextResponse.json({ error: "pieceId required" }, { status: 400 });
    }
    const total = await recordVote(pieceId, delta === -1 ? -1 : 1);
    return NextResponse.json({ ok: true, pieceId, total });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ votes: await getVotes() });
}
