"use client";

import { useRef, useEffect } from "react";

export default function Video({ src, poster, audioSrc, audioDurationMs, controls = true, muted = true, onUnmute, className, style }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const containerRef = useRef(null);

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
          playTimer = setTimeout(() => video.play().catch(() => {}), 150);
          if (audio && audioSrc) {
            audio.play().catch(() => {});
          }
        } else {
          clearTimeout(playTimer);
          video.pause();
          if (audio && audioSrc) {
            audio.pause();
            audio.currentTime = 0;
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(container);
    return () => {
      clearTimeout(playTimer);
      observer.disconnect();
    };
  }, [audioSrc]);

  const handleClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted && onUnmute) {
      onUnmute();
      video.muted = false;
      return;
    }
    if (video.paused) {
      video.play();
    } else {
      video.pause();
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
        muted={muted}
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
        <audio
          ref={audioRef}
          src={audioSrc}
          style={{ display: "none" }}
          playsInline
        />
      )}
    </div>
  );
}
