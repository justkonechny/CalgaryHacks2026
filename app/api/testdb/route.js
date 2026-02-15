import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = getPool();

    // Pull one column from Video table
    const [rows] = await pool.query(
      "SELECT videoId, videoUrl FROM Video LIMIT 1"
    );

    console.log("DB TEST RESULT:", rows);

    return Response.json({
      success: true,
      result: rows,
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
