import { ClientSecretCredential } from "@azure/identity";
import fetch from "node-fetch";
import type { EvalRow } from "./types.ts";

const ENDPOINT_URL = process.env.CHATBOT_URL;
if (!ENDPOINT_URL) throw new Error("CHATBOT_URL is not set");

const endpointUrl: string = ENDPOINT_URL;

const INPUT_FIELD = process.env.CHATBOT_FIELD || "message";
const ANSWER_FIELD = process.env.CHATBOT_ANSWER_FIELD || "answer";
const THREAD_ID_FIELD = process.env.CHATBOT_THREAD_ID_FIELD || "threadId";

/** Entra ID: required. Endpoints can stay protected; eval sends Bearer token. */
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const AZURE_SCOPE = process.env.AZURE_SCOPE || "https://graph.microsoft.com/.default";

if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    throw new Error(
        "Entra ID is required. Set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET in .env"
    );
}

const credential = new ClientSecretCredential(
    AZURE_TENANT_ID,
    AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET
);

async function getAccessToken(): Promise<string> {
    const token = await credential.getToken(AZURE_SCOPE);
    return token.token;
}

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

    const token = await getAccessToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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

/** Extract extra row columns (e.g. audience) to send with every request. */
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

/**
 * Send the initial message. Returns answer and optional threadId for follow-ups.
 */
export async function callEndpoint(row: EvalRow): Promise<ChatResponse> {
    const body = {
        [INPUT_FIELD]: row.input,
        ...getExtras(row),
    };

    return post(body);
}

/**
 * Send a follow-up message in the same conversation (if backend supports threadId).
 */
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
