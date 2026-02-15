"use client";

import { useEffect, useRef, useState } from "react";
import VideoItem from "@/components/VideoItem";

export default function VideoFeed() {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const [items, setItems] = useState([]); // load from DB/feed
  const [muted, setMuted] = useState(true);

  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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

  async function loadFeed() {
    const data = await fetchJson("/api/feed", { cache: "no-store" });
    if (data?.items && Array.isArray(data.items)) {
      setItems(data.items);
      return;
    }

    // fallback local item if feed fails
    setItems([
      {
        id: "local-1",
        src: "/videos/001.mp4",
        username: "@you",
        caption: "Local fallback (feed failed; check DB/env)",
        state: "ready",
      },
    ]);
  }

  useEffect(() => {
    loadFeed();
  }, []);

  // Observe which feed item is active (autoplay only that one)
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best = null;
        for (const e of entries) {
          if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
        }
        if (!best) return;
        if (best.intersectionRatio < 0.6) return;

        const idx = Number(best.target.getAttribute("data-index"));
        if (!Number.isNaN(idx)) setActiveIndex(idx);
      },
      { root, threshold: [0.2, 0.4, 0.6, 0.8, 1] }
    );

    const nodes = root.querySelectorAll("[data-feed-item='true']");
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [items.length]);

  const onToggleMuted = () => setMuted((m) => !m);

  async function createSoraVideo() {
    const text = prompt.trim();
    if (!text) return;

    setIsCreating(true);
    try {
      // 1) create task + insert Thread/Video rows in DB
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
        alert(start.error);
        console.log("Create error:", start);
        return;
      }

      const taskId = start.taskId;
      const tempId = `gen-${taskId}`;

      // 2) add placeholder item immediately (not playable yet)
      setItems((prev) => [
        {
          id: tempId,
          src: "", // not ready
          username: "@you",
          caption: text,
          state: "generating",
          taskId,
        },
        ...prev,
      ]);

      setPrompt("");

      // 3) poll provider status until success/fail (NEVER used for playback)
      for (let attempt = 0; attempt < 120; attempt++) {
        await new Promise((res) => setTimeout(res, 3000));

        const status = await fetchJson(
          `/api/sora/status?taskId=${encodeURIComponent(taskId)}`
        );

        if (status.error) {
          setItems((prev) =>
            prev.map((it) =>
              it.taskId === taskId
                ? {
                    ...it,
                    state: "fail",
                    failMsg:
                      status.error +
                      (status.status ? ` (HTTP ${status.status})` : ""),
                  }
                : it
            )
          );
          console.log("Status error:", status);
          break;
        }

        if (
          status.state &&
          status.state !== "success" &&
          status.state !== "fail"
        ) {
          setItems((prev) =>
            prev.map((it) =>
              it.taskId === taskId ? { ...it, state: status.state } : it
            )
          );
        }

        if (status.state === "success") {
          const remoteUrl = status.remoteUrl;

          if (!remoteUrl) {
            setItems((prev) =>
              prev.map((it) =>
                it.taskId === taskId
                  ? {
                      ...it,
                      state: "fail",
                      failMsg: "Success but no remoteUrl returned",
                    }
                  : it
              )
            );
            break;
          }

          // uploading state
          setItems((prev) =>
            prev.map((it) =>
              it.taskId === taskId ? { ...it, state: "uploading" } : it
            )
          );

          // 4) ingest -> upload to Azure -> update DB -> return SAS
          const up = await fetchJson("/api/azure/ingest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId, remoteUrl }),
          });

          if (up.error || !up.azureUrl) {
            // IMPORTANT: no provider fallback (you asked: show from Blob, not get API)
            const reason = up.error || "No azureUrl returned";
            setItems((prev) =>
              prev.map((it) =>
                it.taskId === taskId
                  ? {
                      ...it,
                      src: "",
                      state: "fail",
                      failMsg: `Azure upload failed: ${reason}`,
                    }
                  : it
              )
            );
            console.log("Azure ingest failed:", up);
            break;
          }

          // 5) set item playable immediately using SAS returned by ingest
          setItems((prev) =>
            prev.map((it) =>
              it.taskId === taskId
                ? { ...it, src: up.azureUrl, state: "ready", failMsg: "" }
                : it
            )
          );

          // 6) Refresh feed from DB so it persists and comes from Blob
          await loadFeed();

          containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          break;
        }

        if (status.state === "fail") {
          const msg =
            (status.failCode ? `(${status.failCode}) ` : "") +
            (status.failMsg || "Failed");

          setItems((prev) =>
            prev.map((it) =>
              it.taskId === taskId ? { ...it, state: "fail", failMsg: msg } : it
            )
          );
          break;
        }
      }
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div ref={containerRef} className="feed">
      {/* Top input overlay */}
      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          right: 12,
          zIndex: 50,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a short TikTok-style shot..."
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.45)",
            color: "white",
            outline: "none",
          }}
        />
        <button
          className="btnSmall"
          type="button"
          onClick={createSoraVideo}
          disabled={isCreating || !prompt.trim()}
          style={{ opacity: isCreating ? 0.6 : 1 }}
        >
          {isCreating ? "Generating..." : "Generate"}
        </button>
      </div>

      {/* Spacer so fixed bar doesn't cover the first video */}
      <div style={{ height: 70 }} />

      {items.map((v, i) => (
        <div
          key={v.id}
          className="feedItem"
          data-feed-item="true"
          data-index={i}
        >
          <VideoItem
            video={v}
            isActive={i === activeIndex}
            muted={muted}
            onToggleMuted={onToggleMuted}
          />
        </div>
      ))}
    </div>
  );
}
