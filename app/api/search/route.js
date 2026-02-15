// app/api/search/route.js
import Groq from "groq-sdk";

export async function POST(req) {
  try {
    const body = await req.json();

    const topic = String(body?.topic ?? "").trim();
    const difficultyRaw = String(body?.difficulty ?? "medium").trim().toLowerCase();
    const sourcesIn = body?.sources ?? null;

    if (!topic) {
      return Response.json({ error: "Missing required field: topic" }, { status: 400 });
    }

    const difficulty = ["easy", "medium", "hard"].includes(difficultyRaw) ? difficultyRaw : "medium";
    const sources = normalizeSources(sourcesIn);

    if (!process.env.GROQ_API_KEY) {
      return Response.json({ error: "Missing GROQ_API_KEY in environment" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt({ topic, difficulty, sources }) },
      ],
      temperature: 0.3,
    });

    const content = completion?.choices?.[0]?.message?.content ?? "";

    // Guarantee the API returns JSON (prevents: Unexpected token '*' / markdown parsing errors)
    const parsed = safeParseJson(content);

    if (!parsed) {
      return Response.json(
        {
          error: "Model did not return valid JSON. See raw output.",
          raw: content,
        },
        { status: 502 }
      );
    }

    const validated = validateShape(parsed, { topic, difficulty, sources });
    if (!validated.ok) {
      return Response.json(
        {
          error: "Model returned JSON, but it did not match the expected schema.",
          issues: validated.issues,
          raw: parsed,
        },
        { status: 502 }
      );
    }

    return Response.json(validated.value);
  } catch (err) {
    console.error("Groq route error:", err);
    return Response.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

function buildSystemPrompt() {
  return `You are an academic instructional designer generating a structured micro-learning thread.

CRITICAL OUTPUT RULES:
- Return ONLY valid JSON.
- No markdown, no headings, no bullet lists, no code fences, no extra commentary, no asterisks.
- Do not wrap JSON in backticks.
- Output must be a single JSON object matching the schema exactly.

SCHEMA (must match exactly):
{
  "topic": string,
  "difficulty": "easy"|"medium"|"hard",
  "sources": string[],
  "units": [
    {
      "index": 1..5,
      "title": string,
      "script": string,
      "quiz": {
        "question": string,
        "options": [string, string, string, string],
        "correctIndex": 0..3,
        "explanation": string
      }
    }
  ]
}

GLOBAL REQUIREMENTS:
- Generate exactly 5 units.
- Each unit must represent ONE distinct conceptual idea.
- Follow this progression strictly:
  1) Context / Background
  2) Core Mechanisms or Causes
  3) Major Impacts or Developments
  4) Concrete Example or Case Study
  5) Synthesis / Concept Reinforcement
- Do NOT repeat the same facts across units. Each unit must add new information.
- Unit 1 may define transmission/definitions. Units 2–5 must not restate Unit 1's transmission explanation except as a single short bridging sentence if absolutely necessary.

SCRIPT REQUIREMENTS:
- Written for spoken narration.
- Clear, structured, focused on one central concept.
- No rhetorical questions, filler, repetition, or tangents.
- Approximately 60 seconds when spoken.
- Target 130–170 words (minimum 120, maximum 180).
- Sentences paced for natural narration; avoid overly long or fragmented sentences.
- Content must feel complete without rushing or padding.
- After drafting each script, revise it to meet the word-range WITHOUT adding filler.

QUIZ REQUIREMENTS (per unit):
- Exactly 1 question per script.
- Must be answerable directly from the script.
- 4 options only; return as an array of 4 strings.
- Exactly one correct answer (correctIndex 0..3).
- Include a concise explanation that directly clarifies the correct concept.
- Do not reference the script, lesson, or formatting in the explanation.
- The explanation must read as standalone academic clarification.

SOURCE ENFORCEMENT:
- If sources are provided: do NOT introduce facts that are not supported by the provided sources.
- If sources are provided and you are unsure a specific number/date is present, DO NOT invent it; use a qualitative statement instead.
- If no sources are provided: you may use general knowledge, but keep claims conservative.`;
}

function buildUserPrompt({ topic, difficulty, sources }) {
  const src = sources.length ? sources.join("\n") : "None";
  return `Generate a micro-learning thread for:

Topic: ${topic}
Difficulty: ${difficulty}
Sources:
${src}

Return JSON only, matching the schema exactly.`;
}

function normalizeSources(sourcesIn) {
  if (!sourcesIn) return [];
  if (Array.isArray(sourcesIn)) {
    return sourcesIn.map(String).map((s) => s.trim()).filter(Boolean);
  }
  // allow newline-delimited sources
  return String(sourcesIn)
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function safeParseJson(text) {
  if (!text) return null;

  // 1) Try direct parse
  try {
    return JSON.parse(text);
  } catch (_) {}

  // 2) Try extracting the biggest {...} block if the model added extra text
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const candidate = text.slice(first, last + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) {}
  }

  return null;
}

function validateShape(obj, fallback) {
  const issues = [];

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    issues.push("Top-level must be an object.");
  }

  const topic = typeof obj?.topic === "string" ? obj.topic.trim() : "";
  const difficulty =
    typeof obj?.difficulty === "string" ? obj.difficulty.trim().toLowerCase() : "";
  const sources = Array.isArray(obj?.sources)
    ? obj.sources.filter((s) => typeof s === "string").map((s) => s.trim()).filter(Boolean)
    : null;
  const units = Array.isArray(obj?.units) ? obj.units : null;

  if (!topic) issues.push("Missing/invalid: topic");
  if (!["easy", "medium", "hard"].includes(difficulty)) issues.push("Missing/invalid: difficulty");
  if (!sources) issues.push("Missing/invalid: sources (must be array of strings)");
  if (!units || units.length !== 5) issues.push("Missing/invalid: units (must be length 5)");

  if (units) {
    units.forEach((u, i) => {
      if (!u || typeof u !== "object") issues.push(`Unit ${i + 1}: must be object`);
      if (u?.index !== i + 1) issues.push(`Unit ${i + 1}: index must be ${i + 1}`);
      if (typeof u?.title !== "string" || !u.title.trim()) issues.push(`Unit ${i + 1}: missing title`);
      if (typeof u?.script !== "string" || !u.script.trim()) issues.push(`Unit ${i + 1}: missing script`);

      const q = u?.quiz;
      if (!q || typeof q !== "object") issues.push(`Unit ${i + 1}: missing quiz object`);
      if (q) {
        if (typeof q?.question !== "string" || !q.question.trim()) issues.push(`Unit ${i + 1}: missing quiz.question`);
        if (
          !Array.isArray(q?.options) ||
          q.options.length !== 4 ||
          !q.options.every((x) => typeof x === "string")
        ) {
          issues.push(`Unit ${i + 1}: quiz.options must be array of 4 strings`);
        }
        if (typeof q?.correctIndex !== "number" || q.correctIndex < 0 || q.correctIndex > 3) {
          issues.push(`Unit ${i + 1}: quiz.correctIndex must be 0..3`);
        }
        if (typeof q?.explanation !== "string" || !q.explanation.trim()) {
          issues.push(`Unit ${i + 1}: missing quiz.explanation`);
        }
      }
    });
  }

  if (issues.length) return { ok: false, issues };

  // Normalize top-level fields (avoid model echoing wrong values)
  return {
    ok: true,
    value: {
      topic: topic || fallback.topic,
      difficulty: ["easy", "medium", "hard"].includes(difficulty) ? difficulty : fallback.difficulty,
      sources: sources || fallback.sources,
      units,
    },
  };
}
