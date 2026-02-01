# Eval module (chat-test endpoint)

Drag and drop this folder into your NestJS app (e.g. into `src/` as `src/eval-module/`). Then apply the code changes listed below. Chat-test sends Entra Bearer tokens, so this endpoint can stay protected.

## Contract

- **Request:** `POST /eval/sync`  
  Body: `{ message: string; threadId?: string }` plus any extra columns from the test CSV.
- **Response:** `{ answer: string; threadId?: string; status?: string; error?: string }`

## Drag and drop

1. Copy this **entire folder** (eval-module) into your project.
2. In your root `AppModule` (or a feature module), add `TestModule` to `imports`:
3. Apply every **CHANGE** listed below so the module works with your chat backend.

## Places that need a code change

Search for `// CHANGE:` in this folder. Summary:

| File | What to change |
|------|----------------|
| **test.controller.ts** | Route path (`eval`, `sync`) if your app uses different paths. |
| **test.service.ts** | Uncomment and fix: `ChatService` import, `MessageRole` (or equivalent) import. Fix constructor type. Ensure `chatRequest` shape, `chat()`, `getHistoryForThread()`, role/state strings, and `msg.parts` text extraction match your chat backend. Optionally change `userId`. |
| **test.module.ts** | Uncomment and fix: `ChatModule` import. Add `ChatModule` to `imports`. |

## Eval bot .env

In the chat-test repo, set:

- `CHATBOT_URL=https://your-app/eval/sync` (or your base URL + path)
- `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` (required)
- `AZURE_SCOPE` (optional; set to your API scope if needed)
- `CHATBOT_FIELD=message`, `CHATBOT_ANSWER_FIELD=answer`, `CHATBOT_THREAD_ID_FIELD=threadId` (if you support follow-ups)
