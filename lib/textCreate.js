// text generation and tts
const handleGenerateText = async () => {
  try {
    const response = await fetch("/api/generate-content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: topicPrompt,
        difficulty,
        sources,
      }),
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("Generation result:", data);

    // save to database?
    //TODO

    // Play the audio immediately to test
    if (data.audioUrl) {
      const audio = new Audio(data.audioUrl);
      audio.play().catch((err) => console.error("Audio play error:", err));
      console.log("Playing audio from:", data.audioUrl);
    }
  } catch (error) {
    console.error("Generation error:", error);
    throw new Error("Failed to generate content. Please try again.");
  }
};
