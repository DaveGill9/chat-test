import { Injectable } from "@nestjs/common";
import { nanoid } from "nanoid";
// Uncomment and fix paths when copying to your project:
// import { ChatService } from "../chat/chat.service";
// import { MessageRole } from "../messages/message.types";

@Injectable()
export class TestService {
    constructor(private readonly chatService: ChatService) { }

    async handleSync(request: {
        message: string;
        audience?: string;
        threadId?: string;
    }) {
        const userId = "eval-user";
        const chatRequest = {
            _id: nanoid(),
            query: request.message,
            audience: request.audience,
            threadId: request.threadId,
        };

        const thread = await this.chatService.chat(chatRequest, userId);

        const maxAttempts = 120;
        for (let i = 0; i < maxAttempts; i++) {
            const history =
                await this.chatService.getHistoryForThread(thread._id);
            const msg = history.find(
                (m: { role: string; agentState: string }) =>
                    m.role === MessageRole.Assistant &&
                    (m.agentState === "Completed" || m.agentState === "Error")
            );

            if (msg) {
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
