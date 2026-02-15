export const runtime = "nodejs";

import { getPool } from "@/lib/db";
import { makeBlobReadSasUrl } from "@/lib/azureUpload";

export async function GET() {
  const pool = getPool();

  // Only return videos that are ready and have blob data
  const [rows] = await pool.query(
    `SELECT
        v.id AS videoId,
        v.taskId,
        v.blobName,
        v.blobUrl,
        t.prompt,
        t.createdAt
     FROM Video v
     JOIN Thread t ON t.id = v.threadId
     WHERE t.status = 'ready'
       AND v.blobUrl IS NOT NULL
       AND v.blobName IS NOT NULL
     ORDER BY t.createdAt DESC
     LIMIT 50`
  );

  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "videos";

  const items = rows.map((r) => {
    const sasUrl = makeBlobReadSasUrl({
      blobUrl: r.blobUrl,
      blobName: r.blobName,
      containerName,
      expiresInMinutes: 60 * 24,
    });

    return {
      id: `db-${r.videoId}`,
      src: sasUrl,
      username: "@you",
      caption: r.prompt,
      state: "ready",
      taskId: r.taskId,
      createdAt: r.createdAt,
    };
  });

  return Response.json({ items });
}
