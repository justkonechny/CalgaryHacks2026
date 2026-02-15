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
    {
      headers: { Authorization: `Bearer ${process.env.KIE_API_KEY}` }
    }
  );

  const data = await resp.json();

  if (!resp.ok || data.code !== 200) {
    return Response.json(
      { error: data?.message || "Kie recordInfo failed", raw: data },
      { status: 500 }
    );
  }

  const state = data?.data?.state; // waiting | queuing | generating | success | fail
  let resultUrls = [];

  if (state === "success" && data?.data?.resultJson) {
    try {
      const parsed = JSON.parse(data.data.resultJson);
      resultUrls = parsed?.resultUrls || [];
    } catch {}
  }

  return Response.json({
    taskId,
    state,
    failMsg: data?.data?.failMsg || "",
    resultUrls
  });
}
