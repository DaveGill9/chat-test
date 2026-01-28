import fetch from "node-fetch";

const ENDPOINT_URL = process.env.CHATBOT_URL;
if (!ENDPOINT_URL) throw new Error("CHATBOT_URL is not set");

const endpointUrl: string = ENDPOINT_URL;

const INPUT_FIELD = process.env.CHATBOT_FIELD || "message";
const ANSWER_FIELD = process.env.CHATBOT_ANSWER_FIELD || "answer";

export async function callEndpoint(input: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const res = await fetch(endpointUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [INPUT_FIELD]: input }),
            signal: controller.signal
        });

        const text = await res.text();

        try {
            const json = JSON.parse(text);
            const value =
                json?.[ANSWER_FIELD] ??
                json?.answer ??
                json?.output ??
                json?.message;

            return typeof value === "string" ? value : JSON.stringify(json);
        } catch {
            return text;
        }
    } finally {
        clearTimeout(timeout);
    }
}
