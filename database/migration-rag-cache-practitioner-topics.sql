-- =============================================================================
-- Migration: Practitioner Topic Cache — 32-Topic Spine
-- IPSAS Practitioner Advisor — pre-computed knowledge packets
--
-- Run AFTER: migration-rag-cache.sql and migration-rag-cache-supplementary.sql
--
-- What this adds:
--   1. Two new columns on rag_knowledge_cache:
--        source_folder    — which Documentation/ folder the content comes from
--        hierarchy_level  — priority order per Accounting-documentation-hierarchy.md
--                           1 = IPSAS_Regulations (highest authority)
--                           2 = Downloaded_Standards
--                           3 = Accounting_Study_Guides
--                           4 = Accounting_Guidance
--                           5 = Government-Specific (jurisdiction-scoped)
--                           6 = Supplementary_Resources / subfolders
--                           NULL = synthesised from multiple folders
--   2. A new entry_type value: 'practitioner_topic'
--   3. 32 cache entries — one per topic in the practitioner spine (P01-P32)
--
-- Content source: synthesised from Documentation/Supplementary_Resources/
--   (already RAGed into ChromaDB) PLUS IPSAS_Regulations/ standard content.
--   These are the Layer 2 "topic pages" for the practitioner advisor.
--
-- Hierarchy note (see projects/ipsas-advisor/CLAUDE.md):
--   When IPSAS_Regulations content conflicts with Supplementary content,
--   IPSAS_Regulations wins (hierarchy_level 1 < 6).
--   These synthesised entries have hierarchy_level = NULL (mixed sources).
--   The advisor actions.ts should prefer lower hierarchy_level entries
--   when building the system prompt context.
-- =============================================================================


-- ============================================================================
-- SCHEMA CHANGES
-- ============================================================================

-- Add source_folder column (safe — IF NOT EXISTS guard)
alter table rag_knowledge_cache
  add column if not exists source_folder text default null;

-- Add hierarchy_level column (1 = highest authority, 6 = lowest, NULL = mixed)
alter table rag_knowledge_cache
  add column if not exists hierarchy_level integer default null
    check (hierarchy_level is null or (hierarchy_level between 1 and 6));

-- Widen the entry_type constraint to include the new practitioner_topic value.
-- PostgreSQL requires dropping and re-adding the constraint.
alter table rag_knowledge_cache
  drop constraint if exists rag_knowledge_cache_entry_type_check;

alter table rag_knowledge_cache
  add constraint rag_knowledge_cache_entry_type_check
    check (entry_type in ('standard', 'topic_cluster', 'practitioner_topic'));

-- Index on hierarchy_level so actions.ts can ORDER BY it efficiently
create index if not exists rag_cache_hierarchy_level
  on rag_knowledge_cache(hierarchy_level);


-- ============================================================================
-- P01 — FINANCIAL REPORTING FRAMEWORK AND CONCEPTUAL BASIS
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P01',
  'Financial Reporting Framework and Conceptual Basis',
  'practitioner_topic',
  array['IPSAS-1', 'IPSAS-33', 'C4'],
  'both',

  '[
    {
      "text": "The IPSASB Conceptual Framework (2014) establishes the objectives, qualitative characteristics, and elements of general purpose financial statements for public sector entities. Objective of financial statements: to provide information about the entity useful for accountability and decision-making. Two user groups: (1) resource providers — taxpayers, donors, lenders; (2) service recipients — citizens who receive government services. Unlike IFRS, which focuses on investors, IPSAS financial statements serve both accountability (did the entity do what it was authorised to do?) and decision-making (is the entity financially sustainable?). The accountability objective is primary for most public sector entities.",
      "source": "IPSASB-Conceptual-Framework-2014",
      "score": 1.0
    },
    {
      "text": "Qualitative characteristics of financial information under IPSAS Conceptual Framework: Fundamental — Relevance (has predictive or confirmatory value) and Faithful Representation (complete, neutral, free from material error). Enhancing — Understandability, Timeliness, Comparability, Verifiability. Cost-benefit constraint applies. A key public-sector-specific characteristic is that faithful representation requires showing the substance of transactions even where legal form differs — for example, service concession assets controlled by the grantor are recognised on the grantor''s Statement of Financial Position regardless of legal title.",
      "source": "IPSASB-Conceptual-Framework-Qualitative-Characteristics",
      "score": 1.0
    },
    {
      "text": "Elements of financial statements under the IPSAS Conceptual Framework: Assets (resource controlled by the entity as a result of a past event from which future economic benefits or service potential is expected to flow), Liabilities (present obligation requiring probable outflow of resources), Net Assets/Equity (residual after deducting liabilities from assets). Revenue and expenses are defined by changes in assets and liabilities. The public-sector-specific concept of ''service potential'' distinguishes IPSAS from IFRS — an asset need not generate cash to qualify; it qualifies if it delivers services (e.g. a school building, a road).",
      "source": "IPSASB-Conceptual-Framework-Elements",
      "score": 1.0
    },
    {
      "text": "Accounting basis options under IPSAS: (1) Accrual basis — transactions recognised when they occur regardless of when cash flows. Full IPSAS 1-48 suite applies. (2) Cash basis — only cash receipts and payments recognised. Cash Basis IPSAS (revised 2017) applies. The revised Cash Basis IPSAS has Part 1 (required) and Part 2 (encouraged additional disclosures). Most Pacific Island governments including Solomon Islands currently report under Cash Basis IPSAS Part 1. Transition to accrual is governed by IPSAS 33 (First-time Adoption), which provides phased-in relief periods for specific asset and liability classes.",
      "source": "IPSAS-Accounting-Basis-Options",
      "score": 1.0
    }
  ]'::jsonb,

  'The IPSASB Conceptual Framework (2014) is the foundation for all IPSAS standards. It defines the objective of financial reporting as providing information useful for accountability and decision-making by resource providers (taxpayers, donors, lenders) and service recipients (citizens). Unlike IFRS, the accountability objective — demonstrating that resources were used as authorised — is primary for most public sector entities.

The Framework establishes two fundamental qualitative characteristics: Relevance (information has predictive or confirmatory value) and Faithful Representation (complete, neutral, free from material error). Enhancing characteristics (understandability, timeliness, comparability, verifiability) improve usefulness when the fundamentals are met.

The public-sector-specific concept of service potential is critical: an asset qualifies for recognition not only if it generates cash but if it delivers services. A hospital building, a road, or a school qualifies as an asset because it has service potential, even if it generates no direct cash return. This distinction drives significant differences between IPSAS and IFRS in asset recognition and impairment testing.

Elements of financial statements: Assets (controlled resource, past event, future economic benefits or service potential), Liabilities (present obligation, probable outflow), Net Assets/Equity (residual interest). Revenue and expenses are defined in terms of changes in these elements, not as separate free-standing concepts.

Two accounting bases are available under IPSAS: accrual (full IPSAS suite) and cash (Cash Basis IPSAS, revised 2017). The cash basis standard has Part 1 (mandatory minimum disclosures) and Part 2 (encouraged disclosures that move toward accrual). Solomon Islands currently operates under Cash Basis IPSAS Part 1. IPSAS 33 governs the transition to accrual, providing relief periods of up to five years for specific asset classes.',

  array['conceptual framework', 'financial reporting objective', 'accountability', 'qualitative characteristics', 'relevance', 'faithful representation', 'service potential', 'public sector entities', 'net assets', 'equity', 'accounting basis', 'accrual', 'cash basis', 'IPSAS framework', 'elements of financial statements', 'IPSASB', 'resource providers', 'service recipients', 'substance over form', 'Solomon Islands reporting'],

  'current',
  4,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS conceptual framework financial reporting objectives public sector", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P02 — PRESENTATION OF FINANCIAL STATEMENTS (IPSAS 1)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P02',
  'Presentation of Financial Statements (IPSAS 1)',
  'practitioner_topic',
  array['IPSAS-1'],
  'accrual',

  '[
    {
      "text": "IPSAS 1 requires a complete set of financial statements comprising: (1) Statement of Financial Position (balance sheet); (2) Statement of Financial Performance (income statement equivalent); (3) Statement of Changes in Net Assets/Equity; (4) Cash Flow Statement (governed by IPSAS 2); (5) Budget Comparison Statement or Note (required when the entity makes its budget publicly available — governed by IPSAS 24); (6) Notes including accounting policies and explanatory information. All statements must present comparative information for the prior period. An entity may present additional statements if they enhance usefulness (e.g. a Statement of Service Performance).",
      "source": "IPSAS-1-Complete-Set",
      "score": 1.0
    },
    {
      "text": "IPSAS 1 Statement of Financial Position: Minimum line items required — assets: cash and equivalents, receivables (current), investments (current), inventories, other current assets; PPE; intangibles; investments in controlled entities/associates; other non-current assets. Liabilities: payables (current), short-term borrowings; current portion of long-term borrowings; long-term borrowings; employee benefit provisions; other non-current liabilities. Net assets/equity: accumulated surplus/deficit; reserves. Current/non-current distinction: an asset is current if expected to be realised within 12 months or the operating cycle. Governments may present by liquidity if more relevant.",
      "source": "IPSAS-1-SFP-Requirements",
      "score": 1.0
    },
    {
      "text": "IPSAS 1 Statement of Financial Performance: Revenue and expenses may be analysed by either nature (salaries, depreciation, supplies) or function (health, education, defence). The nature classification is more common in government as it aligns with how budgets are typically structured. Surplus or deficit for the period is the bottom line. Unlike IFRS, there is no concept of ''other comprehensive income'' as a separate section — all items are included in surplus/deficit unless a specific standard requires direct recognition in net assets (e.g. revaluation surpluses under IPSAS 17/45).",
      "source": "IPSAS-1-SFPerf-Requirements",
      "score": 1.0
    },
    {
      "text": "Fair presentation and compliance with IPSAS: IPSAS 1 requires that financial statements present fairly the financial position, performance, and cash flows. Where compliance with IPSAS would be so misleading as to conflict with the objectives of financial reporting, an entity may depart from the standard — but this is extremely rare and requires full disclosure of the nature of, reasons for, and financial impact of the departure. In practice, fair presentation is achieved by complying with IPSAS plus providing additional disclosures where needed. An entity cannot use a ''fair presentation override'' to avoid an unwanted IPSAS requirement.",
      "source": "IPSAS-1-Fair-Presentation",
      "score": 0.9
    }
  ]'::jsonb,

  'IPSAS 1 governs the overall presentation of financial statements for entities reporting on the accrual basis. A complete set of financial statements comprises: Statement of Financial Position, Statement of Financial Performance, Statement of Changes in Net Assets/Equity, Cash Flow Statement (IPSAS 2), Budget Comparison Statement or Note (IPSAS 24 when budget is publicly available), and Notes. All statements require prior-period comparative figures.

The Statement of Financial Position must distinguish current and non-current assets and liabilities, unless a liquidity presentation is more relevant (permitted for entities where liquidity drives decision-making). Minimum line items are prescribed; additional line items, headings, and subtotals must be added where relevant to understanding financial position.

The Statement of Financial Performance presents revenue and expenses either by nature (salaries, depreciation, materials) or by function (health, education, general administration). Nature classification is most common in government as it aligns with budget structure. Unlike IFRS, there is no separate other comprehensive income section — all items flow through surplus/deficit unless a specific standard requires direct recognition in net assets (such as revaluation surpluses).

Key compliance requirements: accounting policies must be disclosed, including the measurement basis. Where IPSAS permits a choice (cost vs revaluation for PPE; direct vs indirect method for cash flows), the choice made must be stated and applied consistently. Changes in accounting policy require retrospective restatement under IPSAS 3.',

  array['IPSAS 1', 'financial statements', 'Statement of Financial Position', 'Statement of Financial Performance', 'balance sheet', 'income statement', 'net assets', 'equity', 'current assets', 'non-current assets', 'presentation', 'comparative information', 'fair presentation', 'accounting policies', 'notes to financial statements', 'surplus deficit', 'revenue by nature', 'revenue by function', 'IPSAS presentation', 'complete set of statements'],

  'current',
  4,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 1 presentation financial statements components requirements", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P03 — CASH FLOW STATEMENTS (IPSAS 2)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P03',
  'Cash Flow Statements (IPSAS 2)',
  'practitioner_topic',
  array['IPSAS-2', 'IPSAS-1'],
  'both',

  '[
    {
      "text": "IPSAS 2 requires a cash flow statement classified into three activities: Operating — cash flows from the main revenue-producing activities and other activities not classified as investing or financing. Investing — cash flows from acquisition and disposal of long-term assets and investments. Financing — cash flows from borrowings, repayment of borrowings, and contributions from or distributions to owners. Government-specific: taxes received and transfers from other government entities are generally operating. Purchases of infrastructure are investing. New borrowings and loan repayments are financing.",
      "source": "IPSAS-2-Classification",
      "score": 1.0
    },
    {
      "text": "Two permitted methods for presenting operating cash flows: (1) Direct method — shows gross cash receipts and gross cash payments by major category (receipts from taxpayers, payments to suppliers, payments to employees). IPSAS 2 encourages this method as it provides information that is not available from the financial performance statement. (2) Indirect method — starts with surplus/deficit and adjusts for non-cash items (depreciation, provisions, changes in working capital). Both are permitted; direct method is preferred but indirect is more common in practice because the data is more readily available from accounting systems.",
      "source": "IPSAS-2-Methods",
      "score": 1.0
    },
    {
      "text": "Cash and cash equivalents definition: Cash — notes, coins, demand deposits. Cash equivalents — short-term highly liquid investments readily convertible to known amounts of cash and subject to insignificant risk of changes in value (generally maturities of three months or less from date of acquisition). For governments with a Treasury Single Account, the TSA balance is treated as cash. Restricted cash — if cash is restricted and cannot be used for general operations (e.g. held as collateral, or restricted for a specific project by donor conditions), it should be shown separately and may not qualify as a cash equivalent.",
      "source": "IPSAS-2-Cash-Equivalents",
      "score": 1.0
    },
    {
      "text": "Government-specific items in the cash flow statement: (1) Tax receipts — classified as operating; may be shown gross or net depending on whether the entity acts as principal or agent. (2) Grant receipts from donors — classified as operating unless specifically tied to acquiring a capital asset, in which case financing or investing classification is appropriate. (3) Transfers between government entities — operating if routine; investing if capital-related. (4) Interest paid — may be operating or financing (entity must disclose the policy adopted). (5) Interest received — may be operating or investing. (6) Dividends from SOEs — operating or investing. The policy adopted must be consistent period to period.",
      "source": "IPSAS-2-Government-Items",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 2 prescribes how cash flows are presented and classified. The cash flow statement is one of the few IPSAS statements required under both the accrual and cash bases (Cash Basis IPSAS also requires a cash flow statement, making it a useful bridge document during transition).

Three activity classifications: Operating (main revenue-producing and other activities), Investing (acquisition and disposal of long-term assets and investments), and Financing (changes in the size and composition of contributed capital and borrowings).

Two methods for operating cash flows: Direct method (gross cash receipts and payments by category — encouraged by IPSAS 2) and Indirect method (starts with surplus/deficit and adjusts for non-cash items — most common in practice). The direct method provides information not otherwise available and is preferred for government entities where transparency of receipts and payments is an accountability requirement.

Government-specific classification considerations: tax receipts are operating; grant receipts are operating unless tied to capital asset acquisition; interest paid and received may be operating or financing/investing (policy must be consistent). Treasury Single Account balances qualify as cash. Restricted cash (donor-tied balances, collateral) must be shown separately.

Cash equivalents: short-term highly liquid investments, maturity of three months or less from acquisition date, insignificant risk of value change.',

  array['IPSAS 2', 'cash flow statement', 'operating activities', 'investing activities', 'financing activities', 'direct method', 'indirect method', 'cash equivalents', 'Treasury Single Account', 'TSA', 'restricted cash', 'tax receipts', 'grant receipts', 'interest paid', 'interest received', 'government cash flows', 'liquidity', 'working capital', 'cash management', 'accrual to cash reconciliation'],

  'current',
  4,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 2 cash flow statement classification direct indirect method", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P04 — REVENUE: EXCHANGE TRANSACTIONS (IPSAS 9 / IPSAS 47)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P04',
  'Revenue — Exchange Transactions (IPSAS 9 and IPSAS 47)',
  'practitioner_topic',
  array['IPSAS-9', 'IPSAS-47', 'IPSAS-11'],
  'accrual',

  '[
    {
      "text": "IPSAS 9 (current until replaced by IPSAS 47 from 1 January 2026): Revenue from exchange transactions is recognised when it is probable that economic benefits or service potential will flow to the entity and the amount can be reliably measured. For rendering of services — stage of completion method (percentage of completion); for sale of goods — when risks and rewards transfer. Exchange transaction: one party receives approximately equal value in return. Government examples: fees for services (passport fees, court filing fees, user charges), rental income from government properties, interest on government loans advanced at market rates.",
      "source": "IPSAS-9-Recognition",
      "score": 1.0
    },
    {
      "text": "IPSAS 47 Revenue (effective 1 January 2026, early adoption permitted): Replaces IPSAS 9 and IPSAS 11. Uses a different classification — not exchange vs non-exchange but whether there is a ''binding arrangement''. Revenue with a binding arrangement (contract, legislation with performance obligation, or grant with conditions) is recognised as performance obligations are satisfied. Revenue without a binding arrangement (unconditional taxes, donations with no conditions) is recognised when the inflow meets asset recognition criteria. The key change: ''conditions'' (formerly triggers for liability recognition under IPSAS 23) are now performance obligations within the binding arrangement framework.",
      "source": "IPSAS-47-Framework",
      "score": 1.0
    },
    {
      "text": "Practical distinction — exchange vs non-exchange (IPSAS 9 / IPSAS 23 framework, still applicable pre-2026): A transaction is an exchange transaction if the entity receives approximately equal value in return. Test: would the entity carry out this transaction with a private party on the same terms? If yes, it is likely an exchange. User charges for services that reflect cost-recovery pricing are exchange transactions. Fees set well below cost are non-exchange (the subsidy element is a non-exchange inflow). Many government fees are partially exchange and partially non-exchange — the exchange portion is recognised under IPSAS 9, the non-exchange portion under IPSAS 23.",
      "source": "IPSAS-9-vs-23-Distinction",
      "score": 1.0
    }
  ]'::jsonb,

  'Revenue from exchange transactions is governed by IPSAS 9 (current) and will transition to IPSAS 47 from 1 January 2026. Early adoption of IPSAS 47 is permitted.

Under IPSAS 9: Exchange transactions are those where one party receives approximately equal value in return. Revenue is recognised when the inflow is probable and reliably measurable. For services, the stage-of-completion (percentage of completion) method applies. For goods, revenue is recognised when risks and rewards of ownership transfer.

Government exchange revenues include: user charges (passport fees, court filing fees, hospital fees set at cost-recovery prices), rental income from government properties, interest on loans advanced at market rates, and proceeds from sale of goods.

Under IPSAS 47 (post-2026): The exchange/non-exchange distinction is replaced by a binding arrangement framework. Revenue with a binding arrangement (contract, legislation with performance obligation, conditional grant) is recognised as performance obligations are satisfied — similar in concept to IFRS 15. Revenue without a binding arrangement is recognised when the inflow meets asset recognition criteria.

Transition: entities still applying IPSAS 9 must be aware the standard is being superseded. Preparers should compare their current policies against IPSAS 47 requirements and begin preparing for transition. Early adoption of IPSAS 47 requires simultaneous adoption of IPSAS 48 (Transfer Expenses).',

  array['IPSAS 9', 'IPSAS 47', 'exchange transactions', 'revenue recognition', 'stage of completion', 'percentage completion', 'user charges', 'fees for services', 'binding arrangement', 'performance obligation', 'IPSAS 47 transition', 'rendering of services', 'sale of goods', 'rental income', 'interest income', 'cost recovery', 'exchange non-exchange distinction', 'IPSAS 11', 'construction contracts', '2026 revenue standard'],

  'current',
  4,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 9 revenue exchange transactions recognition user charges fees", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P05 — REVENUE: NON-EXCHANGE — TAXES (IPSAS 23)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P05',
  'Revenue — Non-Exchange: Taxes (IPSAS 23)',
  'practitioner_topic',
  array['IPSAS-23', 'IPSAS-47'],
  'accrual',

  '[
    {
      "text": "IPSAS 23 — Tax revenue recognition: An inflow from a non-exchange transaction satisfies the criteria for recognition as an asset (and revenue) when it is probable that future economic benefits or service potential will flow to the entity and the fair value can be reliably measured. For taxes: a taxable event occurs when the conditions established by taxation legislation are met. Example: income tax — taxable event is earning the taxable income in the period. Customs duty — taxable event is movement of goods across the border. The entity recognises the receivable and revenue when the taxable event occurs AND the asset recognition criteria are met (probable inflow, reliably measurable).",
      "source": "IPSAS-23-Tax-Recognition",
      "score": 1.0
    },
    {
      "text": "Practical challenges in tax revenue recognition under IPSAS 23: For self-assessed taxes (income tax, GST), the government does not know the precise amount owing until taxpayers file returns. Approaches: (1) Accrual based on assessed amounts once returns are filed — most common and defensible. (2) Estimates based on prior year collections plus known economic indicators — acceptable if reliable. (3) Cash basis for taxes — not permitted under IPSAS 23 for accrual-basis reporters. Tax receivables must be disclosed separately from other receivables. Bad debt provisions on tax receivables should reflect the probability of collection.",
      "source": "IPSAS-23-Tax-Practical",
      "score": 1.0
    },
    {
      "text": "Tax revenue items commonly encountered in Pacific Islands governments: Income Tax (corporate and personal — taxable event is earning the income); GST/VAT (taxable event is the supply); Customs/import duty (taxable event is importation); Stamp duty (taxable event is execution of the relevant instrument); Property rates (taxable event is ownership during the rating period). For Solomon Islands: Major taxes are corporate income tax, personal income tax (PAYE), GST, and customs duty. Recognition is complicated by the lag between taxable event and return filing — accrual requires estimates at year end.",
      "source": "IPSAS-23-Pacific-Tax-Context",
      "score": 1.0
    }
  ]'::jsonb,

  'Tax revenue is the largest non-exchange revenue category for most governments. Under IPSAS 23, tax revenue is recognised when a taxable event occurs AND the asset recognition criteria are met (probable inflow, reliably measurable fair value).

The taxable event depends on the specific tax: for income tax it is earning the taxable income; for customs duty it is crossing the border; for GST/VAT it is making the taxable supply; for stamp duty it is executing the instrument; for property rates it is being the owner during the rating period.

The central practical challenge is the filing lag: for self-assessed taxes, the government does not know the precise amounts until taxpayers file returns, which may be months after year end. Accrual accounting requires an estimate of tax receivables at year end based on assessed amounts filed, adjusted for probable uncollectable amounts. The estimate must be disclosed and must be based on a defensible methodology.

Tax receivables on the Statement of Financial Position must: (a) be disclosed separately from other receivables, (b) carry a provision for doubtful collection, and (c) be reconciled to the tax authority''s records annually.

IPSAS 47 (effective 2026) does not fundamentally change the treatment of tax revenue — taxes remain unconditional inflows and are still recognised when the inflow meets asset recognition criteria.',

  array['IPSAS 23', 'tax revenue', 'non-exchange revenue', 'taxable event', 'income tax', 'GST', 'customs duty', 'VAT', 'stamp duty', 'property rates', 'tax receivables', 'filing lag', 'year-end estimates', 'self-assessed taxes', 'bad debt provision', 'tax authority', 'Solomon Islands tax', 'PAYE', 'revenue accrual', 'non-exchange recognition'],

  'current',
  4,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 23 tax revenue non-exchange taxable event recognition", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P06 — REVENUE: NON-EXCHANGE — GRANTS AND TRANSFERS (IPSAS 23)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P06',
  'Revenue — Non-Exchange: Grants and Transfers (IPSAS 23)',
  'practitioner_topic',
  array['IPSAS-23', 'IPSAS-47', 'IPSAS-48'],
  'accrual',

  '[
    {
      "text": "IPSAS 23 — Grants and transfers: A transfer is a non-exchange transaction in which an entity receives assets without directly giving approximately equal value in return. Recognition: when it is probable that the inflow will occur AND the fair value can be reliably measured. The critical distinction is between conditions and restrictions. A condition is a requirement that, if not met, requires the entity to return the transferred resources or cease using them — it creates a liability (deferred revenue) until the condition is satisfied. A restriction is a stipulation that limits how the resource can be used — it does NOT create a liability; revenue is recognised on receipt.",
      "source": "IPSAS-23-Conditions-vs-Restrictions",
      "score": 1.0
    },
    {
      "text": "Practical test for conditions vs restrictions (IPSAS 23): A condition exists when: (1) the grantor can require repayment if the condition is not met; and (2) there are enforceable performance requirements attached. A restriction exists when the grantor specifies the purpose but cannot demand repayment if the restriction is breached (only the future flow stops). Example — Conditional grant: ''AUD 2 million to build a school; unspent funds must be returned.'' → Liability recognised until building is complete. Example — Restricted grant: ''AUD 2 million for education generally.'' → Revenue recognised on receipt; expenditure of funds not required for revenue recognition.",
      "source": "IPSAS-23-Practical-Test",
      "score": 1.0
    },
    {
      "text": "In-kind grants and non-cash transfers: IPSAS 23 applies to transfers of assets other than cash — goods, services, use of assets. Recognition: at fair value at the date of receipt. In-kind contributions that are reliably measurable should be recognised. Common in-kind items in Pacific Islands: technical assistance (value is the market rate of the services received); donated goods (food aid, medical supplies); asset transfers (vehicles, equipment). Governments often understate assets by not recognising in-kind transfers — this understates both revenue and assets on the Statement of Financial Position.",
      "source": "IPSAS-23-In-Kind-Grants",
      "score": 1.0
    },
    {
      "text": "IPSAS 47/48 transition (effective 2026): Under IPSAS 47, grants become revenue recognised as ''binding arrangement'' performance obligations are satisfied. The concept of a performance obligation replaces the condition/restriction distinction. Conditional grants (which create a liability under IPSAS 23) will become revenue recognised when the entity satisfies the performance obligation in the binding arrangement. Non-conditional grants remain recognised on receipt. The practical impact: entities may recognise grant revenue later under IPSAS 47 if performance obligations are defined strictly, or earlier if conditions are interpreted as less than performance obligations.",
      "source": "IPSAS-47-48-Grants-Transition",
      "score": 0.9
    }
  ]'::jsonb,

  'Grant and transfer revenue is governed by IPSAS 23 (current) and transitions to IPSAS 47 (effective 2026). The central accounting question under IPSAS 23 is whether attached stipulations create a liability (condition) or merely restrict usage (restriction).

A condition: requires return of resources or cessation of use if not met. Creates a liability (deferred revenue) until the condition is satisfied. Revenue is recognised progressively as conditions are met. A restriction: specifies purpose but does not require repayment. Revenue is recognised on receipt.

The practical test: can the grantor legally demand repayment if the entity does not comply? If yes — condition, create a liability. If no — restriction, recognise revenue immediately.

In-kind grants (technical assistance, donated goods, asset transfers) are recognised at fair value at date of receipt. Pacific Island governments frequently understate assets by omitting in-kind transfers from recognition — this is a material omission where assistance is substantial.

Multi-year grants: where a grant agreement spans multiple years and conditions attach to each tranche, each tranche is treated independently. Revenue from tranche 1 is recognised when tranche 1 conditions are met; the tranche 2 portion remains a liability until tranche 2 conditions are met.

Under IPSAS 47/48 (2026): conditions become performance obligations within binding arrangements. The substance is similar but the measurement framework is more precise.',

  array['IPSAS 23', 'grants', 'transfers', 'non-exchange revenue', 'conditions', 'restrictions', 'deferred revenue', 'liability recognition', 'in-kind grants', 'technical assistance', 'donor grants', 'ADB', 'World Bank grants', 'conditional grant', 'unconditional grant', 'grant revenue recognition', 'IPSAS 47 grants', 'IPSAS 48', 'multi-year grants', 'Pacific Islands grants', 'Solomon Islands aid'],

  'current',
  4,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 23 grants transfers non-exchange conditions restrictions revenue recognition", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P07 — EXPENSES AND EXPENDITURE RECOGNITION
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P07',
  'Expenses and Expenditure Recognition',
  'practitioner_topic',
  array['IPSAS-1', 'IPSAS-3', 'IPSAS-5', 'IPSAS-12', 'IPSAS-17'],
  'accrual',

  '[
    {
      "text": "IPSAS defines an expense as a decrease in net assets/equity (other than distributions to owners) that results from a decrease in assets or an increase in liabilities. The accrual principle requires expenses to be recognised when the obligation arises (when goods or services are received), not when cash is paid. Key implication: salaries accrued at year end but paid in the following year must be recognised as an expense and a liability in the current period. Similarly, invoices received before year end for goods already delivered must be accrued even if unpaid.",
      "source": "IPSAS-Expense-Definition",
      "score": 1.0
    },
    {
      "text": "Classification of expenses by nature (preferred in government): (1) Employee costs — salaries, wages, allowances, employer contributions to superannuation/pension, leave entitlements; (2) Supplies and consumables — goods consumed in operations; (3) Depreciation and amortisation — consumption of PPE and intangibles; (4) Finance costs — interest on borrowings; (5) Grants and transfers paid — transfers to other entities; (6) Other operating expenses. Classification by function (alternative): health, education, general public services, defence, etc. The choice between nature and function classification must be disclosed and applied consistently.",
      "source": "IPSAS-1-Expense-Classification",
      "score": 1.0
    },
    {
      "text": "Common accrual adjustments for government expenses: (1) Salary accruals — employees work in June but are paid in July; accrue the June expense. (2) Supplier invoices in transit — goods received before year end, invoice arrives after; accrue at year end based on goods received. (3) Utilities — estimated accrual for last billing period of year. (4) Leave liabilities — annual leave and long service leave entitlements must be recognised as they accrue, not when taken. (5) Depreciation — annual charge must be calculated for all depreciable assets. (6) Provisions — for legal claims, redundancy, restoration obligations (IPSAS 19). These accruals are the most common areas of audit finding in transitioning governments.",
      "source": "IPSAS-Expense-Accruals-Practical",
      "score": 1.0
    }
  ]'::jsonb,

  'Expense recognition under IPSAS follows the accrual principle: an expense is recognised when an obligation arises, not when cash is paid. The entity has an expense when goods or services are received, and a liability to the counterparty. Payment merely settles the liability already recognised.

Common accrual-basis expenses government must recognise that are often missed in cash-basis transition: salary accruals (June services paid in July), supplier invoices in transit (goods received, invoice not yet processed), utility accruals (estimated costs for the final billing period), leave liabilities (annual leave and long service leave accrue continuously), depreciation (systematic allocation of PPE cost over useful life), and provisions for probable obligations (legal claims, restoration obligations, redundancy).

Classification by nature (most common in government): employee costs, supplies and consumables, depreciation, finance costs, grants and transfers, other. Classification by function: health, education, general public services, social protection, etc. The choice must be disclosed and consistently applied.

The most significant accrual failures in first-time IPSAS adopters: (1) omitting leave liabilities — can be material where accumulated leave is large; (2) omitting depreciation — requires a complete and valued asset register; (3) failing to accrue year-end supplier balances — commonly treated as cash items.',

  array['expense recognition', 'accrual basis', 'employee costs', 'salaries', 'depreciation', 'amortisation', 'supplies', 'grants paid', 'leave liabilities', 'annual leave', 'long service leave', 'provisions', 'year-end accruals', 'invoices in transit', 'utility accruals', 'expense classification', 'nature vs function', 'IPSAS expenses', 'operating expenses', 'expenditure'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS expense recognition accrual basis classification government", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P08 — TRANSFER EXPENSES (IPSAS 48)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P08',
  'Transfer Expenses (IPSAS 48)',
  'practitioner_topic',
  array['IPSAS-48', 'IPSAS-23', 'IPSAS-19'],
  'accrual',

  '[
    {
      "text": "IPSAS 48 Transfer Expenses (effective 1 January 2026, replaces the expense side of IPSAS 23 and IPSAS 19 for transfer-related provisions): A transfer expense is an outflow of resources from the reporting entity to another party in a non-exchange transaction. Examples: grants to lower-level governments, social benefit payments, transfers to SOEs, disaster relief payments, subsidies. The standard requires a transfer expense liability to be recognised when the entity has a present obligation that it cannot avoid. For binding arrangements (e.g. a grant agreement with conditions), the expense and liability are recognised as the conditions become obligatory on the entity paying.",
      "source": "IPSAS-48-Framework",
      "score": 1.0
    },
    {
      "text": "IPSAS 48 and social benefits: Social benefits paid to individuals (pensions, unemployment benefits, disability payments, universal health benefits) are a significant category of transfer expense. Recognition: the obligation to pay arises when the beneficiary satisfies the qualifying conditions (age, disability status, unemployment). For recurring social benefits, the current period''s entitlement is recognised as an expense and liability. The liability is extinguished when payment is made. For defined social benefit schemes with actuarially calculated obligations (like pension schemes), the liability is measured actuarially and accounted for under IPSAS 39 (employee benefits) or IPSAS 48 depending on whether the recipients are employees.",
      "source": "IPSAS-48-Social-Benefits",
      "score": 1.0
    },
    {
      "text": "Transition from IPSAS 23 to IPSAS 48: Under IPSAS 23 (current), a transfer expense is recognised when there is a ''present obligation'' — broadly when the entity has formally committed and cannot withdraw. Under IPSAS 48, the timing aligns more precisely with when the conditions for payment are met by the recipient. Key change: goods and services received free of charge from a transfer recipient must be recognised by the receiving entity (IPSAS 47) and the equivalent expense by the paying entity (IPSAS 48). This closes a gap in the current standards where in-kind transfers were often not recognised symmetrically.",
      "source": "IPSAS-48-Transition",
      "score": 0.9
    }
  ]'::jsonb,

  'IPSAS 48 Transfer Expenses (effective 2026) governs the recognition and measurement of outflows in non-exchange transactions — payments the entity makes without receiving approximately equal value in return. It replaces the expense recognition aspects of IPSAS 23 and IPSAS 19 for transfer-related provisions.

Transfer expenses include: grants to provincial and local governments, social benefit payments (pensions, unemployment benefits, disability allowances), transfers to state-owned enterprises, disaster relief, subsidies, and in-kind transfers (donated goods, technical assistance provided).

Recognition: a transfer expense liability is recognised when the entity has a present obligation it cannot avoid. For binding arrangements with conditions (e.g. a grant agreement requiring the recipient to achieve specified outcomes), the expense is recognised as those conditions create an unavoidable obligation.

Social benefits: recognised when the beneficiary satisfies qualifying conditions (age, income threshold, disability status). For multi-period schemes, the current period''s entitlement is an expense; long-term actuarial obligations fall under IPSAS 39 if employment-related, or IPSAS 48 if broader.

Key transition change: IPSAS 47 and 48 together require symmetrical recognition of in-kind transfers — the payer recognises an expense, the recipient recognises revenue. This closes a gap where in-kind transfers were commonly omitted from both parties'' financial statements.',

  array['IPSAS 48', 'transfer expenses', 'grants payable', 'social benefits', 'pensions', 'disability payments', 'subsidies', 'non-exchange expenditure', 'present obligation', 'binding arrangement', 'in-kind transfers', 'grants to local government', 'SOE transfers', 'disaster relief', 'social protection', 'IPSAS 48 transition', 'IPSAS 23 replacement', 'transfer liability', 'social benefit recognition', 'government payments'],

  'current',
  4,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 48 transfer expenses social benefits grants non-exchange", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P09 — PROPERTY, PLANT AND EQUIPMENT (IPSAS 17 / IPSAS 45)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P09',
  'Property, Plant and Equipment (IPSAS 17 / IPSAS 45)',
  'practitioner_topic',
  array['IPSAS-17', 'IPSAS-45', 'IPSAS-46', 'IPSAS-21'],
  'accrual',

  '[
    {
      "text": "IPSAS 17 / IPSAS 45 — Recognition criteria for PPE: An item of property, plant and equipment is recognised as an asset when (a) it is probable that future economic benefits or service potential associated with the item will flow to the entity, and (b) the fair value or cost can be reliably measured. Government-specific: the service potential criterion means that assets used to deliver public services (roads, schools, hospitals) qualify even if they generate no direct cash return. Minimum capitalisation thresholds are not set by IPSAS — entities must determine their own threshold based on materiality. In practice, thresholds of USD 500-5,000 are common for developing country governments.",
      "source": "IPSAS-17-Recognition",
      "score": 1.0
    },
    {
      "text": "IPSAS 17 / IPSAS 45 — Measurement models: (1) Cost model: asset carried at cost less accumulated depreciation and impairment. Cost = purchase price + directly attributable costs of bringing the asset to its location and condition for use. (2) Revaluation model: asset carried at fair value at revaluation date less subsequent depreciation and impairment. Fair value for government assets: market value where available; depreciated replacement cost for specialised assets with no market (common for infrastructure, hospitals, military assets). Revaluation must be performed with sufficient regularity to ensure carrying amount does not differ materially from fair value.",
      "source": "IPSAS-17-Measurement-Models",
      "score": 1.0
    },
    {
      "text": "Depreciation under IPSAS 17 / 45: Each component of an asset with a cost that is significant relative to the total cost must be depreciated separately (component approach). Example: a building might have components — structure (40 years), roof (15 years), HVAC (10 years), fitout (7 years). Depreciation method must reflect the pattern of consumption of service potential: straight-line is most common; diminishing balance is appropriate where service potential is consumed faster in earlier years. Land is not depreciated. Heritage assets and infrastructure may have very long useful lives; where indefinite, not depreciated but tested for impairment.",
      "source": "IPSAS-17-Depreciation",
      "score": 1.0
    },
    {
      "text": "First-time recognition of PPE in governments transitioning to accrual (IPSAS 33): The opening Statement of Financial Position must include all PPE. This is the single most challenging task in IPSAS adoption for developing countries. Required: (1) physical inventory of all assets; (2) condition assessment; (3) valuation at fair value (preferred) or estimated historical cost less depreciation. IPSAS 33 provides a five-year transitional relief period allowing entities to defer recognition of specific PPE classes. However, deferred PPE must still be disclosed and the transitional relief must be disclosed. In Solomon Islands context: road infrastructure, government buildings, vehicles, and marine vessels are the major PPE categories requiring recognition.",
      "source": "IPSAS-33-PPE-Transition",
      "score": 1.0
    }
  ]'::jsonb,

  'PPE is typically the largest asset class on a government''s Statement of Financial Position. IPSAS 17 governs PPE (currently effective); IPSAS 45 replaces it from 1 January 2025. The key changes in IPSAS 45: adoption of IPSAS 46 measurement concepts including current operational value for assets held for service delivery; revised guidance on heritage assets; and clarifications on componentisation.

Recognition: an item is recognised as an asset when it is probable that future economic benefits or service potential will flow to the entity, and the fair value or cost can be reliably measured. Service potential (not just cash-generating capacity) is the key test — a road, school, or health clinic qualifies.

Measurement after recognition: Cost model (cost less accumulated depreciation and impairment) or Revaluation model (fair value less subsequent depreciation). For specialised government assets without market prices, fair value is estimated using depreciated replacement cost (DRC) — the cost to replace the asset in its current condition using modern equivalent assets.

Depreciation: Component approach required where components have materially different useful lives. Land is not depreciated. Useful life must reflect the entity''s actual maintenance and replacement patterns, not manufacturer estimates.

First-time adoption challenge: recognising the opening PPE balance is the most resource-intensive task in IPSAS transition. IPSAS 33 allows a five-year deferral for specific PPE classes. Despite this, entities must plan systematically for full recognition.',

  array['IPSAS 17', 'IPSAS 45', 'PPE', 'property plant equipment', 'infrastructure', 'roads', 'buildings', 'vehicles', 'asset register', 'cost model', 'revaluation model', 'depreciated replacement cost', 'DRC', 'fair value', 'componentisation', 'useful life', 'depreciation', 'capitalisation threshold', 'first-time adoption PPE', 'IPSAS 33 PPE relief', 'IPSAS 46', 'current operational value', 'heritage assets'],

  'current',
  4,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 17 45 property plant equipment recognition measurement depreciation government", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P10 — INTANGIBLE ASSETS (IPSAS 31)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P10',
  'Intangible Assets (IPSAS 31)',
  'practitioner_topic',
  array['IPSAS-31', 'IPSAS-21'],
  'accrual',

  '[
    {
      "text": "IPSAS 31 — Recognition of intangible assets: An intangible asset is an identifiable non-monetary asset without physical substance that is controlled by the entity and expected to provide future economic benefits or service potential. Three criteria must all be met: (1) Identifiability — separable from the entity or arises from contractual/legal rights; (2) Control — power to obtain the economic benefits or service potential and restrict others from accessing them; (3) Future economic benefits or service potential — must flow to the entity. Common government intangibles: computer software (developed or purchased), licences, patents, database rights, emission trading rights.",
      "source": "IPSAS-31-Recognition",
      "score": 1.0
    },
    {
      "text": "Internally generated intangibles under IPSAS 31: Expenditure on internally developed software or other intangibles is split between a research phase (expense as incurred) and a development phase (capitalise when technical feasibility is demonstrated, intention to complete, ability to use, how it will generate service potential, adequate resources, ability to reliably measure expenditure). Internally generated goodwill, brand names, and publishing titles cannot be recognised as assets. Key for government: ERP system implementations are often partially capitalised — module development costs in the development phase can be capitalised; training costs and data migration costs cannot.",
      "source": "IPSAS-31-Internally-Generated",
      "score": 1.0
    },
    {
      "text": "Amortisation of intangible assets: If the useful life is finite, the asset is amortised over its useful life using a method that reflects consumption of service potential (straight-line is most common). If the useful life is indefinite, the asset is not amortised but must be tested for impairment annually under IPSAS 21. Computer software: typical useful life 3-7 years. Licences: amortised over licence period. Emission rights: held to use in compliance period — typically not amortised but tested for impairment.",
      "source": "IPSAS-31-Amortisation",
      "score": 0.9
    }
  ]'::jsonb,

  'Intangible assets in government are less common than PPE but can be material — particularly computer software, ERP systems, licences, and database rights.

Recognition requires three conditions to all be met: identifiability (separable or from legal/contractual rights), control (power to obtain benefits and restrict access), and expected future economic benefits or service potential.

Internally generated intangibles follow a research-phase/development-phase split. Research phase costs are expensed. Development phase costs are capitalised from the point where technical feasibility is established, intent to complete is demonstrated, resources are available, and measurement is reliable. For government ERP implementations: module build costs in the development phase can be capitalised; training, data migration, and post-implementation maintenance costs cannot.

Purchased intangibles (off-the-shelf software, acquired licences) are recognised at cost. Finite-life intangibles are amortised over useful life. Indefinite-life intangibles are not amortised but tested annually for impairment under IPSAS 21.',

  array['IPSAS 31', 'intangible assets', 'computer software', 'ERP system', 'licences', 'patents', 'database rights', 'internally generated', 'research phase', 'development phase', 'capitalisation', 'amortisation', 'indefinite useful life', 'impairment intangibles', 'identifiability', 'control', 'service potential', 'software development costs', 'FMIS', 'government intangibles'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 31 intangible assets software licences recognition amortisation government", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P11 — LEASES (IPSAS 43)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P11',
  'Leases (IPSAS 43)',
  'practitioner_topic',
  array['IPSAS-43', 'IPSAS-21', 'IPSAS-26', 'IPSAS-5'],
  'accrual',

  '[
    {
      "text": "IPSAS 43 Leases (effective 1 January 2025, replacing IPSAS 13): Lessee accounting uses a single right-of-use model. A lessee recognises a right-of-use (ROU) asset and a lease liability for virtually all leases at the commencement date. The ROU asset is initially measured at the lease liability amount plus initial direct costs, prepayments made, and estimated restoration costs. The lease liability is the present value of unpaid lease payments, discounted using the interest rate implicit in the lease (if readily determinable) or the lessee''s incremental borrowing rate. This eliminates the former finance/operating lease distinction for lessees — all leases are on-balance-sheet.",
      "source": "IPSAS-43-Lessee-ROU-Model",
      "score": 1.0
    },
    {
      "text": "IPSAS 43 — Lessee exemptions: Two practical expedients allow lessees to avoid on-balance-sheet recognition: (1) Short-term leases: lease term of 12 months or less at commencement date, with no purchase option. The entity must elect this by class of underlying asset. (2) Low-value assets: individual asset is of low value when new (IPSAS 43 does not set a threshold — entities set their own materiality level, typically USD 5,000 or local equivalent). If either exemption applies, lease payments are recognised as an expense on a straight-line basis or another systematic basis over the lease term. These exemptions are commonly applied by governments for office equipment, small vehicles, and short-term property rentals.",
      "source": "IPSAS-43-Lessee-Exemptions",
      "score": 1.0
    },
    {
      "text": "IPSAS 43 — Lessor accounting: Lessor accounting is substantially unchanged from IPSAS 13. Lessors continue to classify leases as finance leases (risks and rewards substantially transferred to lessee) or operating leases (risks and rewards retained by lessor). For finance leases: derecognise asset, recognise net investment in lease; unearned finance income is recognised over the lease term using the effective interest method. For operating leases: asset remains on lessor''s Statement of Financial Position and is depreciated; lease income is recognised on a straight-line or systematic basis.",
      "source": "IPSAS-43-Lessor-Accounting",
      "score": 1.0
    },
    {
      "text": "IPSAS 43 — Concessionary leases and government context: A concessionary lease is one where the lease terms are significantly below market terms (common in government-to-government or government-to-NGO arrangements). At commencement, the lessee recognises the ROU asset at fair value (not just the lease liability). The difference between fair value and present value of lease payments is accounted for under IPSAS 23 or IPSAS 47 (non-exchange revenue for the lessee) or IPSAS 48 (transfer expense for the lessor). Pacific Islands context: government properties leased to community organisations at nominal rent are concessionary leases. IPSAS 43 concessionary lease amendments are effective 1 January 2027.",
      "source": "IPSAS-43-Concessionary-Leases",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 43 (effective 1 January 2025) replaces IPSAS 13 and adopts the IFRS 16 right-of-use model for lessees. Every lease, except short-term and low-value leases, is recognised on the lessee''s Statement of Financial Position as a right-of-use asset and a corresponding lease liability.

The ROU asset is initially measured at the lease liability, plus initial direct costs, advance payments, and any restoration cost estimate. The lease liability equals the present value of future lease payments, discounted at the implicit rate (if known) or the incremental borrowing rate. Subsequently, the ROU asset is depreciated over the lease term (or useful life if shorter and ownership transfers), and the lease liability is unwound using the effective interest method.

Two practical expedients allow simplified treatment: (1) short-term leases (term ≤12 months at commencement) and (2) low-value assets (entity-determined threshold). Both may be treated as operating expense on a straight-line basis. These exemptions are commonly applied by governments for vehicles, office equipment, and short-term accommodation.

Lessor accounting retains the IPSAS 13 finance/operating distinction. This reflects that IPSAS 43 focuses primarily on improving lessee transparency — the lessor''s exposure is less affected by off-balance-sheet risk.

Concessionary leases — where rent is significantly below market — require the lessee to recognise the ROU asset at fair value with the discount recognised as non-exchange revenue (IPSAS 23/47). The concessionary lease amendments are effective 1 January 2027.

Government entities are commonly lessors (government-owned buildings rented to agencies, SOEs, or NGOs) and lessees (office space, vehicles, equipment). IPSAS 43 will increase reported assets and liabilities for most governments currently treating operating leases as off-balance-sheet items.',

  array['IPSAS 43', 'leases', 'right-of-use asset', 'ROU', 'lease liability', 'lessee', 'lessor', 'finance lease', 'operating lease', 'short-term lease', 'low-value asset', 'incremental borrowing rate', 'implicit rate', 'concessionary lease', 'IPSAS 13 replacement', 'lease term', 'lease payments', 'present value', 'government leases', 'below-market lease'],

  'current',
  4,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 43 leases right-of-use asset lessee lessor government recognition", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P12 — INVENTORIES (IPSAS 12)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P12',
  'Inventories (IPSAS 12)',
  'practitioner_topic',
  array['IPSAS-12', 'IPSAS-46'],
  'accrual',

  '[
    {
      "text": "IPSAS 12 — Scope and types of inventories: Inventories are assets held for sale in the ordinary course of operations, in the process of production for such sale, or in the form of materials or supplies to be consumed in the production process or in the rendering of services. Government inventories commonly include: (1) Consumable stores — stationery, fuel, medical supplies, food aid; (2) Maintenance materials — spare parts for infrastructure and vehicles; (3) Goods for distribution — items to be distributed to beneficiaries at no charge or below cost (social welfare goods, disaster relief supplies); (4) Work in progress — partially completed service outputs; (5) Strategic reserves — food, fuel, or medicines held as emergency buffers.",
      "source": "IPSAS-12-Scope",
      "score": 1.0
    },
    {
      "text": "IPSAS 12 — Measurement: The measurement rule depends on how inventories will be used. (1) Inventories held for sale in the ordinary course of operations: measured at the lower of cost and net realisable value (NRV). NRV is the estimated selling price less the estimated costs of completion and selling costs. (2) Inventories held for distribution at no charge or for a nominal charge (service delivery inventories): measured at the lower of cost and current replacement cost. Current replacement cost is the cost to acquire an equivalent inventory item at measurement date — relevant because a below-cost selling price does not indicate that cost recovery is possible via sale. This is a significant departure from IAS 2/IPSAS practice for commercial entities.",
      "source": "IPSAS-12-Measurement",
      "score": 1.0
    },
    {
      "text": "IPSAS 12 — Cost formulas and write-down: Cost includes purchase price, import duties, transport, handling, and other directly attributable costs less trade discounts and rebates. Cost formulas permitted: FIFO (first-in, first-out) or weighted average. LIFO (last-in, first-out) is prohibited. Where inventories are fungible (identical), FIFO and weighted average give different results — the entity must choose one and apply it consistently to all inventories of a similar nature and use. Write-down to NRV or current replacement cost: recognised as an expense in the period the write-down occurs. Reversal of write-down is required if circumstances that caused the write-down no longer exist.",
      "source": "IPSAS-12-Cost-Formulas",
      "score": 1.0
    }
  ]'::jsonb,

  'Inventories under IPSAS 12 cover goods held for sale, production, or use in service delivery. The key distinction unique to public sector accounting is the measurement basis: inventories held for sale use the lower of cost and net realisable value (same as IFRS); inventories held for distribution to beneficiaries at no charge or nominal charge use the lower of cost and current replacement cost.

This distinction matters because governments regularly hold inventories that will never be sold at a profit — food aid, medical supplies, disaster relief goods, and subsidised goods. For these, the selling price (zero or nominal) would otherwise trigger a write-down to zero under the NRV test, which does not reflect the economic reality that the goods have value in service delivery. Current replacement cost preserves that value.

Cost formulas: FIFO or weighted average. LIFO is prohibited under IPSAS 12. The cost formula must be applied consistently to all inventories of similar nature and use.

Common government inventory accounting failures: (1) holding large consumable stores off-balance-sheet entirely — these must be recognised as assets; (2) not distinguishing distribution inventories from sale inventories and applying the wrong measurement basis; (3) failing to write down obsolete or damaged inventories at year end.

IPSAS 46 (Measurement, effective 2025) introduces current replacement cost as a formal measurement basis, providing additional guidance consistent with IPSAS 12''s requirement for distribution inventories.',

  array['IPSAS 12', 'inventories', 'consumable stores', 'service delivery inventories', 'distribution inventories', 'net realisable value', 'NRV', 'current replacement cost', 'FIFO', 'weighted average', 'LIFO prohibited', 'medical supplies', 'food aid', 'strategic reserves', 'maintenance materials', 'spare parts', 'write-down inventories', 'disaster relief stocks', 'inventory cost formulas', 'government inventory'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 12 inventories measurement service delivery distribution cost formula government", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P13 — INVESTMENT PROPERTY (IPSAS 16)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P13',
  'Investment Property (IPSAS 16)',
  'practitioner_topic',
  array['IPSAS-16', 'IPSAS-17', 'IPSAS-21', 'IPSAS-26'],
  'accrual',

  '[
    {
      "text": "IPSAS 16 — Definition and scope: Investment property is land or a building (or part of a building), or both, held to earn rentals or for capital appreciation, or both, rather than for use in the production or supply of goods or services, for administrative purposes, or for sale in the ordinary course of operations. Government examples: a government-owned commercial office building rented to private sector tenants; surplus land held for future sale at appreciated value; a government building leased to an NGO at a commercial rental rate. NOT investment property: a government building used by a ministry (PPE under IPSAS 17); surplus land held for sale in the ordinary course (inventory under IPSAS 12).",
      "source": "IPSAS-16-Definition",
      "score": 1.0
    },
    {
      "text": "IPSAS 16 — Measurement models: An entity must choose either the cost model or the fair value model and apply it to all investment property. (1) Cost model: investment property is carried at cost less accumulated depreciation and impairment (same as IPSAS 17 cost model for PPE). However, the entity must disclose the fair value in the notes. (2) Fair value model: investment property is carried at fair value at each reporting date; changes in fair value are recognised in surplus/deficit for the period. The fair value model does not allow depreciation — the fair value adjustment replaces it. The fair value model is more informative but requires reliable fair value determination, which can be difficult for specialised government properties.",
      "source": "IPSAS-16-Measurement",
      "score": 1.0
    },
    {
      "text": "IPSAS 16 — Transfers and government context: Transfer between investment property and PPE or inventories occurs when there is a change in use — evidenced by commencement of owner-occupation (transfer to PPE), commencement of development for sale (transfer to inventories), or end of owner-occupation (transfer to investment property). For governments: many assets reside on the boundary between PPE and investment property — a partially occupied government building (part owner-occupied, part rented out) must be split: the owner-occupied portion is PPE, the rented portion is investment property. Where portions cannot be measured separately and the rental portion is not significant, the entire asset is classified as PPE.",
      "source": "IPSAS-16-Transfers",
      "score": 0.9
    }
  ]'::jsonb,

  'Investment property under IPSAS 16 is property held for rental income or capital appreciation — not for use in delivering government services or for administrative purposes. This distinguishes it from PPE (IPSAS 17) and owner-occupied property.

Government investment property is less common than in the private sector but does arise: commercial buildings rented at market rates, surplus land held for appreciation, and government-owned properties leased to private tenants or NGOs at commercial rentals.

Two measurement models are available, applied consistently to all investment property: the cost model (cost less depreciation and impairment, with fair value disclosed in notes) or the fair value model (fair value at each reporting date, changes through surplus/deficit, no depreciation). The fair value model provides more relevant information but requires reliable fair value inputs, which may be difficult for government properties in thin markets.

The boundary between PPE and investment property requires judgment. A partially occupied government building must be split if the portions are separately measurable. Mixed-use property where the rental portion is not significant is classified as PPE in full.

Transfers between classifications occur when use changes — not as a result of a management decision alone but when there is evidence of the change in use (e.g., commencement of construction for sale, or first lease to an external tenant).',

  array['IPSAS 16', 'investment property', 'rental income', 'capital appreciation', 'fair value model', 'cost model', 'owner-occupied property', 'PPE boundary', 'government property', 'surplus land', 'commercial buildings', 'fair value changes', 'transfer between classifications', 'partially occupied building', 'investment property disclosure', 'government leases commercial', 'property portfolio'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 16 investment property recognition fair value cost model government", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P14 — IMPAIRMENT — NON-CASH-GENERATING ASSETS (IPSAS 21)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P14',
  'Impairment — Non-Cash-Generating Assets (IPSAS 21)',
  'practitioner_topic',
  array['IPSAS-21', 'IPSAS-46', 'IPSAS-17', 'IPSAS-31'],
  'accrual',

  '[
    {
      "text": "IPSAS 21 — Scope and trigger: Applies to non-cash-generating (NCG) assets — assets held primarily to deliver public services rather than to generate commercial cash flows. Examples: public roads, schools, hospitals, government offices, community halls, parks. An impairment review is required when there is an impairment indicator. Indicators: (External) significant decline in asset''s service utility; asset is idle or to be discontinued; evidence of physical damage; plan to dispose of asset before expected end of useful life. (Internal) significant changes in how the asset is used; evidence asset is performing worse than expected. Entities with many NCG assets should establish a systematic review process rather than waiting for observable indicators.",
      "source": "IPSAS-21-Trigger",
      "score": 1.0
    },
    {
      "text": "IPSAS 21 — Recoverable service amount: The recoverable service amount (RSA) is the higher of the asset''s fair value less costs to sell (FVLCTS) and its value in use (VIU). For NCG assets, VIU is NOT measured using discounted cash flows (which are immaterial or zero for service assets). Instead, VIU is assessed using one of three approaches: (1) Depreciated replacement cost (DRC) — cost to replace or reproduce the asset in its current condition using modern equivalent assets, net of accumulated depreciation. Most common for government assets. (2) Restoration cost approach — cost to restore the asset to its current service capacity. (3) Service units approach — present value of the remaining service potential of the asset. DRC is most widely used because it is directly observable and auditable.",
      "source": "IPSAS-21-RSA",
      "score": 1.0
    },
    {
      "text": "IPSAS 21 — Recognition, measurement, and reversal: An impairment loss is recognised when the carrying amount exceeds the recoverable service amount. The loss equals the carrying amount minus RSA. It is recognised immediately in surplus/deficit (or in net assets if the asset was previously revalued upward). After impairment, depreciation is recalculated on the new carrying amount over the remaining useful life. Reversal: if circumstances that caused the impairment no longer exist, reversal is required — the increased carrying amount must not exceed what the depreciated historical cost (or revalued amount) would have been without impairment. Reversal is recognised in surplus/deficit (or net assets if the original impairment was against a revaluation reserve). IPSAS 46 (2025): current operational value informs RSA assessments for service delivery assets.",
      "source": "IPSAS-21-Recognition-Reversal",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 21 governs impairment of non-cash-generating (NCG) assets — the dominant asset type in most government balance sheets. An NCG asset is one held primarily to deliver public services, not to generate commercial returns. Roads, hospitals, schools, and government buildings are all NCG assets.

Impairment is assessed when indicators are present (external: physical damage, idle assets, planned disposal; internal: underperformance, change of use) or annually for assets not depreciated (indefinite-life intangibles). IPSAS 21 does not require annual impairment testing for all NCG assets — only when indicators arise.

The recoverable service amount (RSA) replaces the IPSAS 26 concept of recoverable amount. RSA = higher of fair value less costs to sell AND value in use. For service assets, value in use is calculated using one of three approaches: (1) depreciated replacement cost (DRC) — most common; (2) restoration cost; (3) service units. DRC is the present cost of a modern equivalent replacement, depreciated to reflect the asset''s current condition. It is the approach most readily audited and supported.

IPSAS 46 (effective 2025) introduces current operational value as a measurement concept for service delivery assets. The current operational value of an NCG asset can inform the RSA calculation under IPSAS 21.

A critical Pacific Islands context: many government infrastructure assets are significantly older and more degraded than their accounting records suggest. DRC-based impairment assessments often reveal that carrying amounts substantially overstate the remaining service potential — particularly for roads, marine wharves, and older government buildings.',

  array['IPSAS 21', 'impairment', 'non-cash-generating assets', 'NCG', 'recoverable service amount', 'RSA', 'depreciated replacement cost', 'DRC', 'restoration cost', 'service units', 'value in use', 'fair value less costs to sell', 'impairment indicators', 'reversal of impairment', 'IPSAS 46 current operational value', 'public infrastructure', 'roads hospitals schools', 'government buildings impairment', 'service potential', 'impairment loss'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 21 impairment non-cash-generating assets recoverable service amount DRC government", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P15 — IMPAIRMENT — CASH-GENERATING ASSETS (IPSAS 26)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P15',
  'Impairment — Cash-Generating Assets (IPSAS 26)',
  'practitioner_topic',
  array['IPSAS-26', 'IPSAS-21', 'IPSAS-17', 'IPSAS-31'],
  'accrual',

  '[
    {
      "text": "IPSAS 26 — Scope: Applies to cash-generating (CG) assets — assets held primarily to generate a commercial return. In the public sector, CG assets are most common in: Government Business Enterprises (GBEs) applying IPSAS; commercial property rented at market rates; toll roads and airports; SOE infrastructure assets. The distinction between NCG (IPSAS 21) and CG (IPSAS 26) assets depends on the primary purpose — an asset is CG if it generates cash flows largely independent of other assets and the entity''s primary purpose in holding it is commercial return. Where an asset is partly NCG and partly CG, the entity applies the primary-purpose test. The impairment standard to apply is a significant judgment that must be documented.",
      "source": "IPSAS-26-Scope",
      "score": 1.0
    },
    {
      "text": "IPSAS 26 — Recoverable amount and CGU: Recoverable amount = higher of fair value less costs to sell (FVLCTS) and value in use (VIU). Value in use for CG assets uses discounted cash flow projections — the present value of expected future cash flows from the asset. The cash-generating unit (CGU) is the smallest identifiable group of assets generating cash inflows largely independent of other assets or groups. Goodwill and corporate assets are allocated to CGUs for impairment testing. FVLCTS: price in an arm''s length transaction between knowledgeable, willing parties less disposal costs. If FVLCTS > carrying amount, no further impairment test is required. VIU is calculated using pre-tax discount rates reflecting the current market assessment of the time value of money and the asset-specific risks.",
      "source": "IPSAS-26-Recoverable-Amount",
      "score": 1.0
    },
    {
      "text": "IPSAS 26 — Recognition, allocation, and reversal: Impairment loss = carrying amount minus recoverable amount, recognised in surplus/deficit. Where the impairment loss exceeds the carrying amount of the CGU''s assets, a liability is recognised only if required by another standard. Within a CGU, the loss is allocated: first to goodwill; then pro-rata to other assets. No individual asset is written below the highest of its FVLCTS, VIU, or zero. Reversal: permitted if conditions that gave rise to impairment no longer exist. Reversal is capped at what the depreciated carrying amount would have been. Exception: goodwill impairment cannot be reversed. Key government context: SOE infrastructure, investment property, and commercial land holdings are the most common IPSAS 26 applications in Pacific Islands governments.",
      "source": "IPSAS-26-Recognition-Reversal",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 26 governs impairment of cash-generating (CG) assets — those held primarily to generate a commercial return. In the public sector, this applies mainly to GBE assets, commercial property, toll infrastructure, and commercial SOE investments. Most government assets are non-cash-generating and fall under IPSAS 21.

The recoverable amount is the higher of fair value less costs to sell and value in use. Unlike IPSAS 21, value in use for CG assets is a discounted cash flow calculation using forecast cash flows and a risk-adjusted pre-tax discount rate. The cash-generating unit (CGU) concept applies when an individual asset does not generate independent cash flows — the impairment test is applied at the CGU level.

Impairment losses are allocated first to any goodwill allocated to the CGU, then pro-rata to remaining assets, subject to a floor of each asset''s individual FVLCTS or VIU.

Reversal is required when conditions improve, capped at the original depreciated carrying amount — except goodwill, which cannot be reversed.

The critical judgment in public sector entities is the NCG vs CG classification. A hospital that charges partial fees is still NCG if its primary purpose is public service delivery. A commercially operated port is CG. Mixed-use assets require the primary-purpose test and clear documentation of the rationale for the classification chosen.',

  array['IPSAS 26', 'impairment', 'cash-generating assets', 'CG assets', 'recoverable amount', 'fair value less costs to sell', 'FVLCTS', 'value in use', 'VIU', 'discounted cash flows', 'cash-generating unit', 'CGU', 'goodwill impairment', 'impairment reversal', 'GBE impairment', 'SOE assets', 'commercial property impairment', 'discount rate', 'pre-tax discount rate', 'IPSAS 21 vs IPSAS 26'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 26 impairment cash-generating assets CGU recoverable amount value in use", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P16 — FINANCIAL INSTRUMENTS (IPSAS 41)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P16',
  'Financial Instruments (IPSAS 41)',
  'practitioner_topic',
  array['IPSAS-41', 'IPSAS-28', 'IPSAS-30'],
  'accrual',

  '[
    {
      "text": "IPSAS 41 Financial Instruments (effective 1 January 2023 for most entities; replaces IPSAS 29): Classification of financial assets depends on two tests: (1) Business model — is the asset held to collect contractual cash flows (HTC), held to collect and sell (HTCS), or held for trading? (2) SPPI test — do the contractual cash flows represent solely payments of principal and interest (SPPI) on the outstanding principal? Classification outcomes: HTC + SPPI pass = amortised cost; HTCS + SPPI pass = fair value through other comprehensive income / net assets (FVOCI); all other cases = fair value through surplus/deficit (FVTPL). Government financial assets commonly at amortised cost: receivables from tax and grants, loans advanced to other government entities, government bonds held to maturity.",
      "source": "IPSAS-41-Classification",
      "score": 1.0
    },
    {
      "text": "IPSAS 41 — Concessional loans (critical for government): A concessional loan is one advanced at a below-market interest rate (common in government lending to SOEs, local governments, or developing country borrowers). Under IPSAS 41, a concessional loan is initially recognised at fair value — which is less than the nominal amount lent. The difference (the ''day-one'' discount) is recognised as a transfer expense under IPSAS 48 (or IPSAS 23 pre-2026) if it represents a government subsidy. Subsequently, the loan is carried at amortised cost using the effective interest method at the market rate used to calculate fair value. This changes the carrying amount compared to what face-value accounting would show and reduces stated interest income.",
      "source": "IPSAS-41-Concessional-Loans",
      "score": 1.0
    },
    {
      "text": "IPSAS 41 — Expected credit loss (ECL) model: Impairment is based on expected credit losses, not incurred losses. Three stages: Stage 1 — performing assets (12-month ECL recognised from initial recognition); Stage 2 — significant increase in credit risk since initial recognition (lifetime ECL); Stage 3 — credit-impaired (lifetime ECL + gross interest ceases). For governments: trade receivables without significant financing component use the simplified approach (lifetime ECL immediately). Tax receivables, intergovernmental receivables, and loan portfolios require the general model. Key practical challenge: governments must develop probability-of-default estimates for assets where there is no market data — internally modelled ECL is often required.",
      "source": "IPSAS-41-ECL",
      "score": 1.0
    },
    {
      "text": "IPSAS 41 — Financial liabilities and government borrowings: Financial liabilities are classified as amortised cost (most government borrowings) or FVTPL (trading liabilities, derivatives). Government borrowings recognised at fair value at initial recognition less transaction costs; subsequently at amortised cost using the effective interest method. Key items: concessional borrowings from IDA/ADB/bilateral donors — same day-one treatment as concessional loans but from the borrower side. The difference between nominal amount received and fair value is non-exchange income (IPSAS 23/47). Government guarantees are not financial instruments under IPSAS 41 (no contractual cash flow obligation); they are contingent liabilities under IPSAS 19 unless payment becomes probable.",
      "source": "IPSAS-41-Liabilities",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 41 (effective 1 January 2023) replaces IPSAS 29 and aligns with the IFRS 9 approach, with adaptations for the public sector. It governs all financial instruments not specifically scoped out (leases, employee benefits, insurance contracts, and equity instruments in controlled entities are excluded).

Financial assets are classified using a two-step test: business model (how the entity manages the asset) and SPPI (whether cash flows are solely principal and interest). The three classifications are amortised cost, FVOCI, and FVTPL. Most government financial assets — receivables, loans to SOEs and local governments, held-to-maturity bonds — qualify for amortised cost measurement.

Concessional loans are a critical public sector application. A loan advanced at below-market rates must be recognised at fair value on initial recognition. The day-one discount (difference between face value and fair value) is a transfer expense recognised under IPSAS 48 (or IPSAS 23). Subsequently, the loan accrues interest using the effective market rate — lower reported interest income than the face rate would suggest.

Impairment uses the expected credit loss (ECL) model. Governments must recognise ECL from day one for all financial assets at amortised cost. Trade receivables use the simplified approach (lifetime ECL immediately). Tax receivables and loan portfolios require the general model with three-stage assessment.

Concessional borrowings received from donors or multilateral lenders at below-market rates are recognised at fair value; the day-one difference is non-exchange income, reducing the apparent cost of the borrowing and requiring disclosure.',

  array['IPSAS 41', 'financial instruments', 'amortised cost', 'FVOCI', 'FVTPL', 'SPPI test', 'business model', 'expected credit loss', 'ECL', '12-month ECL', 'lifetime ECL', 'concessional loans', 'day-one discount', 'effective interest method', 'financial assets classification', 'government borrowings', 'concessional borrowings', 'IPSAS 28', 'IPSAS 30', 'financial liabilities', 'Stage 1 Stage 2 Stage 3', 'credit impaired'],

  'current',
  4,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 41 financial instruments classification ECL concessional loans government", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P17 — EMPLOYEE BENEFITS (IPSAS 39)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P17',
  'Employee Benefits (IPSAS 39)',
  'practitioner_topic',
  array['IPSAS-39', 'IPSAS-19', 'IPSAS-49'],
  'accrual',

  '[
    {
      "text": "IPSAS 39 — Categories of employee benefits: (1) Short-term employee benefits: due within 12 months of the end of the period in which the employee renders service. Examples: salaries, wages, annual leave, sick leave, profit-sharing, and non-monetary benefits (housing, vehicles). Recognised as an expense and liability in the period service is rendered — no actuarial assumptions required. Annual leave not taken is accrued at the undiscounted amount. (2) Post-employment benefits: pensions, gratuities, life insurance, medical benefits after employment. Subdivided into defined contribution (DC) and defined benefit (DB). (3) Other long-term employee benefits: long service leave, sabbatical leave, jubilee benefits, disability benefits expected > 12 months. (4) Termination benefits: from the decision to terminate before normal retirement date.",
      "source": "IPSAS-39-Categories",
      "score": 1.0
    },
    {
      "text": "IPSAS 39 — Defined benefit obligations (the hard part): A defined benefit (DB) plan promises a specified benefit at retirement (e.g. 1/600th of final salary per month of service). The employer bears the actuarial and investment risk. Recognition: the present value of the defined benefit obligation (DBO) is measured using the projected unit credit method — each period of service earns an additional unit of benefit entitlement; the present value is projected to the date of expected payment and discounted at a high-quality corporate bond rate (or government bond rate in markets without deep corporate bond markets). Components: current service cost (in surplus/deficit), net interest cost (in surplus/deficit), and remeasurements (actuarial gains/losses and return on plan assets excluding interest — recognised directly in net assets, not recycled). Most Pacific Islands governments have unfunded defined benefit pension schemes — where there are no plan assets, the DBO is a pure liability on the SOFP.",
      "source": "IPSAS-39-Defined-Benefit",
      "score": 1.0
    },
    {
      "text": "IPSAS 39 — Leave liabilities and practical application: Annual leave accrues continuously as employees render service. At year end, the accumulated unused annual leave balance must be recognised as a liability at the current pay rate (undiscounted for short-term leave). Long service leave (leave earned after an extended period, e.g., 10 years) is a long-term employee benefit: actuarial measurement is required, including probability of employee completing the qualifying period. These leave liabilities are among the most commonly omitted or understated items in governments transitioning from cash basis to accrual IPSAS. Key inputs needed: payroll records by employee showing leave balances, current pay rates, and probability of employees reaching qualifying period for long service leave.",
      "source": "IPSAS-39-Leave-Liabilities",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 39 covers all employee benefits except share-based payments (not common in government). The four categories — short-term, post-employment, other long-term, and termination benefits — each have different recognition and measurement rules.

Short-term benefits (due within 12 months) are accrued at undiscounted amounts in the period service is rendered. Annual leave is the most common: the unused balance at year end is a liability measured at current pay rates. This is frequently omitted in cash-basis governments transitioning to accrual.

Post-employment defined contribution plans are straightforward: the obligation is extinguished when the contribution is paid. Defined benefit plans require actuarial measurement. The projected unit credit method calculates the present value of benefit units earned to date, projected to the expected payment date, and discounted using high-quality bond rates. The defined benefit obligation (DBO), net of plan assets, appears as a liability. Most Pacific Islands governments operate unfunded DB pension schemes — the full DBO is on the balance sheet with no offsetting plan assets.

Three components of DB cost: current service cost and net interest (surplus/deficit) and remeasurements (actuarial gains/losses, directly in net assets, never recycled to surplus/deficit).

Long service leave is an other long-term benefit requiring actuarial measurement including the probability of employees completing the qualifying period. This is a significant liability in government workforces with long average tenures.',

  array['IPSAS 39', 'employee benefits', 'short-term benefits', 'annual leave', 'leave liability', 'defined benefit', 'defined contribution', 'projected unit credit', 'DBO', 'pension obligation', 'post-employment benefits', 'long service leave', 'termination benefits', 'actuarial assumptions', 'remeasurements', 'net assets remeasurement', 'unfunded pension', 'public service pension', 'current service cost', 'net interest cost'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 39 employee benefits defined benefit leave liabilities pension government accrual", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P18 — RETIREMENT BENEFIT PLANS (IPSAS 49)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P18',
  'Retirement Benefit Plans (IPSAS 49)',
  'practitioner_topic',
  array['IPSAS-49', 'IPSAS-39'],
  'accrual',

  '[
    {
      "text": "IPSAS 49 (effective 1 January 2023) governs the financial reporting of retirement benefit plans themselves — the fund or plan entity — not the employer''s accounting for its obligation. This standard is relevant when the government operates a retirement benefit plan (such as a national provident fund or public service superannuation scheme) that prepares its own financial statements. IPSAS 49 distinguishes: (1) Defined contribution (DC) plans — actuarial risk and investment risk borne by members; the plan''s obligation is the accumulated fund balance; (2) Defined benefit (DB) plans — the plan guarantees a specified benefit; the plan must present both plan assets and the actuarial present value of promised benefits.",
      "source": "IPSAS-49-Scope",
      "score": 1.0
    },
    {
      "text": "IPSAS 49 — Defined benefit plan financial statements: A DB retirement benefit plan must present: (1) a statement of net assets available for benefits (plan assets at fair value less any plan liabilities); (2) a statement of changes in net assets available for benefits; and (3) either in the financial statements or in accompanying actuarial information: the actuarial present value of promised retirement benefits (distinguishing between vested and non-vested benefits). The actuarial present value may be prepared by an independent actuary. Where the actuarial present value exceeds the net assets available for benefits, the plan is in deficit — a critical disclosure for government-sponsored schemes.",
      "source": "IPSAS-49-DB-Plan",
      "score": 1.0
    },
    {
      "text": "IPSAS 49 — Government context: Many Pacific Islands governments operate national provident funds or public service superannuation schemes. The Solomon Islands National Provident Fund (SINPF) is a DC plan where members bear investment risk. The Public Service Provident Fund (PSPF) may have DB characteristics. Key disclosure: where a government scheme is underfunded, IPSAS 49 requires transparent presentation of the shortfall between plan assets and the actuarial present value of benefits. This information is critical for fiscal sustainability analysis. IPSAS 49 financial statements are separate from the government''s own financial statements (which account for the employer''s obligation under IPSAS 39).",
      "source": "IPSAS-49-Pacific-Context",
      "score": 0.9
    }
  ]'::jsonb,

  'IPSAS 49 governs the financial statements of retirement benefit plan entities — the fund or plan itself — rather than the employer''s obligation (which is IPSAS 39). This distinction matters: a government may both operate a pension fund (subject to IPSAS 49 at the fund level) and be an employer contributing to that fund (subject to IPSAS 39 at the government level).

Defined contribution plans present net assets available for benefits (assets at fair value less plan liabilities). The plan obligation equals the accumulated member balances; there is no actuarial liability beyond that.

Defined benefit plans must present both net assets available for benefits AND the actuarial present value of promised retirement benefits (or provide this as accompanying actuarial information). Where plan assets fall short of the actuarial present value, the plan is in deficit. This shortfall must be disclosed and is the primary fiscal risk indicator for government-sponsored DB schemes.

Many Pacific Islands governments operate national provident or superannuation funds that prepare separate financial statements. IPSAS 49 governs those fund-level statements. The employer government''s obligation to contribute is a separate matter governed by IPSAS 39.',

  array['IPSAS 49', 'retirement benefit plans', 'pension fund', 'superannuation', 'national provident fund', 'defined contribution plan', 'defined benefit plan', 'plan assets', 'actuarial present value', 'promised benefits', 'net assets available for benefits', 'fund deficit', 'SINPF', 'PSPF', 'vested benefits', 'non-vested benefits', 'pension fund financial statements', 'government pension scheme', 'plan underfunding', 'IPSAS 39 vs IPSAS 49'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 49 retirement benefit plan financial statements fund defined benefit defined contribution", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P19 — PROVISIONS, CONTINGENT LIABILITIES AND CONTINGENT ASSETS (IPSAS 19)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P19',
  'Provisions, Contingent Liabilities and Contingent Assets (IPSAS 19)',
  'practitioner_topic',
  array['IPSAS-19', 'IPSAS-14', 'IPSAS-39', 'IPSAS-42'],
  'accrual',

  '[
    {
      "text": "IPSAS 19 — Recognition criteria for provisions: A provision is recognised when ALL three conditions are met: (1) The entity has a present obligation (legal or constructive) as a result of a past event; (2) It is probable that an outflow of resources embodying economic benefits or service potential will be required to settle the obligation (probable = more likely than not, i.e., >50%); (3) A reliable estimate can be made of the amount of the obligation. A legal obligation arises from a contract, legislation, or judicial decision. A constructive obligation arises from an established pattern of past practice, published policy, or specific statement that has created a valid expectation in other parties. Key: the obligating event must have occurred — a future event alone does not create a provision (e.g., a government cannot provision for future salary increases).",
      "source": "IPSAS-19-Recognition",
      "score": 1.0
    },
    {
      "text": "IPSAS 19 — Measurement: The amount recognised is the best estimate of the expenditure required to settle the obligation at the reporting date. For a range of possible outcomes: use the most likely outcome if it dominates; otherwise use expected value (probability-weighted average). Discounting: where the time value of money is material, the provision is discounted to present value using a pre-tax rate reflecting the risks specific to the liability. Unwinding of the discount is recognised as a finance cost in surplus/deficit. Reimbursements: where the entity expects reimbursement from a third party (e.g., insurance), the reimbursement asset is recognised separately and only when virtually certain of receipt. The provision must not be offset against the reimbursement asset.",
      "source": "IPSAS-19-Measurement",
      "score": 1.0
    },
    {
      "text": "IPSAS 19 — Contingent liabilities and contingent assets: A contingent liability is NOT recognised (only disclosed) where: (a) a possible obligation exists but it is not yet confirmed whether a present obligation exists (outcome depends on uncertain future event); or (b) a present obligation exists but outflow is not probable or amount cannot be reliably estimated. Contingent assets: recognised only when the inflow is virtually certain (at which point it is no longer contingent). Where inflow is probable but not certain: disclosed, not recognised. Government-specific common provisions: (1) Legal claims against the government; (2) Restoration or decommissioning obligations; (3) Guarantees where payment is probable; (4) Onerous contracts; (5) Restructuring provisions (constructive obligation arises when a formal plan is announced and the affected parties have a reasonable expectation of implementation).",
      "source": "IPSAS-19-Contingencies",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 19 governs the recognition of provisions (liabilities of uncertain timing or amount), contingent liabilities (possible obligations, or obligations where outflow is not probable), and contingent assets.

Three conditions must all be met for a provision: a present obligation (legal or constructive) from a past event; probable outflow (>50%); reliable estimate of amount. If any condition is not met, a provision is not recognised — instead a contingent liability is disclosed (unless an outflow is remote, in which case no disclosure is required).

The best estimate for measurement may be a single most likely outcome (for individual items) or an expected value (for large populations of items). Discounting is required where time value is material — using a pre-tax, obligation-specific risk rate.

Common government provisions: legal claims (use probability-weighted outcomes across open cases); restoration and decommissioning obligations (include in cost of PPE at inception); guarantees where payment is probable; onerous contracts (where unavoidable costs exceed benefits); redundancy/restructuring (constructive obligation arises when a detailed plan is formally announced).

A constructive obligation in government can arise from legislation, administrative decisions, or consistent past practice. A government that has consistently paid ex-gratia compensation for certain events may have a constructive obligation to continue even without a legal requirement.',

  array['IPSAS 19', 'provisions', 'contingent liabilities', 'contingent assets', 'present obligation', 'legal obligation', 'constructive obligation', 'past event', 'probable outflow', 'best estimate', 'expected value', 'discounting provisions', 'reimbursement asset', 'legal claims', 'restoration obligation', 'decommissioning', 'onerous contract', 'restructuring provision', 'government guarantees', 'government litigation'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 19 provisions contingent liabilities recognition measurement government obligations", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P20 — BORROWING COSTS (IPSAS 5)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P20',
  'Borrowing Costs (IPSAS 5)',
  'practitioner_topic',
  array['IPSAS-5', 'IPSAS-17', 'IPSAS-31'],
  'accrual',

  '[
    {
      "text": "IPSAS 5 — Core principle: Borrowing costs that are directly attributable to the acquisition, construction, or production of a qualifying asset are capitalised as part of the cost of that asset. All other borrowing costs are expensed in the period incurred. This is the required treatment (not a choice — IPSAS 5 removed the benchmark ''expense all'' approach in its current version). Borrowing costs include: interest on bank overdrafts and short/long-term borrowings; amortisation of discounts/premiums on borrowings; amortisation of ancillary costs in arranging borrowings; finance charges on leases recognised under IPSAS 43; and exchange differences on foreign-currency borrowings to the extent they are an adjustment to interest costs.",
      "source": "IPSAS-5-Core-Principle",
      "score": 1.0
    },
    {
      "text": "IPSAS 5 — Qualifying asset: A qualifying asset is one that necessarily takes a substantial period of time to get ready for its intended use or sale. Examples: a government building under construction; a major road or bridge being built; an internally developed ERP system. Inventories routinely manufactured in large quantities are not qualifying assets. Commencement of capitalisation: when (a) expenditure on the asset is being incurred, (b) borrowing costs are being incurred, and (c) activities necessary to prepare the asset for use are in progress. Suspension: capitalisation is suspended during extended periods when active development is interrupted. Cessation: when substantially all activities to prepare the asset are complete.",
      "source": "IPSAS-5-Qualifying-Asset",
      "score": 1.0
    },
    {
      "text": "IPSAS 5 — Capitalisation rate: Where funds are borrowed specifically for a qualifying asset, the amount capitalised is the actual borrowing costs incurred less any investment income earned on temporary investment of those funds. Where general borrowings are used, the capitalisation rate is the weighted average of the borrowing costs applicable to the entity''s general borrowings outstanding during the period (excluding borrowings made specifically for other qualifying assets). The amount capitalised cannot exceed the total borrowing costs incurred. Government-specific: sovereign borrowings from multilateral lenders (ADB, World Bank IDA) at concessional rates — the concessional portion is a day-one non-exchange transaction (IPSAS 41/48); only the market-rate portion is an ongoing borrowing cost to be capitalised or expensed.",
      "source": "IPSAS-5-Capitalisation-Rate",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 5 requires capitalisation of borrowing costs that are directly attributable to the acquisition, construction, or production of a qualifying asset. A qualifying asset is one that necessarily takes a substantial period to get ready for its intended use — capital infrastructure projects, major building construction, and internally developed software systems commonly qualify.

Borrowing costs include interest, amortisation of debt issuance costs, finance charges on leases, and exchange differences on foreign-currency debt to the extent they are an adjustment to interest. Investment income earned on temporarily invested specific borrowings reduces the amount capitalised.

Capitalisation commences when all three conditions are met simultaneously: expenditure is being incurred, borrowing costs are being incurred, and preparatory activities are in progress. It is suspended during extended interruptions and ceases when the asset is substantially complete.

For general borrowings, the capitalisation rate is the weighted average of all general borrowing costs during the period (excluding borrowings specific to other qualifying assets). The amount capitalised cannot exceed total borrowing costs incurred.

Government context: many developing country governments borrow from multilateral lenders at concessional rates. Under IPSAS 41, such loans are initially recognised at fair value, with the concession element recognised as non-exchange income. Only the ongoing effective interest at the market rate is the borrowing cost for IPSAS 5 purposes — not the face interest rate. This means the capitalised amount on concessionally funded infrastructure is lower than a face-rate calculation would suggest.',

  array['IPSAS 5', 'borrowing costs', 'qualifying asset', 'capitalisation', 'interest capitalisation', 'construction interest', 'weighted average capitalisation rate', 'specific borrowing', 'general borrowings', 'investment income offset', 'concessional borrowing costs', 'infrastructure borrowing', 'ERP capitalisation', 'commencement capitalisation', 'suspension capitalisation', 'cessation capitalisation', 'multilateral loans', 'ADB World Bank borrowing costs'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 5 borrowing costs qualifying asset capitalisation rate government infrastructure", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P21 — FOREIGN CURRENCY (IPSAS 4)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P21',
  'Foreign Currency (IPSAS 4)',
  'practitioner_topic',
  array['IPSAS-4', 'IPSAS-10', 'IPSAS-41', 'IPSAS-35'],
  'both',

  '[
    {
      "text": "IPSAS 4 — Functional and presentation currency: Functional currency is the currency of the primary economic environment in which the entity operates. For most government entities, this is the local currency. Indicators: the currency that mainly influences prices (revenue), the currency in which funds from financing activities are generated, and the currency in which receipts from operations are usually retained. Where a government entity''s operations are heavily donor-funded in USD or AUD, the functional currency analysis is more complex. Presentation currency: the currency in which financial statements are presented. Where the presentation currency differs from the functional currency, all items must be translated to the presentation currency and the resulting differences recognised in net assets (translation reserve).",
      "source": "IPSAS-4-Functional-Currency",
      "score": 1.0
    },
    {
      "text": "IPSAS 4 — Transactions in foreign currency: A foreign currency transaction is recorded at the spot rate on the transaction date (or an average rate for the period as a practical approximation). At each subsequent reporting date: monetary items (cash, receivables, payables, borrowings) are retranslated at the closing rate; non-monetary items measured at historical cost are retranslated at the historical rate; non-monetary items measured at fair value are retranslated at the rate at the date of the fair value measurement. Exchange differences on monetary items are recognised in surplus/deficit in the period they arise. For government entities with USD-denominated borrowings (common for multilateral loans), exchange differences on the outstanding loan balance at year end go through surplus/deficit — this can be a source of significant volatility.",
      "source": "IPSAS-4-Transaction-Translation",
      "score": 1.0
    },
    {
      "text": "IPSAS 4 — Foreign operations: Where a government controls or has interests in entities operating in different currency environments (e.g., a regional authority operating in a different territory), the foreign operation''s assets and liabilities are translated at the closing rate; income and expenses at the transaction date rate (or average as approximation). The resulting translation differences are recognised in net assets (a separate translation reserve) rather than surplus/deficit, until disposal of the foreign operation (at which point the cumulative translation difference is recycled to surplus/deficit). Pacific Islands context: for governments with project implementation units (PIUs) or regional development authorities operating across island groups with different currency exposures, IPSAS 4 translation requirements apply.",
      "source": "IPSAS-4-Foreign-Operations",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 4 governs accounting for transactions and balances in foreign currencies. It applies to both accrual and cash-basis reporters, though the full accrual implications (remeasurement of monetary balances, translation reserves) arise mainly under accrual accounting.

Functional currency is the currency of the entity''s primary economic environment. For most government ministries it is the local currency. Where donor funding dominates, a detailed functional currency analysis is required.

Foreign currency transactions are initially recorded at the spot rate. At year end, monetary items (cash, receivables, payables, foreign-currency borrowings) are retranslated at the closing rate. Exchange differences go through surplus/deficit. Non-monetary items remain at the historical rate.

For Pacific Islands governments with USD or AUD-denominated multilateral loans, the outstanding loan balance is retranslated at each year end. Exchange movements on that balance go through surplus/deficit — potentially large amounts if local currency depreciates. This is a genuine cash liability even though it appears as a non-cash accounting entry.

Foreign operations (subsidiaries or project entities in different currency environments) use the closing-rate method for balance sheet translation and the average-rate method for income and expenses. Translation differences go to a net assets reserve (not surplus/deficit) until the foreign operation is disposed of.',

  array['IPSAS 4', 'foreign currency', 'functional currency', 'presentation currency', 'exchange differences', 'closing rate', 'historical rate', 'spot rate', 'monetary items', 'non-monetary items', 'translation reserve', 'foreign operation', 'USD borrowings', 'multilateral loans currency risk', 'exchange rate gains losses', 'foreign currency translation', 'net assets translation', 'average rate', 'Pacific Islands FX', 'Solomon Islands dollar'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 4 foreign currency functional currency exchange differences translation government", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P22 — CONSOLIDATION AND THE REPORTING ENTITY (IPSAS 34–38)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P22',
  'Consolidation and the Reporting Entity (IPSAS 34–38)',
  'practitioner_topic',
  array['IPSAS-34', 'IPSAS-35', 'IPSAS-36', 'IPSAS-37', 'IPSAS-38'],
  'accrual',

  '[
    {
      "text": "IPSAS 35 Consolidated Financial Statements — Control model: An entity controls another entity when it has: (1) Power over the investee (existing rights that give the ability to direct the relevant activities); (2) Exposure or rights to variable returns from its involvement; and (3) The ability to use its power to affect those returns. For governments: a government controls a government business enterprise (GBE) or statutory authority when it can direct the entity''s operating and financial policies — typically through ownership, legislation, or the right to appoint a majority of the governing board. Control exists even where the controlled entity is commercially operated (a GBE) or has a different reporting framework. All controlled entities must be consolidated into whole-of-government financial statements.",
      "source": "IPSAS-35-Control-Model",
      "score": 1.0
    },
    {
      "text": "IPSAS 36 Investments in Associates and Joint Ventures: An associate is an entity over which the investor has significant influence — the power to participate in financial and operating policy decisions (but not control). Significant influence is presumed when the investor holds 20–50% of voting power. Accounting: equity method — the investment is initially recognised at cost and subsequently adjusted for the investor''s share of the investee''s surplus/deficit and other changes in net assets. Joint arrangements (IPSAS 37): either a joint operation (parties have rights to assets and obligations for liabilities directly) or a joint venture (parties have rights to net assets). Joint operations: recognise the entity''s own assets, liabilities, revenue, and expenses. Joint ventures: equity method. Government examples: joint utility companies, shared port facilities, co-funded infrastructure projects.",
      "source": "IPSAS-36-37-Associates-JV",
      "score": 1.0
    },
    {
      "text": "IPSAS 35 — Whole-of-government reporting and GBEs: Whole-of-government (WoG) financial statements consolidate all entities controlled by the government, including GBEs. GBEs may prepare their own financial statements under IFRS (as they are profit-oriented commercial entities); these are consolidated into the WoG statements under IPSAS 35. At consolidation, IFRS-based GBE statements must be adjusted to IPSAS equivalents where the accounting policies differ. Non-controlling interests (NCI) in entities not wholly owned by the government are presented within net assets. Intragovernmental transactions and balances are eliminated on consolidation. Key challenge for developing-country governments: determining the boundary of the reporting entity — which agencies, funds, and GBEs are controlled and therefore in scope for consolidation.",
      "source": "IPSAS-35-WoG-GBE",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 34–38 govern how governments account for their interests in other entities — from full consolidation of controlled entities (IPSAS 35) to equity accounting for associates and joint ventures (IPSAS 36, 37) to the disclosure of all interests (IPSAS 38).

The control model under IPSAS 35 has three elements: power over relevant activities, exposure to variable returns, and ability to use power to affect returns. Government entities commonly control statutory authorities, GBEs, social security funds, and special-purpose vehicles. All controlled entities must be included in consolidated whole-of-government financial statements.

IPSAS 36 governs equity accounting for associates (20–50% ownership or significant influence). IPSAS 37 covers joint arrangements — joint operations (direct share of assets/liabilities) or joint ventures (equity method for net assets). IPSAS 38 requires comprehensive disclosure of all interests regardless of method.

Practical challenges for developing-country governments: (1) Determining the boundary of the reporting entity — which agencies and funds are "controlled"; (2) Obtaining audited financial statements from all controlled entities on a compatible basis; (3) GBEs using IFRS must be adjusted to IPSAS at consolidation; (4) Eliminating intergovernmental transactions and balances requires complete transactional records across the whole entity group.',

  array['IPSAS 35', 'IPSAS 36', 'IPSAS 37', 'IPSAS 38', 'IPSAS 34', 'consolidated financial statements', 'whole-of-government', 'control model', 'power', 'variable returns', 'GBE consolidation', 'government business enterprise', 'equity method', 'associates', 'joint ventures', 'joint operations', 'non-controlling interest', 'NCI', 'reporting entity boundary', 'IPSAS consolidation', 'statutory authority', 'government ownership'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 35 36 37 consolidation control whole-of-government GBE associates joint ventures", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P23 — SERVICE CONCESSION ARRANGEMENTS (IPSAS 32)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P23',
  'Service Concession Arrangements (IPSAS 32)',
  'practitioner_topic',
  array['IPSAS-32', 'IPSAS-17', 'IPSAS-41', 'IPSAS-19'],
  'accrual',

  '[
    {
      "text": "IPSAS 32 — Scope and control test: A service concession arrangement is a binding arrangement between a grantor (the public sector entity) and an operator (a private entity) whereby the operator uses the grantor''s infrastructure assets to provide public services on the grantor''s behalf for a specified period, in exchange for consideration. IPSAS 32 applies only to the grantor''s accounting. The standard is relevant for: toll roads, bridges, ports, airports, water/sewerage systems, and other public infrastructure operated under PPP arrangements. The recognition control test: the grantor recognises a service concession asset when (a) it controls or regulates what services the operator must provide with the asset, to whom, and at what price; AND (b) the grantor controls any significant residual interest in the asset at the end of the concession period.",
      "source": "IPSAS-32-Scope-Control-Test",
      "score": 1.0
    },
    {
      "text": "IPSAS 32 — Liability models: Where the control test is met and the grantor recognises the service concession asset, the corresponding credit depends on the nature of the operator''s consideration: (1) Financial liability model: the operator is paid by the grantor (in cash or through another financial asset). The grantor recognises a financial liability for the operator''s entitlement. (2) Grant of right model: the operator is compensated by the right to collect fees from users (no cash from grantor). The grantor recognises deferred revenue until it is earned, or applies the grant of right approach (a credit directly to the asset — sometimes called the ''pass-through'' model). (3) Bifurcated model: where the operator is compensated partly by cash and partly by user fees, both models are applied to the respective portions.",
      "source": "IPSAS-32-Liability-Models",
      "score": 1.0
    },
    {
      "text": "IPSAS 32 — Pacific Islands context and practical issues: Infrastructure PPP arrangements are increasingly common in Pacific Islands countries for port upgrades, airport expansions, and road maintenance contracts. Key recognition challenge: many existing arrangements that are economically equivalent to service concessions may not be formally documented as PPPs — governments should review all long-term infrastructure agreements for IPSAS 32 applicability. Practical disclosure requirements: description of the arrangement, significant terms (price revision, contract duration, renewal and termination provisions), nature and extent of rights granted, obligations undertaken, asset and liability amounts recognised. Contingent liabilities from guarantees given to operators (e.g., minimum revenue guarantees) must be disclosed under IPSAS 19.",
      "source": "IPSAS-32-Pacific-Practical",
      "score": 0.9
    }
  ]'::jsonb,

  'Service concession arrangements (PPPs) involve a private operator using government infrastructure assets to deliver public services in exchange for consideration — either cash from the government or the right to charge users. IPSAS 32 governs the grantor''s (government''s) accounting.

The key control test has two prongs: (1) the grantor controls or regulates what services the operator provides, to whom, and at what price; and (2) the grantor controls any significant residual interest in the asset at the end of the arrangement. If both prongs are met, the grantor recognises the service concession asset on its Statement of Financial Position.

The corresponding liability depends on how the operator is compensated. Financial liability model: operator receives cash from grantor — record a financial liability. Grant of right model: operator collects fees from users — record deferred revenue or apply the grant of right approach. Many arrangements are bifurcated between both models.

This accounting means PPP-funded infrastructure appears on the government''s balance sheet regardless of who physically built or financed it — a major shift from cash-basis treatment where such assets were often entirely off-balance-sheet.

Pacific Islands governments are increasingly entering PPP and long-term concession agreements for ports, airports, and road maintenance. Many existing arrangements should be reviewed against the IPSAS 32 control criteria even where they pre-date IPSAS adoption.',

  array['IPSAS 32', 'service concession arrangements', 'PPP', 'public-private partnership', 'grantor', 'operator', 'financial liability model', 'grant of right model', 'service concession asset', 'control test', 'residual interest', 'infrastructure PPP', 'toll road', 'airport concession', 'port concession', 'deferred revenue grantor', 'bifurcated model', 'minimum revenue guarantee', 'off-balance-sheet infrastructure', 'Pacific Islands PPP'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 32 service concession arrangements PPP grantor liability model government infrastructure", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P24 — BUDGET REPORTING AND RECONCILIATION (IPSAS 24)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P24',
  'Budget Reporting and Reconciliation (IPSAS 24)',
  'practitioner_topic',
  array['IPSAS-24', 'IPSAS-1', 'IPSAS-2', 'IPSAS-3'],
  'both',

  '[
    {
      "text": "IPSAS 24 — Scope and requirement: IPSAS 24 is required for entities that make their approved budgets publicly available. The standard requires a comparison of budget amounts and actual amounts arising from execution of the budget. This comparison may be presented as a separate additional financial statement (a ''Budget Comparison Statement'') or as additional budget columns in the existing financial statements. In practice, most governments use a separate statement. Budget columns required: (1) Original budget — the initial approved budget; (2) Final budget — after all in-year amendments, supplementary estimates, and virements; (3) Actual — amounts arising from execution of the budget on the same basis as the budget. Material differences between the final budget and actual must be explained in notes.",
      "source": "IPSAS-24-Core-Requirement",
      "score": 1.0
    },
    {
      "text": "IPSAS 24 — Basis differences and reconciliation: A critical complication arises when the budget is prepared on a different basis from the financial statements. Common scenario: the budget is on a cash basis; the financial statements are on an accrual basis. In this case: (1) The budget comparison statement presents amounts on the budget basis (cash); (2) A reconciliation between the actual amounts on the budget basis and the accrual-basis amounts in the financial statements must be provided — either in the budget comparison statement itself or in the notes; (3) The reconciliation must explain all differences: accruals, depreciation, in-kind items, capital vs. operating classifications, and other timing differences. This reconciliation is one of the most valuable disclosures in a transitioning government''s financial statements.",
      "source": "IPSAS-24-Basis-Differences",
      "score": 1.0
    },
    {
      "text": "IPSAS 24 — Budget explanations and government context: Material differences between original and final budget must be explained (budget amendments, policy changes, new priorities). Material differences between final budget and actual must be explained — these are the accountability disclosures most scrutinised by legislatures and oversight bodies. Common explanations: underspending due to slow procurement; revenue shortfall; delayed donor disbursements; exchange rate movements on foreign-funded projects. For Solomon Islands and similar governments: the budget is typically cash-based and ministry/department structured. The IPSAS 24 reconciliation to accrual-basis statements bridges the accountability report (budget performance) to the financial report (financial position and performance).",
      "source": "IPSAS-24-Explanations",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 24 requires a comparison of budget and actual amounts for entities that make their approved budgets publicly available — which is essentially every government with a public appropriations process.

The comparison presents three columns: original budget (initial approved), final budget (after all amendments), and actuals on the budget basis. Material variances between final budget and actual must be explained in notes. This is the most important accountability disclosure in government financial statements.

The most technically challenging aspect is when the budget basis differs from the accounting basis — a common scenario where budgets are on a cash or modified cash basis while financial statements are prepared on accrual. IPSAS 24 requires a reconciliation between actual amounts on the budget basis and the equivalent amounts in the accrual financial statements, explaining each category of difference: accruals, depreciation, capital vs. operating items, in-kind transactions, and timing differences.

For transitioning governments, this reconciliation document is invaluable: it explains the "gap" between cash budget outcomes (which politicians and administrators understand) and accrual financial statements (which IPSAS requires). It also serves as a control document — unreconciled differences signal accounting errors or omissions.',

  array['IPSAS 24', 'budget comparison', 'original budget', 'final budget', 'actual amounts', 'budget basis', 'accrual basis', 'basis difference reconciliation', 'budget explanation', 'underspending', 'budget variance', 'supplementary estimates', 'virements', 'cash budget', 'accrual reconciliation', 'legislature accountability', 'budget performance', 'government budget reporting', 'budget vs actual', 'fiscal accountability'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 24 budget reporting comparison actual amounts reconciliation government basis difference", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P25 — SEGMENT REPORTING (IPSAS 18)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P25',
  'Segment Reporting (IPSAS 18)',
  'practitioner_topic',
  array['IPSAS-18', 'IPSAS-1'],
  'accrual',

  '[
    {
      "text": "IPSAS 18 — Definition of segments: A segment is a distinguishable activity or group of activities for which it is appropriate to separately report financial information for the purpose of evaluating the entity''s past performance and making decisions about future allocation of resources. Two types: (1) Service segments — distinguishable components providing related services subject to risks and returns different from other segments. (2) Geographical segments — distinguishable components providing services within a particular economic environment subject to risks and returns different from other environments. Government examples of service segments: health, education, public safety, infrastructure, social protection, and general government administration. Geographical segments: central ministries vs. provincial/regional offices.",
      "source": "IPSAS-18-Definition",
      "score": 1.0
    },
    {
      "text": "IPSAS 18 — Required disclosures for primary and secondary reporting formats: Entities identify a primary format (service or geographical — whichever reflects the entity''s dominant source of risks and returns) and a secondary format. Primary segment disclosures: revenue by source (external and inter-segment), expenses, surplus/deficit, assets, liabilities, capital expenditure, depreciation, and non-cash expenses. Secondary segment disclosures are less extensive: revenue, assets, and capital expenditure by segment. Intersegment transactions must be eliminated and the elimination basis disclosed. Unallocated items (corporate overheads, general reserves) are disclosed separately. Comparative period data is required.",
      "source": "IPSAS-18-Disclosures",
      "score": 1.0
    },
    {
      "text": "IPSAS 18 — Government context and practical use: Segment reporting is more common in larger government entities and whole-of-government statements. For smaller Pacific Islands governments, the entire government may be treated as a single segment — IPSAS 18 applies only where distinguishable activities have materially different risk and return profiles. The standard does not prescribe a minimum number of segments. IPSAS 18 is voluntary for first-time adopters in their first year of IPSAS reporting. Key value: segment information allows parliament and citizens to assess the financial performance of each major service area independently — health spending per output, education cost per student, infrastructure expenditure by region. This aligns with performance budgeting frameworks.",
      "source": "IPSAS-18-Practical",
      "score": 0.9
    }
  ]'::jsonb,

  'IPSAS 18 requires entities to disclose financial information about distinguishable activities (segments) with materially different risk and return profiles. For governments, segments typically align with major service delivery areas or geographic regions.

Two segment types: service segments (health, education, public safety, infrastructure, etc.) and geographical segments (central vs. provincial, or by island group). The primary format is chosen based on the dominant source of risks — most governments choose service segments as their primary format.

Primary format disclosures include: external and inter-segment revenue, expenses, surplus/deficit, assets, liabilities, capital expenditure, depreciation, and non-cash items. Secondary format requires only revenue, assets, and capital expenditure. Intersegment transactions and balances are eliminated.

IPSAS 18 is a significant accountability tool: it allows parliament and the public to assess financial performance by service area. Combined with IPSAS 24 budget comparison data at the segment level, it provides a comprehensive picture of resource allocation and delivery outcomes.

For small governments where a single entity delivers all services, IPSAS 18 may yield limited additional insight. The standard does not mandate a minimum number of segments — entities apply professional judgment about which activities are "distinguishable" with different risk-return profiles.',

  array['IPSAS 18', 'segment reporting', 'service segments', 'geographical segments', 'primary format', 'secondary format', 'segment revenue', 'segment expenses', 'segment assets', 'segment liabilities', 'intersegment elimination', 'health segment', 'education segment', 'infrastructure segment', 'government service delivery', 'performance reporting', 'segment disclosure', 'whole-of-government segments', 'Pacific Islands segments'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 18 segment reporting government service segments geographical disclosures", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P26 — RELATED PARTY DISCLOSURES (IPSAS 20)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P26',
  'Related Party Disclosures (IPSAS 20)',
  'practitioner_topic',
  array['IPSAS-20', 'IPSAS-35', 'IPSAS-38'],
  'accrual',

  '[
    {
      "text": "IPSAS 20 — Related party definition: A related party is a party that controls, is controlled by, or is under common control with, the reporting entity; or exercises significant influence over the entity; or is a key management personnel (KMP) member of the entity or its controlling entity; or is a close family member of such a person; or is an entity significantly influenced by or over which significant influence is exercised by KMP or their close family. In the public sector: the controlling government is a related party of all entities it controls; controlled GBEs and statutory authorities are related parties of each other through common control; ministers and senior officials (KMP) and their close family members are related parties.",
      "source": "IPSAS-20-Definition",
      "score": 1.0
    },
    {
      "text": "IPSAS 20 — Disclosure requirements: Disclose the nature of the related party relationship, the types of transactions, and the amounts involved for each major category of related party. KMP remuneration must be disclosed in total, broken down by category: short-term employee benefits, post-employment benefits, other long-term benefits, and termination benefits. Transactions to disclose: purchases or sales of goods; purchases or sales of property; rendering or receiving services; leases; transfer of research and development; licence arrangements; finance arrangements; provision of guarantees; settlement of liabilities on behalf of the entity. Amounts outstanding at reporting date and provisions for doubtful debts must also be disclosed.",
      "source": "IPSAS-20-Disclosures",
      "score": 1.0
    },
    {
      "text": "IPSAS 20 — Government-related entity exemption: IPSAS 20 includes a partial exemption for related party transactions that arise simply because of common government ownership. An entity need not disclose individually all transactions with related parties arising solely because of common control by the same government — provided it discloses the fact of common control, provides a general description of the types of transactions, and makes specific disclosures about individually significant transactions. This exemption avoids impractical disclosure burdens in whole-of-government reporting where every inter-ministry transaction would technically require disclosure. However, transactions on non-arm''s-length terms must still be fully disclosed, regardless of the exemption.",
      "source": "IPSAS-20-Exemption",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 20 requires disclosure of related party transactions that may have been entered into on non-arm''s-length terms. In government, related parties are pervasive: the controlling government, controlled GBEs and authorities, ministers and senior officials (KMP), and their families.

KMP remuneration must always be disclosed in total by category (short-term, post-employment, other long-term, termination). This is mandatory without exception and is frequently missing or incomplete in developing-country government financial statements.

For transactions between government entities under common control (ministry-to-ministry, ministry-to-GBE), IPSAS 20 provides a partial exemption: individual transaction disclosure is not required provided the fact of common control is disclosed, the types of transactions are described, and individually significant non-arm''s-length transactions are still fully disclosed.

The exemption does not cover transactions on non-arm''s-length terms — these must be disclosed regardless. A government lending to a GBE at below-market rates, or a minister purchasing government property at below-market price, requires full disclosure of the terms, amounts, and the nature of the relationship.',

  array['IPSAS 20', 'related party disclosures', 'key management personnel', 'KMP', 'KMP remuneration', 'controlling government', 'GBE related party', 'common control', 'government-related entity exemption', 'close family members', 'non-arm''s-length transactions', 'related party transactions', 'minister disclosure', 'senior officials', 'intergovernmental transactions', 'significant influence', 'related party definition', 'government ownership', 'remuneration disclosure'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 20 related party disclosures KMP remuneration government controlled entities transactions", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P27 — EVENTS AFTER THE REPORTING DATE (IPSAS 14)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P27',
  'Events After the Reporting Date (IPSAS 14)',
  'practitioner_topic',
  array['IPSAS-14', 'IPSAS-1', 'IPSAS-19'],
  'accrual',

  '[
    {
      "text": "IPSAS 14 — Definition and types: Events after the reporting date are those events, both favourable and unfavourable, that occur between the reporting date and the date the financial statements are authorised for issue. Two types: (1) Adjusting events — those that provide evidence of conditions that existed at the reporting date. Financial statements must be adjusted to reflect these. Examples: settlement of a court case at an amount different from the provision; receipt of information after reporting date that an asset was impaired at reporting date; discovery of fraud or errors showing the financial statements were incorrect. (2) Non-adjusting events — those that indicate conditions that arose after the reporting date. These do not change the financial statements but are disclosed if material. Examples: a major natural disaster, a significant acquisition, a major restructuring announced after reporting date.",
      "source": "IPSAS-14-Types",
      "score": 1.0
    },
    {
      "text": "IPSAS 14 — Adjusting vs non-adjusting in practice: The key test is whether the condition existed AT the reporting date. Post-reporting date information often clarifies what was true at reporting date. Example — adjusting: a debtor declared bankrupt one month after year end — the bankruptcy likely existed at year end (adjust the provision). Example — non-adjusting: the same debtor''s business is destroyed by a fire two weeks after year end — the fire did not exist at year end (disclose if material, do not adjust). Government-specific adjusting events: final tax assessments received after year end confirming year-end tax receivable balances; final grant claims confirmed after year end; resolution of contingent liabilities where the outcome was determinable at year end.",
      "source": "IPSAS-14-Practical-Test",
      "score": 1.0
    },
    {
      "text": "IPSAS 14 — Going concern and disclosure: If, after the reporting date, it becomes apparent that the going concern assumption is inappropriate (for those entities to which it applies), the financial statements are not prepared on a going concern basis — an entirely different presentation applies. For non-adjusting events, the disclosure must include: the nature of the event and an estimate of the financial effect (or a statement that such an estimate cannot be made). Government context: natural disasters occurring after year end are a common non-adjusting event in Pacific Islands — Cyclone Winston (2016, Fiji), Cyclone Harold (2020, Vanuatu/Solomon Islands) — these require prominent disclosure if they occur between reporting date and authorisation for issue, even though the financial statements are not adjusted.",
      "source": "IPSAS-14-Disclosure",
      "score": 0.9
    }
  ]'::jsonb,

  'IPSAS 14 governs events occurring between the reporting date and the date financial statements are authorised for issue. The governing principle is whether the event reflects conditions that existed at the reporting date (adjusting — change the numbers) or conditions arising after that date (non-adjusting — disclose if material).

Adjusting events: settlement of legal cases at amounts different from provisions; bankruptcy of debtors; evidence of asset impairment at reporting date; corrections of errors. The financial statements must be updated to reflect these.

Non-adjusting events: natural disasters, major acquisitions, significant policy changes, restructurings announced after year end. These do not change the financial statements but require disclosure including the nature of the event and an estimate of the financial impact.

The practical judgment — whether a condition "existed" at reporting date — is often difficult. Post-reporting-date information that clarifies an existing condition (e.g., a debtor''s solvency status) is adjusting. Information about new events (a fire, a new policy decision) is non-adjusting.

Pacific Islands context: cyclones and natural disasters are a real concern. A cyclone striking after year end but before financial statements are authorised for issue is a non-adjusting event requiring prominent disclosure. Where the disaster affects assets or liabilities that existed at year end, subsequent valuations may also constitute adjusting evidence.',

  array['IPSAS 14', 'events after reporting date', 'adjusting events', 'non-adjusting events', 'subsequent events', 'reporting date', 'authorisation for issue', 'going concern', 'post-balance-sheet events', 'natural disaster disclosure', 'cyclone disclosure', 'court case settlement', 'debtor bankruptcy', 'impairment evidence', 'material subsequent events', 'government subsequent events', 'Pacific Islands natural disaster', 'financial statement adjustment'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 14 events after reporting date adjusting non-adjusting subsequent events government", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P28 — ACCOUNTING POLICIES, ESTIMATES AND ERRORS (IPSAS 3)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P28',
  'Accounting Policies, Estimates and Errors (IPSAS 3)',
  'practitioner_topic',
  array['IPSAS-3', 'IPSAS-1'],
  'accrual',

  '[
    {
      "text": "IPSAS 3 — Selecting accounting policies: Accounting policies are the specific principles, bases, conventions, rules, and practices applied in preparing and presenting financial statements. Where an IPSAS standard specifically applies to a transaction, the policy must comply with that standard. Where no standard specifically applies, management uses judgment to develop a policy using (in order): (1) requirements in IPSAS standards dealing with similar issues; (2) the definitions, recognition criteria, and measurement concepts in the IPSAS Conceptual Framework; (3) pronouncements by the IASB (IFRS) dealing with similar issues; (4) other accepted public and private sector guidance consistent with the sources above. Accounting policies must be applied consistently for similar transactions period-to-period.",
      "source": "IPSAS-3-Policy-Selection",
      "score": 1.0
    },
    {
      "text": "IPSAS 3 — Changes in accounting policy vs. changes in estimates: This distinction is critical because the accounting treatment differs. Change in accounting policy: a voluntary change (entity selects a different permitted policy) or a mandatory change (required by a new IPSAS). Voluntary changes are retrospective — prior period comparative figures and opening net assets are restated as if the new policy had always been applied, unless impracticable. Change in accounting estimate: a revision to an estimated amount arising from new information (e.g., change in useful life of an asset, change in the provision estimate). Estimates are changed prospectively — no restatement of comparatives; the change applies from the current period and future periods. Distinguishing a policy change from an estimate change requires judgment: changing from straight-line to declining-balance depreciation is a policy change; revising the useful life of an asset is an estimate change.",
      "source": "IPSAS-3-Policy-vs-Estimate",
      "score": 1.0
    },
    {
      "text": "IPSAS 3 — Prior period errors: Prior period errors are omissions from, and misstatements in, the entity''s financial statements for one or more prior periods arising from failure to use (or misuse of) reliable information. Material prior period errors are corrected retrospectively — restate the comparative figures for the period(s) affected; if the error occurred before the earliest comparative period presented, restate the opening balances for the earliest period shown. Disclose: the nature of the error, the amount of the correction in each period presented, and the amount of correction at the beginning of the earliest comparative period. If retrospective restatement is impracticable for a specific period, disclose why and describe how the error has been corrected. In transitioning governments, material prior period errors are common during the early years of accrual reporting as recognition principles are fully applied for the first time.",
      "source": "IPSAS-3-Errors",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 3 governs three distinct but related topics: the selection and disclosure of accounting policies, the treatment of changes in accounting policies and estimates, and the correction of prior period errors.

Accounting policies must be consistently applied. Where no specific IPSAS standard applies, policies are selected using a defined hierarchy ending with IFRS pronouncements on similar issues and other accepted practice.

The policy-vs-estimate distinction determines how a change is reflected: policy changes are retrospective (restate comparatives as if the new policy had always applied); estimate changes are prospective (apply from the current period onward). Misclassifying an estimate change as a policy change would incorrectly require restatement. Common government examples: changing from cost to revaluation model for PPE is a policy change (retrospective, subject to impracticability). Revising the useful life of a building is an estimate change (prospective).

Prior period errors — from omissions or misstatements in earlier financial statements — require retrospective restatement. Material errors are corrected in the earliest comparative period presented, with disclosure of the nature and amount of correction. In governments transitioning to accrual IPSAS, errors discovered in early periods (e.g., PPE not recognised, leave liabilities omitted) are treated as prior period errors once the reporting entity has the information needed to correct them.',

  array['IPSAS 3', 'accounting policies', 'accounting estimates', 'prior period errors', 'change in accounting policy', 'change in accounting estimate', 'retrospective restatement', 'prospective change', 'policy hierarchy', 'IPSAS hierarchy', 'consistency', 'error correction', 'material error', 'comparative restatement', 'opening balances restatement', 'voluntary policy change', 'mandatory policy change', 'estimate revision', 'useful life revision', 'impracticability'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 3 accounting policies estimates errors changes retrospective restatement government", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P29 — FIRST-TIME ADOPTION OF ACCRUAL IPSAS (IPSAS 33)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P29',
  'First-Time Adoption of Accrual IPSAS (IPSAS 33)',
  'practitioner_topic',
  array['IPSAS-33', 'IPSAS-17', 'IPSAS-39', 'IPSAS-35', 'IPSAS-41'],
  'accrual',

  '[
    {
      "text": "IPSAS 33 — Key dates and the opening SOFP: The adoption date is the first day of the accounting period for which the entity presents its first IPSAS financial statements. The transition date is one year before the adoption date (the start of the comparative period). The entity must prepare an opening Statement of Financial Position (SOFP) at the transition date. Requirements for the opening SOFP: (1) Recognise all assets and liabilities required by IPSAS; (2) Derecognise items that IPSAS prohibits as assets or liabilities; (3) Reclassify items previously classified under a different category; (4) Measure all assets and liabilities in accordance with IPSAS. All adjustments from the pre-IPSAS carrying amounts are recognised directly in the opening accumulated surplus/deficit (equity).",
      "source": "IPSAS-33-Opening-SOFP",
      "score": 1.0
    },
    {
      "text": "IPSAS 33 — Transitional reliefs (critical for developing countries): IPSAS 33 permits a three-year transitional relief period from the adoption date (not the transition date) for the following: (1) Property, plant and equipment — entity may use deemed cost (fair value at transition date) rather than full retrospective recognition and measurement. (2) Leases — simplified approach for initial recognition. (3) Employee benefits — actuarial measurement may use simplified assumptions at transition. (4) Financial instruments — IPSAS 41 may be applied prospectively from adoption date. (5) Consolidation — no requirement to restate pre-transition combinations; controlled entities recognised from adoption date. Each relief elected must be disclosed; the entity must disclose what it expects to recognise when the relief period ends.",
      "source": "IPSAS-33-Transitional-Reliefs",
      "score": 1.0
    },
    {
      "text": "IPSAS 33 — IMF four-phase transition model in practice: The IMF and World Bank advocate a four-phase approach for developing-country IPSAS adoption: Phase 1 — Strengthen cash accounting (reliable cash records, bank reconciliations, budget vs. actual reporting); Phase 2 — Add supplementary disclosures (PPE inventory, payables aging, leave liabilities disclosed as notes); Phase 3 — Modified accrual (key accruals added: payables, receivables, some PPE) while maintaining cash basis for the main statements; Phase 4 — Full accrual IPSAS (complete on-balance-sheet recognition and measurement). Solomon Islands Government is currently in the transition pathway. IPSAS 33 transitional reliefs are specifically designed to make Phase 4 adoption achievable by sequencing the most difficult items (PPE, actuarial pension liabilities) over the relief period.",
      "source": "IPSAS-33-IMF-Transition",
      "score": 1.0
    }
  ]'::jsonb,

  'IPSAS 33 provides the framework for governments moving from cash (or other) basis accounting to full accrual IPSAS. It defines the adoption date, transition date, and the requirements for preparing an opening Statement of Financial Position.

The opening SOFP adjustments — recognising previously unrecognised assets and liabilities, derecognising prohibited items, reclassifying, and remeasuring — are all taken directly to accumulated surplus/deficit (equity). They do not pass through the income statement.

The transitional reliefs are the most important practical feature of IPSAS 33. A three-year relief period (from adoption date) is available for: PPE (use deemed cost rather than full retrospective valuation); employee benefits (simplified actuarial assumptions); financial instruments (prospective application of IPSAS 41); consolidation (no restatement of pre-adoption combinations); and leases (simplified approach). Each relief elected must be disclosed, along with what the entity plans to recognise when the relief expires.

The IMF four-phase model positions IPSAS 33 adoption at Phase 4 of a structured transition. For Solomon Islands and similar governments, Phases 1–3 build the data infrastructure (asset registers, payroll records, receivables systems) needed to support full IPSAS recognition. IPSAS 33''s reliefs are specifically designed to allow Phase 4 adoption even before all data is complete, with a commitment to progressively close the gaps.',

  array['IPSAS 33', 'first-time adoption', 'accrual IPSAS', 'transition date', 'adoption date', 'opening SOFP', 'opening statement of financial position', 'transitional reliefs', 'deemed cost', 'PPE transition', 'employee benefits transition', 'financial instruments transition', 'consolidation transition', 'three-year relief', 'IMF four-phase model', 'cash to accrual transition', 'Solomon Islands transition', 'accumulated surplus deficit', 'first IPSAS financial statements', 'IPSAS adoption plan'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 33 first-time adoption accrual transitional reliefs opening statement financial position", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P30 — CASH BASIS IPSAS — FINANCIAL REPORTING (C4)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P30',
  'Cash Basis IPSAS — Financial Reporting (C4)',
  'practitioner_topic',
  array['C4'],
  'cash-basis',

  '[
    {
      "text": "Cash Basis IPSAS (C4, revised 2017) — Structure: The standard has two parts. Part 1 (mandatory requirements) applies to all entities reporting on the cash basis. Part 2 contains encouraged (voluntary) additional disclosures that move the entity progressively toward accrual reporting. Part 1 requirements: (1) Statement of Cash Receipts and Payments — the primary financial statement, reporting all cash receipts and cash payments during the period. (2) Accounting policies and explanatory notes. (3) Comparison of budget and actual cash flows (required where the approved budget is publicly available). Part 2 encouraged disclosures include: schedules of property, plant and equipment; schedules of external assistance received; statements of comparative financial information; and cash flows from service delivery activities.",
      "source": "C4-Structure",
      "score": 1.0
    },
    {
      "text": "Cash Basis IPSAS — Statement of Cash Receipts and Payments: This is the central financial statement. It reports: all cash receipts during the period (taxes collected, grants received, borrowings received, asset sale proceeds, other receipts); all cash payments during the period (salaries and wages paid, goods and services paid, transfers paid, debt service paid, capital expenditure paid, other payments); and the net cash movement for the period with opening and closing cash balances. Cash is defined broadly: cash on hand, demand deposits, and cash equivalents (short-term highly liquid investments). The Treasury Single Account (TSA) balance is cash. Restricted cash (e.g., donor project accounts) is shown separately. No assets or liabilities other than cash are recognised in Part 1.",
      "source": "C4-Statement",
      "score": 1.0
    },
    {
      "text": "Cash Basis IPSAS — Transition context: The Cash Basis IPSAS is intended as a stepping stone, not a permanent destination. The IPSASB revised the standard in 2017 specifically to strengthen Part 2 encouraged disclosures so that entities making progress toward accrual adoption can demonstrate that progress within the cash basis framework. For Solomon Islands and similar Pacific Islands governments currently on cash basis: (1) Full compliance with Part 1 is the minimum required; (2) Adopting selected Part 2 disclosures builds data quality and management capacity; (3) The budget comparison statement is critical for accountability — the reconciliation between budget and cash actuals is scrutinised by parliament; (4) External assistance schedules (Part 2) are particularly valuable where donor funding is material, providing visibility over aid flows by donor and project.",
      "source": "C4-Transition-Context",
      "score": 1.0
    }
  ]'::jsonb,

  'The Cash Basis IPSAS (C4, revised 2017) is the applicable standard for entities reporting on the cash basis of accounting. It is a single standard (unlike the 48-standard accrual suite) with two parts: Part 1 (mandatory) and Part 2 (encouraged additional disclosures).

The primary financial statement is the Statement of Cash Receipts and Payments. It records all cash in and cash out during the period, with opening and closing balances. No assets or liabilities other than cash are recognised under Part 1. This starkly limits the information content compared to accrual statements — assets, liabilities, depreciation, accruals, and non-cash flows are all invisible.

The budget comparison statement is a mandatory disclosure where the budget is publicly available. This is the most important accountability document in a cash-basis government''s financial statements — it shows what was budgeted (original and final) versus what was actually received and spent in cash.

Part 2 encouraged disclosures allow entities to voluntarily add near-accrual information: PPE schedules, payables and receivables, external assistance (donor funding) schedules, comparative information. Adopting selected Part 2 disclosures builds the data infrastructure and management capability needed for eventual IPSAS 33 accrual adoption.

Solomon Islands Government currently reports under Cash Basis IPSAS Part 1. The IMF four-phase transition model used in the region identifies progressive adoption of Part 2 disclosures as an intermediate phase before full accrual adoption.',

  array['Cash Basis IPSAS', 'C4', 'cash receipts', 'cash payments', 'statement of cash receipts and payments', 'Part 1', 'Part 2', 'budget comparison cash basis', 'Treasury Single Account', 'TSA', 'restricted cash', 'donor project accounts', 'external assistance', 'cash basis financial statements', 'Solomon Islands cash basis', 'Pacific Islands accounting', 'cash to accrual transition', 'encouraged disclosures', 'cash basis budget', 'cash basis accounting'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "Cash Basis IPSAS C4 Part 1 Part 2 statement cash receipts payments budget comparison", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P31 — HYPERINFLATIONARY ECONOMIES (IPSAS 10)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P31',
  'Hyperinflationary Economies (IPSAS 10)',
  'practitioner_topic',
  array['IPSAS-10', 'IPSAS-4'],
  'accrual',

  '[
    {
      "text": "IPSAS 10 — Indicators of hyperinflation: IPSAS 10 does not define hyperinflation by a specific inflation rate threshold, but lists qualitative indicators: (1) The general population prefers to keep its wealth in non-monetary assets or in a relatively stable foreign currency; (2) Prices are stated in terms of a relatively stable foreign currency; (3) Credit sales and purchases take place at prices that compensate for the expected loss of purchasing power, even for short credit periods; (4) Interest rates, wages, and prices are linked to a price index; (5) The cumulative inflation rate over three years approaches or exceeds 100%. All five indicators together constitute the assessment — the 100% threshold is illustrative, not definitive.",
      "source": "IPSAS-10-Indicators",
      "score": 1.0
    },
    {
      "text": "IPSAS 10 — Restatement procedure: When the reporting currency is the currency of a hyperinflationary economy, financial statements must be restated in terms of the measuring unit current at the end of the reporting period. Non-monetary items measured at historical cost (PPE, inventories, intangibles) are restated by applying a general price index from the date of acquisition or the last revaluation. Non-monetary items already measured at current amounts (items at fair value or revalued amounts) are not restated — they are already in current terms. The gain or loss on the net monetary position (the difference between monetary assets and monetary liabilities, adjusted for the inflation index) is recognised in surplus/deficit. Comparative periods are also restated to the current period''s price level.",
      "source": "IPSAS-10-Restatement",
      "score": 1.0
    },
    {
      "text": "IPSAS 10 — Practical context: Hyperinflation is not currently a concern for Solomon Islands (low-to-moderate inflation environment). However, it is relevant for Pacific Islands practitioners who may work in or advise entities in high-inflation economies (Zimbabwe, Argentina, Türkiye, Venezuela, Sudan). Entities in these environments can present materially misleading financial statements if they do not restate for inflation — historical cost figures become economically meaningless when inflation is severe. Key practical issue: when a government entity has significant non-monetary assets (PPE) acquired years ago, the restated carrying amounts can be orders of magnitude higher than historical cost, dramatically changing the apparent financial position.",
      "source": "IPSAS-10-Practical",
      "score": 0.9
    }
  ]'::jsonb,

  'IPSAS 10 applies when an entity''s functional currency is the currency of a hyperinflationary economy. Five qualitative indicators signal hyperinflation, with the most commonly cited being cumulative 3-year inflation approaching or exceeding 100%.

The restatement procedure: historical cost non-monetary items (PPE, inventories, intangibles) are restated by applying a general price index from the acquisition date to the reporting date. Items already at current value (fair value, revalued amounts) are not restated. The net monetary position (monetary assets minus monetary liabilities) generates a gain or loss in surplus/deficit equal to the purchasing-power change on that net position.

Comparative periods are also restated to the current period''s price level — effectively all historic figures are expressed in current purchasing-power units. This is a significant presentational change that makes financial statements comparable across periods despite the inflation distortion.

While Solomon Islands is not currently hyperinflationary, IPSAS 10 knowledge is important for practitioners who may advise entities in higher-inflation environments or who need to understand the basis for IPSAS 10 disclosures when reviewing financial statements from such environments.',

  array['IPSAS 10', 'hyperinflation', 'hyperinflationary economies', 'price index', 'general price index', 'restatement', 'non-monetary items', 'monetary items', 'net monetary position', 'purchasing power', 'inflation indicators', 'cumulative inflation', 'historical cost restatement', 'Zimbabwe', 'Argentina', 'high inflation economies', 'inflation gain loss', 'current measuring unit', 'comparative restatement', 'IPSAS 4 interaction'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 10 hyperinflationary economies restatement price index non-monetary items", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;


-- ============================================================================
-- P32 — GENERAL GOVERNMENT SECTOR DISCLOSURE (IPSAS 22)
-- ============================================================================

insert into rag_knowledge_cache (
  cache_key, label, entry_type, standard_ids, pathway,
  raw_chunks, synthesised_summary, keywords,
  standard_status, source_chunk_count, hierarchy_level, source_folder, generation_query
) values (
  'practitioner-P32',
  'General Government Sector Disclosure (IPSAS 22)',
  'practitioner_topic',
  array['IPSAS-22', 'IPSAS-35', 'IPSAS-18'],
  'accrual',

  '[
    {
      "text": "IPSAS 22 — Purpose and scope: IPSAS 22 is a voluntary standard. It prescribes disclosure requirements for governments that choose to present information about the General Government Sector (GGS) within their whole-of-government financial statements. The GGS excludes publicly-owned corporations (Government Business Enterprises) from the government reporting entity — it represents only the core government functions financed primarily by taxation and other non-exchange revenues. This mirrors the classification used in Government Finance Statistics (GFS) frameworks (IMF GFS manual and ESA 2010), which separately analyse the GGS for fiscal sustainability and debt analysis.",
      "source": "IPSAS-22-Purpose",
      "score": 1.0
    },
    {
      "text": "IPSAS 22 — Required disclosures: Where an entity presents GGS information, IPSAS 22 requires disclosure of: (a) a description of the entities included in and excluded from the GGS; (b) a description of the basis used to distinguish GGS from public corporations; (c) for each class of assets, liabilities, revenue, and expenses — the amount attributable to the GGS and the amount attributable to public corporations and any other entities; (d) the basis of preparation for GGS information (including whether it is on an accrual or GFS basis). The GGS disclosure appears as supplementary information within the consolidated whole-of-government financial statements — it is not a primary statement.",
      "source": "IPSAS-22-Disclosures",
      "score": 1.0
    },
    {
      "text": "IPSAS 22 — Reconciliation to GFS and practical context: A key purpose of IPSAS 22 is to allow users of IPSAS financial statements to reconcile the accrual-based IPSAS numbers to the Government Finance Statistics (GFS) fiscal aggregates reported to the IMF and used in debt sustainability analyses. GFS uses different classification conventions (different treatment of some transfers, different boundary for the reporting entity) and may be on a different basis (ESA accrual vs. cash GFS). The reconciliation between IPSAS surplus/deficit and GFS fiscal balance, and between IPSAS net assets and GFS net worth, is highly valuable for fiscal transparency. Most Pacific Islands governments report GFS data to the IMF separately from their IPSAS financial statements — IPSAS 22 provides a framework for bridging the two.",
      "source": "IPSAS-22-GFS-Reconciliation",
      "score": 0.9
    }
  ]'::jsonb,

  'IPSAS 22 is a voluntary disclosure standard for governments wishing to present information about the General Government Sector (GGS) — the core government functions financed primarily by taxation, excluding Government Business Enterprises and public corporations.

The GGS concept mirrors the classification used in IMF Government Finance Statistics (GFS) frameworks. Many governments are required to report GFS data to the IMF and multilateral lenders. IPSAS 22 provides a framework for presenting GGS information within IPSAS financial statements, enabling users to reconcile between the IPSAS accrual view and the GFS statistical view.

Where GGS information is presented, IPSAS 22 requires: description of entities included and excluded from the GGS; basis for distinguishing GGS from public corporations; breakdown of assets, liabilities, revenue, and expenses between GGS and public corporations; and basis of preparation.

The most practically valuable use of IPSAS 22 is the reconciliation between the IPSAS surplus/deficit and the GFS fiscal balance, and between IPSAS net assets and GFS net worth. These reconciliations help fiscal analysts, IMF/World Bank assessors, and rating agencies understand the government''s true consolidated financial position across both frameworks.

For Solomon Islands and similar Pacific Islands governments: the GGS/GBE boundary is important because state-owned enterprises (electricity, telecommunications, ports) carry significant liabilities that affect whole-of-government risk but are outside the GGS boundary for GFS fiscal sustainability analysis.',

  array['IPSAS 22', 'General Government Sector', 'GGS', 'GFS', 'Government Finance Statistics', 'IMF GFS', 'public corporations', 'GBE exclusion', 'fiscal balance', 'GFS reconciliation', 'net worth GFS', 'debt sustainability', 'whole-of-government boundary', 'ESA 2010', 'accrual GFS', 'IPSAS GFS bridge', 'fiscal transparency', 'Solomon Islands GFS', 'voluntary disclosure', 'supplementary GGS information'],

  'current',
  3,
  null,
  'synthesised-multiple',
  '{"query_text": "IPSAS 22 general government sector GFS reconciliation disclosure public corporations", "n_results": 10}'::jsonb
) on conflict (cache_key) do nothing;
