"use client";

export default function LeftNav({ feeds = [], activeFeedId, onSelectFeed }) {
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
      <h2
        style={{
          margin: 0,
          padding: "0.6rem 0.75rem",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "#888",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Feeds
      </h2>
      {feeds.map((feed) => {
        const isActive = feed.id === activeFeedId;
        return (
          <button
            key={feed.id}
            type="button"
            onClick={() => onSelectFeed?.(feed.id)}
            style={{
              width: "100%",
              padding: "0.6rem 0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              border: "none",
              borderRadius: "8px",
              backgroundColor: isActive ? "#2a2a2a" : "transparent",
              color: "#fff",
              fontSize: "1rem",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
            onMouseOver={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = "#2a2a2a";
            }}
            onMouseOut={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {feed.label}
          </button>
        );
      })}
    </nav>
  );
}
