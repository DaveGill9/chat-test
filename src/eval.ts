import OpenAI from "openai";
import { EvalResult } from "./types.js";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("Missing OPENAI_API_KEY env var");

const client = new OpenAI({ apiKey });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function evaluate(
    input: string,
    expected: string,
    actual: string
): Promise<EvalResult> {
    const prompt = `
You are grading a chatbot response.

Input:
${input}

Expected:
${expected}

Actual:
${actual}

Return JSON ONLY:
{
  "score": number,     // 0 to 1
  "rationale": string // max 2 sentences
}

Scoring guide:
- 1.0 = fully correct
- 0.7 = mostly correct
- 0.4 = partially correct
- 0.0 = incorrect
`;

    const resp = await client.chat.completions.create({
        model: MODEL,
        temperature: 0,
        messages: [{ role: "user", content: prompt }]
    });

    const content = resp.choices[0].message.content;
    if (!content) throw new Error("Eval returned empty response");

    let parsed: any;
    try {
        parsed = JSON.parse(content);
    } catch {
        throw new Error(`Eval did not return valid JSON:\n${content}`);
    }

    return {
        score: Math.max(0, Math.min(1, parsed.score)),
        rationale: parsed.rationale
    };
}
