"use client";

const inputStyle = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid #2a2a2a",
  backgroundColor: "#1a1a1a",
  color: "#fff",
  fontSize: "1rem",
  fontFamily: "inherit",
};

const labelStyle = {
  display: "block",
  marginBottom: "0.35rem",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#888",
};

export default function EmptyFeedForm({
  topicPrompt = "",
  sources = "",
  difficulty = "medium",
  onChange,
  className,
  style,
}) {
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
        backgroundColor: "#0f0f0f",
        padding: "2rem",
        boxSizing: "border-box",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <div>
          <label htmlFor="empty-feed-topic" style={labelStyle}>
            Topic prompt
          </label>
          <textarea
            id="empty-feed-topic"
            value={topicPrompt}
            onChange={(e) => onChange?.({ topicPrompt: e.target.value })}
            placeholder="Enter a topic or prompt..."
            rows={3}
            style={{
              ...inputStyle,
              resize: "none",
              minHeight: "80px",
            }}
          />
        </div>
        <div>
          <label htmlFor="empty-feed-sources" style={labelStyle}>
            Sources (optional)
          </label>
          <textarea
            id="empty-feed-sources"
            value={sources}
            onChange={(e) => onChange?.({ sources: e.target.value })}
            placeholder="Paste URLs or sources, one per line or comma-separated"
            rows={2}
            style={{
              ...inputStyle,
              resize: "none",
              minHeight: "56px",
            }}
          />
        </div>
        <div>
          <label htmlFor="empty-feed-difficulty" style={labelStyle}>
            Difficulty
          </label>
          <select
            id="empty-feed-difficulty"
            value={difficulty}
            onChange={(e) =>
              onChange?.({ difficulty: e.target.value })
            }
            style={{
              ...inputStyle,
              cursor: "pointer",
            }}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
    </div>
  );
}
