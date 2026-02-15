import { getPool } from "@/lib/db";

export async function POST(req) {
  try {
    const { fact, audioUrl, question, answers, prompt } = await req.json();

    if (!fact || !question || !answers || !prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      console.log("Creating thread");

      // get threadId
      const [threadResult] = await connection.query(
        "INSERT INTO Thread (prompt, status, createdAt) VALUES (?, 'ready', NOW())",
        [prompt],
      );

      const threadId = threadResult.insertId;

      console.log("Thread created with ID:", threadId);
      console.log("Inserting fact");

      // insert fact and video
      var blobName = audioUrl.split("/").pop().split("?")[0]; // Extract
      let blobUrl = "https://calgaryhacks.blob.core.windows.net/" + blobName;
      const [videoResult] = await connection.query(
        `INSERT INTO Video (threadId, \`index\`, scriptText, taskId, blobName, blobUrl, videoUrl, duration, createdAt)
        VALUES (?, 1, ?, ?, ?, ?, 60, NOW())`,
        [
          threadId,
          fact,
          "task_id_placeholder",
          blobName,
          blobUrl,
          "placeholder_videoUrl",
        ],
      );

      const videoId = videoResult.insertId;

      console.log("Fact and Video inserted");
      //   console.log("Inserting audio file");

      //   // insert audio file
      //   const blobName = audioUrl.split("/").pop().split("?")[0]; // Extract filename from URL
      //   await connection.query(
      //     `INSERT INTO AudioFile (factId, audioUrl, blobName, createdAt) VALUES (?, ?, ?, NOW())`,
      //     [factId, audioUrl, blobName],
      //   );

      //   console.log("Audio file inserted");
      console.log("Inserting the quiz");

      // insert the quiz
      const correctIndex = answers.findIndex((a) => a.correct);
      const [quizResult] = await connection.query(
        `INSERT INTO Quiz (videoId, questionText, correctIndex, explaination) VALUES (?, ?, ?, ?)`,
        [videoId, question, correctIndex, ""],
      );

      const quizId = quizResult.insertId;

      console.log("Quiz created with ID:", quizId);
      console.log("Inserting quiz options");

      // insert quiz options
      for (let i = 0; i < answers.length; i++) {
        await connection.query(
          `INSERT INTO QuizOption (quizId, optionIndex, optionText) VALUES (?, ?, ?)`,
          [quizId, i, answers[i].text],
        );
      }

      console.log("Quiz options inserted");

      await connection.commit();

      return Response.json({
        success: true,
        factId,
        videoId,
        quizId,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Save content error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
