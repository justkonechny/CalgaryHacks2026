"use client";

import { useState, useRef, useCallback } from "react";
import Video from "./components/Video";
import LeftNav from "./components/LeftNav";

const feeds = {
  feed1: {
    id: "feed1",
    label: "Feed 1",
    videos: [
      { src: "/videos/Lazer 🔵 VS 🟢 Orbital [2HxET-pqRjk].webm" },
      { src: "/videos/Lazer 🔵 VS 🟢 Orbital [2HxET-pqRjk].webm" },
      { src: "/videos/Lazer 🔵 VS 🟢 Orbital [2HxET-pqRjk].webm" }
    ],
  },
  feed2: {
    id: "feed2",
    label: "Feed 2",
    videos: [
      { src: '/videos/Key & Peele S5E10 🤯 ｜ When “Comedy” Goes Way Too Far [ghwFg-JTRqU].webm' },
      { src: '/videos/Key & Peele S5E10 🤯 ｜ When “Comedy” Goes Way Too Far [ghwFg-JTRqU].webm' },
      { src: '/videos/Key & Peele S5E10 🤯 ｜ When “Comedy” Goes Way Too Far [ghwFg-JTRqU].webm' }
      // Add more videos here
    ],
  },
  feed3: {
    id: "feed3",
    label: "Feed 3",
    videos: [
      { src: '/videos/Steve Harvey be like： SHE SAID WHAT! [DoJQiFaLm9I].webm' },
      { src: "/videos/Lazer 🔵 VS 🟢 Orbital [2HxET-pqRjk].webm" }
    ],
  },
};

export default function Home() {
  const [activeFeedId, setActiveFeedId] = useState("feed1");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [userHasUnmuted, setUserHasUnmuted] = useState(false);
  const feedRef = useRef(null);

  const currentVideos = feeds[activeFeedId]?.videos ?? [];

  const scrollToIndex = useCallback((index) => {
    const el = feedRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(index, currentVideos.length - 1));
    el.scrollTo({ top: clamped * window.innerHeight, behavior: "smooth" });
  }, [currentVideos.length]);

  const handleFeedScroll = useCallback(() => {
    const el = feedRef.current;
    if (!el) return;
    const vh = window.innerHeight;
    const index = Math.round(el.scrollTop / vh);
    setCurrentVideoIndex(Math.max(0, Math.min(index, currentVideos.length - 1)));
  }, [currentVideos.length]);

  const handleSelectFeed = useCallback((feedId) => {
    setActiveFeedId(feedId);
    setCurrentVideoIndex(0);
    setTimeout(() => {
      feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  }, []);

  return (
    <main
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        backgroundColor: "#0f0f0f",
        overflow: "hidden",
      }}
    >
      <LeftNav
        feeds={Object.values(feeds)}
        activeFeedId={activeFeedId}
        onSelectFeed={handleSelectFeed}
      />

      <div
        key={activeFeedId}
        ref={feedRef}
        className="feed-scroll"
        onScroll={handleFeedScroll}
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
        }}
      >
        {currentVideos.map((item, i) => (
          <section
            key={i}
            style={{
              height: "100vh",
              minHeight: "100vh",
              scrollSnapAlign: "start",
              scrollSnapStop: "always",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Video
              src={item.src}
              poster={item.poster}
              controls={false}
              muted={!userHasUnmuted}
              onUnmute={() => setUserHasUnmuted(true)}
              style={{
                width: "100%",
                height: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </section>
        ))}
      </div>

      <aside
        style={{
          width: "80px",
          minWidth: "80px",
          height: "100vh",
          backgroundColor: "#0f0f0f",
          borderLeft: "1px solid #2a2a2a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
        }}
      >
        <button
          type="button"
          onClick={() => scrollToIndex(currentVideoIndex - 1)}
          disabled={currentVideoIndex === 0}
          aria-label="Previous video"
          style={{
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            border: "none",
            backgroundColor: currentVideoIndex === 0 ? "#1a1a1a" : "#2a2a2a",
            color: currentVideoIndex === 0 ? "#555" : "#fff",
            fontSize: "1.25rem",
            cursor: currentVideoIndex === 0 ? "not-allowed" : "pointer",
            transition: "background-color 0.15s ease",
          }}
        >
          ↑
        </button>
        <span style={{ fontSize: "0.8rem", color: "#888" }}>
          {currentVideoIndex + 1} / {currentVideos.length}
        </span>
        <button
          type="button"
          onClick={() => scrollToIndex(currentVideoIndex + 1)}
          disabled={currentVideoIndex === currentVideos.length - 1}
          aria-label="Next video"
          style={{
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            border: "none",
            backgroundColor:
              currentVideoIndex === currentVideos.length - 1 ? "#1a1a1a" : "#2a2a2a",
            color:
              currentVideoIndex === currentVideos.length - 1 ? "#555" : "#fff",
            fontSize: "1.25rem",
            cursor:
              currentVideoIndex === currentVideos.length - 1 ? "not-allowed" : "pointer",
            transition: "background-color 0.15s ease",
          }}
        >
          ↓
        </button>
      </aside>
    </main>
  );
}
