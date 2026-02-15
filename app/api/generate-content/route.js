import { uploadAudioToAzure } from "@/lib/azureUpload";

export async function POST(req) {
  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Query cannot be empty" }), {
        status: 400,
      });
    }

    // 1. Get content from Groq
    const groqResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/search`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      },
    );

    if (!groqResponse.ok) {
      throw new Error("Failed to generate content");
    }

    const contentData = await groqResponse.json();

    // 2. Generate TTS for the fact
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
          text: contentData.fact,
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

    // 3. Upload to Azure
    const timestamp = Date.now();
    const blobName = `fact-${timestamp}.mp3`;
    const { signedUrl } = await uploadAudioToAzure({
      buffer: audioBuffer,
      blobName: blobName,
    });

    console.log("Content generated with audio:", signedUrl);

    // 4. TODO: Save to database
    await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/save-content`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fact: contentData.fact,
          question: contentData.question,
          answers: contentData.answers,
          audioUrl: signedUrl,
          query: query,
        }),
      },
    );

    // 5. Return everything
    return new Response(
      JSON.stringify({
        fact: contentData.fact,
        question: contentData.question,
        answers: contentData.answers,
        audioUrl: signedUrl,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Generate content error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Something went wrong" }),
      { status: 500 },
    );
  }
}
