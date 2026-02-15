"use client";

import { useState, useRef, useCallback } from "react";
import VideoSlide from "./components/VideoSlide";
import LeftNav from "./components/LeftNav";
import EmptyFeedForm from "./components/EmptyFeedForm";
import "./page.css";

const initialFeeds = {
  feed1: {
    id: "feed1",
    label: "Feed 1",
    videos: [
      { src: "/videos/Lazer 🔵 VS 🟢 Orbital [2HxET-pqRjk].webm" },
      { src: "/videos/Lazer 🔵 VS 🟢 Orbital [2HxET-pqRjk].webm" },
      { src: "/videos/Lazer 🔵 VS 🟢 Orbital [2HxET-pqRjk].webm" }
    ],
    questions: [
      { text: "Question 1?", options: ["A", "B", "C", "D"], correctIndex: 0 },
      { text: "Question 2?", options: ["A", "B", "C", "D"], correctIndex: 1 },
      { text: "Question 3?", options: ["A", "B", "C", "D"], correctIndex: 2 },
    ],
  },
  feed2: {
    id: "feed2",
    label: "Feed 2",
    videos: [
      { src: "/videos/Lazer 🔵 VS 🟢 Orbital [2HxET-pqRjk].webm" },
      { src: "/videos/Lazer 🔵 VS 🟢 Orbital [2HxET-pqRjk].webm" },
      { src: "/videos/Lazer 🔵 VS 🟢 Orbital [2HxET-pqRjk].webm" }
      // Add more videos here
    ],
    questions: [
      { text: "First question?", options: ["A", "B", "C", "D"], correctIndex: 0 },
      { text: "Second question?", options: ["A", "B", "C", "D"], correctIndex: 1 },
      { text: "Third question?", options: ["A", "B", "C", "D"], correctIndex: 2 },
    ],
  },
  feed3: {
    id: "feed3",
    label: "Feed 3",
    videos: [
      { src: '/videos/Steve Harvey be like： SHE SAID WHAT! [DoJQiFaLm9I].webm' },
      { src: "/videos/Lazer 🔵 VS 🟢 Orbital [2HxET-pqRjk].webm" }
    ],
    questions: [
      { text: "Question 1?", options: ["A", "B", "C", "D"], correctIndex: 0 },
      { text: "Question 2?", options: ["A", "B", "C", "D"], correctIndex: 3 },
    ],
  },
};

function getNextNewFeedLabel(existingLabels) {
  const hasUnnumbered = existingLabels.includes("New feed");
  const numbers = existingLabels
    .map((l) => /^New feed \((\d+)\)$/.exec(l))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));
  const maxN = numbers.length ? Math.max(...numbers) : 0;
  if (!hasUnnumbered && maxN === 0) return "New feed";
  return `New feed (${maxN + 1})`;
}

export default function Home() {
  const [feeds, setFeeds] = useState(initialFeeds);
  const [activeFeedId, setActiveFeedId] = useState("feed1");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const [answeredCorrectly, setAnsweredCorrectly] = useState([]);
  const videoSlideRef = useRef(null);

  const currentVideos = feeds[activeFeedId]?.videos ?? [];
  const currentQuestions = feeds[activeFeedId]?.questions ?? [];

  const isOnQuestionSection = currentQuestions.length > 0 && sectionIndex % 2 === 1;
  const currentQuestionIndex = isOnQuestionSection ? Math.floor(sectionIndex / 2) : -1;
  const currentQuestionAnswered = currentQuestionIndex >= 0 && (answeredCorrectly[currentQuestionIndex] ?? false);
  const canAdvancePastQuestion = !isOnQuestionSection || currentQuestionAnswered;

  const handleSelectFeed = useCallback((feedId) => {
    setActiveFeedId(feedId);
    setSectionIndex(0);
    setAnsweredCorrectly([]);
    const count = (feeds[feedId]?.videos?.length ?? 0) * 2;
    setTotalSections(count);
  }, [feeds]);

  const handleCreateFeed = useCallback(() => {
    const id = `new-feed-${Date.now()}`;
    const existingLabels = Object.values(feeds).map((f) => f.label);
    const label = getNextNewFeedLabel(existingLabels);
    const newFeed = {
      id,
      label,
      videos: [],
      questions: [],
      topicPrompt: "",
      sources: "",
      difficulty: "medium",
    };
    setFeeds((prev) => ({ ...prev, [id]: newFeed }));
    setActiveFeedId(id);
    setSectionIndex(0);
    setTotalSections(0);
    setAnsweredCorrectly([]);
  }, [feeds]);

  const handleEmptyFeedConfigChange = useCallback((feedId, updates) => {
    setFeeds((prev) => ({
      ...prev,
      [feedId]: { ...prev[feedId], ...updates },
    }));
  }, []);

  const handleRenameFeed = useCallback((feedId, newLabel) => {
    setFeeds((prev) => ({
      ...prev,
      [feedId]: { ...prev[feedId], label: newLabel.trim() || prev[feedId].label },
    }));
  }, []);

  const handleSectionChange = useCallback((index, total) => {
    setSectionIndex(index);
    setTotalSections(total);
  }, []);

  const goToPrev = useCallback(() => {
    videoSlideRef.current?.cancelAutoScroll?.();
    videoSlideRef.current?.scrollToSection(sectionIndex - 1);
  }, [sectionIndex]);

  const goToNext = useCallback(() => {
    videoSlideRef.current?.cancelAutoScroll?.();
    videoSlideRef.current?.scrollToSection(sectionIndex + 1);
  }, [sectionIndex]);

  const displayTotal = totalSections > 0 ? totalSections : currentVideos.length * 2;

  return (
    <main className="pageLayout">
      <LeftNav
        feeds={Object.values(feeds)}
        activeFeedId={activeFeedId}
        onSelectFeed={handleSelectFeed}
        onCreateFeed={handleCreateFeed}
        onRenameFeed={handleRenameFeed}
      />

      {currentVideos.length === 0 ? (
        <EmptyFeedForm
          topicPrompt={feeds[activeFeedId]?.topicPrompt ?? ""}
          sources={feeds[activeFeedId]?.sources ?? ""}
          difficulty={feeds[activeFeedId]?.difficulty ?? "medium"}
          onChange={(updates) =>
            handleEmptyFeedConfigChange(activeFeedId, updates)
          }
          className="videoSlideWrapper"
        />
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
      )}

      <aside className="navAside">
        <button
          type="button"
          className="navBtn"
          onClick={goToPrev}
          disabled={sectionIndex === 0}
          aria-label="Previous"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </aside>
    </main>
  );
}
