import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid text" },
        { status: 400 },
      );
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "TTS not configured" },
        { status: 503 },
      );
    }

    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/with-timestamps",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
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
      const errBody = await response.json().catch(() => ({}));
      const message = errBody.detail ?? "TTS service error";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const data = await response.json();

    if (typeof data?.audio_base64 !== "string") {
      return NextResponse.json(
        { error: "Invalid TTS response" },
        { status: 502 },
      );
    }
    const { audio_base64, alignment, normalized_alignment } = data;

    return NextResponse.json({
      audio_base64,
      alignment,
      normalized_alignment,
    });
  } catch (error) {
    console.error("TTS Error:", error);
    return NextResponse.json(
      { error: "Failed to generate TTS" },
      { status: 500 },
    );
  }
}
