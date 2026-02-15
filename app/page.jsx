"use client";

import { useState, useRef, useCallback } from "react";
import VideoSlide from "./components/VideoSlide";
import LeftNav from "./components/LeftNav";
import "./page.css";

const feeds = {
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

export default function Home() {
  const [activeFeedId, setActiveFeedId] = useState("feed1");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const videoSlideRef = useRef(null);

  const currentVideos = feeds[activeFeedId]?.videos ?? [];
  const currentQuestions = feeds[activeFeedId]?.questions ?? [];

  const handleSelectFeed = useCallback((feedId) => {
    setActiveFeedId(feedId);
    setSectionIndex(0);
    const count = (feeds[feedId]?.videos?.length ?? 0) * 2;
    setTotalSections(count);
  }, []);

  const handleSectionChange = useCallback((index, total) => {
    setSectionIndex(index);
    setTotalSections(total);
  }, []);

  const goToPrev = useCallback(() => {
    videoSlideRef.current?.scrollToSection(sectionIndex - 1);
  }, [sectionIndex]);

  const goToNext = useCallback(() => {
    videoSlideRef.current?.scrollToSection(sectionIndex + 1);
  }, [sectionIndex]);

  const displayTotal = totalSections > 0 ? totalSections : currentVideos.length * 2;

  return (
    <main className="pageLayout">
      <LeftNav
        feeds={Object.values(feeds)}
        activeFeedId={activeFeedId}
        onSelectFeed={handleSelectFeed}
      />

      <VideoSlide
        ref={videoSlideRef}
        key={activeFeedId}
        videos={currentVideos}
        questions={currentQuestions}
        onSectionChange={handleSectionChange}
        className="videoSlideWrapper"
      />

      <aside className="navAside">
        <button
          type="button"
          className="navBtn"
          onClick={goToPrev}
          disabled={sectionIndex === 0}
          aria-label="Previous"
        >
          ↑
        </button>
        <span className="navCounter">
          {sectionIndex + 1} / {displayTotal}
        </span>
        <button
          type="button"
          className="navBtn"
          onClick={goToNext}
          disabled={sectionIndex >= displayTotal - 1}
          aria-label="Next"
        >
          ↓
        </button>
      </aside>
    </main>
  );
}
