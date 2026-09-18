import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  action: z.enum([
    "improve",
    "grammar",
    "rewrite",
    "summarize",
    "ideas",
    "continue",
    "translate",
  ]),
  text: z.string().min(1).max(20000),
  language: z.string().max(40).optional(),
});

const PROMPTS: Record<string, string> = {
  improve: "Improve the clarity, flow and impact of the text. Keep the author's voice.",
  grammar: "Fix all spelling, grammar and punctuation mistakes. Change nothing else.",
  rewrite: "Rewrite the text with fresh phrasing while preserving the meaning.",
  summarize: "Summarise the text into a short, well structured summary with key points.",
  ideas: "Generate a list of strong, specific ideas and an outline based on the text.",
  continue: "Continue writing naturally from where the text stops. Return only the continuation.",
  translate: "Translate the text.",
};

export const runAiAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured.");

    const instruction =
      data.action === "translate"
        ? `Translate the text into ${data.language || "English"}.`
        : PROMPTS[data.action]!;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "system",
            content:
              "You are Dani-Note's writing assistant. Return only the resulting text formatted as simple HTML (paragraphs, lists, headings). No commentary, no code fences.",
          },
          { role: "user", content: `${instruction}\n\nTEXT:\n${data.text}` },
        ],
      }),
    });

    if (!res.ok) {
      const message = await res.text();
      if (res.status === 429) throw new Error("Too many requests — please try again shortly.");
      if (res.status === 402)
        throw new Error("AI credits are exhausted. Add credits in Lovable to continue.");
      throw new Error(`AI request failed (${res.status}): ${message.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "";
    return { content: content.replace(/```html|```/g, "").trim() };
  });
