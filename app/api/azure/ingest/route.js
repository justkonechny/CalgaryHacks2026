// app/api/azure/ingest/route.js
import { uploadMp4ToAzure } from "@/lib/azureUpload";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { taskId, remoteUrl } = await req.json();

    if (!taskId || !remoteUrl) {
      return Response.json(
        { error: "Missing taskId or remoteUrl" },
        { status: 400 }
      );
    }

    // Hard env validation (prevents undefined.split anywhere)
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const container = process.env.AZURE_STORAGE_CONTAINER_NAME;

    if (!conn) {
      return Response.json(
        { error: "Missing AZURE_STORAGE_CONNECTION_STRING" },
        { status: 500 }
      );
    }
    if (!container) {
      return Response.json(
        { error: "Missing AZURE_STORAGE_CONTAINER_NAME" },
        { status: 500 }
      );
    }

    console.log("[azure/ingest] downloading:", remoteUrl);

    const videoResp = await fetch(remoteUrl);
    if (!videoResp.ok) {
      const text = await videoResp.text().catch(() => "");
      return Response.json(
        { error: `Download failed: ${videoResp.status}`, body: text.slice(0, 200) },
        { status: 502 }
      );
    }

    const buffer = Buffer.from(await videoResp.arrayBuffer());
    console.log("[azure/ingest] bytes:", buffer.length);

    const blobName = `video-${taskId}.mp4`;
    const { plainUrl, signedUrl } = await uploadMp4ToAzure({ buffer, blobName });

    console.log("[azure/ingest] uploaded:", plainUrl);

    const pool = getPool();
    const [videoUpdate] = await pool.query(
      `UPDATE Video
       SET blobName = ?, blobUrl = ?, videoUrl = ?
       WHERE taskId = ?`,
      [blobName, plainUrl, signedUrl, taskId]
    );

    if (videoUpdate.affectedRows === 0) {
      return Response.json(
        { error: "No Video row found for taskId. Did /api/sora/create insert it?" },
        { status: 404 }
      );
    }

    const [updatedRows] = await pool.query(
      `SELECT threadId, blobName, blobUrl, videoUrl FROM Video WHERE taskId = ?`,
      [taskId]
    );
    const row = updatedRows[0];
    if (row) {
      await pool.query(
        `UPDATE Video SET blobName = ?, blobUrl = ?, videoUrl = ?
         WHERE threadId = ? AND taskId IS NULL`,
        [row.blobName, row.blobUrl, row.videoUrl, row.threadId]
      );
    }

    await pool.query(
      `UPDATE Thread t
       JOIN Video v ON v.threadId = t.id
       SET t.status = 'ready'
       WHERE v.taskId = ?`,
      [taskId]
    );

    return Response.json({ azureUrl: signedUrl, blobUrl: plainUrl, blobName });
  } catch (e) {
    console.error("[azure/ingest] ERROR:", e);

    const message =
      e && typeof e === "object" && "message" in e
        ? String(e.message)
        : String(e);

    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
