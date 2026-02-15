"use client";

import { useState } from "react";

export default function TestGroqThreadPage() {
  const [topic, setTopic] = useState("The Black Death and its impact on medieval Europe");
  const [difficulty, setDifficulty] = useState("medium");
  const [sources, setSources] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          sources,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Request failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>
        Groq Micro-Learning Thread Test
      </h1>

      <form onSubmit={handleSubmit} style={{ marginTop: 20, display: "grid", gap: 16 }}>
        
        {/* Topic */}
        <div>
          <label style={{ fontWeight: 600 }}>Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </div>

        {/* Difficulty */}
        <div>
          <label style={{ fontWeight: 600 }}>Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          >
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </div>

        {/* Sources */}
        <div>
          <label style={{ fontWeight: 600 }}>
            Sources (optional — one per line)
          </label>
          <textarea
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            placeholder="https://example.com/source1&#10;https://example.com/source2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 16px",
            width: 160,
            backgroundColor: "#111",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate Thread"}
        </button>
      </form>

      {error && (
        <p style={{ marginTop: 20, color: "crimson" }}>
          Error: {error}
        </p>
      )}

      {result && (
        <section style={{ marginTop: 30 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>
            Generated Thread
          </h2>

          {result.units?.map((unit) => (
            <div
              key={unit.index}
              style={{
                marginTop: 20,
                padding: 16,
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              <h3>
                Unit {unit.index}: {unit.title}
              </h3>

              <p style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>
                {unit.script}
              </p>

              <p style={{ marginTop: 10, fontWeight: 600 }}>
                Question: {unit.quiz.question}
              </p>

              <ol type="A">
                {unit.quiz.options.map((option, i) => (
                  <li key={i}>
                    {option}{" "}
                    {i === unit.quiz.correctIndex ? "✅" : ""}
                  </li>
                ))}
              </ol>

              <p>
                <strong>Explanation:</strong> {unit.quiz.explanation}
              </p>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
