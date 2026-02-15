"use client";

import { useRef, useEffect } from "react";

export default function Video({ src, poster, controls = true, muted = true, onUnmute, className, style }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let playTimer;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;
        if (entry.isIntersecting) {
          playTimer = setTimeout(() => video.play().catch(() => {}), 150);
        } else {
          clearTimeout(playTimer);
          video.pause();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(video);
    return () => {
      clearTimeout(playTimer);
      observer.disconnect();
    };
  }, []);

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
    </div>
  );
}
