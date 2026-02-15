/**
 * Client-side helper: create a Sora video with the same flow as VideoFeed
 * (cheap token: portrait, n_frames 10, size high, remove_watermark false, upload_method s3).
 * Returns { url } on success or { error } on failure.
 */

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: "Non-JSON response",
      status: res.status,
      body: text.slice(0, 200),
    };
  }
}

/**
 * Create a Sora video from a text prompt. Same API flow as VideoFeed.
 * @param {string} prompt - Text prompt for Sora
 * @returns {Promise<{ url?: string, error?: string }>} - { url } on success, { error } on failure
 */
export async function createSoraVideo(prompt) {
  const text = String(prompt ?? "").trim();
  if (!text) {
    return { error: "Prompt is required" };
  }

  // 1) create task (Sora2 Pro Text-to-Video, same options as VideoFeed)
  const start = await fetchJson("/api/sora/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: text,
      aspect_ratio: "portrait",
      n_frames: "10",
      size: "high",
      remove_watermark: false,
      upload_method: "s3",
    }),
  });

  if (start.error) {
    const msg = start.status ? `${start.error} (HTTP ${start.status})` : start.error;
    return { error: msg };
  }

  const taskId = start.taskId;
  if (!taskId) {
    return { error: "No taskId returned" };
  }

  // 2) poll status until success/fail
  for (let attempt = 0; attempt < 120; attempt++) {
    await new Promise((res) => setTimeout(res, 3000));

    const status = await fetchJson(
      `/api/sora/status?taskId=${encodeURIComponent(taskId)}`
    );

    if (status.error) {
      const msg = status.status
        ? `${status.error} (HTTP ${status.status})`
        : status.error;
      return { error: msg };
    }

    if (status.state === "success") {
      const remoteUrl = status.remoteUrl;

      if (!remoteUrl) {
        return { error: "Success but no remoteUrl returned" };
      }

      // 3) ingest into Azure (same as VideoFeed)
      const up = await fetchJson("/api/azure/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, remoteUrl }),
      });

      if (up.error || !up.azureUrl) {
        // Fallback: use remote provider URL (same as VideoFeed)
        return { url: remoteUrl };
      }

      return { url: up.azureUrl };
    }

    if (status.state === "fail") {
      const msg =
        (status.failCode ? `(${status.failCode}) ` : "") +
        (status.failMsg || "Failed");
      return { error: msg };
    }
  }

  return { error: "Timed out waiting for video" };
}
