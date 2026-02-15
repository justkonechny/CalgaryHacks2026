// app/api/azure/ingest/route.js
import { uploadMp4ToAzure } from "@/lib/azureUpload";

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

    const arrayBuffer = await videoResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("[azure/ingest] bytes:", buffer.length);

    const blobName = `video-${taskId}.mp4`;
const azureUrl = await uploadMp4ToAzure({ buffer, blobName });


    console.log("[azure/ingest] uploaded:", azureUrl);

    return Response.json({ azureUrl });
  } catch (e) {
    console.error("[azure/ingest] ERROR:", e);

    const message =
      e && typeof e === "object" && "message" in e
        ? String(e.message)
        : String(e);

    const stack =
      e && typeof e === "object" && "stack" in e && e.stack
        ? String(e.stack)
        : "";

    return Response.json(
      {
        error: message,
        stack: stack ? stack.split("\n").slice(0, 8).join("\n") : "",
      },
      { status: 500 }
    );
  }
}
