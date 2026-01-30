# Chat-test endpoint (NestJS sample)

Sample NestJS module that exposes the standard endpoint used by the **chat-test** eval tool. Copy this folder into your project and adapt the service to your chat backend.

## Contract

- **Request:** `POST /eval/sync`  
  Body: `{ message: string; threadId?: string }` plus any extra columns from the test CSV as top-level fields.
- **Response:** `{ answer: string; threadId?: string; status?: string; error?: string }`

The eval bot sends `message` and `threadId`, plus any other CSV columns as-is. It expects `answer` (and optional `threadId` for multi-turn).

## Steps to add to your project

1. **Copy the template**  
   Copy the contents of this folder into your app.

2. **Fix imports in the service**  
   In `test.service.ts`, update:
   - `ChatService` and `ChatModule` to your real chat service/module path.
   - `MessageRole` and any message types to your real types path (e.g. `../messages/message.types` or your equivalent).

3. **Auth in the controller**  
   Chat-test sends an Entra Bearer token, so you can keep this route protected (no `@Public()`). If you uncomment `@Public()`, the route is unauthenticated; remove it to require Bearer auth.

4. **Fix imports in the module**  
   In `test.module.ts`, update `ChatModule` to your real chat module path.

5. **Register the module**  
   In your root `AppModule` (or a feature module), add `TestModule` to `imports`.

6. **Customize the service**  
   Implement or edit `TestService.handleSync` so that it:
   - Maps the request (`message`, `threadId`, and any extra CSV columns from the body) into your chat API shape.
   - Calls your chat backend. If your backend is **synchronous** (blocks until the reply is ready), replace the polling loop with a single call and return `{ answer, threadId }`. If it is **asynchronous** (agent runs in background), keep the polling or use your own completion mechanism.
   - Returns `{ answer, threadId?, status?, error? }`.

7. **Configure the eval bot**  
   In the chat-test repo, set `.env`:
   - `CHATBOT_URL=https://your-app/eval/sync` (or your base URL + path)
   - `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (required; chat-test uses Entra to get a Bearer token)
   - `AZURE_SCOPE` (optional; set to your API scope if not using default)
   - `CHATBOT_FIELD=message`, `CHATBOT_ANSWER_FIELD=answer`, `CHATBOT_THREAD_ID_FIELD=threadId` (if you support follow-ups)

## Files

| File | Purpose |
|------|---------|
| `test.controller.ts` | Endpoint (can stay protected; chat-test sends Bearer token) |
| `test.service.ts` | Adapter: standard → your chat → standard (customize) |
| `test.module.ts` | Nest module (fix ChatModule import) |
