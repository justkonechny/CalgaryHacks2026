"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Video from "./components/Video";
import LeftNav from "./components/LeftNav";

const videos = [
  { src: "/videos/Lazer 🔵 VS 🟢 Orbital [2HxET-pqRjk].webm" },
  { src: "/videos/Steve Harvey be like： SHE SAID WHAT! [DoJQiFaLm9I].webm" },
  {src: "/videos/Key & Peele S5E10 🤯 ｜ When “Comedy” Goes Way Too Far [ghwFg-JTRqU].webm"}
];



export default function Home() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [userHasUnmuted, setUserHasUnmuted] = useState(false);
  const feedRef = useRef(null);

  const scrollToIndex = useCallback((index) => {
    const el = feedRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(index, videos.length - 1));
    el.scrollTo({ top: clamped * window.innerHeight, behavior: "smooth" });
  }, []);

  const handleFeedScroll = useCallback(() => {
    const el = feedRef.current;
    if (!el) return;
    const vh = window.innerHeight;
    const index = Math.round(el.scrollTop / vh);
    setCurrentVideoIndex(Math.max(0, Math.min(index, videos.length - 1)));
  }, []);

  // function for calling LLM for searching
  async function searchTest() {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // put search input parameters in here
        query: `socrates plato aristotle`,
      }),
    });

      function testClick() {
    console.log("button pressed");
    searchTest();
  }
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
      <LeftNav />

      <div
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
        {videos.map((item, i) => (
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
          {currentVideoIndex + 1} / {videos.length}
        </span>
        <button
          type="button"
          onClick={() => scrollToIndex(currentVideoIndex + 1)}
          disabled={currentVideoIndex === videos.length - 1}
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
              currentVideoIndex === videos.length - 1 ? "#1a1a1a" : "#2a2a2a",
            color:
              currentVideoIndex === videos.length - 1 ? "#555" : "#fff",
            fontSize: "1.25rem",
            cursor:
              currentVideoIndex === videos.length - 1 ? "not-allowed" : "pointer",
            transition: "background-color 0.15s ease",
          }}
        >
          ↓
        </button>
      </aside>
    </main>
  );
}
