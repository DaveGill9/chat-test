import { Body, Controller, Post } from "@nestjs/common";
import { TestService } from "./test.service";

// CHANGE: Route path if your app uses a different base path (e.g. "test" or "chat-test").
@Controller("eval")
export class TestController {
    constructor(private readonly testService: TestService) { }

    // CHANGE: Sub-path if needed (e.g. "chat" instead of "sync").
    @Post("sync")
    async sync(
        @Body()
        body: {
            message: string;
            threadId?: string;
            [key: string]: unknown;
        }
    ) {
        return this.testService.handleSync(body);
    }
}
