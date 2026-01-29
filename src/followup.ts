import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("Missing OPENAI_API_KEY env var");

const client = new OpenAI({ apiKey });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export type FollowupDecision = {
    needsFollowup: boolean;
    followupMessage: string | null;
    reason: string;
};

export async function decideFollowup(opts: {
    input: string;
    expected: string;
    latestReply: string;
}): Promise<FollowupDecision> {
    const { input, expected, latestReply } = opts;

    const prompt = `
You are controlling a test of a chatbot.

We have:
- User input: ${input}
- Expected outcome (what the user ultimately wants): ${expected}
- Chatbot reply: ${latestReply}

Your job:
1. Decide if the chatbot reply CLEARLY indicates it needs more information from the user
   (e.g. it asks specific follow-up questions, says it cannot proceed without X, asks for clarification).
2. If YES, propose a single, concise user reply that provides the missing info,
   using the "expected" description to infer good values. Keep it short (one sentence or phrase).
3. If NO, set needsFollowup to false and followupMessage to null.

Return JSON ONLY:
{
  "needsFollowup": boolean,
  "followupMessage": string | null,
  "reason": string
}
`;

    const resp = await client.chat.completions.create({
        model: MODEL,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
    });

    const content = resp.choices[0].message.content;
    if (!content) throw new Error("Followup decision returned empty response");

    let parsed: any;
    try {
        parsed = JSON.parse(content);
    } catch {
        throw new Error(`Followup did not return valid JSON:\n${content}`);
    }

    return {
        needsFollowup: !!parsed.needsFollowup,
        followupMessage:
            typeof parsed.followupMessage === "string"
                ? parsed.followupMessage.trim() || null
                : null,
        reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
}
