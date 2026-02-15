export const runtime = "nodejs";

import { getPool } from "@/lib/db";
import { makeBlobReadSasUrl } from "@/lib/azureUpload";

const PLACEHOLDER_QUESTION = {
  text: "Placeholder question?",
  options: ["A", "B", "C", "D"],
  correctIndex: 0,
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const threadIdParam = searchParams.get("threadId");
  const threadId = threadIdParam ? Number(threadIdParam) : NaN;

  if (!Number.isInteger(threadId) || threadId < 1) {
    return Response.json({ error: "Missing or invalid threadId" }, { status: 400 });
  }

  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT v.id, v.taskId, v.blobName, v.blobUrl, v.scriptText, v.duration
     FROM Video v
     WHERE v.threadId = ?
       AND v.blobUrl IS NOT NULL
       AND v.blobName IS NOT NULL
     ORDER BY v.\`index\``,
    [threadId]
  );

  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "videos";

  const videos = rows.map((r) => {
    const sasUrl = makeBlobReadSasUrl({
      blobUrl: r.blobUrl,
      blobName: r.blobName,
      containerName,
      expiresInMinutes: 60 * 24,
    });
    return {
      id: r.id,
      taskId: r.taskId,
      src: sasUrl,
      scriptText: r.scriptText,
      duration: r.duration,
    };
  });

  const questions = videos.length > 0
    ? Array.from({ length: videos.length }, () => ({ ...PLACEHOLDER_QUESTION }))
    : [];

  return Response.json({ videos, questions });
}
