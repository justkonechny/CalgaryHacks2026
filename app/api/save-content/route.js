import { getPool } from "@/lib/db";

export async function POST(req) {
  try {
    const { fact, audioUrl, question, answers } = await req.json();

    if (!fact || !question || !answers) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // get threadId
      const [threadResult] = await connection.query(
        "INSERT INTO Thread (prompt, status, createdAt) VALUES (?, 'generating', NOW())",
        [fact],
      );

      const threadId = threadResult.insertId;

      console.log("Inserting fact");
      // insert fact
      const [factResult] = await connection.query(
        `INSERT INTO Fact (threadId, factText, createdAt) VALUES (?, ?, NOW())`,
        [threadId, fact],
      );

      const factId = factResult.insertId;

      console.log("Fact inserted");
      console.log("Inserting audio file");

      // insert audio file
      const blobName = audioUrl.split("/").pop().split("?")[0]; // Extract filename from URL
      await connection.query(
        `INSERT INTO AudioFile (factId, audioUrl, blobName, createdAt) VALUES (?, ?, ?, NOW())`,
        [factId, audioUrl, blobName],
      );

      console.log("Audio file inserted");
      console.log("getting next index for thread");

      // get next index for thread
      const [existingVideos] = await connection.query(
        `SELECT MAX(\`index\`) as maxIndex FROM Video WHERE threadId = ?`,
        [threadId],
      );

      const nextIndex = (existingVideos[0]?.maxIndex || 0) + 1;

      console.log("Next index for thread:", nextIndex);
      console.log("creating video");

      // create video
      const [videoResult] = await connection.query(
        `INSERT INTO Video (threadId, factId, \`index\`, scriptText, duration, createdAt) 
         VALUES (?, ?, ?, ?, 60, NOW())`,
        [threadId, factId, nextIndex, fact],
      );

      const videoId = videoResult.insertId;

      console.log("Video created with ID:", videoId);
      console.log("Inserting the quiz");

      // insert the quiz
      const correctIndex = answers.findIndex((a) => a.correct);
      const [quizResult] = await connection.query(
        `INSERT INTO Quiz (videoId, questionText, correctIndex) VALUES (?, ?, ?)`,
        [videoId, question, correctIndex],
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
