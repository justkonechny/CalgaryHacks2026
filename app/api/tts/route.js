import { NextResponse } from "next/server";
import { uploadAudioToAzure } from "@/lib/azureUpload";

// export async function POST(request) {
//   try {
//     const { text } = await request.json();

//     // testing
//     console.log("API Key exists: ", !!process.env.ELEVENLABS_API_KEY);
//     console.log(
//       "API Key starts with: ",
//       process.env.ELEVENLABS_API_KEY?.slice(0, 5),
//     );

//     const response = await fetch(
//       "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
//       {
//         method: "POST",
//         headers: {
//           Accept: "audio/mpeg",
//           "Content-Type": "application/json",
//           "xi-api-key": process.env.ELEVENLABS_API_KEY,
//         },
//         body: JSON.stringify({
//           text,
//           model_id: "eleven_turbo_v2_5",
//           voice_settings: {
//             stability: 0.5,
//             similarity_boost: 0.5,
//           },
//         }),
//       },
//     );

//     if (!response.ok) {
//       throw new Error(`TTS API request failed with status ${response.status}`);
//     }

//     const audioBuffer = await response.arrayBuffer();

//     return new NextResponse(audioBuffer, {
//       headers: {
//         "Content-Type": "audio/mpeg",
//       },
//     });
//   } catch (error) {
//     console.error("TTS Error:", error);
//     return NextResponse.json(
//       { error: "Failed to generate TTS" },
//       { status: 500 },
//     );
//   }
// }

export async function POST(req) {
  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Search cannot be empty" }), {
        status: 400,
      });
    }

    // 1. Get educational content from Groq
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content: `Return ONLY valid JSON in this format:

                {
                "fact": "2-3 short sentences maximum",
                "question": "A multiple choice question about the fact",
                "answers": [
                    { "text": "Option A", "correct": false },
                    { "text": "Option B", "correct": true },
                    { "text": "Option C", "correct": false },
                    { "text": "Option D", "correct": false }
                ]
                }

                Keep the fact concise, educational, and factual.`,
            },
            {
              role: "user",
              content: `Provide educational content about ${query}`,
            },
          ],
          temperature: 0.7,
        }),
      },
    );

    const groqData = await groqResponse.json();
    const content = groqData.choices?.[0]?.message?.content;
    const parsedContent = JSON.parse(content);

    console.log("Parsed content:", parsedContent);

    // 2. Generate TTS audio for the fact
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
          text: parsedContent.fact,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      },
    );

    if (!ttsResponse.ok) {
      throw new Error("TTS generation failed");
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    // 3. Upload audio to Azure Blob Storage
    const timestamp = Date.now();
    const blobName = `fact-${timestamp}.mp3`;
    const { signedUrl } = await uploadAudioToAzure({
      buffer: audioBuffer,
      blobName: blobName,
    });

    console.log("Audio uploaded to:", signedUrl);

    // 4. TODO: Save to your database here
    // await saveToDatabase({
    //   fact: parsedContent.fact,
    //   question: parsedContent.question,
    //   answers: parsedContent.answers,
    //   audioUrl: signedUrl,
    //   query: query,
    //   createdAt: new Date()
    // });

    // 5. Return everything to the frontend
    return new Response(
      JSON.stringify({
        fact: parsedContent.fact,
        question: parsedContent.question,
        answers: parsedContent.answers,
        audioUrl: signedUrl,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("API Error:", error);

    if (error.status === 429) {
      return new Response(
        JSON.stringify({
          error: "Rate limit reached, please wait a moment...",
        }),
        { status: 429 },
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || "Something went wrong" }),
      { status: 500 },
    );
  }
}
