# Chat-test endpoint (NestJS sample)

Sample NestJS module that exposes the standard endpoint used by the **chat-test** eval tool. Copy this folder into your project and adapt the service to your chat backend.

## Contract

- **Request:** `POST /eval/sync`  
  Body: `{ message: string; audience?: string; threadId?: string }`
- **Response:** `{ answer: string; threadId?: string; status?: string; error?: string }`

The eval bot sends `message` (and optional `audience`, `threadId` for follow-ups) and expects `answer` (and optional `threadId` for multi-turn).

## Steps to add to your project

1. **Copy the template**  
   Copy the contents of this folder into your app.

2. **Fix imports in the service**  
   In `test.service.ts`, update:
   - `ChatService` and `ChatModule` to your real chat service/module path.
   - `MessageRole` and any message types to your real types path (e.g. `../messages/message.types` or your equivalent).

3. **Fix imports in the controller**  
   In `test.controller.ts`, update `Public` to your auth decorator that skips auth for this route (or remove the decorator if the route is already public).

4. **Fix imports in the module**  
   In `test.module.ts`, update `ChatModule` to your real chat module path.

5. **Register the module**  
   In your root `AppModule` (or a feature module), add `TestModule` to `imports`.

6. **Customize the service**  
   Implement or edit `TestService.handleSync` so that it:
   - Maps the request (`message`, `audience`, `threadId`) into your chat API shape.
   - Calls your chat backend. If your backend is **synchronous** (blocks until the reply is ready), replace the polling loop with a single call and return `{ answer, threadId }`. If it is **asynchronous** (agent runs in background), keep the polling or use your own completion mechanism.
   - Returns `{ answer, threadId?, status?, error? }`.

7. **Configure the eval bot**  
   In the chat-test repo, set `.env`:
   - `CHATBOT_URL=https://your-app/eval/sync` (or your base URL + path)
   - `CHATBOT_FIELD=message`
   - `CHATBOT_ANSWER_FIELD=answer`
   - `CHATBOT_THREAD_ID_FIELD=threadId` (if you support follow-ups)

## Polling

The sample service polls `getHistoryForThread` until the agent completes. Use this if your chat runs asynchronously. If your backend has a synchronous API that returns the reply when done, replace the polling loop in `handleSync` with a single call and return `{ answer, threadId }` directly.

## Files

| File | Purpose |
|------|---------|
| `test.controller.ts` | Public endpoint (fix auth decorator if needed) |
| `test.service.ts` | Adapter: standard → your chat → standard (customize) |
| `test.module.ts` | Nest module (fix ChatModule import) |
