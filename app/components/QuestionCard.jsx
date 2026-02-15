"use client";

import { useState, useEffect, useRef } from "react";

const COOLDOWN_SECONDS = 5;

export default function QuestionCard({ question, onCorrect, answered = false }) {
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [showWrong, setShowWrong] = useState(false);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCooldown = () => {
    setShowWrong(true);
    setCooldownRemaining(COOLDOWN_SECONDS);
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          intervalRef.current = null;
          setShowWrong(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    intervalRef.current = interval;
  };

  const handleOptionClick = (optionIndex) => {
    if (answered || cooldownRemaining > 0) return;
    if (optionIndex === question.correctIndex) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCooldownRemaining(0);
      setShowWrong(false);
      onCorrect();
    } else {
      startCooldown();
    }
  };

  if (!question || !question.options || question.options.length !== 4) {
    return (
      <div style={{ padding: "1rem", color: "#888" }}>Invalid question</div>
    );
  }

  const optionsDisabled = answered || cooldownRemaining > 0;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "480px",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "1.125rem",
          fontWeight: 600,
          color: "#fff",
          lineHeight: 1.4,
        }}
      >
        {question.text}
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {question.options.map((option, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleOptionClick(i)}
            disabled={optionsDisabled}
            style={{
              padding: "0.75rem 1rem",
              textAlign: "left",
              fontSize: "0.95rem",
              border: "1px solid #2a2a2a",
              borderRadius: "8px",
              backgroundColor: optionsDisabled ? "#1a1a1a" : "#252525",
              color: optionsDisabled ? "#555" : "#fff",
              cursor: optionsDisabled ? "not-allowed" : "pointer",
              transition: "background-color 0.15s ease, border-color 0.15s ease",
            }}
          >
            {option}
          </button>
        ))}
      </div>
      {answered && (
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#4ade80" }}>
          Correct!
        </p>
      )}
      {showWrong && cooldownRemaining > 0 && (
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#f87171" }}>
          Incorrect. Try again in {cooldownRemaining}s
        </p>
      )}
    </div>
  );
}
