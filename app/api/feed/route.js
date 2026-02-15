export const runtime = "nodejs";

import { getPool } from "@/lib/db";
import { makeBlobReadSasUrl } from "@/lib/azureUpload";

const PLACEHOLDER_QUESTION = {
  text: "Placeholder question?",
  options: ["A", "B", "C", "D"],
  correctIndex: 0,
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const threadIdParam = searchParams.get("threadId");
  const threadId = threadIdParam ? Number(threadIdParam) : NaN;

  if (!Number.isInteger(threadId) || threadId < 1) {
    return Response.json({ error: "Missing or invalid threadId" }, { status: 400 });
  }

  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT v.id, v.taskId, v.blobName, v.blobUrl, v.scriptText, v.duration
     FROM Video v
     WHERE v.threadId = ?
       AND v.blobUrl IS NOT NULL
       AND v.blobName IS NOT NULL
     ORDER BY v.\`index\``,
    [threadId]
  );

  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "videos";
  const videoIds = rows.map((r) => r.id);

  let assetByVideoId = new Map();
  if (videoIds.length > 0) {
    const [assetRows] = await pool.query(
      `SELECT videoId, audioBlobName, audioBlobUrl, audioDurationMs
       FROM VideoScriptAsset WHERE videoId IN (?)`,
      [videoIds]
    );
    assetByVideoId = new Map(assetRows.map((a) => [a.videoId, a]));
  }

  const videos = rows.map((r) => {
    const sasUrl = makeBlobReadSasUrl({
      blobUrl: r.blobUrl,
      blobName: r.blobName,
      containerName,
      expiresInMinutes: 60 * 24,
    });
    const asset = assetByVideoId.get(r.id);
    const audioSrc =
      asset?.audioBlobUrl && asset?.audioBlobName
        ? makeBlobReadSasUrl({
            blobUrl: asset.audioBlobUrl,
            blobName: asset.audioBlobName,
            containerName,
            expiresInMinutes: 60 * 24,
          })
        : null;
    return {
      id: r.id,
      taskId: r.taskId,
      src: sasUrl,
      scriptText: r.scriptText,
      duration: r.duration,
      ...(audioSrc && { audioSrc }),
      ...(asset?.audioDurationMs != null && {
        audioDurationMs: asset.audioDurationMs,
      }),
    };
  });

  let questions = [];

  if (videoIds.length > 0) {
    const [quizRows] = await pool.query(
      `SELECT q.id, q.videoId, q.questionText, q.correctIndex
       FROM Quiz q
       WHERE q.videoId IN (?)`,
      [videoIds]
    );
    const quizByVideoId = new Map(quizRows.map((q) => [q.videoId, q]));

    const quizIds = quizRows.map((q) => q.id).filter(Boolean);
    let optionRows = [];
    if (quizIds.length > 0) {
      const [optRows] = await pool.query(
        `SELECT quizId, optionIndex, optionText FROM QuizOption WHERE quizId IN (?) ORDER BY quizId, optionIndex`,
        [quizIds]
      );
      optionRows = optRows;
    }

    const optionsByQuizId = new Map();
    for (const o of optionRows) {
      if (!optionsByQuizId.has(o.quizId))
        optionsByQuizId.set(o.quizId, new Array(4));
      optionsByQuizId.get(o.quizId)[o.optionIndex] = o.optionText;
    }

    questions = videoIds.map((vid) => {
      const quiz = quizByVideoId.get(vid);
      if (!quiz) return { ...PLACEHOLDER_QUESTION };
      const raw = optionsByQuizId.get(quiz.id) || [];
      const options = Array.from(
        { length: 4 },
        (_, i) => (raw[i] != null && raw[i] !== "" ? raw[i] : PLACEHOLDER_QUESTION.options[i] ?? "")
      );
      return {
        text: quiz.questionText || PLACEHOLDER_QUESTION.text,
        options,
        correctIndex:
          typeof quiz.correctIndex === "number" && quiz.correctIndex >= 0 && quiz.correctIndex <= 3
            ? quiz.correctIndex
            : PLACEHOLDER_QUESTION.correctIndex,
      };
    });
  }

  return Response.json({ videos, questions });
}
