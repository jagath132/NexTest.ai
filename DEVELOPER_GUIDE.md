# Developer Guide — QACopilot

This guide provides quick setup and development steps for contributors.

## Prerequisites
- Node.js 18+ (recommended)
- npm 9+
- Optional: a Supabase project if you want persistent storage and search.

## 1. Clone & Install

```bash
git clone <repo-url>
cd "d:\test forge ai\chandru bro project"
npm install
```

## 2. Environment

Create a `.env` file from `.env.example` and fill in any provider/service keys you plan to use.

Example:

```
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (server-only key)
OPENAI_API_KEY=sk-...
GROQ_API_KEY=...
```

Important: keep service role keys on the server. Do not commit `.env`.

## 3. Supabase setup (optional)

1. Create a Supabase project at https://app.supabase.com.
2. Open the SQL editor and run the schema file:
   - Open `supabase/schema.sql` and execute the SQL to create the `knowledge_files` and `knowledge_chunks` tables.
3. Copy the `Project URL` and a service role key into your `.env` as `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## 4. Run the app (development)

```bash
npm run dev
```

This uses Vite. The server middleware is registered inside the project; ensure env variables needed for Supabase or provider testing are present in your environment before generating content.

## 5. Typecheck and build

```bash
npm run typecheck
npm run build
```

## 6. Generating test cases and scripts (manual QA)

- Go to the `AI Settings` page and either set a provider via environment variables or paste an API key into the UI input, then `Save API key` for session use.
- Use the `Test Cases` (Generator) page to enter a requirement and `Generate Test Cases`.
- Switch to `Test Scripts` to choose framework/language and generate an automation script.

## 7. Adding a new AI provider

1. Add the provider id to `src/lib/api.ts` `AiProvider` union.
2. Add a provider card to `src/pages/AISettings.tsx`.
3. Add env key mapping in `server/api.js` `providerEnvKeyMap`.
4. Implement `server/ai/<provider>.js` request helper, wire it into `server/api.js` and `server/test-scripts/generator.js`.

## 8. Tests

- There are no automated tests included by default. Use `npm run typecheck` and manual flows to verify behavior.

## 9. Contributing

- Keep UI-only changes in `src/components` and `src/pages` and avoid changing API shapes.
- For backend changes, maintain explicit provider handling in `server/api.js` and `server/test-scripts/generator.js`.

## 10. Troubleshooting

- `Missing provider API key`: ensure either env vars are set or the UI-saved key is present.
- `Supabase errors`: verify schema installed and env keys are correct.
- JSX parse errors after UI edits: run `npm run typecheck` and check the reported file/line for unclosed tags.

---

If you'd like, I can also:
- Add a GitHub Actions workflow to run `npm run typecheck` on pull requests.
- Create a simple smoke test script to exercise key endpoints.
