// app/api/sora/status/route.js
export const runtime = "nodejs";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!process.env.KIE_API_KEY) {
    return Response.json({ error: "Missing KIE_API_KEY in .env.local" }, { status: 500 });
  }
  if (!taskId) {
    return Response.json({ error: "Missing taskId" }, { status: 400 });
  }

  const resp = await fetch(
    `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    { headers: { Authorization: `Bearer ${process.env.KIE_API_KEY}` } }
  );

  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return Response.json({ error: "Non-JSON response from Kie", status: resp.status, body: text.slice(0, 200) }, { status: 502 });
  }

  if (!resp.ok || data?.code !== 200) {
    return Response.json({ error: data?.message || data?.msg || "Kie recordInfo failed", raw: data }, { status: 500 });
  }

  const state = data?.data?.state; // waiting | queuing | generating | success | fail
  const failCode = data?.data?.failCode || "";
  const failMsg = data?.data?.failMsg || "";

  let remoteUrl = "";

  if (state === "success" && data?.data?.resultJson) {
    try {
      const parsed = JSON.parse(data.data.resultJson);
      remoteUrl = parsed?.resultUrls?.[0] || "";
    } catch {}
  }

  return Response.json({
    taskId,
    state,
    failCode,
    failMsg,
    remoteUrl, // <-- important
  });
}
