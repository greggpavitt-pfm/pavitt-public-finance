IPSAS Advisor — Administrator's Guide
Prepared: April 13, 2026 | Revised: April 14, 2026 | Version: 1.1 | Confidential

PART A — WHAT IS SET UP NOW
1. Application Overview
The IPSAS Advisor is a dual-phase web application built for training and advising public sector accountants on International Public Sector Accounting Standards (IPSAS). It is built on:

Framework: Next.js 16.1.7 (App Router) + React 19 + TypeScript
Database: Supabase (PostgreSQL with Row Level Security)
Hosting: Vercel (auto-deploys from GitHub main branch)
AI Integration: OpenRouter (routes questions to DeepSeek R1, Gemini 1.5 Flash, GPT-5 Nano)
Phase 1 — Training Platform (Live/Beta):
Users work through structured training modules, answer MCQ/flashcard questions, and earn scored assessments. Two learning pathways exist: Accrual IPSAS (IPSAS 1–48) and Cash Basis IPSAS (C4). Progress and scores are tracked per user and per module.

Phase 2 — Practitioner Advisor (In Development):
An interactive Q&A system where accountants describe real transactions in plain text. The system identifies relevant IPSAS standards, asks clarifying questions if needed, and returns a structured treatment with paragraph-level citations from the official standards. Pre-computed RAG knowledge packets are used to inject relevant standard text into each LLM prompt.

2. Database Structure
The following tables exist in the Supabase PostgreSQL database:

Table	Purpose
organisations	Licensed organisations — name, country, jurisdiction code, licence key (internal), licence status, seat limit, expiry date
org_subgroups	Sub-divisions within an org (e.g., Treasury, Customs, Finance); also supports sub_jurisdiction codes for content gating
profiles	One row per user — extends Supabase auth; stores full name, job title, pathway, ability level, account status, org, subgroup, onboarding flag, approval tracking (approved_by, approved_at)
admin_users	Flags which users are admins and what role (super_admin or org_admin)
modules	Training content — markdown body, pathway, difficulty, standards tags, jurisdiction, sub_jurisdiction
questions	MCQ/flashcard questions; correct_answer column is revoked from browser (security)
progress	Per user x module — status: in_progress or completed
module_sessions	Saves in-progress quiz state so page exits don't lose answers
assessment_results	Immutable record of every completed attempt — score, answers, pass/fail, timestamp
advisor_contexts	User's context settings for the Advisor (jurisdiction, entity type, reporting basis)
advisor_conversations	Multi-turn Q&A threads
advisor_messages	Individual messages — role, content, citations, standards cited, token_count_in, token_count_out
advisor_feedback	User ratings (1–5) on advisor responses
advisor_model_config	Admin-configurable LLM model assignments per task type (display_name, updated_by tracking)
ipsas_regulation_metadata	Effective dates, supersessions, source PDFs, handbook year, and notes for IPSAS standards; includes a helper view (ipsas_effective_regulations) that filters to current/effective only
rag_knowledge_cache	Pre-computed RAG context packets — cached knowledge chunks per IPSAS standard/topic, with keywords, synthesised summaries, and source metadata
rag_cache_invalidation_log	Tracks when and why RAG cache entries were invalidated
rag_cache_build_log	Records each RAG cache build run (timestamp, entries processed, status)

Row Level Security (RLS) is enabled on all tables. Users can only see their own data. Admins access broader data through server-side actions using the Supabase service role key, which bypasses RLS.

3. User Lifecycle
Register (select organisation from dropdown)
        |
  Profile Setup (choose pathway + ability level — done at registration)
        |
   Status: PENDING  <- admin sees this in /admin/users
        |
  Admin approves
        |
   Status: APPROVED -> completes onboarding -> can access /training and /advisor
        |
  (if needed) Admin suspends
        |
   Status: SUSPENDED -> redirected to login on next visit

Account States: pending -> approved -> suspended

4. Admin Roles
Role	What They Can Do
super_admin	Full access to all organisations, all users, cross-org results report (master view), model config, reassign users between orgs
org_admin	Manage users and subgroups within their own organisation only
Admin access is controlled by the admin_users table. Being listed there (with the correct org_id for org_admins) is the gate — no other config needed.

5. Admin Panel — Current Pages
/admin — Dashboard

Shows count of pending approvals
Quick links to users, orgs, results
/admin/users — User Management

List of all users (super_admin) or your org's users (org_admin)
Columns: name, email, organisation, subgroup, pathway, account status, joined date
Actions: Approve, Suspend, Assign to Subgroup, Reassign Organisation (super_admin only)
/admin/orgs — Organisation Management

Create new organisations (licence key is auto-generated internally)
View all orgs and their licence keys
Create, rename, or delete subgroups within each org
Set seat limits (max_users)
Manage IPSAS regulation subgroups (separate tab — see Section 5a below)
/admin/results — Scoring Report (Org Admin)

View assessment results scoped to your organisation
Shows: user name, module, score, pass/fail, date completed
Export to CSV via the ExportButton component
/admin/results/master — Scoring Report (Super Admin)

Cross-organisation view of all assessment results
Includes organisation column in output
Export to CSV with org data included

5a. Dual Subgroup System
The platform has two distinct types of subgroups, managed from different tabs on the /admin/orgs page:

Type 1 — Organisational Subgroups (PFS Admin tab)
Purpose: Departmental divisions within an organisation (e.g., Treasury, Customs, Health Finance)
Used for: Reporting — filter results by department
No content gating — all users in the org see the same modules regardless of their subgroup
Stored in: org_subgroups table (main Supabase project)

Type 2 — IPSAS Regulation Subgroups (IPSAS Regulation tab)
Purpose: Content visibility control at a sub-organisational level
Uses sub_jurisdiction codes (e.g., "SIG-TREASURY") on both the org_subgroups table and the modules table
Effect: Users assigned to a subgroup with a sub_jurisdiction code only see modules tagged with a matching sub_jurisdiction (plus universal modules with no sub_jurisdiction)
Stored in: org_subgroups table (IPSAS Supabase project, accessed via separate service role key)
Admin actions: getIpsasOrgsAndSubgroups(), createIpsasSubgroup(), deleteIpsasSubgroup()

A user can be assigned to an organisational subgroup (for reporting) AND their subgroup can have a sub_jurisdiction code (for content gating). These two functions coexist on the same table but are managed through separate admin interfaces.

6. Organisations and Licence Keys
Each organisation has:

name — display name (e.g., "Solomon Islands Government")
country — ISO country code
jurisdiction_code — determines which jurisdiction-specific content is shown (e.g., SIG = Solomon Islands)
licence_key — auto-generated in format PPF-XXXX-XXXX; used as an internal identifier (not entered by users at registration)
licence_status — one of: beta, active, expired, suspended
licence_expires_at — expiry date (null = perpetual/no expiry)
max_users — seat limit (null = unlimited)
Subgroups within an org allow you to segment users into divisions (e.g., Treasury, Customs, MFEM) for reporting purposes. See Section 5a for the dual subgroup system.

Note: Users do NOT enter licence keys during registration. They select their organisation from a dropdown list. Licence keys are generated automatically when an admin creates an organisation and serve as internal reference identifiers.

7. Training & Scoring — How It Works
User opens a module -> a module_sessions row is created (or resumed)
User answers questions one at a time; answers are saved incrementally
On submit: score = (correct / total) x 100; pass threshold = 70%
An assessment_results row is written (immutable — no re-sits allowed)
progress is updated to completed
Answer Security: The browser never receives correct_answer. Comparison happens server-side via a Server Action using the service role key.

8. AI Advisor — Current Setup
The Practitioner Advisor uses OpenRouter to route prompts to different LLMs depending on the task:

Task	Model
Reasoning / drafting the treatment	DeepSeek R1
Citation verification	Gemini 1.5 Flash
Plain-language summaries	GPT-5 Nano
These model assignments are stored in the advisor_model_config table, meaning they can be changed by an admin without a code deploy.

Current limits:

Daily token cap per user: 100,000 tokens (enforced — hardcoded in advisor/actions.ts; checked before every API call)
Token tracking: tokens used per message are recorded in advisor_messages (token_count_in and token_count_out columns)
Conversation history: last 10 messages included in each prompt
OpenRouter caching enabled to reduce repeat costs

RAG Context: The advisor uses pre-computed knowledge packets stored in the rag_knowledge_cache table. When a user asks a question, the system matches keywords against cached entries and injects relevant IPSAS standard text into the LLM prompt. This avoids real-time vector database lookups and keeps response times fast.

Single OpenRouter API key is used for the entire platform, stored in the OPENROUTER_API_KEY environment variable in Vercel. All usage is pooled under one account.

PART B — STEP-BY-STEP ADMIN PROCEDURES
Step 1 — Create a New Organisation
Go to /admin/orgs
Click "Create Organisation"
Fill in:
Organisation name (e.g., "Papua New Guinea Treasury")
Country (select from dropdown)
Jurisdiction code (e.g., PNG — must match the code used in content frontmatter; use null for universal content only)
Max users (leave blank for unlimited)
Click Save — a licence key is auto-generated (e.g., PPF-7K2M-9XPQ) for internal reference
The organisation now appears in the registration dropdown for new users
Step 2 — Create Subgroups Within an Organisation
Subgroups let you segment users inside one org for reporting (e.g., by department).

Go to /admin/orgs
Click on the organisation name to expand it
Under the PFS Admin tab, click "Add Subgroup"
Enter the subgroup name (e.g., "Treasury", "Customs", "MFEM", "Health Finance")
Repeat for each subgroup needed
Click Save for each
You can also delete subgroups from this view (users in the subgroup are not deleted, their subgroup_id is set to null). Deletion is blocked if users are still assigned to the subgroup.

For IPSAS regulation subgroups (with sub_jurisdiction codes for content gating), use the IPSAS Regulation tab instead. See Section 5a.

Step 3 — Users Register Themselves
Users self-register at /register:

Enter full name, email, password, and job title
Select their organisation from the dropdown list (organisations are pre-configured by admins)
Choose their pathway (Accrual or Cash-basis) and ability level (Beginner/Intermediate/Advanced for Accrual; N/A for Cash-basis)
The system creates their auth account and profile, links them to the selected org, and sets account_status = 'pending'
They are redirected to /pending and see a waiting message with contact details for escalation
Beta testers can register as independent users (no organisation selected).

You do not need to manually create user accounts — the organisation dropdown is the gate.

Step 4 — Approve Pending Users
Go to /admin/users — pending users appear at the top
Review name, email, and the organisation they registered under
Click "Approve" to grant access (sets status to approved; records who approved and when)
The user can now log in, complete onboarding (confirm pathway/ability), and access /training and /advisor
If a user registered under the wrong org or looks suspicious, click "Suspend" instead — they will be blocked and redirected to login.

Step 5 — Assign Users to Subgroups
Go to /admin/users
Find the user
In the Subgroup column, select a subgroup from the dropdown
The assignment is saved immediately (no save button needed)
This allows the results report to be filtered by subgroup.

Step 6 — Classify Users by Pathway and Ability
Users choose their own pathway and ability level during registration, then confirm during onboarding (after approval). As admin you can see these in /admin/users:

Pathway: accrual or cash-basis
Ability level: beginner, intermediate, advanced (accrual only; cash-basis is N/A)
These control which modules are shown to each user. If a user chose incorrectly, the current system does not have a UI to change this post-onboarding — this would require a direct database update (see improvement suggestions in Part C).

Step 7 — View Scoring Reports
For org_admin:
Go to /admin/results
Results are shown for your organisation only
Filter options (current): by module
Columns: User name, Module title, Score (%), Pass/Fail, Date completed
Click "Export CSV" to download for external reporting (Excel, etc.)

For super_admin:
Go to /admin/results/master
Results shown for all organisations
Includes Organisation column
Click "Export CSV" to download with org data included

To view by subgroup: Currently the CSV export includes the subgroup column — open in Excel and use a pivot table to slice by subgroup. A dedicated subgroup filter in the UI is a planned improvement.

Step 8 — Manage an Admin User
Currently, adding admin roles requires a direct database operation (no UI yet):

To grant org_admin:

INSERT INTO admin_users (user_id, role, org_id)
VALUES ('<user-uuid>', 'org_admin', '<org-uuid>');

To grant super_admin:

INSERT INTO admin_users (user_id, role)
VALUES ('<user-uuid>', 'super_admin');

To remove admin:

DELETE FROM admin_users WHERE user_id = '<user-uuid>';

Run these in the Supabase SQL Editor (dashboard.supabase.com -> your project -> SQL Editor).

Step 9 — Change AI Model Assignments (Advisor)
The LLM models used by the Advisor can be changed without a code deploy:

Go to Supabase SQL Editor
Run:
UPDATE advisor_model_config
SET model_id = 'anthropic/claude-3-5-sonnet'
WHERE task_type = 'reasoning';

Valid task_type values: reasoning, citation_verification, summary

Model IDs follow OpenRouter format (e.g., deepseek/deepseek-r1, google/gemini-flash-1.5, openai/gpt-4o-mini).

Step 10 — Suspend or Reinstate a User
Suspend:

/admin/users -> find user -> click "Suspend"
User is immediately blocked (redirected to login on next request)
Reinstate:

Currently requires a direct DB update:
UPDATE profiles
SET account_status = 'approved'
WHERE id = '<user-uuid>';

A "Reinstate" button in the UI is a planned improvement.

PART C — IMPROVEMENT ROADMAP: MULTI-GROUP & USAGE TRACKING
This section covers what should be built as the platform scales to multiple organisations and groups.

C1. The Core Problem at Scale
With a single OpenRouter API key and no per-organisation metering, you currently have:

Basic per-user daily token enforcement (100k/day, hardcoded) and per-message token tracking in advisor_messages — but no aggregated usage dashboard
No visibility into which organisation is consuming how many tokens
No way to enforce org-level quotas or differentiated limits
No way to charge organisations based on actual usage
No easy way to identify a "heavy user" without querying the database directly
The improvements below solve this systematically.

C2. Option A — Per-Organisation OpenRouter Keys (Recommended)
What it is: Each organisation gets its own OpenRouter API key. Their usage appears in a separate OpenRouter account/key, making billing and monitoring straightforward.

How to implement:

Add a column to the organisations table:
ALTER TABLE organisations
ADD COLUMN openrouter_api_key TEXT;  -- stored encrypted

When an org is created, either:

Admin manually pastes in a pre-created OpenRouter key
Or the system auto-provisions one via the OpenRouter API (if they support programmatic key creation)
In src/app/advisor/actions.ts, look up the user's org, fetch their org's key, and use it for the OpenRouter call instead of the global OPENROUTER_API_KEY:

// Instead of:
const apiKey = process.env.OPENROUTER_API_KEY

// Do:
const { data: org } = await supabase
  .from('organisations')
  .select('openrouter_api_key')
  .eq('id', user.org_id)
  .single()
const apiKey = org.openrouter_api_key ?? process.env.OPENROUTER_API_KEY

Benefits:

Each org's spend is isolated in OpenRouter's dashboard
You can set per-key spending limits in OpenRouter directly
Billing is accurate per org — you know exactly what to charge each client
If an org's key is revoked/expired, only that org is affected
Tradeoffs:

Requires each org to have (or you to create) a separate OpenRouter account/key
Slightly more complex key management
OpenRouter currently does not fully support programmatic key provisioning via API (you may need to do this manually per org)
C3. Option B — Dedicated Usage Log Table
What it is: Every Advisor API call records how many tokens were used, by which user, in which org, at what cost — in a dedicated table purpose-built for reporting.

Note: Basic token tracking already exists in advisor_messages (token_count_in and token_count_out columns). This proposal adds a dedicated, denormalised log optimised for aggregation queries and billing reports.

New table to add:

CREATE TABLE advisor_usage_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  user_id         UUID REFERENCES profiles(id),
  org_id          UUID REFERENCES organisations(id),
  subgroup_id     UUID REFERENCES org_subgroups(id),
  conversation_id UUID REFERENCES advisor_conversations(id),
  message_id      UUID REFERENCES advisor_messages(id),
  model_used      TEXT,             -- e.g., 'deepseek/deepseek-r1'
  task_type       TEXT,             -- 'reasoning', 'citation', 'summary'
  prompt_tokens   INTEGER,
  completion_tokens INTEGER,
  total_tokens    INTEGER,
  estimated_cost_usd NUMERIC(10,6)  -- calculated from OpenRouter pricing
);

How it works:

OpenRouter returns token counts in every API response (already captured in advisor_messages)
After each Advisor call, also write a row to advisor_usage_log with denormalised org/subgroup/model data
Build a /admin/usage page that queries this table with group-by org, subgroup, user, date range
Benefits:

Full visibility without relying on OpenRouter's dashboard
You can build custom reports (per org, per user, per week, per topic)
Can trigger alerts when a user approaches their daily limit
Provides data for cost-recovery billing
Faster queries than joining advisor_messages with profiles and organisations each time
C4. Option C — Configurable Per-User or Per-Group Token Quotas
Currently the daily token limit is hardcoded at 100,000 tokens per user. This option makes it configurable:

New columns:

-- On organisations table:
ALTER TABLE organisations ADD COLUMN monthly_token_budget INTEGER; -- null = unlimited

-- On profiles table:
ALTER TABLE profiles ADD COLUMN daily_token_limit INTEGER DEFAULT 100000;
ALTER TABLE profiles ADD COLUMN monthly_token_limit INTEGER; -- null = use org default

Enforcement logic (update the existing check in advisor/actions.ts):

// Replace the hardcoded 100k check with a configurable lookup:
const dailyCap = user.daily_token_limit ?? 100000
if (tokensUsedToday >= dailyCap) {
  return { error: 'Daily usage limit reached. Resets at midnight UTC.' }
}

C5. Option D — Separate Supabase Projects Per Organisation (Maximum Isolation)
For large enterprise clients or government departments requiring data sovereignty:

What it is: Each major client gets their own Supabase project (separate PostgreSQL database), with their own URL and keys.

How to implement:

A "master" Supabase project stores org registry + which Supabase project URL to use
On login, the system looks up the user's org and connects to their org's Supabase project
All their data (profiles, results, conversations) lives in that isolated database
Benefits:

True data isolation — one org can never see another's data even if RLS fails
Each org can be in a different geographic region (compliance)
Orgs can be given read access to their own Supabase project
Easier to terminate/export one org's data
Tradeoffs:

Significantly more complex to manage
Schema migrations must be run on every org's project
Not worth it unless you have 3+ large enterprise clients with compliance requirements
C6. Option E — Usage Dashboard for Admins
Build a dedicated /admin/usage page:

Features to build:

Date range selector (last 7 days, last 30 days, custom range)
By Organisation: table showing org name, total tokens, estimated cost, active users
By User: drill down into an org to see per-user token consumption
By Model: breakdown of which LLMs are being used and at what cost
By Topic/Standard: which IPSAS standards are being asked about most
Time series chart: daily token usage over the selected period
This is built on top of either the advisor_usage_log table (Option B) or by querying advisor_messages joined with profiles/organisations directly.

C7. Option F — Per-Group Scoring Sheet Reports
Currently the results report is a flat list. Improve it to:

Add subgroup filter to /admin/results — dropdown to show only a specific department
Group summary view — one row per subgroup showing: number of members, modules completed, average score, pass rate
Individual scorecard — printable/downloadable PDF per user showing all their module scores, pathway, and certification status
Scheduled email reports — weekly or monthly CSV emailed to org_admin (requires implementing an email service such as Resend — not yet set up)
SQL for group summary:

SELECT
  s.name AS subgroup,
  COUNT(DISTINCT p.user_id) AS members,
  COUNT(ar.id) AS total_attempts,
  ROUND(AVG(ar.score), 1) AS avg_score,
  ROUND(100.0 * COUNT(CASE WHEN ar.passed THEN 1 END) / COUNT(ar.id), 1) AS pass_rate_pct
FROM org_subgroups s
JOIN profiles p ON p.subgroup_id = s.id
LEFT JOIN assessment_results ar ON ar.user_id = p.id
WHERE s.org_id = '<your-org-uuid>'
GROUP BY s.id, s.name
ORDER BY s.name;

C8. Option G — Audit Log
For compliance and support, add an immutable audit log of all admin actions:

CREATE TABLE admin_audit_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  admin_id   UUID REFERENCES profiles(id),
  action     TEXT,  -- 'approve_user', 'suspend_user', 'create_org', etc.
  target_id  UUID,  -- ID of the user/org/subgroup acted on
  target_type TEXT, -- 'user', 'org', 'subgroup'
  details    JSONB  -- extra context (old values, new values, reason)
);

Every Server Action in admin/actions.ts writes a row here. This gives you a full history of who approved whom, when, and who made changes.

C9. File Upload Policy — Accepted Formats

Current policy (v1): PDF and JPEG/PNG only.

This keeps the attack surface minimal and avoids the security risks of macro-enabled Office formats. Every official IPSAS document is published as PDF, and users can save-as-PDF from any application, so there is no functional loss.

Accepted formats:
- PDF (.pdf) — reference documents, standards, reports
- JPEG (.jpg/.jpeg) and PNG (.png) — screenshots, scanned evidence, trial balance snapshots

Not accepted (v1): Excel (.xlsx/.xls), Word (.docx/.doc), or any other Office format.

Future expansion — accepting Word and Excel (reference notes for later):

If the platform becomes commercially successful and clients request Office format uploads, the following approach is recommended:

1. Accept .xlsx and .docx only (modern XML-based formats). Never accept .xls or .doc (legacy binary formats with unrestricted macro execution).

2. Strip macros on upload. Use a server-side library (e.g., `xlsx` for spreadsheets, `mammoth` or `docx` for Word) to parse the file, extract the data/text content, and discard all macros, VBA, embedded OLE objects, and external data connections. Never store or serve back the original uploaded file — store only the extracted content.

3. Validate and sandbox. Enforce a maximum file size (e.g., 10 MB), check the file's magic bytes match the claimed extension (prevent disguised files), and process uploads in an isolated server action — never on the client.

4. Virus/malware scanning. If accepting Office files at scale, add a scanning step (e.g., ClamAV or a cloud scanning API) before any processing.

5. Dependencies to evaluate at that time:
   - `xlsx` (npm) — parses .xlsx server-side, extracts cell data as JSON
   - `mammoth` (npm) — converts .docx to clean HTML/text, strips macros
   - Both have had occasional CVEs — pin versions and audit before deploying

6. Never serve uploaded Office files back to other users without sanitisation. If users need to download a file another user uploaded, convert it to PDF first.

The key principle: the more file types you accept, the more attack surface you expose. Expand only when there is a clear commercial need, and always extract-and-discard rather than store-and-serve.

C10. Recommended Implementation Priority
Priority	Feature	Effort	Impact
1	Dedicated usage log table (advisor_usage_log)	Low	High — enables aggregated reporting and billing (basic tracking already exists in advisor_messages)
2	Configurable per-user daily token quota	Low	Medium — the 100k hardcoded limit already works; this makes it flexible
3	/admin/usage dashboard	Medium	High — visibility for billing
4	Subgroup filter on results report	Low	Medium — immediate admin value
5	Per-org OpenRouter API keys	Medium	High — enables per-client billing
6	Group summary scorecard report	Medium	Medium — good for client reporting
7	Admin UI for granting admin roles	Low	Medium — removes need for SQL access
8	"Reinstate" button for suspended users	Low	Low — convenience
9	Pathway/ability level editor for users	Medium	Medium — fixes onboarding mistakes
10	Audit log	Medium	High for compliance
11	Scheduled email reports (requires email service setup)	Medium	Medium — client satisfaction
12	Per-org Supabase isolation	High	High only for enterprise/compliance
C11. Summary Recommendation
For the near term, implement Options B + C + E:

Add advisor_usage_log — zero UI work needed, just write to it from existing server actions alongside the existing advisor_messages token tracking. This immediately gives you denormalised data optimised for reporting.
Make the existing per-user daily token limit configurable (it currently works but is hardcoded at 100k).
Build the usage dashboard once you have 2+ weeks of data to display.
When a second major organisation onboards, create a dedicated OpenRouter key for them and store it in their org record. This is the most practical way to track per-org AI spend without a full billing system.
The per-org OpenRouter key approach is operationally simple, requires no new infrastructure, and gives you clean separation of AI costs per client — which is exactly what you need if you are going to invoice organisations for their platform usage.

End of Report
IPSAS Advisor Administration Guide — April 2026
Pavitt Public Finance Solutions
