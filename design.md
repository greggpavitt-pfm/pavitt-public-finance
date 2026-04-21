# Pavitt Public Finance — Design Specification

This document captures the current design system for the `pavitt-public-finance` website (pfmexpert.net). It is the single source of truth for visual design decisions and the starting point for any redesign or Claude Design improvements.

---

## 1. Brand Identity

**Company:** Pavitt Public Finance (PPF)  
**Domain:** pfmexpert.net  
**Positioning:** Professional services site for an international PFM consultant — credibility, authority, and global reach are the primary signals.

### Logo
- Transparent PNG: `/public/images/logo-transparent.png`
- White-letter variant: `/public/images/logo-white-letters.png`
- SVG variants: `logo.svg`, `logo-transparent.svg`, `logo-original.svg`
- Usage: navbar (72px height, oversized to bleed into the nav bar), hero (80px), footer (144px at 80% opacity)

---

## 2. Colour Palette

Derived from the original PPF logo.

| Token | Hex | Usage |
|-------|-----|-------|
| `--ppf-navy` | `#072A80` | Dark backgrounds (navbar, expertise section, contact section, footer) |
| `--ppf-blue` | `#0A6AB9` | Section labels (uppercase tracking), hover states, borders |
| `--ppf-sky` | `#1F7FCF` | CTA buttons, active badges, hover targets, footnotes |
| `--ppf-light` | `#E8F1FB` | Light-tinted section backgrounds (current engagement callout) |
| `--ppf-pale` | `#F0F6FD` | Very light blue — donors section background |
| White | `#FFFFFF` | Bio section, regions section, body text on dark backgrounds |
| `--foreground` | `#171717` | Default body text on white |
| `text-gray-700` | — | Body text in bio paragraphs |
| `text-slate-700` | — | Country list items |
| `text-blue-200/80` | — | Card body text on navy backgrounds |

**No dark mode** on the marketing site (dark mode only affects global CSS variables; site uses explicit class-based colours throughout).

---

## 3. Typography

| Role | Family | Weight | Size | Notes |
|------|--------|--------|------|-------|
| Body | Geist Sans (Google), fallback Arial/Helvetica | 400 | — | Set via `--font-geist-sans` CSS variable |
| Mono | Geist Mono | 400 | — | Available but not used in marketing sections |
| Page title | Geist Sans | 700 | 4xl / 6xl (md) | Hero `<h1>` |
| Section heading | Geist Sans | 700 | 3xl / 4xl (md) | Used in Expertise, Regions, Donors, Contact |
| Card heading | Geist Sans | 600 | lg | Expertise card full names |
| Card label | Geist Sans | 700 | 3xl | Short acronym label (PIM, IPSAS etc.) |
| Section eyebrow | Geist Sans | 600 | sm | Uppercase, widest tracking, `text-ppf-blue` or `text-ppf-sky` |
| Tagline | Geist Sans | 400 | xl / 2xl (md) | Hero tagline, uppercase, widest tracking, `text-ppf-blue` |
| Bio paragraph | Geist Sans | 400 | lg | `leading-relaxed`, `text-gray-700` |
| Nav links | Geist Sans | 500 | sm | `text-blue-200`, hover `text-white` |

---

## 4. Spacing & Layout

- **Max content width:** `max-w-6xl` (72rem) with `mx-auto` — used on all sections
- **Contact section:** `max-w-3xl` (narrower, form context)
- **Horizontal padding:** `px-6` mobile / `px-16` desktop (`md:`)
- **Vertical padding:** `py-20` on all sections
- **Grid gap (cards):** `gap-6`
- **Bio layout gap:** `gap-10` mobile / `gap-16` desktop

---

## 5. Components

### Navbar
- Sticky, `z-50`, height `h-14`
- Background: `bg-ppf-navy/95` with `backdrop-blur` (frosted glass on scroll)
- Left: oversized logo (72px, bleeds with `-my-4`) + company name in white bold
- Right: anchor links (`text-blue-200` → `text-white`) + two CTA buttons
  - **IPSAS Training** — `bg-ppf-sky` filled button
  - **IPSAS Questions** — `bg-ppf-navy` outlined button (`border border-ppf-blue/30`)
- Mobile: right side hidden below `sm` breakpoint (no hamburger menu currently)

### Footer
- `bg-ppf-navy`, centered column layout
- Large logo (144px, 80% opacity) + copyright line in `text-blue-200/70`

### Hero Section
- Full-width photo (`h-[43vh] min-h-[250px]`), `object-cover`
- Overlay: `bg-ppf-navy/60` (60% dark navy tint)
- Content: bottom-left aligned (`absolute bottom-0 left-0`)
- Logo mark above `<h1>`, tagline below in uppercase with widest letter-spacing

### Bio Section
- White background, `max-w-6xl`
- Left: square headshot (256px mobile / 320px desktop), `rounded-lg`, `shadow-lg`, `ring-4 ring-ppf-sky/20`
- Right: 4 paragraphs, `text-lg leading-relaxed text-gray-700`
- Section eyebrow: `text-ppf-blue`, 10px margin bottom

### Expertise Section
- `bg-ppf-navy` background (dark)
- 3-column card grid (`lg:grid-cols-3`, 2-col at `sm`, 1-col on mobile)
- Cards: `border border-ppf-blue/30 bg-ppf-blue/10 p-8`, hover `border-ppf-sky`
- Card anatomy: acronym label (3xl bold sky) → full name (lg semibold white) → description (sm blue-200/80)

### Regions Section
- White background
- Interactive SVG map (react-simple-maps) fills full width above country lists
- Current engagement callout: `border-l-4 border-ppf-sky bg-ppf-light`, badge pill `bg-ppf-sky`
- 3-column region list (Pacific / Sub-Saharan Africa / South Asia), headings in `text-ppf-blue`

### Donors Section
- `bg-ppf-pale` (very light blue)
- Flexbox wrap, centered on mobile / left-aligned on desktop
- Logos: grayscale by default, `hover:grayscale-0` on hover, 140×70 max

### Contact Section
- `bg-ppf-navy` (dark, like Expertise)
- `max-w-3xl` container
- LinkedIn link above the form in `text-ppf-sky`
- Form fields: `bg-ppf-navy`, `border-ppf-blue/40`, white text, `focus:border-ppf-sky`
- Submit CTA: `bg-ppf-sky` → `hover:bg-ppf-blue`, left-aligned (`self-start`)
- Success state: `border-green-500 bg-green-900/30 text-green-300`
- Error state: `bg-red-900/40 text-red-300`

---

## 6. Interaction Patterns

| Pattern | Implementation |
|---------|---------------|
| Hover on nav links | `text-blue-200` → `text-white` |
| Hover on CTA buttons | `bg-ppf-sky` → `bg-ppf-blue` |
| Hover on expertise cards | `border-ppf-blue/30` → `border-ppf-sky` |
| Hover on donor logos | `grayscale` → `grayscale-0` |
| Scroll nav hiding | None — navbar is sticky, always visible |
| Mobile menu | None — nav links hidden below `sm`, no hamburger |
| Smooth scroll | Not implemented yet (anchor `href` only) |
| Form pending state | Submit button opacity-60 + text "Sending…" |

---

## 7. Section Rhythm (Page Order)

| # | Section | Background |
|---|---------|-----------|
| — | Navbar | `ppf-navy/95` |
| 1 | Hero | Photo + `ppf-navy/60` overlay |
| 2 | Bio | White |
| 3 | Expertise | `ppf-navy` (dark) |
| 4 | Regions | White |
| 5 | Donors | `ppf-pale` (light blue tint) |
| 6 | Contact | `ppf-navy` (dark) |
| — | Footer | `ppf-navy` |

**Alternating contrast rhythm:** dark → light → dark → light → light → dark → dark. Expertise and Contact are both dark navy; the visual separation is the Regions and Donors sections between them.

---

## 8. Responsive Behaviour

- Breakpoints: Tailwind defaults (`sm` = 640px, `md` = 768px, `lg` = 1024px)
- Navbar: right side collapses at `< sm`
- Hero text padding increases at `md`
- Bio: stacks to column on mobile, row at `md`
- Expertise grid: 1-col → 2-col at `sm` → 3-col at `lg`
- Regions list: 1-col → 3-col at `md`
- Donors: centered flex-wrap on all sizes, left-justified at `md`

---

## 9. Identified Design Gaps (For Improvement)

These are weaknesses in the current implementation that Claude Design should address:

1. **No mobile hamburger menu** — nav links are invisible on small screens.
2. **Hero height is conservative** (`43vh`) — undersells the fieldwork photo; consider `60–70vh` or full-screen with scroll cue.
3. **Alternating section rhythm ends with two dark sections** (Contact + Footer back-to-back) — feels heavy at the bottom.
4. **No visual hierarchy in the footer** — just logo + one line of text; could include nav links or social links.
5. **Donors section feels isolated** — `bg-ppf-pale` is close to white; section may blend into Regions.
6. **No call-to-action on the hero** — the strongest opportunity to drive enquiries has no button.
7. **Typography scale is consistent but conservative** — headings and body text are standard; no display-level type to create visual moments.
8. **Expertise cards are uniform** — all 6 areas carry equal visual weight; no way to signal primary services.
9. **Bio section photo is left-heavy** — on wider screens the text column narrows disproportionately.
10. **No scroll animations or entry transitions** — currently fully static.
