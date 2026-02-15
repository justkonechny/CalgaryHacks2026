"use client";

import { useState } from "react";
import { createSoraVideo } from "@/lib/soraCreate";

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

const buttonStyle = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  borderRadius: "8px",
  border: "1px solid #2a2a2a",
  backgroundColor: "#2a2a2a",
  color: "#fff",
  fontSize: "1rem",
  fontFamily: "inherit",
  cursor: "pointer",
  fontWeight: 600,
};

export default function EmptyFeedForm({
  topicPrompt = "",
  sources = "",
  difficulty = "medium",
  threadId = null,
  onChange,
  onVideoReady,
  className,
  style,
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    const text = topicPrompt.trim();
    if (!text || isGenerating) return;

    setIsGenerating(true);
    setError("");

    // 1) Generate the script thread via Groq AND save prompt/difficulty/sources to DB (server-side).
    // For now: just console.log the returned JSON.
    try {
      await handleGenerateText();

      const groqResp = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: text,
          difficulty,
          sources, // can be string (newline/comma) - server normalizes
          threadId, // tells the API to also insert/update DB rows for this thread
        }),
      });

      const groqData = await groqResp.json().catch(() => null);

      if (!groqResp.ok) {
        const msg =
          groqData?.error ||
          `Groq script generation failed (HTTP ${groqResp.status})`;
        setIsGenerating(false);
        setError(msg);
        return;
      }

      console.log("Groq micro-learning thread JSON:", groqData);
    } catch (e) {
      setIsGenerating(false);
      setError(String(e?.message || e));
      return;
    }

    // 2) Generate the video from the prompt (existing flow)
    const result = await createSoraVideo(text, threadId);

      // setIsGenerating(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      onVideoReady?.({ src: result.url });
    } catch (error) {
      console.error("Generation error:", error);
      setError(error.message || "Failed to generate video. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  // text generation and tts
  const handleGenerateText = async () => {
    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: topicPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("Generation result:", data);

      // save to database?
      //TODO

      // Play the audio immediately to test
      // if (data.audioUrl) {
      //   const audio = new Audio(data.audioUrl);
      //   audio.play().catch((err) => console.error("Audio play error:", err));
      //   console.log("Playing audio from:", data.audioUrl);
      // }
    } catch (error) {
      console.error("Generation error:", error);
      throw new Error("Failed to generate content. Please try again.");
    }
  };

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
            onChange={(e) => onChange?.({ difficulty: e.target.value })}
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

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!topicPrompt.trim() || isGenerating}
          style={{
            ...buttonStyle,
            opacity: !topicPrompt.trim() || isGenerating ? 0.6 : 1,
          }}
        >
          {isGenerating ? "Generating..." : "Generate video"}
        </button>

        {error ? (
          <div style={{ fontSize: "0.85rem", color: "#e55" }}>{error}</div>
        ) : null}
      </div>
    </div>
  );
}
