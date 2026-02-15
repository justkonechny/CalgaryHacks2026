"use client";

import { useEffect, useRef, useState } from "react";
import VideoOverlay from "@/components/VideoOverlay";

export default function VideoItem({ video, isActive, muted, onToggleMuted }) {
  const vidRef = useRef(null);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const el = vidRef.current;
    if (!el) return;

    el.muted = muted;

    async function go() {
      if (!isActive) {
        el.pause();
        return;
      }
      if (pausedByUser) return;

      try {
        await el.play();
      } catch {
        // autoplay can fail; user can tap to play
      }
    }

    go();
  }, [isActive, muted, pausedByUser, video.src]);

  function showToast(msg) {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 800);
  }

  function togglePlayPause() {
    const el = vidRef.current;
    if (!el) return;

    if (el.paused) {
      setPausedByUser(false);
      el.play().catch(() => {});
      showToast("Play");
    } else {
      el.pause();
      setPausedByUser(true);
      showToast("Pause");
    }
  }

  const showVideo = video.state === "ready" && !!video.src;

  return (
    <>
      {showVideo ? (
        <video
          ref={vidRef}
          className="video"
          src={video.src}
          playsInline
          loop
          preload="metadata"
          muted={muted}
          onClick={togglePlayPause}
        />
      ) : (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(180deg, #111, #000)",
            textAlign: "center",
            padding: 24
          }}
        >
          {video.state === "fail" ? (
            <div style={{ maxWidth: 420 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                Generation failed
              </div>
              <div style={{ opacity: 0.8, fontSize: 14 }}>
                {video.failMsg || "Unknown error"}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 420 }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                Generating…
              </div>
              <div style={{ opacity: 0.8, fontSize: 14 }}>
                State: {video.state || "generating"}
              </div>
              <div style={{ opacity: 0.7, fontSize: 12, marginTop: 10 }}>
                (It can take a bit — keep scrolling if you want.)
              </div>
            </div>
          )}
        </div>
      )}

      <VideoOverlay
        username={video.username || "@sora"}
        caption={video.caption || ""}
        muted={muted}
        onToggleMuted={() => {
          onToggleMuted();
          showToast(muted ? "Sound On" : "Muted");
        }}
      />

      {toast ? (
        <div className="centerToast">
          <div className="toastBubble">{toast}</div>
        </div>
      ) : null}
    </>
  );
}
