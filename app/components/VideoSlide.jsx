"use client";

import { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import Video from "./Video";
import QuestionCard from "./QuestionCard";
import "./VideoSlide.css";

const AUTO_SCROLL_DELAY_MS = 1000;

function normalizeVideo(item) {
  if (typeof item === "string") return { src: item, poster: undefined, audioSrc: undefined, audioDurationMs: undefined };
  return {
    src: item.src,
    poster: item.poster,
    audioSrc: item.audioSrc,
    audioDurationMs: item.audioDurationMs,
  };
}

function getMaxAllowedSectionIndex(answeredCorrectly) {
  const firstUnanswered = answeredCorrectly.findIndex((a) => !a);
  if (firstUnanswered === -1) return answeredCorrectly.length * 2 - 1;
  return firstUnanswered * 2 + 1;
}

const VideoSlide = forwardRef(function VideoSlide(
  {
    videos = [],
    questions = [],
    currentIndex = 0,
    className,
    style,
    onSectionChange,
    onAnsweredCorrectlyChange,
  },
  ref
) {
  const [userHasStartedPlayback, setUserHasStartedPlayback] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(() =>
    questions.length ? Array(questions.length).fill(false) : []
  );
  const scrollRef = useRef(null);
  const isClampingRef = useRef(false);
  const lastReportedSectionRef = useRef(-1);
  const maxAllowedSectionRef = useRef(0);
  const autoScrollTimeoutRef = useRef(null);

  const hasQuestions =
    questions.length > 0 && questions.length === videos.length;
  const sectionCount = hasQuestions ? videos.length * 2 : 0;

  const maxAllowedSection = hasQuestions
    ? getMaxAllowedSectionIndex(answeredCorrectly)
    : 0;
  maxAllowedSectionRef.current = maxAllowedSection;

  const cancelAutoScroll = useCallback(() => {
    if (autoScrollTimeoutRef.current != null) {
      clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollToSection(index) {
        const el = scrollRef.current;
        if (!el || !hasQuestions) return;
        const vh = el.clientHeight;
        if (vh <= 0) return;
        const clamped = Math.max(0, Math.min(index, maxAllowedSection));
        el.scrollTo({ top: clamped * vh, behavior: "smooth" });
        lastReportedSectionRef.current = clamped;
        onSectionChange?.(clamped, sectionCount);
      },
      cancelAutoScroll,
    }),
    [hasQuestions, maxAllowedSection, sectionCount, onSectionChange, cancelAutoScroll]
  );

  useEffect(() => {
    onAnsweredCorrectlyChange?.(answeredCorrectly);
  }, [answeredCorrectly, onAnsweredCorrectlyChange]);

  const handleCorrect = useCallback(
    (questionIndex) => {
      setAnsweredCorrectly((prev) => {
        const next = [...prev];
        next[questionIndex] = true;
        return next;
      });
      if (autoScrollTimeoutRef.current != null) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
      autoScrollTimeoutRef.current = setTimeout(() => {
        autoScrollTimeoutRef.current = null;
        const el = scrollRef.current;
        if (!el || !hasQuestions) return;
        const vh = el.clientHeight;
        if (vh <= 0) return;
        const nextSection = questionIndex * 2 + 2;
        const maxAllowed = maxAllowedSectionRef.current;
        const clamped = Math.min(nextSection, maxAllowed);
        el.scrollTo({ top: clamped * vh, behavior: "smooth" });
        lastReportedSectionRef.current = clamped;
        onSectionChange?.(clamped, sectionCount);
      }, AUTO_SCROLL_DELAY_MS);
    },
    [hasQuestions, sectionCount, onSectionChange]
  );

  const reportSection = useCallback(
    (sectionIndex) => {
      if (sectionIndex !== lastReportedSectionRef.current && sectionCount > 0) {
        lastReportedSectionRef.current = sectionIndex;
        onSectionChange?.(sectionIndex, sectionCount);
      }
    },
    [sectionCount, onSectionChange]
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasQuestions || isClampingRef.current) return;
    const vh = el.clientHeight;
    if (vh <= 0) return;
    const scrollTop = el.scrollTop;
    const sectionIndex = Math.round(scrollTop / vh);
    if (sectionIndex > maxAllowedSection) {
      isClampingRef.current = true;
      el.scrollTop = maxAllowedSection * vh;
      requestAnimationFrame(() => {
        isClampingRef.current = false;
      });
    }
    reportSection(Math.round(el.scrollTop / vh));
  }, [hasQuestions, maxAllowedSection, reportSection]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !hasQuestions) return;
    const vh = el.clientHeight;
    if (vh <= 0) return;
    const scrollTop = el.scrollTop;
    const sectionIndex = Math.round(scrollTop / vh);
    if (sectionIndex > maxAllowedSection) {
      el.scrollTop = maxAllowedSection * vh;
    }
  }, [hasQuestions, maxAllowedSection]);

  useEffect(() => {
    if (hasQuestions && sectionCount > 0) {
      reportSection(0);
    }
  }, [hasQuestions, sectionCount, reportSection]);

  useEffect(() => {
    return () => {
      if (autoScrollTimeoutRef.current != null) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !hasQuestions) return;
    const onWheel = (e) => {
      if (autoScrollTimeoutRef.current != null) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
      const vh = el.clientHeight;
      if (vh <= 0) return;
      const sectionIndex = Math.round(el.scrollTop / vh);
      const maxAllowed = maxAllowedSectionRef.current;
      if (sectionIndex >= maxAllowed && e.deltaY > 0) {
        e.preventDefault();
      }
    };
    let touchStartY = 0;
    const onTouchStart = (e) => {
      if (autoScrollTimeoutRef.current != null) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      const vh = el.clientHeight;
      if (vh <= 0) return;
      const sectionIndex = Math.round(el.scrollTop / vh);
      const maxAllowed = maxAllowedSectionRef.current;
      if (sectionIndex >= maxAllowed) {
        const touchY = e.touches[0].clientY;
        if (touchY < touchStartY) {
          e.preventDefault();
        }
      }
      touchStartY = e.touches[0].clientY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [hasQuestions]);

  if (!videos.length) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          height: "100%",
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#888",
          ...style,
        }}
      >
        No video
      </div>
    );
  }

  if (questions.length > 0 && questions.length !== videos.length) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          height: "100%",
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#888",
          ...style,
        }}
      >
        Invalid config: videos and questions must have the same length
      </div>
    );
  }

  if (!hasQuestions) {
    const clampedIndex = Math.max(0, Math.min(currentIndex, videos.length - 1));
    const slideHeightPercent = 100 / videos.length;
    const translateYPercent = (clampedIndex / videos.length) * 100;
    return (
      <div
        className={className}
        style={{
          width: "100%",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
          ...style,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: `${videos.length * 100}%`,
            transform: `translateY(-${translateYPercent}%)`,
            transition: "transform 0.3s ease",
          }}
        >
          {videos.map((item, i) => {
            const { src, poster, audioSrc, audioDurationMs } = normalizeVideo(item);
            return (
              <div
                key={i}
                style={{
                  flex: `0 0 ${slideHeightPercent}%`,
                  width: "100%",
                  minHeight: 0,
                  display: "flex",
                  overflow: "hidden",
                  borderRadius: "12px",
                  transform: "translateZ(0)",
                  isolation: "isolate",
                }}
              >
                <Video
                  src={src}
                  poster={poster}
                  audioSrc={audioSrc}
                  audioDurationMs={audioDurationMs}
                  controls={false}
                  muted={true}
                  autoPlayOnScroll={userHasStartedPlayback}
                  onUserStartedPlayback={() => setUserHasStartedPlayback(true)}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={["videoSlideScroll", className].filter(Boolean).join(" ")}
      onScroll={handleScroll}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        scrollSnapType: "y mandatory",
        scrollBehavior: "smooth",
        ...style,
      }}
    >
      {videos.map((item, i) => {
        const { src, poster, audioSrc, audioDurationMs } = normalizeVideo(item);
        return (
          <div key={`section-${i}`}>
            <section
              style={{
                height: "100vh",
                minHeight: "100vh",
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  maxHeight: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <Video
                  src={src}
                  poster={poster}
                  audioSrc={audioSrc}
                  audioDurationMs={audioDurationMs}
                  controls={false}
                  muted={true}
                  autoPlayOnScroll={userHasStartedPlayback}
                  onUserStartedPlayback={() => setUserHasStartedPlayback(true)}
                  style={{
                    width: "100%",
                    height: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            </section>
            <section
              style={{
                height: "100vh",
                minHeight: "100vh",
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                boxSizing: "border-box",
                backgroundColor: "#0f0f0f",
              }}
            >
              <QuestionCard
                question={questions[i]}
                onCorrect={() => handleCorrect(i)}
                answered={answeredCorrectly[i]}
              />
            </section>
          </div>
        );
      })}
    </div>
  );
});

export default VideoSlide;
