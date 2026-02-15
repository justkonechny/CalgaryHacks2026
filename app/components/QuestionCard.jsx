"use client";

import { useState, useEffect, useRef } from "react";
import "./QuestionCard.css";

const COOLDOWN_SECONDS = 5;

export default function QuestionCard({ question, onCorrect, answered = false }) {
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [showWrong, setShowWrong] = useState(false);
  const [wrongClickedIndices, setWrongClickedIndices] = useState(() => new Set());
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
    if (answered || cooldownRemaining > 0 || wrongClickedIndices.has(optionIndex)) return;
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
      setWrongClickedIndices((prev) => new Set(prev).add(optionIndex));
      startCooldown();
    }
  };

  if (!question || !question.options || question.options.length !== 4) {
    return <div className="questionCardInvalid">Invalid question</div>;
  }

  const isOptionDisabled = (i) => answered || cooldownRemaining > 0 || wrongClickedIndices.has(i);

  return (
    <div className="questionCard">
      <p className="questionCardText">{question.text}</p>
      <div className="questionCardOptions">
        {question.options.map((option, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleOptionClick(i)}
            disabled={isOptionDisabled(i)}
            className={`questionCardOption ${isOptionDisabled(i) ? "questionCardOption--disabled" : ""} ${wrongClickedIndices.has(i) ? "questionCardOption--incorrect" : ""} ${answered && i === question.correctIndex ? "questionCardOption--correct" : ""}`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="questionCardFeedback">
        {answered && (
          <p className="questionCardFeedbackCorrect">Correct!</p>
        )}
        {showWrong && cooldownRemaining > 0 && (
          <p className="questionCardFeedbackIncorrect">
            Incorrect. Try again in {cooldownRemaining}s
          </p>
        )}
      </div>
    </div>
  );
}
