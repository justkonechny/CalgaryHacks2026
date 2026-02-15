"use client";

import { useState, useRef, useEffect } from "react";

export default function Video({ src, poster, audioSrc, audioDurationMs, controls = true, muted = true, autoPlayOnScroll = false, onUserStartedPlayback, className, style }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    const container = containerRef.current;
    if (!video || !container) return;
    let playTimer;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;
        if (entry.isIntersecting) {
          if (autoPlayOnScroll) {
            playTimer = setTimeout(() => video.play().catch(() => {}), 150);
            if (audio && audioSrc) {
              audio.play().catch(() => {});
            }
            setIsPaused(false);
          }
        } else {
          clearTimeout(playTimer);
          video.pause();
          if (audio && audioSrc) {
            audio.pause();
            audio.currentTime = 0;
          }
          setIsPaused(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(container);
    return () => {
      clearTimeout(playTimer);
      observer.disconnect();
    };
  }, [audioSrc, autoPlayOnScroll]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video) return;
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    if (nextPaused) {
      video.pause();
      if (audio && audioSrc) audio.pause();
    } else {
      onUserStartedPlayback?.();
      video.play().catch(() => {});
      if (audio && audioSrc) audio.play().catch(() => {});
    }
  };

  const handleClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (audioSrc) {
      handlePlayPause();
    } else {
      if (video.paused) {
        onUserStartedPlayback?.();
        video.play();
      } else {
        video.pause();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`video-rounded ${className ?? ""}`.trim()}
      style={{
        position: "relative",
        width: "100%",
        maxHeight: "90vh",
        ...style,
        overflow: "hidden",
        borderRadius: "12px",
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls={controls}
        muted={true}
        playsInline
        loop
        onClick={handleClick}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: "contain",
          cursor: "pointer",
        }}
      />
      {audioSrc && (
        <>
          <audio
            ref={audioRef}
            src={audioSrc}
            style={{ display: "none" }}
            playsInline
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPause();
            }}
            aria-label={isPaused ? "Play" : "Pause"}
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              zIndex: 2,
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "rgba(0,0,0,0.6)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            {isPaused ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </button>
        </>
      )}
    </div>
  );
}
