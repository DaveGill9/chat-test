import { Module } from "@nestjs/common";
import { TestController } from "./test.controller";
import { TestService } from "./test.service";
// Uncomment and fix path when copying to your project:
// import { ChatModule } from "../chat/chat.module";

@Module({
    // Add ChatModule to imports after uncommenting the import above:
    imports: [],
    controllers: [TestController],
    providers: [TestService],
    exports: [TestService],
})
export class TestModule { }
