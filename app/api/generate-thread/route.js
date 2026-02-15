export const runtime = "nodejs";

import { getPool } from "@/lib/db";
import { uploadAudioToAzure } from "@/lib/azureUpload";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const threadId =
      body?.threadId != null && body.threadId !== ""
        ? Number(body.threadId)
        : null;
    const units = Array.isArray(body?.units) ? body.units : null;
    const topic = typeof body?.topic === "string" ? body.topic.trim() : "";

    if (!Number.isInteger(threadId) || threadId < 1) {
      return Response.json(
        { error: "Missing or invalid threadId" },
        { status: 400 }
      );
    }
    if (!units || units.length !== 5) {
      return Response.json(
        { error: "units must be an array of exactly 5 items" },
        { status: 400 }
      );
    }
    if (!topic) {
      return Response.json({ error: "Missing topic" }, { status: 400 });
    }

    const pool = getPool();

    const [threadRows] = await pool.query(
      "SELECT id FROM Thread WHERE id = ?",
      [threadId]
    );
    if (!threadRows || threadRows.length === 0) {
      return Response.json({ error: "Thread not found" }, { status: 404 });
    }

    const [countRows] = await pool.query(
      "SELECT COUNT(*) AS cnt FROM Video WHERE threadId = ?",
      [threadId]
    );
    if (countRows[0]?.cnt > 0) {
      return Response.json(
        {
          error:
            "Thread already has content; create a new feed to generate again.",
        },
        { status: 409 }
      );
    }

    const connection = await pool.getConnection();
    let videoIds = [];

    try {
      await connection.beginTransaction();

      for (let i = 0; i < 5; i++) {
        const unit = units[i];
        const idx = i + 1;
        const scriptText =
          typeof unit?.script === "string" ? unit.script : "";
        const [videoResult] = await connection.query(
          `INSERT INTO Video (threadId, \`index\`, scriptText, taskId, blobName, blobUrl, videoUrl, duration, createdAt)
           VALUES (?, ?, ?, NULL, NULL, NULL, NULL, 10, NOW())`,
          [threadId, idx, scriptText]
        );
        videoIds.push(videoResult.insertId);
      }

      for (let i = 0; i < 5; i++) {
        const unit = units[i];
        const quiz = unit?.quiz;
        if (!quiz || typeof quiz?.question !== "string") continue;
        const correctIndex =
          typeof quiz.correctIndex === "number" &&
          quiz.correctIndex >= 0 &&
          quiz.correctIndex <= 3
            ? quiz.correctIndex
            : 0;
        const explanation =
          typeof quiz.explanation === "string" ? quiz.explanation : "";
        const [quizResult] = await connection.query(
          `INSERT INTO Quiz (videoId, questionText, correctIndex, explanation)
           VALUES (?, ?, ?, ?)`,
          [videoIds[i], quiz.question, correctIndex, explanation]
        );
        const quizId = quizResult.insertId;
        const options = Array.isArray(quiz.options) ? quiz.options : [];
        for (let j = 0; j < 4; j++) {
          await connection.query(
            `INSERT INTO QuizOption (quizId, optionIndex, optionText)
             VALUES (?, ?, ?)`,
            [quizId, j, typeof options[j] === "string" ? options[j] : ""]
          );
        }
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Missing KIE_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const payload = {
      model: "sora-2-text-to-video",
      input: {
        prompt: topic,
        aspect_ratio: "portrait",
        n_frames: "10",
        size: "high",
        remove_watermark: false,
        upload_method: "s3",
      },
    };

    const resp = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => null);

    if (!resp.ok || !data || data?.code !== 200) {
      return Response.json(
        {
          error: data?.msg || data?.message || "Kie createTask failed",
          status: resp.status,
          raw: data,
        },
        { status: 500 }
      );
    }

    const taskId = data?.data?.taskId;
    if (!taskId) {
      return Response.json(
        { error: "No taskId returned", raw: data },
        { status: 500 }
      );
    }

    await pool.query(
      `UPDATE Video SET taskId = ? WHERE threadId = ? AND \`index\` = 1`,
      [taskId, threadId]
    );

    if (!process.env.ELEVENLABS_API_KEY) {
      return Response.json(
        { error: "Missing ELEVENLABS_API_KEY in environment" },
        { status: 503 }
      );
    }

    let videoScriptAssetFailures = 0;
    const requestId = Date.now();

    for (let i = 0; i < 5; i++) {
      const unit = units[i];
      const scriptText =
        typeof unit?.script === "string" ? unit.script : "";
      if (!scriptText) {
        videoScriptAssetFailures++;
        continue;
      }

      try {
        const ttsResponse = await fetch(
          "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
          {
            method: "POST",
            headers: {
              Accept: "audio/mpeg",
              "Content-Type": "application/json",
              "xi-api-key": process.env.ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
              text: scriptText,
              model_id: "eleven_turbo_v2_5",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5,
              },
            }),
          }
        );

        if (!ttsResponse.ok) {
          console.error(
            `TTS failed for unit ${i + 1}:`,
            ttsResponse.status
          );
          videoScriptAssetFailures++;
          continue;
        }

        const audioBuffer = await ttsResponse.arrayBuffer();
        const blobName = `thread-${threadId}-unit-${i + 1}-${requestId}.mp3`;
        const { plainUrl, blobName: uploadedBlobName } = await uploadAudioToAzure({
          buffer: Buffer.from(audioBuffer),
          blobName,
        });

        await pool.query(
          `INSERT INTO VideoScriptAsset (videoId, scriptText, audioBlobName, audioBlobUrl, audioDurationMs, provider, languageCode, createdAt)
           VALUES (?, ?, ?, ?, 60000, 'elevenlabs', 'en', NOW())`,
          [videoIds[i], scriptText, uploadedBlobName, plainUrl]
        );
      } catch (err) {
        console.error(`VideoScriptAsset failed for unit ${i + 1}:`, err);
        videoScriptAssetFailures++;
      }
    }

    return Response.json({
      taskId,
      ...(videoScriptAssetFailures > 0 && {
        videoScriptAssetFailures,
      }),
    });
  } catch (err) {
    console.error("[generate-thread] error:", err);
    return Response.json(
      { error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
