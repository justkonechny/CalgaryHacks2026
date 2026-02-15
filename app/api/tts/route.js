import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { text } = await request.json();

    // testing
    console.log("API Key exists: ", !!process.env.ELEVENLABS_API_KEY);
    console.log(
      "API Key starts with: ",
      process.env.ELEVENLABS_API_KEY?.slice(0, 5),
    );

    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM",
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`TTS API request failed with status ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("TTS Error:", error);
    return NextResponse.json(
      { error: "Failed to generate TTS" },
      { status: 500 },
    );
  }
}
