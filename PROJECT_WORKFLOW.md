# QACopilot — Project Workflow and Architecture

This document explains the overall architecture, data flows, and developer setup for the QACopilot application in this repository.

> Location: PROJECT root — `PROJECT_WORKFLOW.md`

---

## 1. High-level Overview

QACopilot is a small React + Vite TypeScript application that uses server-side helpers to orchestrate calls to multiple AI providers (Gemini, OpenAI, OpenRouter, Claude, OpenCode, Groq). The app helps generate QA test cases from product requirements and then generate automation test scripts from selected test cases. A Knowledge Base allows document uploads, parsing, chunking, and reuse (RAG) to improve AI prompt context.

Core pieces:
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS (in `src/`). Pages include the generator, test scripts, knowledge base, and AI settings.
- Server: `server/api.js` — lightweight express-like middleware serving `/api/*` endpoints for generation, file upload, and chunk management.
- Storage: Supabase (Postgres) integration when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set; otherwise a local JSON fallback store at `server/storage/localStore.js`.
- AI helpers: `server/ai/` implements provider request logic (Gemini, OpenAI/OpenRouter, Groq via OpenAI-compatible calls).

---

## 2. Repository Layout (important files)

- `src/`
  - `App.tsx` — main shell, routing between pages, preserves existing app state (provider, API key, generated QA result)
  - `pages/AISettings.tsx` — provider selection and secure API key UI
  - `pages/KnowledgeBase.tsx` — upload, file listing, chunk refresh and search UI
  - `pages/TestScripts.tsx` — compose/generate automation scripts from selected test cases
  - `lib/api.ts` — shared client types and API client helper
  - `components/` — small reusable components (e.g., `ErrorBoundary`, `ui/*` wrappers)
  - `index.css` — global theme (Tailwind + base variables)

- `server/`
  - `api.js` — server middleware routing for `/api/*`
  - `ai/` — provider wrappers: `gemini.js`, `openai.js` (handles OpenAI/OpenRouter/OpenCode/Groq-like endpoints)
  - `test-scripts/` — script generation orchestration
  - `storage/` — storage layer with `supabaseStore.js` and `localStore.js`

- `supabase/schema.sql` — SQL schema used by the Supabase database integration

---

## 3. Workflow: Generating Test Cases (frontend → backend flow)

1. User opens the Generator page in the app and enters a requirement (user story or validation criteria).
2. The frontend sends a POST to `/api/generate-test-cases` with payload: `{ requirement, provider, apiKey?, model? }`.
3. `server/api.js` resolves the effective API key using `resolveApiKey(provider, requestApiKey, env)` — priority: request payload key → env provider key mapping → empty.
4. The server queries `knowledge.searchChunks(requirement, limit)` to find contextual document chunks (RAG).
5. The server builds a prompt (`buildQaPrompt`) that includes matched chunks and sends it to the provider-specific helper:
   - Gemini: `server/ai/gemini.js`
   - OpenAI/OpenRouter/OpenCode/Groq: `server/ai/openai.js` (the helper sets proper headers for `x-api-key` when `openrouter` or other provider requires it)
6. Server returns a structured `QaResponse` containing `summary`, `testCases[]`, and `knowledgeContext[]`.
7. Frontend displays results in a table and stores them in component state for later use.

Notes:
- The prompt building step ensures reproducible output columns (TC_ID, Category, Summary, Test Description, Steps, Expected).
- If no API key is available, the server returns a 500-level error explaining the missing key.

---

## 4. Workflow: Generating Test Scripts

1. From the `Test Scripts` page the user chooses framework, language, viewport, headless, and selects test cases.
2. The frontend posts to `/api/generate-test-scripts` (via `server/test-scripts/generator.js`) with `{ testCaseIds, testCases, framework, language, targetUrl, apiKey?, provider, model?, options }`.
3. The test script generator chooses provider flow similar to test case generation and calls the appropriate AI helper.
4. The raw script text is returned and presented in a code preview and offered as a downloadable file.

Notes:
- Selecting no explicit IDs defaults to all generated test cases.
- `server/test-scripts/generator.js` centralizes provider logic and file naming.

---

## 5. Knowledge Base and Storage

- Frontend upload uses `/api/knowledge/upload` which stores incoming files temporarily, the `createKnowledgeService` parses text and saves metadata via the chosen store implementation.
- Storage modes:
  - Supabase: when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set the app uses `server/storage/supabaseStore.js` to persist `knowledge_files` and `knowledge_chunks` (see `supabase/schema.sql`).
  - Local fallback: uses `server/storage/localStore.js` writing `knowledge-store.json` in `.data/`.
- Chunks are created/updated via `/api/knowledge/chunks/refresh` which calls the knowledge service to (re)build embeddings/chunks.

---

## 6. Environment Variables and Secrets

Server environment variables (set in your hosting / `.env` for local dev - never commit secrets):

- `SUPABASE_URL` — Supabase project URL (optional)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only, required for Supabase mode)
- `GEMINI_API_KEY` — optional
- `OPENAI_API_KEY` — optional
- `OPENROUTER_API_KEY` — optional
- `CLAUDE_API_KEY` — optional
- `OPENCODE_API_KEY` — optional
- `GROQ_API_KEY` — optional (added during provider wiring)

Frontend stores a SHA-256 hash locally when saving an API key in `localStorage` (`qacopilot_ai_settings`) but raw keys used for immediate requests are kept in memory only.

Security note: Service-role keys and AI provider keys must remain server-side when possible. Do not expose service keys to the browser.

---

## 7. Development & Run Instructions

Install deps and run in development mode:

```bash
npm install
npm run dev
```

Typecheck and build:

```bash
npm run typecheck
npm run build
```

API server: The project is configured with the `server/api.js` middleware integrated into the dev server pipeline (check `vite.config.ts` or `server` usage in `package.json` scripts). Ensure server env variables are provided before generating or using Supabase storage.

---

## 8. How to Add or Update AI Providers

1. Add provider to `src/lib/api.ts` `AiProvider` union and update `src/pages/AISettings.tsx` provider list.
2. Update `server/api.js` `providerEnvKeyMap` to add the env key name for the provider.
3. Implement a provider helper under `server/ai/` that matches the existing helper signature (e.g., `generateWithOpenAI`, `generateWithGemini`).
4. Wire provider flows in `server/test-scripts/generator.js` and generation endpoints.

---

## 9. Troubleshooting Common Issues

- JSX/TS errors after UI changes: run `npm run typecheck` to catch type errors. Fix unclosed tags or incorrect imports when React Babel errors show line numbers.
- Missing API key errors: ensure `SUPABASE_*` or provider-specific env vars are set or provide an API key in the UI for immediate use.
- Supabase errors: verify `supabase/schema.sql` has been applied in Supabase SQL editor and `SUPABASE_URL`/`SERVICE_ROLE_KEY` are correct.

---

## 10. Where to Start When Contributing

- Read `PROJECT_WORKFLOW.md` (this file).
- Run locally with the commands above.
- Check `src/App.tsx` and `server/api.js` for the high-level request flow.
- UI improvements: prefer presentational changes in `src/components/ui/` wrappers and the `pages/*` components to avoid touching business logic.

---

If you'd like, I can additionally:
- Add this file to repo (already saved here).
- Generate a smaller `DEVELOPER_GUIDE.md` with step-by-step setup (env file template and example supabase steps).
- Create unit or integration tests for critical server flows.

