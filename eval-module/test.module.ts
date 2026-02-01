import { Module } from "@nestjs/common";
import { TestController } from "./test.controller";
import { TestService } from "./test.service";
// CHANGE: Uncomment and set path to your chat module
// import { ChatModule } from "../chat/chat.module";

@Module({
    // CHANGE: Add your chat module here after uncommenting the import above
    imports: [],
    controllers: [TestController],
    providers: [TestService],
    exports: [TestService],
})
export class TestModule { }
