import { getPool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, prompt, status, createdAt
     FROM Thread
     ORDER BY createdAt DESC
     LIMIT 50`
  );
  const feeds = rows.map((r) => ({
    id: r.id,
    label: r.prompt,
    status: r.status,
    createdAt: r.createdAt,
  }));
  return Response.json({ feeds });
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "New feed";
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO Thread (prompt, status) VALUES (?, 'ready')`,
      [prompt || "New feed"]
    );
    const threadId = result.insertId;
    return Response.json({ threadId });
  } catch (e) {
    console.error("[api/feeds] POST error:", e);
    return Response.json(
      { error: e?.message || "Failed to create feed" },
      { status: 500 }
    );
  }
}
