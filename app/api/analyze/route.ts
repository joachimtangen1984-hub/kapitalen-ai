import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return new Response("Missing message", { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Du er en finansanalytiker som gir korte, klare analyser av aksjer og krypto.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const text = response.choices[0].message.content;

    return Response.json({ result: text });

  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
}
