export const runtime = "nodejs";

export async function POST(req) {
  const {
    prompt,
    imageUrl,                 // optional: if present => image-to-video
    aspect_ratio = "portrait",// "portrait" or "landscape"
    n_frames = "10",         // "10s" or "15s"
    remove_watermark = false, // true/false
    upload_method = "s3"      // "s3" or "oss"
  } = await req.json();

  if (!process.env.KIE_API_KEY) {
    return Response.json({ error: "Missing KIE_API_KEY in .env.local" }, { status: 500 });
  }
  if (!prompt) {
    return Response.json({ error: "Missing prompt" }, { status: 400 });
  }

  const isImageToVideo = Boolean(imageUrl);

  const payload = {
    model: isImageToVideo ? "sora-2-image-to-video" : "sora-2-text-to-video",
    input: {
      prompt,
      aspect_ratio,
      n_frames,
      remove_watermark,
      upload_method,
      ...(isImageToVideo ? { image_urls: [imageUrl] } : {})
    }
  };

  const resp = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KIE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await resp.json();

  if (!resp.ok || data.code !== 200) {
    return Response.json(
      { error: data?.msg || data?.message || "Kie createTask failed", raw: data },
      { status: 500 }
    );
  }

  const taskId = data?.data?.taskId || data?.data?.id || data?.taskId;
  if (!taskId) return Response.json({ error: "No taskId returned", raw: data }, { status: 500 });

  return Response.json({ taskId });
}
