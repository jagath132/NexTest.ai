# Getting Started — QACopilot

This guide helps a new developer set up the project locally and begin contributing quickly.

## Prerequisites
- Node.js 18+ and npm
- Git
- Optional: Supabase account (for persistent storage)

## 1. Clone the repository

```bash
git clone <repo-url>
cd "d:\test forge ai\chandru bro project"
```

## 2. Install dependencies

```bash
npm install
```

## 3. Environment variables

Copy `.env.example` to `.env` and fill any keys you need:

```bash
cp .env.example .env
```

Important variables to add when needed:
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — enable Supabase storage mode
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, etc. — AI provider keys (can also be entered via UI for temporary use)

Do NOT commit `.env` or any secret values.

## 4. Run the app (development)

```bash
npm run dev
```

Open the app in your browser at the URL Vite shows (default `http://localhost:5173`).

## 5. Typecheck and build

Typecheck the TypeScript sources:

```bash
npm run typecheck
```

Create a production build:

```bash
npm run build
```

## 6. Quick functional checklist

- AI Settings: open `AI Settings` in the app to select a provider or paste an API key.
- Knowledge Base: upload sample PDF/TXT/DOCX files, then click `Create / Refresh chunks` to index them.
- Test Cases: enter a requirement in the `Test Cases` page and click `Generate Test Cases`.
- Test Scripts: choose framework/language, select test cases, and click `Generate Script`.

## 7. Code style and UI edits

- The project uses Tailwind classes in JSX. Prefer creating small presentational components in `src/components/ui/` (e.g., `Card`, `Badge`, `SectionHeader`) for repeated styles.
- Avoid changing API request shapes; keep logic inside `server/` files when adding providers.

## 8. Backend and storage

- Server middleware lives in `server/api.js` and routes `/api/*` endpoints.
- Add or update provider keys in `server/api.js` `providerEnvKeyMap` if you add a new AI provider.
- For persistent document storage, set up Supabase and run `supabase/schema.sql` in Supabase SQL editor.

## 9. Running tests and verification

- There are no automated tests by default. Use `npm run typecheck` to catch type issues.
- Verify flows manually: Provider selection → Upload docs → Refresh chunks → Generate test cases → Generate scripts.

## 10. Committing and branches

- Create feature branches: `git checkout -b feat/my-change`
- Keep commits small and focused.
- Open PRs with a description of changes and any manual test steps.

## 11. Need help?

If you hit issues, share the following when asking for help:
- Exact terminal commands used
- Any error messages and stack traces
- Which page or endpoint reproduced the error

---

That's it — you should be ready to run and modify the app. If you want, I can also add a sample supabase setup script or a lightweight smoke test that hits the key endpoints automatically.