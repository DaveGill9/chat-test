import fetch from "node-fetch";
import type { EvalRow } from "./types.ts";

const ENDPOINT_URL = process.env.CHATBOT_URL;
if (!ENDPOINT_URL) throw new Error("CHATBOT_URL is not set");

const endpointUrl: string = ENDPOINT_URL;

const INPUT_FIELD = process.env.CHATBOT_FIELD || "message";
const ANSWER_FIELD = process.env.CHATBOT_ANSWER_FIELD || "answer";
const THREAD_ID_FIELD = process.env.CHATBOT_THREAD_ID_FIELD || "threadId";

// API Key authentication
const apiKeyRaw = process.env.EVAL_API_KEY;
if (!apiKeyRaw) {
    throw new Error("EVAL_API_KEY is required. Set it in your .env file.");
}
const API_KEY: string = apiKeyRaw;

export type ChatResponse = {
    answer: string;
    threadId?: string;
};

function parseResponse(text: string): ChatResponse {
    try {
        const json = JSON.parse(text);
        const answer =
            json?.[ANSWER_FIELD] ??
            json?.answer ??
            json?.output ??
            json?.message;
        const threadId =
            json?.[THREAD_ID_FIELD] ?? json?.threadId;

        return {
            answer: typeof answer === "string" ? answer : JSON.stringify(json),
            threadId: typeof threadId === "string" ? threadId : undefined,
        };
    } catch {
        return { answer: text };
    }
}

async function post(
    body: Record<string, unknown>
): Promise<ChatResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
    };

    try {
        const res = await fetch(endpointUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        const text = await res.text();
        return parseResponse(text);
    } finally {
        clearTimeout(timeout);
    }
}

// Extract extra row columns
export function getExtras(row: EvalRow): Record<string, unknown> {
    const {
        id,
        input,
        expected,
        actual,
        score,
        reasoning,
        ...extras
    } = row;
    return extras;
}

// Send the initial message
export async function callEndpoint(row: EvalRow): Promise<ChatResponse> {
    const body = {
        [INPUT_FIELD]: row.input,
        ...getExtras(row),
    };

    return post(body);
}

// Send a follow-up message in the same convo
export async function sendFollowup(
    message: string,
    threadId: string | undefined,
    extras: Record<string, unknown>
): Promise<ChatResponse> {
    const body: Record<string, unknown> = {
        [INPUT_FIELD]: message,
        ...extras,
    };

    if (threadId) {
        body[THREAD_ID_FIELD] = threadId;
    }

    return post(body);
}
