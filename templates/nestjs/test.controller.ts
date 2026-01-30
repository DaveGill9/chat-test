import { Body, Controller, Post } from "@nestjs/common";
// Uncomment and fix path when copying to your project:
// import { Public } from "../auth/public.decorator";
import { TestService } from "./test.service";

@Controller("eval")
export class TestController {
    constructor(private readonly testService: TestService) { }

    // Uncomment when you've added the Public import above:
    // @Public()
    @Post("sync")
    async sync(
        @Body()
        body: {
            message: string;
            audience?: string;
            threadId?: string;
        }
    ) {
        return this.testService.handleSync(body);
    }
}
