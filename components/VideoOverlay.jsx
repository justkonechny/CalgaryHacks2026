"use client";

export default function VideoOverlay({ username, caption, muted, onToggleMuted }) {
  return (
    <div className="overlay">
      <div className="overlayBottom">
        <div className="username">{username}</div>
        <div className="caption">{caption}</div>
      </div>

      <div className="overlayRight">
        <button className="btn" type="button" onClick={onToggleMuted} aria-label="Toggle sound">
          {muted ? "🔇" : "🔊"}
        </button>

        <button
          className="btnSmall"
          type="button"
          onClick={() => alert("Like placeholder")}
        >
          ❤️ Like
        </button>

        <button
          className="btnSmall"
          type="button"
          onClick={() => alert("Share placeholder")}
        >
          📤 Share
        </button>
      </div>
    </div>
  );
}
