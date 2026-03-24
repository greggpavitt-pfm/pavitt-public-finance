# IPSAS Training Platform — Integration Plan

## Context

This plan covers the steps to get the IPSAS training content from the
`ipsas-advisor` project loaded into Supabase and served through the
Pavitt Public Finance website (`pavitt-public-finance`).

**What was already done (prior session):**

1. Created the full database schema (`database/schema.sql` + `schema-paste.sql`)
   — tables, RLS policies, helper functions, indexes, column-level security
2. Added `@supabase/ssr` and `@supabase/supabase-js` to `package.json`
3. Created `src/lib/supabase/client.ts` (browser-side, anon key, respects RLS)
4. Created `src/lib/supabase/server.ts` (server-side with session cookies +
   privileged `createServiceClient()` for admin/answer-checking)
5. Created `src/middleware.ts` (route protection for `/training/*`, `/admin/*`,
   session refresh, redirect logic for pending/suspended/onboarding states)

**What remains — the follow-on steps:**

---

## Step 1: Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a
   new project (free tier is fine for beta).
   - **Name:** `pavitt-ipsas` (or similar)
   - **Region:** closest to Solomon Islands users — `ap-southeast-1` (Singapore)
     or `ap-southeast-2` (Sydney)
   - **Database password:** save securely — you'll need it later
2. Once the project is ready, copy these values from
   **Settings → API → Project API keys**:
   - `NEXT_PUBLIC_SUPABASE_URL` — the project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the public anon key
   - `SUPABASE_SERVICE_ROLE_KEY` — the secret service role key (**never expose
     in browser code**)

## Step 2: Run the schema

1. Open the Supabase **SQL Editor** (Dashboard → SQL Editor → New query)
2. Paste the contents of `database/schema-paste.sql` (the stripped-down version
   — identical structure, no verbose comments)
3. Click **Run** — all tables, functions, RLS policies, indexes, and column
   revocations are created in one pass
4. Verify in **Table Editor** that these tables exist:
   - `organisations`, `org_subgroups`, `profiles`, `admin_users`
   - `modules`, `questions`, `progress`, `assessment_results`

## Step 3: Set up environment variables locally

Create/update `.env.local` in the `pavitt-public-finance/` root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CONTACT_EMAIL=Gregg.pavitt@pfmexpert.net
```

Also add these same variables in **Vercel → Settings → Environment Variables**
for the deployed site.

## Step 4: Create your admin account

1. In Supabase **Authentication → Users**, click **Add user → Create new user**
   - Enter your email and a password
   - Note the UUID that Supabase assigns (visible in the user row)
2. In the **SQL Editor**, run:
   ```sql
   insert into admin_users (id, role)
   values ('<your-user-uuid>', 'super_admin');
   ```
3. Then create the first organisation:
   ```sql
   insert into organisations (name, country, jurisdiction_code, licence_key, licence_status)
   values (
     'Ministry of Finance — Solomon Islands',
     'Solomon Islands',
     'SIG',
     'PPF-SIG-2025-BETA',
     'beta'
   );
   ```

## Step 5: Build the content migration script

This is the big engineering step. A Node.js script that:

1. **Reads** all 110 markdown files from
   `ipsas-advisor/content/{cash-basis,accrual,shared,Solomon-Island-Government}/`
2. **Parses** the YAML frontmatter from each file to extract:
   - `pathway` (cash-basis | accrual)
   - `module` (sequence number)
   - `title`
   - `standards` (array)
   - `work_areas` (array)
   - `difficulty` (beginner/intermediate/advanced, or null for cash-basis)
   - `description`
   - `topic`
3. **Determines jurisdiction** — files under `Solomon-Island-Government/` get
   `jurisdiction = 'SIG'`; all others get `jurisdiction = null` (universal)
4. **Generates a module slug** for the `modules.id` primary key, e.g.:
   - `cash-03-receipts-classification`
   - `accrual-beginner-07-ppe-overview`
   - `sig-cash-01-overview` (for Solomon Islands overlays)
5. **Extracts questions** — parses each file's Flash Cards and MCQ sections:
   - Flash cards → `question_type = 'flashcard'`, `question_text` = Front,
     `correct_answer` = Back
   - MCQs → `question_type = 'mcq'`, `options` as JSONB array,
     `correct_answer` = correct option ID, `explanation` = explanation text
6. **Inserts into Supabase** using the service role key (bypasses RLS):
   - First inserts all `modules` rows
   - Then inserts all `questions` rows (foreign key to modules)

**Script location:** `database/seed-content.ts` (or `.js`)

**Key decisions:**
- Use `@supabase/supabase-js` with the service role key for inserts
- Run as a one-time local script (`npx tsx database/seed-content.ts`)
- Parse markdown with `gray-matter` (YAML frontmatter) + custom regex for
  FC/MCQ sections
- Upsert pattern so it's safe to re-run during development

## Step 6: Run the migration and verify

1. Run the seed script:
   ```bash
   cd pavitt-public-finance
   npx tsx database/seed-content.ts
   ```
2. Verify in Supabase **Table Editor**:
   - `modules` table should have rows for all pathways and difficulty levels
   - `questions` table should have flashcards and MCQs linked to modules
   - Spot-check: filter `modules` by `pathway = 'cash-basis'` — should see
     ~19 modules (01–19)
   - Spot-check: filter by `jurisdiction = 'SIG'` — should see Solomon Islands
     overlay content
   - Spot-check: `questions` for a known module — verify FC and MCQ entries
     match the source markdown

## Step 7: Build the training pages (frontend)

With data in Supabase and auth/middleware in place, build the user-facing pages:

1. **Auth pages** — `/login`, `/register` (with licence key field),
   `/pending` (waiting for admin approval)
2. **Onboarding** — `/onboarding` — user selects pathway
   (cash-basis or accrual) and ability level; sets `profiles.pathway` and
   `profiles.ability_level`
3. **Module listing** — `/training` — shows modules filtered by the user's
   pathway, difficulty, and jurisdiction (RLS handles this automatically)
4. **Module viewer** — `/training/[module-id]` — renders the `content_md`
   with flashcard and MCQ interactive components
5. **Assessment/quiz** — answer checking via Server Action using
   `createServiceClient()` (reads `correct_answer` column, which is revoked
   from the authenticated role)
6. **Progress tracking** — upsert `progress` rows as user completes modules;
   store `assessment_results` per attempt

## Step 8: Build the admin pages

1. **User management** — `/admin/users` — list pending users, approve/reject,
   view by organisation
2. **Organisation management** — `/admin/orgs` — create orgs, generate licence
   keys, set jurisdiction codes
3. **Content overview** — `/admin/content` — read-only view of loaded modules
   and question counts (useful for verifying the seed ran correctly)

## Step 9: Test end-to-end

1. Register a test user with the SIG licence key
2. Admin-approve the test user
3. Complete onboarding (select cash-basis pathway)
4. Verify module list shows only cash-basis + universal content
5. Open a module, work through flash cards and MCQs
6. Verify progress is tracked
7. Repeat with an accrual pathway user at each difficulty level

## Step 10: Deploy to Vercel

1. Ensure all Supabase env vars are in Vercel
2. Push to GitHub → Vercel auto-deploys
3. Test the live deployment end-to-end with the SIG licence key
4. Share the URL with Solomon Islands stakeholders for beta testing

---

## Content inventory (for reference)

| Pathway | Difficulty | Files | Jurisdiction |
|---------|-----------|-------|-------------|
| cash-basis | (single level) | 19 + structure doc | universal |
| accrual | beginner | 29 | universal |
| accrual | intermediate | 29 | universal |
| accrual | advanced | 29 | universal |
| Solomon Islands | — | 1 (SIG policies) | SIG |
| shared | — | TBD | universal |
| **Total** | | **~110 files** | |

## Dependencies installed

- `@supabase/ssr` ^0.9.0
- `@supabase/supabase-js` ^2.99.3

## Files already created

| File | Purpose |
|------|---------|
| `database/schema.sql` | Full schema with comments |
| `database/schema-paste.sql` | Paste-friendly version for SQL Editor |
| `src/lib/supabase/client.ts` | Browser-side Supabase client |
| `src/lib/supabase/server.ts` | Server-side client + privileged service client |
| `src/middleware.ts` | Route protection + session refresh |

## Files still to create

| File | Purpose |
|------|---------|
| `database/seed-content.ts` | Migration script to load markdown → Supabase |
| `src/app/login/page.tsx` | Login page |
| `src/app/register/page.tsx` | Registration with licence key |
| `src/app/pending/page.tsx` | Waiting for approval screen |
| `src/app/onboarding/page.tsx` | Pathway + difficulty selection |
| `src/app/training/page.tsx` | Module listing |
| `src/app/training/[id]/page.tsx` | Module viewer with FC/MCQ |
| `src/app/admin/users/page.tsx` | User management |
| `src/app/admin/orgs/page.tsx` | Organisation management |
