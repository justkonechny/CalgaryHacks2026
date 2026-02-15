"use client";

import { useState, useRef, useEffect } from "react";

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

export default function LeftNav({ feeds = [], activeFeedId, onSelectFeed, onCreateFeed, onRenameFeed }) {
  const [editingFeedId, setEditingFeedId] = useState(null);
  const [hoveredFeedId, setHoveredFeedId] = useState(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (editingFeedId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingFeedId]);

  const handleRenameSubmit = (feedId, value) => {
    const trimmed = value.trim();
    if (trimmed) onRenameFeed?.(feedId, trimmed);
    setEditingFeedId(null);
  };

  return (
    <nav
      style={{
        width: "220px",
        minWidth: "220px",
        height: "100vh",
        backgroundColor: "#0f0f0f",
        borderRight: "1px solid #2a2a2a",
        display: "flex",
        flexDirection: "column",
        paddingTop: "1rem",
        paddingLeft: "0.75rem",
        paddingRight: "0.75rem",
        gap: "0.25rem",
      }}
    >
      <img
        src="/iq-reals-logo.svg"
        alt="IQ Reals"
        style={{
          margin: 0,
          padding: "0.5rem 0",
          width: "100%",
          height: "auto",
          display: "block",
          objectFit: "contain",
        }}
      />
      <button
        type="button"
        onClick={() => onCreateFeed?.()}
        style={{
          width: "100%",
          padding: "0.6rem 0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          border: "1px solid #3a3a3a",
          borderRadius: "8px",
          backgroundColor: "transparent",
          color: "#aaa",
          fontSize: "0.95rem",
          cursor: "pointer",
          transition: "background-color 0.15s ease, border-color 0.15s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = "#2a2a2a";
          e.currentTarget.style.borderColor = "#4a4a4a";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.borderColor = "#3a3a3a";
        }}
      >
        Create feed
      </button>
      {feeds.map((feed) => {
        const isActive = feed.id === activeFeedId;
        const isEditing = editingFeedId === feed.id;
        const isHovered = hoveredFeedId === feed.id;
        return (
          <div
            key={feed.id}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              borderRadius: "8px",
              backgroundColor: isActive ? "#764ba2" : isHovered ? "#2a2a2a" : "transparent",
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={() => setHoveredFeedId(feed.id)}
            onMouseLeave={() => setHoveredFeedId(null)}
          >
            {isEditing ? (
              <input
                ref={editInputRef}
                type="text"
                defaultValue={feed.label}
                style={{
                  flex: 1,
                  padding: "0.6rem 0.75rem",
                  border: "1px solid #4a4a4a",
                  borderRadius: "6px",
                  backgroundColor: "#1a1a1a",
                  color: "#fff",
                  fontSize: "1rem",
                  outline: "none",
                }}
                onBlur={(e) => handleRenameSubmit(feed.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleRenameSubmit(feed.id, e.target.value);
                  }
                  if (e.key === "Escape") {
                    setEditingFeedId(null);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onSelectFeed?.(feed.id)}
                  style={{
                    flex: 1,
                    padding: "0.6rem 0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: "transparent",
                    color: "#fff",
                    fontSize: "1rem",
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                    minWidth: 0,
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {feed.label}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFeedId(feed.id);
                  }}
                  style={{
                    flexShrink: 0,
                    width: "28px",
                    height: "28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: "transparent",
                    color: "#888",
                    cursor: "pointer",
                    opacity: isHovered ? 1 : 0,
                    pointerEvents: isHovered ? "auto" : "none",
                    transition: "opacity 0.15s ease, color 0.15s ease, background-color 0.15s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.backgroundColor = "#3a3a3a";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = "#888";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  aria-label="Rename feed"
                >
                  <PencilIcon />
                </button>
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
}
