// /pricing — Pricing page covering both products plus the bundle.
// Anchors #drills, #desk, #bundle let the product pages deep-link to the right
// section. Copy is taken verbatim from Redesigned-Pages/claude-code-brief.md
// (Step 4). Bundle prices are 20% off the combined annual list — recalculate
// here if list prices change (see PRICING_BUNDLE comment below).

import type { Metadata } from "next"
import Link from "next/link"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"

export const metadata: Metadata = {
  title: "Pricing — Pavitt Public Finance",
  description:
    "Pricing for IPSAS Drills and IPSAS Desk. Self-serve plans for individuals and small teams; organisation plans for ministries and audit firms; donor-funded and regional pricing available.",
  alternates: { canonical: "/pricing" },
}

type Tier = {
  id: string
  name: string
  price: string
  priceSub?: string
  description: string
  features: string[]
  cta: { label: string; href: string }
  badge?: string
  small?: { text: string; linkLabel?: string; linkHref?: string }
}

const DRILLS_TIERS: Tier[] = [
  {
    id: "drills-individual",
    name: "Individual",
    price: "USD 19 / month",
    priceSub: "or USD 180 / year (save USD 48)",
    description:
      "For individual accountants, junior staff, and PFM consultants building their own IPSAS skills.",
    features: [
      "Full drill library, all standards",
      "Personal progress tracking",
      "Updated as standards are revised",
      "14-day free trial — no card to look around",
    ],
    cta: { label: "Start free trial", href: "/register" },
    small: {
      text: "Student pricing (USD 9/mo, .edu or equivalent verification) — ",
      linkLabel: "contact us",
      linkHref: "/#contact",
    },
  },
  {
    id: "drills-team",
    name: "Team",
    price: "USD 600 / year for 5 seats",
    priceSub: "Additional seats: USD 80 / seat / year",
    description:
      "For small audit firms, donor-project teams, and small finance departments.",
    features: [
      "Everything in Individual",
      "Up to 5 staff in one account",
      "Team progress dashboard for the lead",
      "Quarterly review of team weak spots",
      "Invoicing available (annual, in advance)",
    ],
    cta: { label: "Start free trial", href: "/register" },
    badge: "Most popular for small audit firms",
  },
  {
    id: "drills-organisation",
    name: "Organisation",
    price: "From USD 4,800 / year",
    priceSub: "Unlimited staff in one entity",
    description: "For Ministries, statutory bodies, and larger audit firms.",
    features: [
      "Everything in Team",
      "Unlimited seats within one organisation",
      "Director's dashboard with team-wide analytics",
      "Onboarding session for the lead accountant",
      "Annual invoicing, donor-project budget format on request",
    ],
    cta: { label: "Contact us", href: "/#contact" },
  },
]

const DESK_TIERS: Tier[] = [
  {
    id: "desk-practitioner",
    name: "Practitioner",
    price: "USD 49 / month",
    priceSub: "or USD 480 / year (save USD 108)",
    description:
      "For senior accountants, sole practitioners, and PFM consultants.",
    features: [
      "Up to 100 queries / month",
      "Paragraph-cited answers from the IPSAS source",
      "Document upload (PDF) for context-specific questions",
      "14-day free trial — generous query allowance, no card to look around",
    ],
    cta: { label: "Start free trial", href: "/register" },
  },
  {
    id: "desk-firm",
    name: "Firm / Small Ministry",
    price: "USD 2,400 / year",
    priceSub: "Up to 10 named users · 1,000 queries / month shared",
    description: "For small-to-mid audit firms and small Ministries of Finance.",
    features: [
      "Everything in Practitioner",
      "Up to 10 named users in one account",
      "Shared query allowance (1,000/month)",
      "Working-paper export format for audit files",
      "Annual invoicing",
    ],
    cta: { label: "Contact us", href: "/#contact" },
    badge: "Most popular for audit firms outside Big Four",
  },
  {
    id: "desk-customised",
    name: "Customised",
    price: "From USD 6,000 / year",
    priceSub: "Local statute and regulation added",
    description:
      "For organisations needing the Desk to reflect their specific compliance environment.",
    features: [
      "Everything in Firm / Small Ministry",
      "Your local statute, regulations, and accounting manual added to the reference base",
      "Bespoke responses tied to your jurisdiction",
      "Quarterly review and update of the customised reference base",
      "Dedicated point of contact",
    ],
    cta: { label: "Contact us", href: "/#contact" },
  },
]

// PRICING_BUNDLE: each line below is 20% off the combined annual list price.
// If list prices in DRILLS_TIERS or DESK_TIERS change, recalculate these.
//   - Individual ($180/yr) + Practitioner ($480/yr) = $660 → 20% off = $528/yr
//     Monthly equivalent: ($19 + $49) × 0.8 ≈ USD 54 / month
//   - Team ($600/yr) + Firm/Small Ministry ($2,400/yr) = $3,000 → 20% off = $2,400/yr
const BUNDLE_LINES: { label: string; price: string }[] = [
  { label: "Individual + Practitioner", price: "USD 54 / month or USD 528 / year" },
  { label: "Team + Firm", price: "USD 2,400 / year" },
  { label: "Organisation + Firm", price: "Contact us for combined pricing" },
  { label: "Organisation + Customised", price: "Contact us for combined pricing" },
]

const FAQ = [
  {
    q: "Do prices include VAT or local taxes?",
    a: "Prices are exclusive of any local sales tax or VAT. For invoiced organisational plans, applicable taxes will be shown on the invoice.",
  },
  {
    q: "Can we pay by invoice rather than card?",
    a: "Yes — Team, Organisation, Firm, and Customised plans can all be invoiced annually in advance. Individual and Practitioner plans are card-only.",
  },
  {
    q: "Can we cancel any time?",
    a: "Yes. Self-serve monthly plans cancel at the next billing date. Annual plans run to the end of the period; we don't pro-rate refunds, but we don't auto-renew without a reminder.",
  },
  {
    q: "What counts as one “query” on the Desk?",
    a: "One query is one question with one answer, including any follow-up clarification within the same conversation. Practitioner plans have a generous 100/month allowance; in normal use, very few practitioners reach the cap.",
  },
  {
    q: "Is there a free version?",
    a: "Both products offer a 14-day free trial with no credit card required to start. We don't offer a permanently free tier — keeping the products focused, accurate, and well-maintained requires real revenue.",
  },
]

function PricingCard({ tier }: { tier: Tier }) {
  return (
    <div className="relative flex flex-col rounded-lg border border-ink-200 bg-white p-6 shadow-crisp-sm">
      {tier.badge ? (
        <div className="absolute -top-3 left-6 rounded-full bg-ppf-sky px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white shadow-crisp-sm">
          {tier.badge}
        </div>
      ) : null}
      <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-ink-900">
        {tier.name}
      </h3>
      <div className="mt-4 text-[24px] font-semibold tracking-[-0.02em] text-ink-900">
        {tier.price}
      </div>
      {tier.priceSub ? (
        <div className="mt-1 text-[13px] text-ink-600">{tier.priceSub}</div>
      ) : null}
      <p className="mt-4 text-[14px] leading-[1.65] text-ink-700">
        {tier.description}
      </p>
      <ul className="mt-5 flex-1 space-y-2.5">
        {tier.features.map((f) => (
          <li key={f} className="flex gap-2.5 text-[14px] leading-[1.55] text-ink-800">
            <span aria-hidden className="mt-1 shrink-0 text-ppf-sky">
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={tier.cta.href}
        className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-ppf-sky px-4 py-2.5 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
      >
        {tier.cta.label}
      </Link>
      {tier.small ? (
        <p className="mt-3 text-[12px] leading-[1.55] text-ink-500">
          {tier.small.text}
          {tier.small.linkLabel && tier.small.linkHref ? (
            <Link
              href={tier.small.linkHref}
              className="text-ppf-sky underline-offset-2 hover:underline"
            >
              {tier.small.linkLabel}
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white">
        {/* ---------- HERO ---------- */}
        <section className="bg-ppf-navy px-6 pt-[140px] pb-16 text-white md:px-12 md:pt-[160px] md:pb-20">
          <div className="mx-auto max-w-[1240px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ppf-sky">
              Pricing
            </p>
            <h1 className="mt-3 max-w-[22ch] text-[clamp(36px,5vw,64px)] font-semibold leading-[1.05] tracking-[-0.03em]">
              Pricing
            </h1>
            <p className="mt-4 max-w-[40ch] text-[clamp(18px,2vw,22px)] font-medium leading-[1.4] text-ppf-sky">
              Built to be affordable to the teams that need it most.
            </p>
            <p className="mt-6 max-w-[68ch] text-[16px] leading-[1.65] text-white/80 md:text-[17px]">
              Self-serve plans for individuals and small teams. Organisation plans for ministries and audit firms. Donor-funded pricing for governments adopting IPSAS with international donor support. All prices in USD; reduced pricing available for organisations in low- and lower-middle-income countries — see below.
            </p>
          </div>
        </section>

        {/* ---------- SECTION 1 — IPSAS Drills pricing ---------- */}
        <section id="drills" className="scroll-mt-[120px] px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">IPSAS Drills</p>
            <h2 className="mt-3 max-w-[40ch] text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              For staff and teams building IPSAS reflexes.
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {DRILLS_TIERS.map((tier) => (
                <PricingCard key={tier.id} tier={tier} />
              ))}
            </div>
            <p className="mt-8 text-[13px] italic leading-[1.65] text-ink-600">
              <strong className="not-italic font-semibold text-ink-900">
                Donor-funded deployment?
              </strong>{" "}
              If your IPSAS adoption is being supported by World Bank, EU, DFAT, USAID, MCC, FCDO, or another donor,{" "}
              <Link
                href="/#contact"
                className="text-ppf-sky underline-offset-2 hover:underline"
              >
                ask about
              </Link>{" "}
              our donor-funded pricing format — designed to drop directly into a project budget line.
            </p>
          </div>
        </section>

        {/* ---------- SECTION 2 — IPSAS Desk pricing ---------- */}
        <section
          id="desk"
          className="scroll-mt-[120px] border-t border-ink-200 bg-ink-50 px-6 py-20 md:px-12 md:py-24"
        >
          <div className="mx-auto max-w-[1240px]">
            <p className="eyebrow">IPSAS Desk</p>
            <h2 className="mt-3 max-w-[40ch] text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              For practitioners and audit teams who need sourced answers, fast.
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {DESK_TIERS.map((tier) => (
                <PricingCard key={tier.id} tier={tier} />
              ))}
            </div>
          </div>
        </section>

        {/* ---------- SECTION 3 — Bundle ---------- */}
        <section
          id="bundle"
          className="scroll-mt-[120px] border-t border-ink-200 px-6 py-20 md:px-12 md:py-24"
        >
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">Drills + Desk</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              Save 20% when you take both.
            </h2>
            <p className="mt-6 text-[16px] leading-[1.7] text-ink-700">
              Drills builds the reflexes for routine treatments. The Desk handles the hard cases when they come up. Most of our team and ministry customers want both — so we offer them together at a discount.
            </p>

            <div className="mt-10 rounded-lg border border-ppf-sky/30 bg-ppf-pale p-6 md:p-8">
              <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-ink-900">
                Drills + Desk bundle
              </h3>
              <dl className="mt-5 divide-y divide-ink-200">
                {BUNDLE_LINES.map((line) => (
                  <div
                    key={line.label}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between"
                  >
                    <dt className="text-[14px] font-medium text-ink-900">
                      {line.label}
                    </dt>
                    <dd className="text-[14px] tabular-nums text-ink-700">
                      {line.price}
                    </dd>
                  </div>
                ))}
              </dl>
              <Link
                href="/#contact"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-ppf-sky px-5 py-2.5 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
              >
                Contact us for bundle setup
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- SECTION 4 — Regional and donor-funded pricing ---------- */}
        <section className="border-t border-ink-200 bg-ink-50 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">Regional &amp; donor</p>
            <h2 className="mt-3 text-[clamp(26px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.025em] text-ink-900">
              Regional and donor-funded pricing
            </h2>
            <div className="mt-8 space-y-5 text-[16px] leading-[1.7] text-ink-700">
              <p>
                We charge full list price to organisations in high-income countries. For organisations based in countries on the OECD DAC list of ODA recipients — particularly Least Developed Countries and Lower-Middle-Income Countries — we offer reduced pricing of 30 to 50 percent off list, depending on country tier and organisation type.
              </p>
              <p>
                For governments adopting IPSAS with the support of an international donor (World Bank, EU, DFAT, USAID, MCC, FCDO, and others), we provide pricing in a format designed to drop directly into a project budget line. We will provide a sample budget justification on request.
              </p>
              <p>
                To request regional or donor-funded pricing, send us a brief on your organisation, country, and intended use, and we&rsquo;ll come back to you within two working days.
              </p>
            </div>
            <Link
              href="/#contact"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-ppf-sky px-5 py-2.5 text-sm font-semibold text-white shadow-crisp-sm transition-colors hover:bg-ppf-sky-hover"
            >
              Request regional / donor pricing
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        {/* ---------- SECTION 5 — Pricing FAQ ---------- */}
        <section className="border-t border-ink-200 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-[920px]">
            <p className="eyebrow">FAQ</p>
            <h3 className="mt-3 text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-0.02em] text-ink-900">
              Common questions about pricing
            </h3>
            <dl className="mt-8 divide-y divide-ink-200">
              {FAQ.map((item) => (
                <div key={item.q} className="py-5">
                  <dt className="text-[15px] font-semibold text-ink-900">
                    {item.q}
                  </dt>
                  <dd className="mt-1.5 text-[14px] leading-[1.65] text-ink-700">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
