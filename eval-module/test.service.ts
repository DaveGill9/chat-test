import { Injectable } from "@nestjs/common";
import { nanoid } from "nanoid";
// CHANGE: Uncomment and set path to your chat service.
// import { ChatService } from "../chat/chat.service";
// CHANGE: Uncomment and set path to your message/role types (e.g. Assistant, Completed, Error).
// import { MessageRole } from "../messages/message.types";

@Injectable()
export class TestService {
    // CHANGE: Type this with your real ChatService once imported.
    constructor(private readonly chatService: any) { }

    /**
     * Generic synchronous chat endpoint for testing/evaluation.
     *
     * Expected pattern (adapt as needed):
     * - Build whatever request object your chat service expects
     * - Call your async chat entrypoint
     * - Poll history for the latest assistant message until it's "complete"
     * - Return a simple JSON payload: { answer, threadId?, messageId?, status, error? }
     */
    async handleSync(request: {
        message: string;
        threadId?: string;
        // CHANGE: Add any extra fields your backend expects (e.g. audience, metadata).
        [key: string]: unknown;
    }) {
        // CHANGE: User id used for eval requests (or read from auth if needed).
        const userId = "eval-user";

        // CHANGE: Build the payload your chat service expects.
        // Example: many backends accept { _id, query, threadId, ...extras }.
        const chatRequest: Record<string, unknown> = {
            _id: nanoid(),
            query: request.message,
            threadId: request.threadId,
        };
        // Include any extra fields from the request (except message/threadId which we've already mapped).
        Object.entries(request).forEach(([key, value]) => {
            if (key !== "message" && key !== "threadId") {
                chatRequest[key] = value;
            }
        });

        // CHANGE: Method name/path must match your chat service.
        const thread = await this.chatService.chat(chatRequest, userId);

        // Generic polling loop: wait for final assistant message.
        const maxAttempts = 120; // 60 seconds at 500ms intervals
        for (let i = 0; i < maxAttempts; i++) {
            // CHANGE: Method name must match your chat service.
            const history = await this.chatService.getHistoryForThread(thread._id);

            // CHANGE: Role and state values must match your message types.
            // Example: role === MessageRole.Assistant or "assistant"/"Assistant"
            // Example: agentState in ["Completed", "Error", "Done"]
            const lastAssistant = [...history]
                .reverse()
                .find(
                    (m: { role: string; agentState?: string }) =>
                        (m.role === "assistant" ||
                            m.role === "Assistant") &&
                        (m.agentState === "Completed" ||
                            m.agentState === "Error")
                );

            if (lastAssistant) {
                // CHANGE: Path to text content must match your message shape
                // (e.g. msg.parts with type "text" and content, or msg.text).
                const parts = (lastAssistant as any).parts;
                let text: string;

                if (Array.isArray(parts)) {
                    text =
                        parts
                            ?.filter((p: { type: string }) => p.type === "text")
                            ?.map((p: { content: string }) => p.content)
                            ?.join("") || "";
                } else {
                    text = (lastAssistant as any).text ?? "";
                }

                return {
                    answer: text,
                    threadId: thread._id,
                    // CHANGE: Include messageId if your model exposes it.
                    messageId: (lastAssistant as any)._id,
                    status: lastAssistant.agentState,
                };
            }

            await new Promise((r) => setTimeout(r, 500));
        }

        return {
            answer: "",
            threadId: thread._id,
            status: "Timeout",
            error: "Agent did not complete within 60 seconds",
        };
    }
}
