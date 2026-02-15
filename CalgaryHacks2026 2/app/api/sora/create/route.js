export const runtime = "nodejs";

import { getPool } from "@/lib/db";

// Creates a Sora 2 Pro Text-to-Video job on Kie.
// Docs: https://docs.kie.ai/market/sora2/sora-2-text-to-video
export async function POST(req) {
  try {
    const body = await req.json();

    const prompt = String(body?.prompt || "").trim();
    if (!prompt) {
      return Response.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Missing KIE_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    // Defaults optimized for TikTok-style vertical video.
    const aspect_ratio = body?.aspect_ratio === "landscape" ? "landscape" : "portrait";
    const n_frames = body?.n_frames === "15" ? "15" : "10"; // must be "10" or "15"
    const size = body?.size === "high" ? "high" : "high";
    const remove_watermark = Boolean(body?.remove_watermark);
    const upload_method = body?.upload_method === "oss" ? "oss" : "s3";

    const payload = {
      model: "sora-2-text-to-video",
      input: {
        prompt,
        aspect_ratio,
        n_frames,
        size,
        remove_watermark,
        upload_method,
      },
    };

    const resp = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => null);

    if (!resp.ok || !data || data?.code !== 200) {
      return Response.json(
        {
          error: data?.msg || data?.message || "Kie createTask failed",
          status: resp.status,
          raw: data,
        },
        { status: 500 }
      );
    }

    const taskId = data?.data?.taskId;
    if (!taskId) {
      return Response.json({ error: "No taskId returned", raw: data }, { status: 500 });
    }

    // ✅ Insert DB rows immediately (Thread + Video)
    const pool = getPool();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [threadResult] = await conn.query(
        `INSERT INTO Thread (prompt, status) VALUES (?, 'generating')`,
        [prompt]
      );

      const threadId = threadResult.insertId;

      const [videoResult] = await conn.query(
        `INSERT INTO Video (threadId, \`index\`, scriptText, taskId, duration, blobName, blobUrl, videoUrl)
         VALUES (?, 1, ?, ?, 1, NULL, NULL, NULL)`,
        [threadId, prompt, taskId]
      );

      const videoId = videoResult.insertId;

      await conn.commit();

      return Response.json({ taskId, threadId, videoId });
    } catch (e) {
      await conn.rollback();
      return Response.json({ error: String(e?.message || e) }, { status: 500 });
    } finally {
      conn.release();
    }
  } catch (err) {
    return Response.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
