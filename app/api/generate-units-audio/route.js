import { uploadAudioToAzure } from "@/lib/azureUpload";
import { getPool } from "@/lib/db";

export async function POST(req) {
  try {
    const { units, threadId } = await req.json();

    if (!units || !Array.isArray(units) || units.length === 0) {
      return Response.json(
        { error: "Missing or invalid units array" },
        { status: 400 },
      );
    }

    if (!threadId) {
      return Response.json({ error: "Missing threadId" }, { status: 400 });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return Response.json(
        { error: "Missing ELEVENLABS_API_KEY in environment" },
        { status: 500 },
      );
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify thread exists
      const [threadRows] = await connection.query(
        "SELECT id FROM Thread WHERE id = ?",
        [threadId],
      );

      if (!threadRows || threadRows.length === 0) {
        throw new Error(`Thread not found (id=${threadId})`);
      }

      const results = [];

      // Process each unit
      for (let i = 0; i < units.length; i++) {
        const unit = units[i];
        const unitIndex = unit.index || i + 1;

        console.log(`Processing unit ${unitIndex}: ${unit.title}`);

        // 1) Generate TTS audio for this unit's script
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
              text: unit.script,
              model_id: "eleven_turbo_v2_5",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5,
              },
            }),
          },
        );

        if (!ttsResponse.ok) {
          throw new Error(
            `TTS generation failed for unit ${unitIndex}: ${ttsResponse.status}`,
          );
        }

        const audioBuffer = await ttsResponse.arrayBuffer();

        // 2) Upload audio to Azure Blob Storage
        const timestamp = Date.now();
        const blobName = `thread-${threadId}-unit-${unitIndex}-${timestamp}.mp3`;
        const { signedUrl } = await uploadAudioToAzure({
          buffer: audioBuffer,
          blobName: blobName,
        });

        console.log(`Audio uploaded for unit ${unitIndex}:`, signedUrl);

        // 3) Extract blobUrl (without SAS token)
        const blobUrl =
          "https://calgaryhacks.blob.core.windows.net/" + blobName;

        // 4) Insert Video record
        const [videoResult] = await connection.query(
          `INSERT INTO Video (threadId, \`index\`, scriptText, taskId, blobName, blobUrl, videoUrl, duration, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 60, NOW())`,
          [
            threadId,
            unitIndex,
            unit.script,
            `task_${threadId}_${unitIndex}`, // placeholder task ID
            blobName,
            blobUrl,
            signedUrl, // Use signedUrl as videoUrl for now
          ],
        );

        const videoId = videoResult.insertId;

        console.log(`Video record created with ID: ${videoId}`);

        // 5) Insert Quiz record
        const quiz = unit.quiz;
        const [quizResult] = await connection.query(
          `INSERT INTO Quiz (videoId, questionText, correctIndex, explanation)
           VALUES (?, ?, ?, ?)`,
          [videoId, quiz.question, quiz.correctIndex, quiz.explanation || ""],
        );

        const quizId = quizResult.insertId;

        console.log(`Quiz created with ID: ${quizId}`);

        // 6) Insert QuizOptions
        for (let j = 0; j < quiz.options.length; j++) {
          await connection.query(
            `INSERT INTO QuizOption (quizId, optionIndex, optionText)
             VALUES (?, ?, ?)`,
            [quizId, j, quiz.options[j]],
          );
        }

        console.log(`Quiz options inserted for quiz ${quizId}`);

        results.push({
          unitIndex,
          title: unit.title,
          videoId,
          quizId,
          audioUrl: signedUrl,
        });
      }

      // Update thread status to ready
      await connection.query(
        `UPDATE Thread SET status = 'ready' WHERE id = ?`,
        [threadId],
      );

      await connection.commit();

      return Response.json({
        success: true,
        threadId,
        units: results,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Generate units audio error:", error);
    return Response.json(
      { error: error.message || "Something went wrong" },
      { status: 500 },
    );
  }
}
