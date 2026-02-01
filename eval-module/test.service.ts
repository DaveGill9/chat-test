import { Injectable } from "@nestjs/common";
import { nanoid } from "nanoid";
// CHANGE: Uncomment and set path to your chat service.
// import { ChatService } from "../chat/chat.service";
// CHANGE: Uncomment and set path to your message/role types (e.g. Assistant, Completed, Error).
// import { MessageRole } from "../messages/message.types";

@Injectable()
export class TestService {
    // CHANGE: Uncomment when ChatService import is fixed. Type with your real ChatService.
    constructor(private readonly chatService: any) { }

    async handleSync(request: {
        message: string;
        threadId?: string;
    }) {
        // CHANGE: User id used for eval requests (or read from auth if needed).
        const userId = "eval-user";

        // CHANGE: Shape must match what your chat backend expects (e.g. query, threadId, plus any extras from request).
        const chatRequest = {
            _id: nanoid(),
            query: request.message,
            threadId: request.threadId,
        };

        // CHANGE: Method name/path must match your chat service.
        const thread = await this.chatService.chat(chatRequest, userId);

        const maxAttempts = 120;
        for (let i = 0; i < maxAttempts; i++) {
            // CHANGE: Method name must match your chat service.
            const history =
                await this.chatService.getHistoryForThread(thread._id);
            // CHANGE: Role and state values must match your message types (e.g. MessageRole.Assistant, "Completed", "Error").
            const msg = history.find(
                (m: { role: string; agentState: string }) =>
                    m.role === "Assistant" &&
                    (m.agentState === "Completed" || m.agentState === "Error")
            );

            if (msg) {
                // CHANGE: Path to text content must match your message shape (e.g. msg.parts with type "text" and content).
                const text =
                    msg.parts
                        ?.filter((p: { type: string }) => p.type === "text")
                        ?.map((p: { content: string }) => p.content)
                        ?.join("") || "";

                return {
                    answer: text,
                    threadId: thread._id,
                    status: msg.agentState,
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
