import OpenAI from "openai";

export async function POST(req: Request) {
  const { message } = await req.json();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Du er en finansanalytiker. Gi korte, konkrete analyser av aksjer og krypto.",
      },
      {
        role: "user",
        content: message,
      },
    ],
  });

  return Response.json({
    result: completion.choices[0].message.content,
  });
}
