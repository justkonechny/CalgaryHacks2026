import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: "Search cannot be empty" }), {
        status: 400,
      });
    }

    const response = await client.responses.create({
      model: "gpt-5-nano",
      tools: [
        {
          type: "web_search",
        },
      ],
      input: `Provide educational information about ${query}`,
    });

    return new Response(JSON.stringify({ result: response.output_text }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
    });
  }
}
