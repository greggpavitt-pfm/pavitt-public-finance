# Pavitt Public Finance — Project Memory

## Project Overview
Professional website + practitioner toolkit for Pavitt Public Finance (international PFM consultancy).
- **Owner**: Gregg Pavitt
- **Domain**: pfmexpert.net
- **Repo**: greggpavitt-pfm/pavitt-public-finance

## Tech Stack
- **Framework**: Next.js 16.1.7 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 + PostCSS
- **Database**: Supabase (Postgres + Auth + Storage)
- **AI**: Provider-agnostic — Anthropic / OpenAI / Google via env vars
- **Hosting**: Vercel

## Phased Rollout
| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Foundation — scaffold, assets, content.ts | **Complete** |
| 2 | Components — hero, bio, expertise, map, donors | Planned |
| 3 | Practitioner section — AI tools, Supabase | **In Design** (migration + libs done) |
| 4 | Contact form — Server Actions, email | Planned |

## Key Architecture Decisions
- **Content in `src/lib/content.ts`** — single source of truth; never hardcode in JSX
- **Countries split**: `currentCountries` / `completedCountries` arrays (locked decision)
- **Server-side only secrets** — API keys, service role key, contact email never in client bundle
- **Provider-agnostic AI** — `.env` controls provider/model; `src/lib/ai.ts` exposes unified `chat()` interface
- **Architecture doc**: `CONTEXT.md` at project root (referenced by content.ts)

## Key Files
- `src/lib/content.ts` — all site content (bio, expertise, countries, donors, projects, images)
- `src/lib/ai.ts` — provider-agnostic AI client (Anthropic/OpenAI/Google via dynamic imports)
- `src/lib/supabase.ts` — browser + server Supabase client factories
- `supabase/migrations/20260407000000_practitioner_section.sql` — full schema
- `supabase/config.toml` — local Supabase CLI config
- `.env.example` — all required env vars with comments
- `CONTEXT.md` — architecture decisions and practitioner section design

## Database Schema (Supabase)
5 tables with RLS:
- `profiles` — extends Supabase Auth (auto-created on signup via trigger)
- `practitioner_tools` — tool registry (seeded: Knowledge Assistant, Document Analyzer, Reform Roadmap)
- `tool_sessions` — per-user conversation sessions with tools
- `tool_messages` — conversation messages with token/model tracking
- `documents` — uploaded file metadata (files in Supabase Storage)

## Environment Variables (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client-safe
- `SUPABASE_SERVICE_ROLE_KEY` — server-only
- `AI_PROVIDER` — anthropic | openai | google
- `AI_MODEL` — e.g. claude-sonnet-4-6, gpt-4o, gemini-2.0-flash
- `AI_API_KEY` — secret key for chosen provider
- `CONTACT_EMAIL` — Phase 4

## Practitioner Tools (3 seeded)
1. **PFM Knowledge Assistant** (qa) — conversational Q&A on PFM frameworks
2. **Document Analyzer** (analysis) — upload fiscal docs for structured analysis
3. **Reform Roadmap Generator** (planning) — phased reform plans by country/area

## API Routes (Planned)
- `POST /api/tools/[toolId]/sessions` — create session
- `POST /api/tools/[toolId]/messages` — send message, get AI response
- `GET /api/tools/[toolId]/sessions` — list user sessions
- `GET /api/documents` — list documents
- `POST /api/documents` — upload document

## Dependencies (production)
- `@anthropic-ai/sdk@^0.82.0` (was ^0.28 causing Vercel ETARGET — fixed)
- `@google/genai@^1.48.0`
- `@supabase/supabase-js@^2.101.1`
- `openai@^6.33.0`
- `next@16.1.7`, `react@19.2.3`

## Git
- **Main branch**: main
- **Current feature branch**: claude/review-practitioner-architecture-Qbbsz
- **Commit style**: `feat(phase-name): description` (conventional commits)

## Notes
- `.gitignore` excludes `.env*` but allows `.env.example` via `!.env.example`
- Build fails in sandboxed envs (no Google Fonts access) but works on Vercel
- Storage bucket `practitioner-documents` must be created via Supabase Dashboard/CLI (not SQL)
- Next step: run migration on Supabase, then build API routes and practitioner UI
