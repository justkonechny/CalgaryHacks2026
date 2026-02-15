export const runtime = "nodejs";

// Streams a remote MP4 through your Next server.
// Useful if the remote host blocks CORS/range requests/etc.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return new Response("Missing url", { status: 400 });

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  // Basic safety: only allow https
  if (parsed.protocol !== "https:") {
    return new Response("Only https URLs allowed", { status: 400 });
  }

  // Optional: lock to known domains if you want stricter security
  // const allowed = new Set(["cdn.kie.ai", "kie.ai", "static.kie.ai"]);
  // if (!allowed.has(parsed.hostname)) return new Response("Host not allowed", { status: 403 });

  const upstream = await fetch(parsed.toString(), {
    // Some CDNs behave better with a user-agent
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Failed to fetch video", { status: 502 });
  }

  // Forward common headers
  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") || "video/mp4");
  headers.set("Cache-Control", "no-store");

  // If upstream supports range requests, this can help browsers seek.
  const acceptRanges = upstream.headers.get("accept-ranges");
  if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);

  return new Response(upstream.body, { headers });
}
