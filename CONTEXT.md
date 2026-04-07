# Pavitt Public Finance — Architecture Context

## Project Overview

Professional website and practitioner toolkit for Pavitt Public Finance, an
international PFM (Public Financial Management) consultancy. The site serves
two purposes:

1. **Marketing site** — bio, expertise areas, country experience, donor logos
2. **Practitioner section** — AI-assisted PFM tools for practitioners and
   government counterparts

## Tech Stack

| Layer        | Choice                          | Why                                      |
| ------------ | ------------------------------- | ---------------------------------------- |
| Framework    | Next.js 16 (App Router)        | SSR, Server Actions, Vercel deploy       |
| Styling      | Tailwind CSS 4                  | Utility-first, no custom CSS maintenance |
| Database     | Supabase (Postgres + Auth + Storage) | Managed Postgres, Row-Level Security, generous free tier |
| AI / LLM     | Provider-agnostic via env vars  | Swap models without code changes         |
| Hosting      | Vercel                          | Zero-config Next.js deploys              |

## Phased Rollout

| Phase | Scope                                          | Status       |
| ----- | ---------------------------------------------- | ------------ |
| 1     | Foundation — scaffold, assets, content.ts      | Complete     |
| 2     | Components — hero, bio, expertise, map, donors | Planned      |
| 3     | Practitioner section — AI tools, Supabase      | **In Design** |
| 4     | Contact form — Server Actions, email           | Planned      |

## Locked Decisions

- **Content in `src/lib/content.ts`** — single source of truth; components
  import from here, never hardcode text in JSX.
- **Countries split into `currentCountries` / `completedCountries`** — separate
  arrays to distinguish active engagements from historical.
- **Server-side only secrets** — `CONTACT_EMAIL`, API keys, Supabase service
  role key never leak to the client bundle.
- **Provider-agnostic AI** — the `.env` file controls which LLM provider and
  model are used; application code references a single `ai` client.

---

## Practitioner Section Architecture

### Purpose

Provide PFM practitioners (government officials, donor staff, consultants) with
AI-assisted tools that draw on Gregg Pavitt's domain expertise. Initial tools:

1. **PFM Knowledge Assistant** — conversational Q&A grounded in PFM frameworks
   (PEFA, IPSAS, budget cycle)
2. **Document Analyzer** — upload a fiscal report or budget document; get
   structured analysis and recommendations
3. **Reform Roadmap Generator** — given a country context and reform area,
   generate a phased reform plan

### Database Schema (Supabase / Postgres)

```
profiles            — user profiles (extends Supabase Auth)
practitioner_tools  — registry of available tools
tool_sessions       — one row per user session with a tool
tool_messages       — conversation messages within a session
documents           — uploaded files metadata (storage in Supabase Storage)
```

Row-Level Security (RLS) enforced: users can only read/write their own rows.
Admin role can read all.

### AI Integration

- **Provider flexibility**: env var `AI_PROVIDER` selects the provider
  (`anthropic`, `openai`, `google`, etc.)
- **Model flexibility**: env var `AI_MODEL` selects the specific model
  (e.g. `claude-sonnet-4-6`, `gpt-4o`, `gemini-2.0-flash`)
- **API key**: env var `AI_API_KEY` holds the secret key for the chosen provider
- Application code in `src/lib/ai.ts` reads these vars and exposes a unified
  interface — swapping providers requires zero code changes.

### API Routes

```
POST /api/tools/[toolId]/sessions    — create a new session
POST /api/tools/[toolId]/messages    — send a message, get AI response
GET  /api/tools/[toolId]/sessions    — list user's sessions
GET  /api/documents                  — list user's documents
POST /api/documents                  — upload a document
```

### Security Model

- Supabase Auth handles sign-up/sign-in (email + magic link)
- RLS policies enforce per-user data isolation
- AI API key stored server-side only (never in client bundle)
- Rate limiting via Supabase Edge Functions or Next.js middleware
- File uploads validated for type and size before storage
