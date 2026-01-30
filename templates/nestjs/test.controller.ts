import { Body, Controller, Post } from "@nestjs/common";
import { TestService } from "./test.service";

@Controller("eval")
export class TestController {
    constructor(private readonly testService: TestService) { }

    @Post("sync")
    async sync(
        @Body()
        body: {
            message: string;
            threadId?: string;
        }
    ) {
        return this.testService.handleSync(body);
    }
}
