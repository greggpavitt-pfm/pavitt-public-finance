-- =============================================================================
-- Migration: Practitioner RAG Cache — Supplementary Resources
-- IPSAS Practitioner Advisor — pre-computed knowledge packets
--
-- Run this in the Supabase SQL Editor AFTER migration-rag-cache.sql.
--
-- What this adds:
--   Pre-computed topic_cluster entries for the broader PFM and government
--   accounting documents in Documentation/Supplementary_Resources/.
--   These cover practitioner context beyond individual IPSAS standards:
--   reform sequencing, capacity building, internal audit, fiscal transparency,
--   PEFA performance assessment, fraud detection, and PFM in fragile states.
--
-- Sources processed:
--   Cash to Accruals.pdf (ICAEW toolkit)
--   Stepping stones on Transition from cash to accrual.pdf (IPSASB/CIPFA 2011)
--   Migration from cash accounting to accrual.docx (Zimbabwe case study)
--   PFM Reform in Developing Countries.pdf (World Bank post-conflict synthesis)
--   Fragile states - Managing Public Finance and Procurement.pdf (WDR 2011)
--   Public_Financial_Management_Reform_in_Less developed countries 2016.pdf
--   Seven Success Mantras for PFM Reforms.docx (PEFA Secretariat 2025)
--   Reforming PFM in Africa.docx (Harvard/Peterson 2010)
--   Acctg reform and development in Africa in local govt.docx (Lassou & Hopper)
--   Government_accounting_in_Ghana_and_Benin.docx (Lassou & Hopper)
--   Diffusion_of_Public_Sector_Accounting_Reform in Developing Countries.docx
--   GOVERNMENT_ACCOUNTING_STANDARDS_AND_POLI.pdf (Chan & Zhang handbook chapter)
--   Accrual_Accounting_in_the_Government_Sec.pdf (ICGFM Public Fund Digest 2003)
--   Global Internal Audit Standards 2024.pdf (IIA)
--   Internal Audit Capability Model IA-CM.pdf (IIA Research 2009)
--   Internal_auditing_in_the_public_sector_P.pdf (ICGFM)
--   Audit framework.pdf (SAI Performance Measurement Framework)
--   state-of-the-field-review-fiscal-transparency-and-accountability-2018.pdf
--   IFAC-CIPFA-IPSASB-International-Public-Sector-Accountability-Index-2025.txt
--   PEFA Report_Global Trends in PFM Performance.pdf
--   200225 PEFA Handbook Vol II.pdf
--   Finding-Fraud-GovTech-and-Fraud-Detection-in-Public-Administration.pdf
--   Public Expenditure Tracking Systems (PETS).pdf
--   Costing Corruption and Efficiency Losses from Weak PFM Systems.pdf
--   Building_up_Fiscally_Strong_Local_Govern.pdf
--   Fiscal_Decentralization_and_Government_S.pdf
--   IMF Public Financial Management.pdf (Allen, Hemming, Potter handbook)
--   Accrual_Accounting_in_the_Government_Sec.pdf (ICGFM)
--   Many-Govts-Claim-to-Use-Accrual-Do-Not.md (already in skill references)
--   Flynn-Moretti-Cavanagh-2016-Implementing-Accrual-Accounting.md (skill refs)
-- =============================================================================


-- ============================================================================
-- 1. CASH-TO-ACCRUAL TRANSITION — PRACTICAL IMPLEMENTATION GUIDANCE
-- ============================================================================
-- Sources: ICAEW Cash to Accruals toolkit; IPSASB/CIPFA Stepping Stones 2011;
--          Zimbabwe IPSAS migration plan (case study)
-- ============================================================================

INSERT INTO rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, generation_query
) VALUES (
  'topic-cash-to-accrual-transition-practical',
  'Cash-to-Accrual Transition: Practical Implementation Guidance',
  'topic_cluster',
  ARRAY['IPSAS-33', 'IPSAS-1', 'IPSAS-2', 'IPSAS-17', 'IPSAS-19'],
  'both',

  '[
    {
      "text": "The Stepping Stones guidance organises the transition around a series of Milestones, each building on the prior. Milestone 0: Mobilisation — establish project management, timeframe, and governance. Milestone 1: Assess the Operations — document every transaction type the entity has, map data sources, and identify liability types (creditors, loans, leases, advance receipts, accrued expenses, provisions). Milestone 2: Decide which transactions to transition and in what order. Milestone 3: Identify and quantify balances for the opening Statement of Financial Position. The staged approach uses a hybrid year (Year 0) where accrual accounting commences for all transactions, followed by full accrual in Year 1.",
      "source": "Stepping-Stones-Cash-to-Accrual-2011",
      "score": 1.0
    },
    {
      "text": "The ICAEW Cash to Accruals toolkit identifies transition as a major change management project requiring coordination across government departments. Key steps: (1) make the decision to move; (2) establish governance and project management; (3) document current systems and transaction types; (4) plan the chart of accounts; (5) train staff; (6) run parallel systems for at least one year; (7) prepare the opening Statement of Financial Position. The toolkit emphasises that the process delivers enormous benefits in transparency and accountability, but governments consistently underestimate the time and resources required.",
      "source": "ICAEW-Cash-to-Accruals-Toolkit",
      "score": 1.0
    },
    {
      "text": "Zimbabwe IPSAS migration plan (2021): The Government of Zimbabwe launched an IPSAS implementation plan targeting completion by 2025. Pilot ministries: Finance and Economic Development; Local Government, Public Works and National Housing; Information. Two commissions, two parastatals and eight local authorities were identified for pilot projects. Identified challenges: resistance from employees and management; IT systems not supporting accrual; knowledge and skills gaps requiring training; insufficient political support; inadequate legal framework. The plan required moving away from cash basis (recording only receipts and expenditures) to accrual (recording revenues as earned, expenditures as incurred).",
      "source": "Zimbabwe-IPSAS-Migration-Plan",
      "score": 1.0
    },
    {
      "text": "Characteristics comparison — cash vs accrual accounting: Under cash accounting, only one main statement is prepared (Statement of Receipts and Payments). Under accrual, three main statements are required: Statement of Financial Performance, Statement of Financial Position, and Statement of Cash Flows. The Statement of Financial Position includes: Assets (items of value owned or controlled plus amounts receivable); Liabilities (amounts payable plus obligations requiring settlement); Equity (accumulated reserves). A key liability recognition difference: under cash accounting, payables are recorded when paid; under accrual, the liability is recognised when the obligation arises, creating a creditor balance before cash outflow.",
      "source": "Stepping-Stones-Cash-to-Accrual-2011",
      "score": 1.0
    },
    {
      "text": "IPSAS 33 First-Time Adoption of Accrual Basis IPSAS provides transitional relief periods that allow first-time adopters to phase in recognition of specific asset and liability classes. The standard defines the date of IPSAS adoption as the start of the reporting period in which the entity presents its first transitional or first full IPSAS financial statements. Common transition reliefs include deferral of PPE recognition (up to 5 years), deferral of defined benefit plan recognition, and modified comparative information requirements. Entities should always confirm which reliefs they are using, as these affect what appears in the opening Statement of Financial Position.",
      "source": "IPSAS-33-Transition-Context",
      "score": 0.9
    }
  ]'::jsonb,

  'Transitioning from cash to accrual accounting is one of the most significant change management undertakings a government can attempt. Practical implementation guidance from the IPSASB/CIPFA Stepping Stones document, the ICAEW Cash to Accruals toolkit, and country case studies (Zimbabwe, Ethiopia, Philippines) converges on several consistent lessons.

The transition is not primarily a technical accounting exercise — it is a project management challenge that requires governance structures, political commitment, multi-year planning, and staff training well before any accounting entries change.

The Stepping Stones framework organises the transition around sequential Milestones: (0) Mobilisation — establish project governance and a realistic multi-year timeframe (typically five years); (1) Assess the Operations — document every transaction type the entity undertakes, map the data sources that will feed accrual entries, and identify all liability types including creditors, loans, leases, advance receipts, accrued expenses, and provisions; (2) Decide which functions to transition and in what sequence; (3) Identify and quantify all balances needed for the opening Statement of Financial Position; then execute through a hybrid accounting year before reaching full accrual.

The opening Statement of Financial Position is a critical gate. It requires valuing all assets (particularly property, plant and equipment, which many entities have never systematically valued) and recognising all liabilities. This single task typically takes longer than expected and is the most common cause of transition delays.

IPSAS 33 (First-Time Adoption) provides transitional reliefs that allow specific asset and liability classes to be phased in over periods of up to five years. Practitioners should confirm which reliefs their entity is applying, as these determine what appears in opening balances and what disclosure is required.

Under accrual accounting, three main financial statements replace the single Statement of Receipts and Payments used under cash accounting: a Statement of Financial Performance (revenues and expenses), a Statement of Financial Position (assets, liabilities, and equity), and a Statement of Cash Flows. The cash flow statement is required under IPSAS 2 regardless of reporting basis, making it a useful bridge document during hybrid accounting years.

Common transition failure modes: underestimating the data collection burden for opening balances; attempting to transition all transaction types simultaneously rather than in phases; neglecting commitment accounting systems (purchase orders must be embedded for payables recognition to work); IT systems that cannot support accrual-basis posting rules; and insufficient training of finance staff at ministry and agency level.

The Zimbabwe pilot experience highlights a pattern seen across developing countries: IPSAS adoption requires explicit political commitment at cabinet level, a legal framework update to authorise accrual-based reporting, and targeted capacity building that reaches line ministries, not just the ministry of finance.',

  ARRAY['cash to accrual', 'accrual transition', 'IPSAS 33', 'first-time adoption', 'opening balance', 'Statement of Financial Position', 'hybrid accounting', 'Stepping Stones', 'transition milestones', 'commitment accounting', 'purchase orders', 'PPE recognition', 'transition timeline', 'five year plan', 'opening statement', 'accrual reform', 'change management', 'project management', 'transition planning', 'cash basis to accrual'],

  'current',
  5,
  '{"query_text": "cash to accrual transition practical implementation", "n_results": 10, "filter": {"topic": "transition"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;


-- ============================================================================
-- 2. PFM REFORM IN DEVELOPING COUNTRIES — POST-CONFLICT AND FRAGILE STATES
-- ============================================================================
-- Sources: World Bank PFM Reform Post-Conflict Countries (synthesis report);
--          WDR 2011 Background Paper — Managing PFM in Fragile Settings
--          (Porter, Andrews, Turkewitz, Wescott)
-- ============================================================================

INSERT INTO rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, generation_query
) VALUES (
  'topic-pfm-reform-post-conflict-fragile-states',
  'PFM Reform in Post-Conflict and Fragile States',
  'topic_cluster',
  ARRAY['IPSAS-33', 'C4'],
  'both',

  '[
    {
      "text": "World Bank synthesis of PFM reforms in post-conflict countries: Three key drivers of reform success: (1) strong domestic political commitment — reforms led by local champions rather than externally imposed tend to sustain better; (2) appropriate reform sequencing — basic controls (budget execution, cash management, payroll) must be established before more complex reforms like IPSAS adoption; (3) donor coordination — fragmented, competing donor PFM requirements impose dual systems on governments with very limited capacity. The most common PFM reform failures in post-conflict settings involve attempting reforms before the institutional preconditions exist.",
      "source": "World-Bank-PFM-Reform-Post-Conflict",
      "score": 1.0
    },
    {
      "text": "Managing Public Finance in Fragile and Conflicted Settings (Porter et al., WDR 2011): In fragile states, formal PFM systems often coexist with informal power structures that control actual resource flows. Donors frequently fund parallel procurement and financial management systems outside the government PFM framework, weakening rather than strengthening formal systems. Key finding: legitimacy of the PFM system matters as much as its technical quality. Systems imposed without political buy-in create compliance without capability. Reform must engage with informal power structures, not just formal institutions.",
      "source": "WDR2011-Fragile-States-PFM",
      "score": 1.0
    },
    {
      "text": "PFM reform sequencing in post-conflict contexts: Start with fiscal control (can government actually control what it spends?), then budget credibility (does spending match the approved budget?), then reporting quality (are accounts produced on time and are they accurate?), then accounting basis reform (moving from cash to accrual). The World Bank synthesis found that many donors pushed IPSAS or accrual adoption at Stage 2 or 3 when the entity was still working on Stage 1 fundamentals. This mismatched sequencing is a major cause of failed accounting reforms.",
      "source": "World-Bank-PFM-Reform-Post-Conflict",
      "score": 1.0
    },
    {
      "text": "Fragile states PFM — key operational challenges: (1) Payroll control: payroll is typically 40-60% of recurrent expenditure; ghost worker fraud is endemic; basic payroll audits and biometric verification often deliver more value than sophisticated accounting reforms. (2) Procurement integrity: informal procurement is the norm; parallel donor procurement systems undermine the development of national capacity. (3) Cash management: Treasury Single Account is often absent; sub-accounts proliferate; government does not know its actual cash position. These basics must work before IPSAS implementation is meaningful.",
      "source": "WDR2011-Fragile-States-PFM",
      "score": 1.0
    }
  ]'::jsonb,

  'Public financial management reform in post-conflict and fragile states presents fundamentally different challenges from reform in stable developing countries. The World Bank synthesis report on PFM reforms in post-conflict countries and the World Development Report 2011 background paper by Porter, Andrews, Turkewitz, and Wescott provide the most comprehensive evidence base on what works and what fails.

The core finding is that sequencing matters more than technical quality. Attempting accrual accounting, IPSAS adoption, or complex financial reporting reforms before basic fiscal controls are functional almost always fails. The reform sequence that consistently succeeds starts with (1) payroll integrity — identifying and removing ghost workers, establishing biometric payroll verification; (2) cash management — establishing a Treasury Single Account or equivalent so government knows its actual cash position; (3) budget execution controls — ensuring spending stays within authorised limits; (4) timely and accurate cash-basis reporting; and only then (5) accounting basis reforms including IPSAS adoption.

Political commitment is the single most important variable. Reforms driven by domestic champions who understand their institutional context succeed at higher rates than reforms imposed by donors or designed by external consultants without local ownership. This does not mean external support is unhelpful — it means external support must reinforce local leadership, not substitute for it.

Donor fragmentation is a significant problem in fragile states. Multiple donors with competing reporting requirements create parallel accounting and reporting systems that impose enormous burdens on governments with very limited finance staff. Every parallel system diverts capacity from building the national PFM system. Donor coordination and alignment with country systems is not just a principle — it is a precondition for sustainable reform.

In fragile and conflict-affected states, formal PFM systems often coexist with informal power structures that control actual resource flows. Technical reform of formal systems without engaging informal structures produces compliance without capability — systems that look correct on paper but do not function in practice. Effective reform requires understanding and working with political economy realities, not ignoring them.

IPSAS adoption in fragile state contexts: the Cash Basis IPSAS (Part 1 requirements) is the appropriate standard for most post-conflict and fragile state contexts. It provides a credible, internationally recognised framework for cash reporting that is achievable within limited capacity. Attempting accrual IPSAS before the cash basis is fully operational is almost always counterproductive.

For Solomon Islands context: the evidence from post-conflict and small island state settings consistently shows that basic controls, timely reporting, and parliamentary oversight matter more than accounting basis sophistication in the early stages of reform.',

  ARRAY['fragile states', 'post-conflict', 'PFM reform', 'reform sequencing', 'donor coordination', 'political commitment', 'capacity building', 'ghost workers', 'payroll control', 'Treasury Single Account', 'cash management', 'budget execution', 'parallel systems', 'informal power', 'institutional reform', 'World Bank', 'development', 'PFM basics', 'fiscal control', 'reform failure'],

  'current',
  4,
  '{"query_text": "PFM reform fragile states post-conflict sequencing", "n_results": 10, "filter": {"topic": "pfm-reform"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;


-- ============================================================================
-- 3. PFM REFORM — DEVELOPING COUNTRIES AND AFRICA
-- ============================================================================
-- Sources: Peterson (Harvard, 2010) Reforming PFM in Africa;
--          Lassou & Hopper — Ghana and Benin government accounting;
--          Public_Financial_Management_Reform_in_Less developed countries 2016
--          Seven Success Mantras for PFM Reforms (PEFA Secretariat 2025)
-- ============================================================================

INSERT INTO rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, generation_query
) VALUES (
  'topic-pfm-reform-africa-developing-countries',
  'PFM Reform in Africa and Developing Countries: Lessons from Practice',
  'topic_cluster',
  ARRAY['IPSAS-33', 'C4'],
  'both',

  '[
    {
      "text": "Peterson (Harvard Kennedy School, 2010) — Reforming PFM in Africa: Ethiopia reformed its PFM to international standards over twelve years and now has the third best PFM system in Africa, managing the largest aid flows on the continent. Key success factors: long time horizon (12 years), consistent domestic leadership, systematic capacity building through the civil service, and willingness to adapt international models to local context rather than importing them wholesale. Ethiopia''s experience shows that sustainable reform requires building local technical capacity, not dependence on external consultants.",
      "source": "Peterson-Reforming-PFM-Africa-Harvard-2010",
      "score": 1.0
    },
    {
      "text": "Lassou & Hopper — Government accounting in Ghana and Benin: Development of accounting in both countries follows a similar path consistent with colonial legacy models. Reforms are frequently externally driven and progress is hindered by indigenous neopatrimonial leadership, corruption, and over-reliance on foreign consultants. In both countries, former colonial powers (Britain and France) still influence accounting — France directly, Britain more indirectly. Good governance aims of increasing civil service capacity, financial transparency, and civil society involvement remain problematic, especially in Benin. Key finding: accounting reforms imposed from outside without addressing underlying political economy tend to produce formal compliance without substantive change.",
      "source": "Lassou-Hopper-Ghana-Benin-Accounting",
      "score": 1.0
    },
    {
      "text": "Seven Success Mantras for PFM Reforms (PEFA Secretariat, Blasco & Gurazada, 2025): (1) PEFA scores should not be the only determinant of reform decisions — PEFA measures quantifiable aspects but may not capture every PFM nuance; (2) Use PEFA dimensions rather than indicators for monitoring — reforms happen at the dimension level; (3) Build on signals of success — quick wins demonstrate results and build momentum; (4) Sequencing matters — attempt reforms that are appropriate for the country''s current PFM maturity; (5) Strengthen local ownership; (6) Ensure political commitment at the highest level; (7) Plan for sustainability beyond the reform project period.",
      "source": "PEFA-Seven-Success-Mantras-2025",
      "score": 1.0
    },
    {
      "text": "PFM Reform in Less Developed Countries (Ouda, 2016): Public sector accounting reform is defined as the shift from a less informative accounting system (cash-based) to a more informative system (accrual-based). Reform prerequisites in less developed countries include: (1) adequate information technology infrastructure; (2) trained accountants with professional qualifications; (3) a legal and regulatory framework permitting accrual reporting; (4) political will at senior levels; (5) sufficient financial resources to sustain reform over 5-10 years. Without all five prerequisites, reforms stall at the formal adoption stage — governments issue accrual standards but continue preparing cash-basis accounts in practice.",
      "source": "Ouda-PFM-Reform-Less-Developed-Countries-2016",
      "score": 1.0
    }
  ]'::jsonb,

  'PFM reform in Africa and developing countries presents persistent challenges that go beyond technical accounting issues. The evidence base — drawn from Harvard''s Kennedy School, World Bank research, and academic studies of Ghana, Benin, Ethiopia, Nepal, Sri Lanka, and Egypt — converges on several consistent findings.

Reform sustainability requires domestic ownership. Ethiopia''s twelve-year transformation of its PFM system is the clearest African success story: led by domestic champions, adapted to local context, and built around sustained civil service capacity development rather than dependence on external consultants. The contrast with countries like Benin, where externally driven reforms produced formal compliance without substantive change, is instructive.

Political economy matters as much as technical design. In many African countries, neopatrimonial governance structures mean that formal accounting reforms coexist with informal resource flows that bypass official systems. Accounting reform that ignores these dynamics creates technically correct systems that do not reflect actual government finances. This does not make reform futile — it means reform must engage with political realities and identify local champions who can build legitimacy for formal systems.

Colonial legacy shapes accounting frameworks. In Anglophone Africa (Ghana, Kenya, Solomon Islands), British accounting traditions and common law frameworks create a different starting point from Francophone Africa (Benin, Senegal) where French administrative traditions dominate. Reform strategies must account for these institutional foundations rather than importing uniform international templates.

PEFA assessment as a reform tool: The PEFA framework provides objective measurement of PFM performance across 31 performance indicators. The PEFA Secretariat''s Seven Success Mantras (2025) warn against simplistic conversion of PEFA scores into reform actions. Reforms should be prioritised at the dimension level (the basic measurement unit), build on existing strengths rather than trying to fix everything simultaneously, and sequence appropriately for the country''s current maturity.

Prerequisites for less developed countries before IPSAS adoption: (1) IT infrastructure capable of supporting accrual-basis posting; (2) professionally trained accountants (at least at the central treasury level); (3) updated legal framework authorising accrual reporting; (4) multi-year political commitment; (5) funding for the full reform period (typically 7-10 years). Countries that attempt IPSAS adoption before these prerequisites exist consistently produce accrual-format statements compiled on a cash basis — the form without the substance.',

  ARRAY['Africa PFM reform', 'Ethiopia', 'Ghana', 'Benin', 'neopatrimonialism', 'colonial legacy', 'domestic ownership', 'capacity building', 'PEFA', 'PFM sequencing', 'political economy', 'seven success mantras', 'less developed countries', 'developing countries', 'PFM prerequisites', 'accrual prerequisites', 'civil service capacity', 'external consultants', 'sustainability', 'reform failure', 'local ownership'],

  'current',
  4,
  '{"query_text": "PFM reform developing countries Africa lessons capacity", "n_results": 10, "filter": {"topic": "pfm-reform"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;


-- ============================================================================
-- 4. GOVERNMENT ACCOUNTING STANDARDS — POLICY AND INTERNATIONAL DIFFUSION
-- ============================================================================
-- Sources: Chan & Zhang (handbook chapter on govt accounting standards);
--          Diffusion of Public Sector Accounting Reform (Kuruppu et al.)
--          ICGFM Public Fund Digest Vol III No.2 2003
-- ============================================================================

INSERT INTO rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, generation_query
) VALUES (
  'topic-government-accounting-standards-policy',
  'Government Accounting Standards: Policy, Scope, and International Diffusion',
  'topic_cluster',
  ARRAY['IPSAS-1', 'IPSAS-33', 'C4'],
  'both',

  '[
    {
      "text": "Chan & Zhang (PFM Handbook chapter): A complete government accounting system has three subsystems: (1) budget accounting — tracks authorised spending at each stage of the spending process; (2) financial accounting — recognises and measures the financial consequences of actual transactions and events; (3) cost accounting — determines the cost of producing public services. Government accounting exists at the intersection of government budgeting and business accounting, and experiences tensions between these disciplines, particularly regarding accounting standards. Financial accounting, imported from the private sector, is not deferential to budget rules, creating potential for misunderstanding.",
      "source": "Chan-Zhang-Govt-Accounting-Standards",
      "score": 1.0
    },
    {
      "text": "Chan & Zhang — IPSAS as international standard: IPSASs have become influential as an exemplar of accrual accounting for government. The chapter concludes that accrual accounting is a necessary feature of a credit economy whether in the private or public sector, but requires certain preconditions: (1) an economy with significant credit transactions (loans, leases, trade credit); (2) a government with material non-cash assets and liabilities; (3) a professional accounting corps capable of exercising judgment; (4) independent standard-setting institutions with credibility. Developing countries that adopt IPSAS without these preconditions produce accrual-format statements of limited informational value.",
      "source": "Chan-Zhang-Govt-Accounting-Standards",
      "score": 1.0
    },
    {
      "text": "Diffusion of public sector accounting reforms (Kuruppu, Ouda, Adhikari, Ambalangodage — Nepal, Sri Lanka, Egypt): Drawing on Rogers diffusion theory, the study found that involvement of professionals considered alien to the government sector (e.g. private sector accountants without public sector experience) can delay adoption of accrual accounting. Both native professionals and international consultants argue for accrual accounting instead of promoting locally-developed accounting practices. International financial institution pressure (World Bank, IMF) drives accounting reform in LDCs at the expense of locally-developed solutions, sometimes creating professional rifts and grievances.",
      "source": "Kuruppu-Diffusion-Accounting-Reform",
      "score": 1.0
    },
    {
      "text": "ICGFM disciplines of governmental financial management: accounting, auditing, budgeting, debt administration, information technology, tax administration and treasury management. These seven disciplines are interdependent — effective government financial management requires competence across all of them. IPSAS addresses the accounting and reporting component; PEFA measures performance across the full budget cycle including planning, execution, accounting, and audit. Practitioners should understand where IPSAS fits within this broader framework rather than treating accounting reform in isolation.",
      "source": "ICGFM-Public-Fund-Digest",
      "score": 1.0
    }
  ]'::jsonb,

  'Government accounting operates at the intersection of budget accounting and financial accounting — two disciplines with different origins, objectives, and logic. Understanding this tension is essential for practitioners implementing IPSAS reforms.

Budget accounting tracks authorised spending at each stage of the spending cycle: appropriation, commitment, obligation, and payment. It is governed primarily by legislation and serves parliamentary accountability purposes. Financial accounting, derived from private sector practice, recognises and measures the economic consequences of transactions regardless of budget status. IPSAS is primarily a financial accounting framework. When financial accounting standards (IPSAS) are introduced into a budget-dominated accounting system, conflicts arise — particularly around recognition timing, asset valuation, and the treatment of non-cash transactions.

The Chan & Zhang analysis in the IMF/World Bank Public Financial Management Handbook identifies a tripartite government accounting system: budget accounting (expenditure control), financial accounting (economic measurement), and cost accounting (service delivery costs). IPSAS deals with the financial accounting component. Effective IPSAS implementation requires that budget accounting and financial accounting systems be harmonised, not maintained as separate silos.

International diffusion of accounting standards in developing countries follows a pattern documented across Nepal, Sri Lanka, Egypt, Ghana, Benin, and Ethiopia. Institutional pressure from the World Bank and IMF is the primary driver of accounting reform in low-income countries. This creates a risk identified in diffusion theory: reforms imposed through external institutional pressure without local professional ownership tend to produce formal adoption without substantive implementation. The form (accrual-format financial statements) is adopted while the substance (underlying accrual data systems and professional judgment) is not.

IPSAS has become the de facto international exemplar for government accrual accounting. As at 2024, 35 of the 53 jurisdictions reporting on accrual use IPSAS in some form. But the standards themselves acknowledge that accrual accounting requires significant judgment capability — exactly what is scarce in capacity-constrained environments. The prerequisite analysis by Chan & Zhang is demanding: credit-economy transactions, material non-cash assets and liabilities, a professional accounting corps, and credible standard-setting institutions.

For practitioners, the key implication is that IPSAS implementation is not primarily a standards compliance exercise — it is an institutional development exercise that happens to use accounting standards as a framework.',

  ARRAY['government accounting', 'accounting standards', 'IPSAS diffusion', 'budget accounting', 'financial accounting', 'cost accounting', 'standard setting', 'institutional pressure', 'World Bank', 'IMF', 'accrual adoption', 'accounting reform', 'international standards', 'less developed countries', 'Nepal', 'Sri Lanka', 'Egypt', 'Chan Zhang', 'Rogers diffusion', 'professional capacity'],

  'current',
  4,
  '{"query_text": "government accounting standards policy IPSAS diffusion adoption", "n_results": 10, "filter": {"topic": "standards-policy"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;


-- ============================================================================
-- 5. INTERNAL AUDIT IN THE PUBLIC SECTOR
-- ============================================================================
-- Sources: IIA Global Internal Audit Standards 2024;
--          IIA Internal Audit Capability Model (IA-CM) for Public Sector 2009;
--          SAI Performance Measurement Framework (Audit framework.pdf)
-- ============================================================================

INSERT INTO rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, generation_query
) VALUES (
  'topic-internal-audit-public-sector',
  'Internal Audit in the Public Sector: Standards, Capability, and Practice',
  'topic_cluster',
  ARRAY['IPSAS-1'],
  'both',

  '[
    {
      "text": "IIA Global Internal Audit Standards 2024 — Five Domains: Domain I Purpose of Internal Auditing; Domain II Ethics and Professionalism (Integrity, Objectivity, Legal and Ethical Behaviour, Competency, Due Professional Care, Commitment to Learning); Domain III Proficiency and Due Professional Care; Domain IV Quality Assurance and Improvement Programme; Domain V Governing the Internal Audit Function (Independence, Authority, Organisational Positioning, Resources, Communication with Stakeholders). The Standards apply to both private and public sector internal audit functions and are mandatory for IIA members.",
      "source": "IIA-Global-Internal-Audit-Standards-2024",
      "score": 1.0
    },
    {
      "text": "IIA Internal Audit Capability Model (IA-CM) for the Public Sector — Five capability levels: Level 1 Initial (ad hoc, no sustainable processes); Level 2 Infrastructure (sustainable basic processes, basic professional practices); Level 3 Integrated (professional practices embedded, linked to risk and governance); Level 4 Managed (continuous improvement, measurement); Level 5 Optimising (strategic focus, driving organisational improvement). Most public sector internal audit functions in developing countries operate at Level 1 or early Level 2. The IA-CM is used by donors and governments to assess internal audit maturity and plan improvement programmes.",
      "source": "IIA-IA-CM-Public-Sector-2009",
      "score": 1.0
    },
    {
      "text": "SAI Performance Measurement Framework (SAI PMF): Supreme Audit Institutions are assessed on four domains: (A) Independence and Legal Framework — constitutional and legal basis for SAI independence, financial autonomy; (B) Internal Governance and Ethics — code of ethics, internal audit within the SAI, financial management; (C) Audit Quality and Reporting — audit planning, audit standards compliance, quality control, timeliness of reports; (D) Financial Management, Assets and Support Services. The SAI PMF is the primary tool for assessing national audit office capacity, used by INTOSAI, donors, and governments.",
      "source": "SAI-PMF-Audit-Framework-2016",
      "score": 1.0
    },
    {
      "text": "Internal audit function in public sector — relationship to financial reporting: Internal audit does not produce financial statements. Its role is to provide independent assurance to management and the governing body that risk management, control, and governance processes are adequate and effective. Under IPSAS, internal audit supports financial statement reliability by testing the internal controls over financial reporting. Key internal audit work relevant to IPSAS compliance: testing completeness of asset registers (IPSAS 17 PPE), testing revenue recognition controls (IPSAS 23 or IPSAS 47), testing payables cutoff (for accrual completeness), and testing that accounting policies are consistently applied (IPSAS 3).",
      "source": "IIA-Standards-IPSAS-Interface",
      "score": 0.9
    }
  ]'::jsonb,

  'Internal audit in the public sector operates within a dual framework of professional standards (the IIA''s Global Internal Audit Standards) and government-specific capability models (the IA-CM for the Public Sector). Understanding both layers is important for practitioners involved in PFM reform, as internal audit is a key governance component alongside financial reporting.

The IIA Global Internal Audit Standards (2024 edition, replacing the 2017 standards) organise internal audit across five domains covering purpose, ethics, proficiency, quality assurance, and governance of the function. The standards are principles-based and apply globally to both private and public sector audit functions. The 2024 revision strengthened requirements around independence, organisational positioning, and communication with governing bodies — areas where public sector internal audit frequently has structural weaknesses.

The IIA''s Internal Audit Capability Model (IA-CM) provides a five-level maturity framework specifically designed for public sector audit functions. Most internal audit functions in developing countries operate at Level 1 (ad hoc, no sustainable processes) or early Level 2 (basic sustainable processes). Moving to Level 3 (integrated, risk-based) requires: a permanent internal audit charter; adequate staff with professional qualifications; risk-based audit planning; a quality assurance programme; and regular reporting to a senior governance body (audit committee or equivalent).

Supreme Audit Institutions (SAIs) — the national audit offices that audit government financial statements — are assessed separately using the SAI Performance Measurement Framework (SAI PMF). The SAI PMF evaluates independence and legal framework, internal governance, audit quality and reporting, and financial management. SAI quality directly affects the reliability of published government financial statements under IPSAS, as external audit is the final check on statement accuracy.

Relationship to IPSAS compliance: internal audit supports financial statement reliability through controls testing. Key IPSAS-relevant work includes: testing asset register completeness and accuracy (IPSAS 17/IPSAS 45 PPE); testing revenue recognition and grant accounting controls (IPSAS 23 or IPSAS 47); testing payables and accrued expenses cutoff for accrual completeness; and verifying consistent application of accounting policies (IPSAS 3). In transitioning countries, internal audit often identifies gaps between stated and actual accounting basis that management reporting has not captured.',

  ARRAY['internal audit', 'IIA standards', 'IA-CM', 'capability model', 'SAI', 'supreme audit institution', 'SAI PMF', 'audit framework', 'INTOSAI', 'audit independence', 'audit quality', 'public sector audit', 'internal controls', 'risk-based audit', 'audit committee', 'governance', 'asset register', 'financial controls', 'audit capacity', 'developing countries audit'],

  'current',
  4,
  '{"query_text": "internal audit public sector standards capability framework", "n_results": 10, "filter": {"topic": "internal-audit"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;


-- ============================================================================
-- 6. FISCAL TRANSPARENCY AND ACCOUNTABILITY — STATE OF THE FIELD
-- ============================================================================
-- Sources: State-of-the-field review: Fiscal Transparency and Accountability
--          (Rudiger, IBP/Carnegie/TAI, 2018);
--          IFAC-CIPFA-IPSASB International Public Sector Financial
--          Accountability Index 2025 Status Report
-- ============================================================================

INSERT INTO rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, generation_query
) VALUES (
  'topic-fiscal-transparency-accountability',
  'Fiscal Transparency and Accountability: Global Trends and State of the Field',
  'topic_cluster',
  ARRAY['IPSAS-1', 'IPSAS-24', 'C4'],
  'both',

  '[
    {
      "text": "IFAC-CIPFA-IPSASB International Public Sector Financial Accountability Index 2025: 169 jurisdictions tracked. In 2024: 53 jurisdictions (31%) on accrual; 66 (39%) on partial accrual; 50 (30%) on cash. 35 of the 53 accrual jurisdictions (66%) use IPSAS in some form: 4 with no modifications, 12 modified for local context, 19 using IPSAS as reference for national standards. 2030 projection revised down from 120 to 95 accrual jurisdictions, primarily due to COVID-19 delays. In 2024, no low-income jurisdictions report on accrual.",
      "source": "IFAC-CIPFA-Accountability-Index-2025",
      "score": 1.0
    },
    {
      "text": "State of the Field Review — Fiscal Transparency and Accountability (Rudiger, 2018): This century has seen impressive increases in public access to fiscal information and civic engagement on budget issues. Norms of fiscal transparency have gained ground globally. However, transformation of public finance and tangible improvements in people''s lives have lagged behind the increase in information access. Key questions: Does more fiscal transparency actually lead to better fiscal outcomes? Under what conditions does civil society engagement on budgets produce accountability? The field is at a critical juncture with democratic backsliding threatening gains.",
      "source": "State-of-Field-Fiscal-Transparency-2018",
      "score": 1.0
    },
    {
      "text": "Fiscal transparency trends 2018: (1) Open data — governments increasingly publish machine-readable budget data; (2) Participatory budgeting — citizen participation in budget decisions has grown globally; (3) Budget monitoring — civil society organisations systematically track budget implementation against plans; (4) Parliamentary scrutiny — budget transparency requirements have strengthened through legal and constitutional reforms. Despite these gains, the accountability link — from disclosure to improved service delivery outcomes — remains weak. Information is necessary but not sufficient for accountability.",
      "source": "State-of-Field-Fiscal-Transparency-2018",
      "score": 1.0
    },
    {
      "text": "IPSAS and fiscal transparency: Financial statements prepared under IPSAS provide significantly more information than cash-basis accounts. Accrual IPSAS requires disclosure of: all assets including long-term infrastructure; all liabilities including contingent liabilities (IPSAS 19) and employee benefit obligations (IPSAS 25/39); budget vs actual comparisons (IPSAS 24); segment information (IPSAS 18); related party transactions (IPSAS 20). These disclosures allow citizens, legislators, and rating agencies to assess the true financial position of government — including off-balance-sheet risks and contingent liabilities not visible in cash accounts.",
      "source": "IPSAS-Fiscal-Transparency-Link",
      "score": 0.9
    }
  ]'::jsonb,

  'Fiscal transparency and accountability has expanded significantly since 2000. The IFAC-CIPFA-IPSASB International Public Sector Financial Accountability Index tracks accounting basis and framework adoption across 169 jurisdictions, providing the most comprehensive global benchmark on government financial reporting standards.

The 2025 Index shows 53 jurisdictions (31%) reporting on accrual, 66 (39%) on partial accrual, and 50 (30%) on cash. Of the 53 accrual jurisdictions, 66% use IPSAS in some form. The 2030 projection for accrual adoption has been revised down from 120 to 95 jurisdictions, primarily due to COVID-19-related reform delays. A significant finding: in 2024, no low-income jurisdictions report on accrual. Accrual adoption remains concentrated in high-income and upper-middle-income jurisdictions.

These statistics measure policy adoption, not functional implementation quality. The gap between stated accounting basis and actual practice is substantial — a concern documented across IMF, World Bank, and academic research. Governments can claim accrual while continuing to compile accounts on a cash basis with year-end accrual adjustments.

The fiscal transparency and accountability field has undergone its own evolution. The 2018 State of the Field Review (Rudiger, prepared for IBP/Carnegie/TAI) found that while access to fiscal information has increased dramatically, the accountability link from disclosure to improved fiscal outcomes and service delivery remains weak. Information is necessary but not sufficient for accountability — the institutional capacity to use information (parliament, civil society, media, and courts) must also function.

IPSAS strengthens fiscal transparency through mandatory disclosures not required under cash accounting: the full asset base including infrastructure (IPSAS 17/45), contingent liabilities (IPSAS 19), employee benefit obligations (IPSAS 25/39), budget vs actual comparisons (IPSAS 24), and segment reporting (IPSAS 18). These disclosures allow meaningful assessment of government''s true financial position beyond the narrow cash position.

For developing countries, the practical path to improved fiscal transparency often starts with (1) timely publication of in-year budget execution reports; (2) comprehensive coverage of all government entities in reporting; (3) independent audit of financial statements; and (4) parliamentary review. These steps deliver transparency gains under any accounting basis, before IPSAS adoption is required.',

  ARRAY['fiscal transparency', 'accountability', 'open data', 'participatory budgeting', 'budget monitoring', 'IPSAS transparency', 'accountability index', 'IFAC CIPFA', 'accrual adoption statistics', 'financial accountability', 'disclosure', 'citizen engagement', 'parliamentary scrutiny', 'civil society', 'budget information', 'IPSAS 24', 'budget comparison', 'financial reporting basis', 'global trends', 'open government'],

  'current',
  4,
  '{"query_text": "fiscal transparency accountability government financial reporting", "n_results": 10, "filter": {"topic": "transparency"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;


-- ============================================================================
-- 7. PEFA AND PFM PERFORMANCE MEASUREMENT
-- ============================================================================
-- Sources: PEFA Report: Global Trends in PFM Performance;
--          PEFA Handbook Vol II (Assessment Field Guide, December 2018);
--          Seven Success Mantras for PFM Reforms (PEFA Secretariat 2025)
-- ============================================================================

INSERT INTO rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, generation_query
) VALUES (
  'topic-pefa-pfm-performance-measurement',
  'PEFA Framework and PFM Performance Measurement',
  'topic_cluster',
  ARRAY['IPSAS-1', 'IPSAS-24', 'C4'],
  'both',

  '[
    {
      "text": "PEFA (Public Expenditure and Financial Accountability) Framework: 31 performance indicators across seven pillars: (I) Budget reliability — does spending match the approved budget?; (II) Transparency of public finances — is fiscal information publicly accessible?; (III) Management of assets and liabilities — are assets and liabilities effectively managed?; (IV) Policy-based fiscal strategy and budgeting — is the budget linked to policy?; (V) Predictability and control in budget execution — are controls effective?; (VI) Accounting and reporting — are financial reports produced timely and accurately?; (VII) External scrutiny and audit — is the audit function independent and effective?",
      "source": "PEFA-Framework",
      "score": 1.0
    },
    {
      "text": "PEFA Pillar VI — Accounting and Reporting: Indicators relevant to IPSAS practitioners: PI-25 (in-year budget reports — frequency and coverage of financial data), PI-26 (annual financial statements — completeness, timeliness, and standards compliance), PI-27 (financial data integrity — bank reconciliation, suspense accounts, advance accounts). PI-26 directly assesses whether annual financial statements are prepared using internationally recognised accounting standards, making it the most direct PEFA measure of IPSAS compliance. A score below C on PI-26 indicates material gaps in financial reporting quality.",
      "source": "PEFA-Handbook-Vol-II",
      "score": 1.0
    },
    {
      "text": "PEFA Seven Success Mantras (2025): PEFA scores should not be the only determinant of reform decisions — scores measure quantifiable aspects but may miss context. Use PEFA dimensions rather than indicators for reform monitoring — reform actions happen at the dimension level. Build on signals of success — quick wins build momentum. Consider political feasibility alongside technical priority. Ensure local ownership of reform plans. Plan for sustainability beyond the project period. Avoid the trap of designing reforms at PI (indicator) level when the actual work is at the dimension level within each PI.",
      "source": "PEFA-Seven-Success-Mantras-2025",
      "score": 1.0
    },
    {
      "text": "PEFA and IPSAS relationship: IPSAS adoption directly improves PEFA PI-26 scores, but the relationship is not mechanical. A government can adopt IPSAS formally while producing statements that score poorly on PI-26 if the statements are not produced within six months of year-end (timeliness requirement), are not audited, or lack required disclosures. Conversely, a government on cash basis with a well-functioning reporting system can score reasonably on PI-26 under the Cash Basis IPSAS. For reform planning, PEFA provides the diagnostic; IPSAS provides the target standard for the accounting and reporting pillar.",
      "source": "PEFA-IPSAS-Relationship",
      "score": 0.9
    }
  ]'::jsonb,

  'The Public Expenditure and Financial Accountability (PEFA) framework is the most widely used diagnostic tool for assessing government PFM quality globally. As at 2025, over 700 assessments have been conducted across more than 140 countries. PEFA provides practitioners with an objective, internationally comparable measure of PFM performance that complements but is distinct from IPSAS compliance.

PEFA assesses 31 performance indicators across seven pillars covering the full budget cycle: budget reliability, fiscal transparency, asset and liability management, policy-based budgeting, budget execution controls, accounting and reporting, and external scrutiny. This breadth means PEFA captures whether accounting reform (Pillar VI) is matched by functioning controls and oversight (Pillars V and VII) — a critical contextual check.

For IPSAS practitioners, PEFA Pillar VI — Accounting and Reporting — is the most directly relevant. PI-26 (Annual Financial Statements) assesses completeness, timeliness, and standards compliance. A score of A requires statements to: (1) include all specified financial statement components; (2) be submitted for audit within six months of the financial year end; and (3) be prepared using internationally recognised accounting standards with deviations explained. The six-month submission requirement is often the binding constraint in developing countries even when statements are technically well-prepared.

PI-25 (In-year Budget Reports) and PI-27 (Financial Data Integrity — bank reconciliations, suspense accounts, advance accounts) provide context for the quality of the underlying accounting records that feed annual statements. Poor scores on PI-27 indicate that data integrity problems will compromise IPSAS statement quality regardless of the formal accounting basis adopted.

The PEFA Secretariat''s Seven Success Mantras (2025) provide important guidance on using PEFA assessments for reform planning. Key warnings: do not convert PEFA scores mechanically into reform priorities — contextual analysis is essential; monitor reforms at the dimension level rather than indicator level; sequence reforms appropriately for PFM maturity; and ensure local ownership so reform momentum continues after donor project completion.

For Solomon Islands context: PEFA assessments have been conducted periodically, with PI-26 scores providing the clearest external benchmark of IPSAS compliance progress. The 2025 PEFA assessment planned for SIG will provide an updated baseline for reporting quality under Cash Basis IPSAS.',

  ARRAY['PEFA', 'PFM performance', 'budget reliability', 'fiscal transparency', 'accounting and reporting', 'PI-26', 'annual financial statements', 'seven success mantras', 'PEFA score', 'PEFA assessment', 'performance indicators', 'budget execution', 'external audit', 'bank reconciliation', 'suspense accounts', 'IPSAS compliance assessment', 'Solomon Islands PEFA', 'PFM diagnostic', 'financial statement quality', 'reform sequencing'],

  'current',
  4,
  '{"query_text": "PEFA performance measurement PFM financial management assessment", "n_results": 10, "filter": {"topic": "pefa"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;


-- ============================================================================
-- 8. FRAUD DETECTION AND PUBLIC EXPENDITURE TRACKING
-- ============================================================================
-- Sources: Finding Fraud: GovTech and Fraud Detection in Public Administration
--          (World Bank, 2020);
--          Public Expenditure Tracking Systems (PETS);
--          Costing Corruption and Efficiency Losses from Weak PFM Systems
-- ============================================================================

INSERT INTO rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, generation_query
) VALUES (
  'topic-fraud-detection-public-expenditure',
  'Fraud Detection, PETS, and Efficiency Losses from Weak PFM Systems',
  'topic_cluster',
  ARRAY['IPSAS-1', 'IPSAS-19', 'C4'],
  'both',

  '[
    {
      "text": "Finding Fraud: GovTech and Fraud Detection in Public Administration (World Bank, 2020): GovTech tools — digital identification, e-procurement systems, financial management information systems (FMIS), and data analytics — create digital audit trails that make fraud detection more systematic. Key fraud vectors in public administration: (1) procurement fraud (bid rigging, collusion, inflated invoices); (2) payroll fraud (ghost workers, salary manipulation); (3) asset misappropriation (missing assets, unauthorised disposals); (4) financial statement fraud (misclassification of expenditure, concealment of liabilities). FMIS implementation significantly improves detectability across all four categories.",
      "source": "World-Bank-Finding-Fraud-GovTech-2020",
      "score": 1.0
    },
    {
      "text": "Public Expenditure Tracking Surveys (PETS): Pioneered in Uganda in the 1990s, PETS track the flow of public funds from central government through the chain of service delivery to the final beneficiary. Original Uganda PETS found that only 20% of non-wage education grants actually reached schools. PETS methodology: (1) survey central ministry disbursements; (2) survey district/province transfers; (3) survey facility-level receipts; (4) compare records at each level to identify leakages. PETS are particularly effective for identifying leakage in earmarked grants (health, education) where intended beneficiaries can be directly surveyed.",
      "source": "PETS-Public-Expenditure-Tracking",
      "score": 1.0
    },
    {
      "text": "Fraud and weak PFM systems: Corruption and efficiency losses from weak PFM systems impose significant fiscal costs. Key channels: (1) revenue leakage — taxes collected but not remitted to treasury; (2) expenditure leakage — payments made for goods and services not received; (3) asset stripping — public assets misappropriated or disposed of below market value; (4) procurement overpricing — contracts awarded at inflated prices through corrupt tendering. Strengthening PFM controls — through FMIS, e-procurement, asset registers, and independent audit — is the primary mitigation strategy.",
      "source": "Costing-Corruption-PFM-Losses",
      "score": 1.0
    },
    {
      "text": "IPSAS and fraud prevention: IPSAS accrual accounting inherently improves fraud detection relative to cash-basis reporting. Key mechanisms: (1) receivables recognition — amounts due to government are recorded, making non-remittance visible; (2) payables recognition — amounts owed by government are recorded, making duplicate payments visible; (3) asset register — all assets are recognised and valued, making unauthorised disposals visible; (4) contingent liability disclosure (IPSAS 19) — potential claims against government are disclosed, preventing concealment of loss events. However, IPSAS is a financial reporting standard, not an internal control framework. IPSAS produces better disclosures; it does not substitute for functioning internal controls.",
      "source": "IPSAS-Fraud-Prevention-Link",
      "score": 0.9
    }
  ]'::jsonb,

  'Fraud and leakage in public finance represent a significant drain on government resources in developing countries. Three complementary tools address this challenge: GovTech fraud detection systems, Public Expenditure Tracking Surveys (PETS), and strengthened PFM accounting and control frameworks.

The World Bank''s 2020 analysis of GovTech and fraud detection identifies four principal fraud vectors in public administration: procurement fraud (bid rigging, inflated invoices, phantom deliveries), payroll fraud (ghost workers, inflated salaries), asset misappropriation (unauthorised disposal, missing assets), and financial statement fraud (expenditure misclassification, liability concealment). Digital tools — FMIS, e-procurement systems, biometric payroll verification, and data analytics — create digital audit trails that significantly improve the detectability of all four fraud types.

Public Expenditure Tracking Surveys, pioneered in Uganda in the late 1990s, trace the flow of public funds from central allocation through the service delivery chain to the final beneficiary. The original Uganda PETS revealed that only 20% of non-wage education grants reached schools — the remainder being captured at district, division, and school administrative levels. PETS methodology triangulates records at each level in the transfer chain to quantify leakage rates. The approach is most powerful for earmarked grants with identifiable beneficiaries (schools, health facilities, social protection recipients).

Weak PFM systems impose fiscal costs through multiple channels: revenue leakage when tax collections are not remitted to treasury; expenditure leakage when payments are made for goods and services not delivered; asset stripping when public assets are misappropriated or sold below value; and procurement overpricing through corrupt tender processes. Strengthening PFM controls through FMIS implementation, e-procurement, comprehensive asset registers, and independent audit is the primary mitigation strategy.

IPSAS accrual accounting supports fraud prevention as a by-product of better financial reporting. Receivables recognition makes non-remittance of government revenues visible. Payables recognition enables duplicate payment detection. Comprehensive asset registers (IPSAS 17/45) make unauthorised disposals visible. Contingent liability disclosures (IPSAS 19) prevent concealment of loss events. However, IPSAS is a financial reporting framework, not an internal control system — it produces better disclosures, but does not substitute for functioning procurement controls, payroll audits, and internal audit capability.',

  ARRAY['fraud detection', 'procurement fraud', 'payroll fraud', 'ghost workers', 'PETS', 'public expenditure tracking', 'GovTech', 'FMIS', 'e-procurement', 'corruption', 'PFM losses', 'leakage', 'asset misappropriation', 'internal controls', 'digital audit trail', 'Uganda PETS', 'service delivery', 'expenditure leakage', 'fraud prevention', 'IPSAS 19 contingent liabilities'],

  'current',
  4,
  '{"query_text": "fraud detection public expenditure corruption PFM controls", "n_results": 10, "filter": {"topic": "fraud-control"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;


-- ============================================================================
-- 9. LOCAL GOVERNMENT FINANCIAL MANAGEMENT AND FISCAL DECENTRALIZATION
-- ============================================================================
-- Sources: Building up Fiscally Strong Local Governments (Slukhai);
--          Fiscal Decentralization and Government Size in Latin America
-- ============================================================================

INSERT INTO rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, generation_query
) VALUES (
  'topic-local-government-fiscal-management',
  'Local Government Financial Management and Fiscal Decentralization',
  'topic_cluster',
  ARRAY['IPSAS-1', 'IPSAS-17', 'IPSAS-23', 'IPSAS-24', 'C4'],
  'both',

  '[
    {
      "text": "Building up Fiscally Strong Local Governments (Slukhai — Ukraine case): Key prerequisites for fiscally strong local governments: (1) adequate revenue sources — own-source revenues (property taxes, business licences, user fees) rather than pure transfer dependence; (2) expenditure responsibility clearly assigned by law to the local level; (3) competent local finance staff; (4) functioning local accounting and reporting systems; (5) local government budget transparency and public accountability. The paper argues that fiscal strength at local government level requires matching revenue assignment to expenditure responsibilities — a fundamental intergovernmental fiscal design issue.",
      "source": "Slukhai-Fiscally-Strong-Local-Governments",
      "score": 1.0
    },
    {
      "text": "Fiscal Decentralization and Government Size in Latin America: Decentralization can lead to fiscal expansion at the sub-national level without offsetting reductions at the central level, increasing total government size. The ''flypaper effect'' — grants to local governments tend to increase local spending more than equivalent increases in local income — is a consistent finding across decentralized systems. Sub-national fiscal discipline requires: hard budget constraints (no central bailouts), own-source revenue accountability, and transparent reporting of sub-national finances.",
      "source": "Fiscal-Decentralization-Latin-America",
      "score": 1.0
    },
    {
      "text": "IPSAS at the local government level: IPSAS standards apply equally to local governments as to central governments. In practice, local governments face additional challenges: (1) smaller, less trained finance staff; (2) more direct community accountability but weaker formal oversight; (3) greater asset diversity (community infrastructure, recreational facilities, heritage assets); (4) higher proportion of grant and transfer income subject to IPSAS 23/47 non-exchange rules. The Cash Basis IPSAS is generally the appropriate starting standard for local governments in developing countries, with accrual adoption deferred until basic systems and capacity are established.",
      "source": "IPSAS-Local-Government-Application",
      "score": 0.9
    },
    {
      "text": "Sub-national PFM reform: Extending PFM reform from central government to provincial and local levels is consistently identified as one of the most difficult aspects of reform. Central government reforms rarely reach sub-national entities within the initial reform period. In Solomon Islands, provincial governments operate under the same Cash Basis IPSAS framework as central government but with substantially weaker accounting capacity. The PEFA assessment framework has a sub-national variant that allows provincial PFM performance to be assessed separately from central government.",
      "source": "Sub-national-PFM-Reform",
      "score": 0.9
    }
  ]'::jsonb,

  'Local government financial management operates within the broader framework of intergovernmental fiscal relations. The financial reporting and accountability requirements for local governments under IPSAS are identical to those for central government entities, but the implementation context differs significantly: smaller finance teams, higher community accountability, greater asset diversity, and stronger dependence on intergovernmental transfers.

Fiscal decentralization — the assignment of revenues and expenditure responsibilities to sub-national governments — creates both opportunities and risks. When expenditure responsibilities are decentralized without matching revenue sources, local governments become transfer-dependent, reducing fiscal accountability. The literature on Latin American decentralization identifies a consistent "flypaper effect": grants to local governments increase local spending more than equivalent own-source revenue increases, suggesting that transfer dependence weakens fiscal discipline relative to own-source accountability.

Prerequisite conditions for fiscally strong local governments (Slukhai): clear and sufficient own-source revenue authority; expenditure responsibilities assigned by law; competent local finance staff; functioning local accounting and reporting systems; and local budget transparency with genuine public oversight. Countries that decentralize spending without building the supporting PFM infrastructure at local level consistently find that local accountability is weaker than at central level.

IPSAS application to local governments: All IPSAS standards apply to local governments (which are typically "public sector entities" within the scope). In practice, the Cash Basis IPSAS is the appropriate starting standard for most local governments in developing countries. Key IPSAS issues at local level: (1) non-exchange revenue from central government grants (IPSAS 23 or IPSAS 47 depending on adoption status); (2) infrastructure assets — roads, community buildings, water systems — that are often unrecorded or unvalued (IPSAS 17/45 PPE); (3) budget presentation (IPSAS 24) where local budgets must be compared to actuals in financial statements; (4) related party transactions between local government councillors and entities they control (IPSAS 20).

In Solomon Islands, the nine provincial governments operate under the same legal PFM framework as central government but with substantially weaker accounting capacity. Reform interventions at provincial level require simplified procedures, local-language training materials, and IT systems appropriate to small operations with intermittent power and connectivity.',

  ARRAY['local government', 'provincial government', 'fiscal decentralization', 'intergovernmental transfers', 'sub-national PFM', 'own-source revenue', 'grants to local government', 'flypaper effect', 'local government accounting', 'IPSAS local', 'community infrastructure', 'non-exchange revenue', 'local budget', 'IPSAS 24 local', 'provincial accounting', 'Solomon Islands provinces', 'transfer dependence', 'fiscal strength', 'local government reform', 'PEFA sub-national'],

  'current',
  4,
  '{"query_text": "local government fiscal management decentralization provincial accounting", "n_results": 10, "filter": {"topic": "local-government"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;


-- ============================================================================
-- 10. IMF PUBLIC FINANCIAL MANAGEMENT HANDBOOK
-- ============================================================================
-- Source: Allen, Hemming, Potter (eds.) — The International Handbook of
--         Public Financial Management (Palgrave Macmillan, 2013)
-- ============================================================================

INSERT INTO rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, generation_query
) VALUES (
  'topic-imf-pfm-handbook',
  'IMF International Handbook of Public Financial Management: Framework Overview',
  'topic_cluster',
  ARRAY['IPSAS-1', 'IPSAS-24', 'IPSAS-2', 'C4'],
  'both',

  '[
    {
      "text": "Allen, Hemming, Potter (eds.) — The International Handbook of PFM: The book treats PFM as an integrated framework with its own architecture, logic, and connections. Three innovation categories: (1) Information innovations — improved fiscal data, accrual accounting, programme classification, government financial statistics; (2) Process innovations — medium-term expenditure frameworks, performance budgeting, internal audit reforms; (3) Rules innovations — fiscal rules, debt ceilings, independent fiscal institutions. The key argument is that individual PFM innovations do not have predictable outcomes without considering the broader institutional context and the coherence of the overall framework.",
      "source": "IMF-PFM-Handbook-Allen-Hemming-Potter",
      "score": 1.0
    },
    {
      "text": "PFM as an integrated system: Individual innovations in PFM — including IPSAS adoption — do not deliver benefits in isolation. The effectiveness of accrual accounting depends on: (1) functioning budget preparation that uses accrual-basis cost information; (2) an execution system that captures commitments in addition to payments; (3) an internal control system that prevents misclassification; (4) an audit system that verifies the accuracy of accrual entries. A government that adopts IPSAS without reforming the underlying budget execution and control systems is unlikely to produce materially improved financial statements.",
      "source": "IMF-PFM-Handbook-Allen-Hemming-Potter",
      "score": 1.0
    },
    {
      "text": "Medium-Term Expenditure Framework (MTEF) and IPSAS interaction: MTEF provides forward estimates of budget allocations across a three-to-five year horizon. IPSAS 24 requires comparison of actual financial statement figures against the most recent approved budget. Where an MTEF is used, the budget comparison note must specify whether the comparison is against the annual budget or the MTEF forward estimate. The disclosure requirement under IPSAS 24 is against the original approved annual budget, not the MTEF, unless the entity formally presents the MTEF as the approved budget.",
      "source": "MTEF-IPSAS24-Interaction",
      "score": 0.9
    },
    {
      "text": "PFM reform and public debt sustainability: The handbook emphasises that government financial reporting quality directly affects a government''s ability to manage public debt sustainably. Accrual accounting reveals the full liability profile — including pension obligations, contingent liabilities, and guarantees — that cash accounting conceals. For developing countries with significant donor funding, accrual accounting also makes visible the conditions and obligations attached to concessional loans and grants that may not appear in cash flow data.",
      "source": "IMF-PFM-Handbook-Debt-Context",
      "score": 0.9
    }
  ]'::jsonb,

  'The International Handbook of Public Financial Management (Allen, Hemming, Potter, Palgrave Macmillan 2013) is the most comprehensive academic and practitioner reference on PFM reform, covering the full budget cycle from policy formulation through execution, accounting, reporting, and audit. It provides the conceptual framework within which IPSAS adoption is best understood.

The handbook''s central argument is that PFM is an integrated system. Individual reforms — including IPSAS adoption — do not produce predictable outcomes when implemented in isolation. The effectiveness of accounting basis reform depends entirely on the coherence of the surrounding systems: budget preparation processes that use the accounting information, execution controls that capture commitments in real time, internal audit capability to verify accrual entries, and external audit quality to provide credible assurance on financial statements.

Three categories of PFM innovation are distinguished: information innovations (improved fiscal data, accrual accounting, programme classification, government finance statistics harmonisation); process innovations (medium-term expenditure frameworks, performance budgeting, commitment controls, cash management); and rules innovations (fiscal rules, debt ceilings, independent fiscal councils). IPSAS is an information innovation. Its value is realised only when the process and rules innovations support its implementation.

MTEF and IPSAS interaction: The Medium-Term Expenditure Framework provides rolling three-to-five-year budget allocations. IPSAS 24 requires comparison of actual financial statement figures against the approved budget. Where an MTEF is in place, the budget comparison must specify whether it references the annual budget or the MTEF forward estimate — IPSAS 24 requires comparison against the original approved annual budget unless the MTEF is formally presented as the approved budget instrument.

Public debt sustainability and financial reporting: Accrual accounting reveals the full government liability profile — pension obligations, contingent liabilities from guarantees, lease commitments, and conditions attached to concessional loans — that is invisible in cash-basis reporting. For Pacific Island countries with significant external grant and loan financing, accrual reporting makes visible the full fiscal obligations that cash accounting conceals in footnotes or off-balance-sheet items.',

  ARRAY['PFM handbook', 'integrated PFM', 'MTEF', 'medium-term expenditure', 'performance budgeting', 'fiscal rules', 'debt sustainability', 'budget classification', 'commitment controls', 'information systems', 'PFM architecture', 'programme budgeting', 'IPSAS 24 MTEF', 'government finance statistics', 'GFS', 'IMF PFM', 'Allen Hemming Potter', 'PFM innovation', 'fiscal policy', 'accrual benefits'],

  'current',
  4,
  '{"query_text": "IMF public financial management handbook framework", "n_results": 10, "filter": {"topic": "pfm-framework"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;


-- ============================================================================
-- 11. ACCRUAL ACCOUNTING IN THE GOVERNMENT SECTOR — ICGFM PRACTITIONER DIGEST
-- ============================================================================
-- Source: ICGFM Public Fund Digest Vol III No.2 2003;
--         ICGFM Internal Auditing in the Public Sector
-- ============================================================================

INSERT INTO rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, generation_query
) VALUES (
  'topic-accrual-accounting-government-sector',
  'Accrual Accounting in the Government Sector: ICGFM Practitioner Perspectives',
  'topic_cluster',
  ARRAY['IPSAS-1', 'IPSAS-33', 'IPSAS-2', 'IPSAS-17'],
  'both',

  '[
    {
      "text": "ICGFM disciplines of government financial management: accounting, auditing, budgeting, debt administration, information technology, tax administration, and treasury management. These seven disciplines are interdependent components of a government''s financial management system. IPSAS addresses the accounting and financial reporting component. Effective government financial management requires competence across all seven disciplines — a point frequently missed in donor programmes that focus narrowly on accounting standards reform without addressing the supporting IT, audit, and treasury functions.",
      "source": "ICGFM-Public-Fund-Digest-2003",
      "score": 1.0
    },
    {
      "text": "Accrual accounting in government — practitioner perspectives from 2003: Key advantages cited: (1) complete financial picture — assets and liabilities as well as cash flows; (2) accountability — managers accountable for full resource cost including capital consumption; (3) efficiency incentives — depreciation charging creates incentives to manage assets efficiently; (4) inter-period equity — matching costs and benefits across generations. Disadvantages cited: (1) complexity — requires professional judgment for estimates and valuations; (2) cost — significant systems and training investment; (3) potential for manipulation — accrual estimates are less auditable than cash transactions.",
      "source": "ICGFM-Accrual-Accounting-Government",
      "score": 1.0
    },
    {
      "text": "Government financial management disciplines — budget accounting vs financial accounting: Budget accounting tracks the spending authority granted by the legislature and the status of that authority at each stage (appropriated, committed, expended). Financial accounting under IPSAS tracks the economic consequences of transactions regardless of budget authority status. These two accounting systems must be reconciled — the difference between budget basis and IPSAS basis is a required disclosure under IPSAS 24. In many governments, these systems are maintained separately, creating reconciliation challenges and potential for discrepancies that are not easily detected.",
      "source": "ICGFM-Budget-Financial-Reconciliation",
      "score": 1.0
    }
  ]'::jsonb,

  'The International Consortium on Governmental Financial Management (ICGFM) has since the 1980s provided a practitioner network and knowledge platform for government financial management professionals. The ICGFM Public Fund Digest and its associated practitioner guides on accrual accounting and internal audit reflect ground-level practitioner experience from across the developing world.

Government financial management as a discipline encompasses seven interdependent areas: accounting, auditing, budgeting, debt administration, information technology, tax administration, and treasury management. IPSAS addresses only the accounting and financial reporting component. A government that adopts IPSAS while neglecting the IT systems to support accrual posting, the audit function to verify accrual entries, or the treasury function to manage the cash position that accrual accounting reveals, will produce financial statements that are technically compliant but practically unreliable.

The 2003 ICGFM practitioner debate on accrual accounting reflects arguments that remain relevant today. Advocates cite the complete financial picture (assets, liabilities, and cash flows rather than just cash flows), improved accountability (managers charged for full resource consumption including capital), and efficiency incentives from depreciation charging. Sceptics cite complexity (estimates and valuations require professional judgment scarce in government), cost (systems and training investment is substantial), and auditability concerns (accrual estimates are more difficult to verify than cash transaction records).

This debate has largely been resolved in favour of accrual adoption as a long-term objective, but the sceptics'' concerns remain relevant for sequencing: simpler, more auditable forms of improved reporting (enhanced cash basis, partial accrual) may deliver better accountability outcomes in the medium term than premature full accrual adoption that produces unreliable estimates.

Budget accounting and financial accounting are parallel systems that must be reconciled. Budget accounting tracks spending authority through stages from appropriation to commitment to expenditure. Financial accounting under IPSAS tracks economic consequences including accruals, valuations, and non-cash items that have no budget counterpart. The reconciliation between budget basis and IPSAS basis is a required disclosure under IPSAS 24 and is frequently one of the most challenging note disclosures in transitioning entities.',

  ARRAY['ICGFM', 'government financial management', 'accrual advantages', 'accrual disadvantages', 'budget accounting', 'financial accounting reconciliation', 'IPSAS 24 reconciliation', 'capital consumption', 'depreciation charging', 'accountability', 'budget vs actual', 'treasury management', 'debt administration', 'interdependent PFM', 'practitioner perspective', 'accrual debate', 'partial accrual', 'enhanced cash basis', 'government accounting history', 'PFM seven disciplines'],

  'current',
  3,
  '{"query_text": "accrual accounting government sector practitioner ICGFM", "n_results": 10, "filter": {"topic": "accrual-government"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;


-- ============================================================================
-- 12. ACCRUAL IMPLEMENTATION REALITIES — POLICY VS PRACTICE
-- ============================================================================
-- Source: Many-Govts-Claim-to-Use-Accrual-Do-Not.md (IMF PFM Blog synthesis);
--         IFAC-CIPFA-IPSASB Accountability Index 2025 (statistics);
--         Hepworth 2025 / SIGMA-OECD 2024 (prerequisites framework)
-- Note: Full detail also in skill reference accrual-implementation-realities.md
-- ============================================================================

INSERT INTO rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, generation_query
) VALUES (
  'topic-accrual-implementation-realities',
  'Accrual Implementation Realities: Policy Adoption vs Functional Implementation',
  'topic_cluster',
  ARRAY['IPSAS-33', 'IPSAS-17', 'IPSAS-19', 'IPSAS-25', 'C4'],
  'both',

  '[
    {
      "text": "IMF PFM Blog observation: A worrying trend in many emerging market countries is that governments claim to have moved to accruals but de facto still compile financial data on a cash basis. Sri Lanka has been moving toward IPSAS-aligned accounting since 2004 and presents financial statements in accrual format, but those statements are prepared on a modified cash basis with historic cost valuation. Accrual format; cash substance. This pattern is documented across Africa, Asia, and Eastern Europe.",
      "source": "IMF-PFM-Blog-Accrual-Reality",
      "score": 1.0
    },
    {
      "text": "Two operational prerequisites almost never in place before accrual reform: (1) Commitment accounting — genuine accrual requires liability recognition at the point of commitment (when an order is placed). Without purchase orders in a functioning commitment control system, payables are year-end estimates rather than live data. (2) Non-cash asset valuation — asset recognition commonly happens once a year as a compliance exercise, not a management tool. Heritage assets, military equipment, land, and public infrastructure are either absent from the balance sheet or carried at unreliable values.",
      "source": "Accrual-Implementation-Realities",
      "score": 1.0
    },
    {
      "text": "Five prerequisites before accrual reform makes sense (Hepworth 2025 / SIGMA-OECD 2024): (1) Asset management capability — functioning asset registers updated continuously; (2) Liability management — debt obligations, pension liabilities, contingent liabilities understood and managed; (3) Strategic planning beyond 3-year inflation forecasts; (4) Strong governance and external audit capable of auditing accrual estimates; (5) Strengthened Ministry of Finance controls over asset values, capital cash flows, and investment efficiency. SIGMA-OECD conclusion: for countries facing governance and corruption challenges, full accrual should not be a short or medium-term priority.",
      "source": "Accrual-Prerequisites-Framework",
      "score": 1.0
    },
    {
      "text": "The corruption dividend: Research covering 77 low and middle-income countries (Tawiah 2020, referenced in Nagae et al. 2022) found that even partial adoption of IPSAS standards is associated with measurable reductions in corruption. This finding supports maintaining the direction of travel toward accrual, even if the pace must be realistic. Realistic timeline: few countries have completed the transition in less than five years; many rich countries have taken more than ten years (van Helden and Reichard, OECD Journal on Budgeting, 2018).",
      "source": "IPSAS-Corruption-Reduction-Evidence",
      "score": 1.0
    },
    {
      "text": "What the Cash Basis IPSAS (C4) gets wrong (Wynne 2016): The standard is so minimal it does not represent good practice — it represents minimal practice. It does not require the government budget to be made public; does not stipulate any timeframe for publication of audited annual financial statements; makes full consolidation of government-controlled entities optional. Many African governments already exceed the required Part 1 standards but receive no international credit for it.",
      "source": "Cash-Basis-IPSAS-Limitations",
      "score": 1.0
    }
  ]'::jsonb,

  'A recurring concern in the public sector accounting literature is the gap between governments that formally claim to report on an accrual basis and those that actually do. The IMF has documented that many emerging market governments present financial statements in accrual format while continuing to compile the underlying data on a cash basis. The form is accrual; the substance is not.

The IFAC-CIPFA Accountability Index (2025) counts 53 jurisdictions as reporting on accrual. These figures are based on self-reported data and stated intentions — they measure policy adoption, not functional system quality. The gap between the two is where most of the real implementation work occurs, and where most reform programmes stall.

Two operational prerequisites are almost never in place when accrual reforms are launched. First, commitment accounting: genuine accrual requires recognising a liability when an obligation is created (when a purchase order is placed), not when an invoice is received or when cash is paid. In most developing countries, purchase order systems do not exist or are not embedded in financial systems. As a result, payables are year-end estimates constructed from invoices received after the reporting date, not from a live commitment tracking system. Second, non-cash asset valuation: asset recognition in most developing country governments happens once a year as a compliance exercise. Heritage assets, military equipment, land, and public infrastructure are either absent from the balance sheet or carried at values bearing no relationship to current reality.

Five prerequisites before accrual reform delivers value (Hepworth 2025, SIGMA-OECD 2024): (1) asset management capability with continuously updated registers; (2) liability management including pension provisions and contingent liabilities; (3) strategic planning beyond inflation forecasts; (4) governance and audit capable of validating accrual estimates; (5) Ministry of Finance controls over capital flows. For countries with governance and corruption challenges, full accrual should not be a short or medium-term priority.

Despite these implementation challenges, research finds a corruption dividend: even partial IPSAS adoption is associated with measurable reductions in corruption in low and middle-income countries. This supports maintaining the direction of travel while being realistic about pace. Practitioners should plan for decades, not years, and set intermediate milestones against recognised intermediate standards.',

  ARRAY['accrual implementation', 'cash vs accrual', 'commitment accounting', 'purchase orders', 'asset valuation', 'asset register', 'prerequisites', 'policy adoption', 'functional implementation', 'Sri Lanka', 'modified cash', 'corruption dividend', 'IPSAS corruption reduction', 'Cash Basis IPSAS limitations', 'C4 weaknesses', 'intermediate standards', 'realistic timeline', 'SIGMA OECD', 'Hepworth', 'accrual reform failures'],

  'current',
  5,
  '{"query_text": "accrual accounting implementation reality government claiming accrual", "n_results": 10, "filter": {"topic": "accrual-implementation"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;


-- ============================================================================
-- 13. IMF ACCRUAL TRANSITION PHASES — FOUR-PHASE FRAMEWORK
-- ============================================================================
-- Source: Flynn, Moretti, Cavanagh — Implementing Accrual Accounting in the
--         Public Sector, IMF Technical Notes and Manuals 16/06, September 2016
-- Note: Full detail also in skill reference imf-accrual-transition-phases.md
-- ============================================================================

INSERT INTO rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, generation_query
) VALUES (
  'topic-imf-accrual-transition-phases',
  'IMF Four-Phase Accrual Transition Framework (Flynn, Moretti, Cavanagh 2016)',
  'topic_cluster',
  ARRAY['IPSAS-33', 'IPSAS-1', 'IPSAS-2', 'IPSAS-17', 'IPSAS-25', 'IPSAS-19', 'C4'],
  'both',

  '[
    {
      "text": "IMF four-phase transition framework: Phase 0 (Cash Accounting) — reliable cash and debt data; financial statements: cash flow statement, elementary balance sheet (cash + debt). Phase 1 (Elementary Accrual) — adds trade receivables, payables, prepayments; operating statement adds in-transit revenues and expenses; expands to some extra-budgetary agencies. Phase 2 (Advanced Accrual) — adds full financial assets and liabilities, employee benefit provisions; expands to consolidated general government. Phase 3 (Full Accrual) — adds non-financial assets (PPE, intangibles, inventories), depreciation, revaluations; expands to whole-of-public-sector.",
      "source": "Flynn-Moretti-Cavanagh-2016-IMF-TN",
      "score": 1.0
    },
    {
      "text": "Phase 0 requirements — what must work before any accrual is attempted: Treasury Single Account (or limited commercial bank accounts) to capture all cash; double-entry bookkeeping (not strictly required but greatly facilitates consolidation); a functioning debt management system. Without Phase 0 working reliably, any accrual reform is premature. Many reform programmes skip Phase 0 verification and attempt Phase 1 or Phase 2 reforms with unreliable cash data foundations.",
      "source": "Flynn-Moretti-Cavanagh-2016-Phase0",
      "score": 1.0
    },
    {
      "text": "Country transition timelines: United Kingdom took over 15 years from initial reform decision to full whole-of-government accrual statements. New Zealand is the most cited rapid transition — approximately 5 years — but New Zealand had an unusually strong institutional foundation including a professional civil service, functioning commitment controls, and comprehensive asset data. New Zealand should not be used as a typical transition timeline. France took approximately 10 years. Austria approximately 8 years. Sri Lanka — over 20 years and still not complete.",
      "source": "Flynn-Moretti-Cavanagh-2016-Country-Cases",
      "score": 1.0
    },
    {
      "text": "IPSAS standards by transition phase: Phase 0 — Cash Basis IPSAS (C4) Part 1 is appropriate; IPSAS 2 (Cash Flow Statements). Phase 1 — IPSAS 1 (Presentation), IPSAS 2 (Cash Flows), IPSAS 9/23/47 (Revenue). Phase 2 — adds IPSAS 25/39 (Employee Benefits), IPSAS 19 (Provisions), IPSAS 28-30/41 (Financial Instruments), IPSAS 34-38 (Consolidation). Phase 3 — adds IPSAS 17/45 (PPE), IPSAS 31 (Intangibles), IPSAS 12 (Inventories), IPSAS 21/26 (Impairment).",
      "source": "Flynn-Moretti-Cavanagh-2016-Standards-Sequence",
      "score": 1.0
    }
  ]'::jsonb,

  'The IMF Technical Note on Implementing Accrual Accounting in the Public Sector (Flynn, Moretti, Cavanagh, September 2016) provides the most widely cited framework for sequencing the transition from cash to full accrual accounting. The framework organises the transition into four phases, each adding elements across three dimensions: what is recorded in the balance sheet, what is recognised in the operating statement, and which institutions are consolidated.

Phase 0 (Cash Accounting) is the baseline: reliable and complete information on cash transactions, cash holdings, and short-term debt. Financial statements comprise a cash flow statement and an elementary balance sheet showing only cash and debt. This phase requires a Treasury Single Account (or equivalent), double-entry bookkeeping, and a functioning debt management system. Phase 0 must work reliably before any accrual reform is attempted — it is the foundation on which all subsequent phases depend.

Phase 1 (Elementary Accrual) adds trade receivables, payables, and prepayments to the balance sheet, and recognises in-transit revenues and expenses in the operating statement. Coverage expands to include some extra-budgetary agencies.

Phase 2 (Advanced Accrual) adds full financial assets and liabilities, employee benefit provisions, and contingent liabilities. Institutional coverage expands to the consolidated general government level.

Phase 3 (Full Accrual) adds non-financial assets — property, plant and equipment, intangibles, inventories, heritage assets — along with depreciation and revaluation entries. Coverage extends to the whole of the public sector.

Country experience shows that transition timelines are much longer than reformers typically plan. New Zealand''s widely cited five-year transition was enabled by an unusually strong institutional foundation. The United Kingdom took over 15 years. France approximately 10 years. Sri Lanka is still not complete after 20 years of attempting the transition. Realistic planning should use New Zealand as an upper bound, not a typical case.',

  ARRAY['accrual transition phases', 'IMF framework', 'Phase 0', 'Phase 1', 'Phase 2', 'Phase 3', 'elementary accrual', 'advanced accrual', 'full accrual', 'cash to accrual sequence', 'Treasury Single Account', 'trade receivables', 'employee benefits provision', 'PPE recognition', 'consolidation', 'New Zealand accrual', 'UK accrual', 'France accrual', 'Sri Lanka accrual', 'transition timeline', 'Flynn Moretti Cavanagh', 'IPSAS sequence'],

  'current',
  4,
  '{"query_text": "accrual transition phases IMF framework sequencing cash to accrual", "n_results": 10, "filter": {"topic": "transition-phases"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;


-- ============================================================================
-- VERIFY: Count inserted entries
-- ============================================================================
-- Run after inserting to confirm all entries are present:
-- SELECT cache_key, label, pathway, source_chunk_count, generated_at
-- FROM rag_knowledge_cache
-- WHERE cache_key LIKE 'topic-%'
-- ORDER BY cache_key;
