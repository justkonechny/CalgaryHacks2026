"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import VideoSlide from "./components/VideoSlide";
import LeftNav from "./components/LeftNav";
import EmptyFeedForm from "./components/EmptyFeedForm";
import "./page.css";

export default function Home() {
  const [feeds, setFeeds] = useState({});
  const [activeFeedId, setActiveFeedId] = useState(null);
  const [feedsLoading, setFeedsLoading] = useState(true);
  const [feedContentLoading, setFeedContentLoading] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState([]);
  const videoSlideRef = useRef(null);

  const feedList = Object.values(feeds);
  const activeFeed = activeFeedId ? feeds[activeFeedId] : null;
  const currentVideos = activeFeed?.videos ?? [];
  const currentQuestions = activeFeed?.questions ?? [];

  const isOnQuestionSection =
    currentQuestions.length > 0 && sectionIndex % 2 === 1;
  const currentQuestionIndex = isOnQuestionSection
    ? Math.floor(sectionIndex / 2)
    : -1;
  const currentQuestionAnswered =
    currentQuestionIndex >= 0 &&
    (answeredCorrectly[currentQuestionIndex] ?? false);
  const canAdvancePastQuestion =
    !isOnQuestionSection || currentQuestionAnswered;

  // Load feed list on mount
  useEffect(() => {
    let cancelled = false;
    setFeedsLoading(true);
    fetch("/api/feeds", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list = data.feeds || [];
        const next = {};
        list.forEach((r) => {
          const id = String(r.id);
          next[id] = {
            id,
            label: r.label || r.prompt || "Feed",
            status: r.status,
            createdAt: r.createdAt,
            videos: [],
            questions: [],
            topicPrompt: "",
            sources: "",
            difficulty: "medium",
          };
        });
        setFeeds(next);
        setActiveFeedId((prev) => {
          if (prev && next[prev]) return prev;
          return list.length > 0 ? String(list[0].id) : null;
        });
      })
      .catch(() => {
        if (!cancelled) setFeeds({});
      })
      .finally(() => {
        if (!cancelled) setFeedsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load feed content when active feed changes
  useEffect(() => {
    if (!activeFeedId) return;
    let cancelled = false;
    setFeedContentLoading(true);
    fetch(`/api/feed?threadId=${encodeURIComponent(activeFeedId)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const videos = (data.videos || []).map((v) => ({
          src: v.src,
          audioSrc: v.audioSrc ?? undefined,
          audioDurationMs: v.audioDurationMs,
        }));
        const questions = data.questions || [];
        setFeeds((prev) => ({
          ...prev,
          [activeFeedId]: {
            ...prev[activeFeedId],
            videos,
            questions,
          },
        }));
        setSectionIndex(0);
        const count = videos.length * 2;
        setTotalSections(count);
        setAnsweredCorrectly([]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFeedContentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeFeedId]);

  const handleSelectFeed = useCallback(
    (feedId) => {
      setActiveFeedId(feedId);
      setSectionIndex(0);
      setAnsweredCorrectly([]);
      const f = feeds[feedId];
      const count = (f?.videos?.length ?? 0) * 2;
      setTotalSections(count);
    },
    [feeds],
  );

  const handleCreateFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "New feed" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create feed");
      const threadId = data.threadId;
      if (threadId == null) throw new Error("No threadId returned");
      const id = String(threadId);
      setFeeds((prev) => ({
        ...prev,
        [id]: {
          id,
          label: "New feed",
          status: "ready",
          createdAt: new Date().toISOString(),
          videos: [],
          questions: [],
          topicPrompt: "",
          sources: "",
          difficulty: "medium",
        },
      }));
      setActiveFeedId(id);
      setSectionIndex(0);
      setTotalSections(0);
      setAnsweredCorrectly([]);
    } catch (e) {
      console.error("Create feed failed:", e);
    }
  }, []);

  const handleEmptyFeedConfigChange = useCallback((feedId, updates) => {
    setFeeds((prev) => ({
      ...prev,
      [feedId]: { ...prev[feedId], ...updates },
    }));
  }, []);

  const handleRenameFeed = useCallback(
    async (feedId, newLabel) => {
      const trimmed = newLabel?.trim() || feeds[feedId]?.label;
      if (!trimmed) return;
      try {
        const res = await fetch(`/api/feeds/${feedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed }),
        });
        if (!res.ok) return;
        setFeeds((prev) => ({
          ...prev,
          [feedId]: { ...prev[feedId], label: trimmed },
        }));
      } catch (e) {
        console.error("Rename feed failed:", e);
      }
    },
    [feeds],
  );

  const handleSectionChange = useCallback((index, total) => {
    setSectionIndex(index);
    setTotalSections(total);
  }, []);

  const refetchActiveFeedContent = useCallback(() => {
    if (!activeFeedId) return;
    setFeedContentLoading(true);
    fetch(`/api/feed?threadId=${encodeURIComponent(activeFeedId)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        const videos = (data.videos || []).map((v) => ({
          src: v.src,
          audioSrc: v.audioSrc ?? undefined,
          audioDurationMs: v.audioDurationMs,
        }));
        const questions = data.questions || [];
        setFeeds((prev) => ({
          ...prev,
          [activeFeedId]: {
            ...prev[activeFeedId],
            videos,
            questions,
          },
        }));
        setTotalSections(videos.length * 2);
        setAnsweredCorrectly([]);
      })
      .catch(() => {})
      .finally(() => setFeedContentLoading(false));
  }, [activeFeedId]);

  const goToPrev = useCallback(() => {
    videoSlideRef.current?.cancelAutoScroll?.();
    videoSlideRef.current?.scrollToSection(sectionIndex - 1);
  }, [sectionIndex]);

  const goToNext = useCallback(() => {
    videoSlideRef.current?.cancelAutoScroll?.();
    videoSlideRef.current?.scrollToSection(sectionIndex + 1);
  }, [sectionIndex]);

  const displayTotal =
    totalSections > 0 ? totalSections : currentVideos.length * 2;

  if (feedsLoading) {
    return (
      <main
        className="pageLayout"
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <span style={{ color: "#888" }}>Loading feeds...</span>
      </main>
    );
  }

  return (
    <main className="pageLayout">
      <LeftNav
        feeds={feedList}
        activeFeedId={activeFeedId}
        onSelectFeed={handleSelectFeed}
        onCreateFeed={handleCreateFeed}
        onRenameFeed={handleRenameFeed}
      />

      {feedList.length === 0 ? (
        <div
          className="videoSlideWrapper"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0f0f0f",
            padding: "2rem",
          }}
        >
          <p style={{ color: "#888", marginBottom: "1rem" }}>No feeds yet.</p>
          <button
            type="button"
            onClick={handleCreateFeed}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              border: "1px solid #3a3a3a",
              backgroundColor: "#2a2a2a",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Create your first feed
          </button>
        </div>
      ) : activeFeedId && !feedContentLoading && currentVideos.length === 0 ? (
        <EmptyFeedForm
          topicPrompt={activeFeed?.topicPrompt ?? ""}
          sources={activeFeed?.sources ?? ""}
          difficulty={activeFeed?.difficulty ?? "medium"}
          threadId={activeFeedId}
          onChange={(updates) =>
            handleEmptyFeedConfigChange(activeFeedId, updates)
          }
          onVideoReady={() => refetchActiveFeedContent()}
          className="videoSlideWrapper"
        />
      ) : activeFeedId && (feedContentLoading || currentVideos.length > 0) ? (
        feedContentLoading && currentVideos.length === 0 ? (
          <div
            className="videoSlideWrapper"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#0f0f0f",
            }}
          >
            <span style={{ color: "#888" }}>Loading feed...</span>
          </div>
        ) : (
          <VideoSlide
            ref={videoSlideRef}
            key={activeFeedId}
            videos={currentVideos}
            questions={currentQuestions}
            onSectionChange={handleSectionChange}
            onAnsweredCorrectlyChange={setAnsweredCorrectly}
            className="videoSlideWrapper"
          />
        )
      ) : null}

      <aside className="navAside">
        <button
          type="button"
          className="navBtn"
          onClick={goToPrev}
          disabled={sectionIndex === 0}
          aria-label="Previous"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
        <span className="navCounter">
          {sectionIndex + 1} / {displayTotal}
        </span>
        <button
          type="button"
          className="navBtn"
          onClick={goToNext}
          disabled={sectionIndex >= displayTotal - 1 || !canAdvancePastQuestion}
          aria-label="Next"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </aside>
    </main>
  );
}
