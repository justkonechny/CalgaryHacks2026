"use client";

import { useEffect, useRef, useState } from "react";
import VideoItem from "@/components/VideoItem";

export default function VideoFeed() {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Start muted so autoplay works on mobile Safari/Chrome
  const [muted, setMuted] = useState(true);

  // Feed items (newest at top). Includes a local fallback example.
  const [items, setItems] = useState([
    {
      id: "local-001",
      src: "/videos/001.mp4",
      username: "@you",
      caption: "Local fallback (optional) — replace /public/videos/001.mp4",
      state: "ready"
    }
  ]);

  // Generator UI
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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

  function onToggleMuted() {
    setMuted((m) => !m);
  }

  async function createSoraVideo() {
    const text = prompt.trim();
    if (!text) return;

    setIsCreating(true);

    try {
      // 1) Create task
      const start = await fetch("/api/sora/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prompt: text,
            aspect_ratio: "portrait",
            n_frames: "10",
            remove_watermark: false,
            upload_method: "s3"
        })
        }).then(r => r.json());



      if (start.error) {
        alert(start.error);
        return;
      }

      const taskId = start.taskId;
      const tempId = `sora-${taskId}`;

      // 2) Add placeholder item immediately
      setItems((prev) => [
        {
          id: tempId,
          src: "",
          username: "@sora",
          caption: text,
          state: "generating",
          taskId
        },
        ...prev
      ]);

      setPrompt("");

      // 3) Poll until success/fail
      for (let attempt = 0; attempt < 120; attempt++) {
        await new Promise((res) => setTimeout(res, 3000));

        const status = await fetch(
          `/api/sora/status?taskId=${encodeURIComponent(taskId)}`
        ).then((r) => r.json());

        if (status.error) {
          setItems((prev) =>
            prev.map((it) =>
              it.taskId === taskId
                ? { ...it, state: "fail", failMsg: status.error }
                : it
            )
          );
          break;
        }

        // Update state while waiting
        setItems((prev) =>
          prev.map((it) =>
            it.taskId === taskId ? { ...it, state: status.state } : it
          )
        );

        if (status.state === "success") {
          const remoteUrl = status.resultUrls?.[0];

          if (!remoteUrl) {
            setItems((prev) =>
              prev.map((it) =>
                it.taskId === taskId
                  ? { ...it, state: "fail", failMsg: "No resultUrls returned" }
                  : it
              )
            );
            break;
          }

          // Use our proxy route to avoid CORS / blocked headers
          const proxied = `/api/proxy-video?url=${encodeURIComponent(remoteUrl)}`;

          setItems((prev) =>
            prev.map((it) =>
              it.taskId === taskId
                ? { ...it, src: proxied, state: "ready" }
                : it
            )
          );

          // scroll to top (newest)
          containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          break;
        }

        if (status.state === "fail") {
          setItems((prev) =>
            prev.map((it) =>
              it.taskId === taskId
                ? { ...it, state: "fail", failMsg: status.failMsg || "Failed" }
                : it
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
      {/* fixed top generator bar */}
      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          right: 12,
          zIndex: 50,
          display: "flex",
          gap: 8,
          alignItems: "center"
        }}
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe a short TikTok-style shot…"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.45)",
            color: "white",
            outline: "none"
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

      {/* spacer so bar doesn't cover the first video */}
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
