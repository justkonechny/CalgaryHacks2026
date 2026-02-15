import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    // extracts query field from frontend
    const { query } = await req.json();

    // checks that input has search
    if (!query) {
      return new Response(JSON.stringify({ error: "Search cannot be empty" }), {
        status: 400,
      });
    }

    // model details for query
    const response = await client.responses.create({
      model: "gpt-5-nano",
      tools: [
        {
          type: "web_search",
        },
      ],
      instructions: `return ONLY valid JSON in this format: 
      
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
    
        keep the fact concise and educational and factual.`,
      input: [
        {
          role: "user",
          content: `Provide educational information about ${query}`,
        },
      ],
    });

    // returns result: message
    return new Response(JSON.stringify({ result: response.output_text }), {
      status: 200,
    });
  } catch (error) {
    if (error.status == 429) {
      return new Response(
        JSON.stringify({
          error: "Rate limit reached, please wait a moment...",
        }),
        { status: 429 },
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || "Something went wrong" }),
      {
        status: 500,
      },
    );
  }
}

// test with /api/search to url to see if api is connected
// export async function GET() {
//   return new Response(JSON.stringify({ ok: true }), { status: 200 });
// }
