import { getPool } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req, { params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isInteger(id) || id < 1) {
      return Response.json({ error: "Invalid feed id" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : (typeof body.label === "string" ? body.label.trim() : null);
    if (prompt === null || prompt === "") {
      return Response.json({ error: "Missing prompt or label" }, { status: 400 });
    }
    const pool = getPool();
    const [result] = await pool.query(
      `UPDATE Thread SET prompt = ? WHERE id = ?`,
      [prompt, id]
    );
    if (result.affectedRows === 0) {
      return Response.json({ error: "Feed not found" }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[api/feeds/[id]] PATCH error:", e);
    return Response.json(
      { error: e?.message || "Failed to rename feed" },
      { status: 500 }
    );
  }
}
