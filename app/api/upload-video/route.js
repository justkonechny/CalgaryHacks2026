export const runtime = "nodejs";

import { BlobServiceClient } from "@azure/storage-blob";

function getExtFromContentType(contentType) {
  if (!contentType) return "mp4";
  if (contentType.includes("webm")) return "webm";
  if (contentType.includes("mp4")) return "mp4";
  return "mp4";
}

export async function POST(req) {
  try {
    console.log("Container:", process.env.AZURE_STORAGE_CONTAINER_NAME);
    const contentType = req.headers.get("content-type") || "application/octet-stream";
    const bytes = await req.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );

    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "videos";
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: "blob" }); // public blobs (optional)

    const ext = getExtFromContentType(contentType);
    const blobName = `video-${crypto.randomUUID()}.${ext}`;

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType === "application/octet-stream" ? "video/mp4" : contentType
      }
    });

    // Public container: URL is directly playable
    const url = blockBlobClient.url;

    return Response.json({ url, blobName });
  } catch (err) {
    return new Response(`Upload failed: ${err?.message || err}`, { status: 500 });
  }
}
