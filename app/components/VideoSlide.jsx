"use client";

import { useState } from "react";
import Video from "./Video";

function normalizeVideo(item) {
  if (typeof item === "string") return { src: item, poster: undefined };
  return { src: item.src, poster: item.poster };
}

export default function VideoSlide({ videos = [], currentIndex = 0, className, style }) {
  const [userHasUnmuted, setUserHasUnmuted] = useState(false);

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
          ...style,
        }}
      >
        No video
      </div>
    );
  }

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
          const { src, poster } = normalizeVideo(item);
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
                controls={false}
                muted={!userHasUnmuted}
                onUnmute={() => setUserHasUnmuted(true)}
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
