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

    const threadId = body?.threadId != null ? Number(body.threadId) : null;

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Missing KIE_API_KEY in .env.local" }, { status: 500 });
    }

    // Defaults optimized for TikTok-style vertical video.
    const aspect_ratio = body?.aspect_ratio === "landscape" ? "landscape" : "portrait";
    const n_frames = body?.n_frames === "15" ? "15" : "10"; // must be "10" or "15"
    const size = body?.size === "high" ? "high" : "high"; // default high (matches docs example)
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

    if (Number.isInteger(threadId) && threadId >= 1) {
      const pool = getPool();
      const [threadRows] = await pool.query(
        `SELECT id FROM Thread WHERE id = ?`,
        [threadId]
      );
      if (threadRows.length === 0) {
        return Response.json({ error: "Thread not found", taskId }, { status: 404 });
      }
      const [indexRows] = await pool.query(
        `SELECT COALESCE(MAX(\`index\`), 0) + 1 AS nextIndex FROM Video WHERE threadId = ?`,
        [threadId]
      );
      const nextIndex = indexRows[0]?.nextIndex ?? 1;
      if (nextIndex > 5) {
        return Response.json(
          { error: "Thread already has maximum videos (5)", taskId },
          { status: 400 }
        );
      }
      const [insertResult] = await pool.query(
        `INSERT INTO Video (threadId, \`index\`, scriptText, taskId, duration, blobName, blobUrl, videoUrl)
         VALUES (?, ?, ?, ?, 10, NULL, NULL, NULL)`,
        [threadId, nextIndex, prompt, taskId]
      );
      const videoId = insertResult.insertId;
      return Response.json({ taskId, threadId, videoId });
    }

    return Response.json({ taskId });
  } catch (err) {
    return Response.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
