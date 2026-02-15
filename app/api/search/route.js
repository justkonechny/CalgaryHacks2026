export async function POST(req) {
  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Search cannot be empty" }), {
        status: 400,
      });
    }

    const response = await fetch(
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

    const data = await response.json();

    // gets the content from the LLM response, which should be a JSON string, and parses it into an object
    const content = data.choices?.[0]?.message?.content;

    console.log(content);

    return new Response(JSON.stringify({ result: content }), { status: 200 });
  } catch (error) {
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

// test to see if API route is working
// export async function GET() {
//   return new Response(
//     JSON.stringify({ message: "Hello from the search API!" }),
//     {
//       status: 200,
//     },
//   );
// }
