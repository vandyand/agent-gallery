import { getRun } from "@/lib/store";

export const runtime = "nodejs";

// GET /api/runs/:id — full saved run (for opening / forking in the workbench).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(run);
}
