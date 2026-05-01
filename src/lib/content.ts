// src/lib/content.ts
// Single source of truth for all site content.
// Phase 2+ components import from here — do not hardcode content in JSX.

// ---------------------------------------------------------------------------
// SITE CONFIG
// ---------------------------------------------------------------------------

export const siteConfig = {
  companyName: "Pavitt Public Finance",
  tagline: "International PFM Expert",
  domain: "pfmexpert.net",
  linkedIn: "https://www.linkedin.com/in/greggpavitt/",
  // Contact email is server-side only — never render in HTML
  contactEmail: process.env.CONTACT_EMAIL ?? "",
} as const

// ---------------------------------------------------------------------------
// BIO
// (Both paragraphs verbatim from "Web Page Data for Pavitt Public Finance May 27.docx")
// ---------------------------------------------------------------------------

export const bio = {
  tagline: "PFM Specialist · 25+ Years · Pacific, Africa, Asia",
  paragraphs: [
    "Gregg Pavitt is a public financial management specialist with over 25 years of experience helping governments in Sub-Saharan Africa, South Asia, and the Pacific strengthen how they plan, allocate, and account for public resources.",
    "He provides technical assistance and advisory services in six core areas: PFM studies and assessments, public expenditure management (PEM), domestic revenue mobilisation (DRM), integrated financial management systems (IFMIS), public investment management (PIM), and International Public Sector Accounting Standards (IPSAS).",
    "Gregg has served as Team Leader and Key Expert on programmes funded by the EU (EuropeAid), World Bank, DFAT, USAID, and DFID/FCDO — both in long-term embedded roles within Ministries of Finance and on targeted short-term assignments. He is known for effective policy dialogue with government counterparts, practical reform design, and building national capacity that outlasts the project cycle.",
    "International consulting firms and development organisations engage Gregg for his ability to mobilise quickly, manage multi-disciplinary teams, and deliver reliably within the compliance and reporting frameworks that donor-funded programmes demand.",
  ],
};






// ---------------------------------------------------------------------------
// EXPERTISE AREAS
// (6 total — PIM, IFMS, PEM, DRM, PFM Studies, IPSAS)
// ---------------------------------------------------------------------------

export interface ExpertiseArea {
  id: string
  label: string
  fullName: string
  description: string
}

export const expertiseAreas: ExpertiseArea[] = [
  // Row 1: PFM Studies, IFMS, IPSAS
  {
    id: "pfm-studies",
    label: "PFM Studies",
    fullName: "PFM Studies & Assessments",
    description:
      "Conducting diagnostic assessments (PEFA, fiduciary reviews) and research to inform PFM reform strategies.",
  },
  {
    id: "ifms",
    label: "IFMS",
    fullName: "Integrated Financial Management Systems",
    description:
      "Advising on the design, implementation, and improvement of government financial information systems.",
  },
  {
    id: "ipsas",
    label: "IPSAS",
    fullName: "International Public Sector Accounting Standards",
    description:
      "Supporting governments transitioning to accrual-basis accounting and IPSAS-compliant financial reporting.",
  },
  // Row 2: PIM, PEM, DRM
  {
    id: "pim",
    label: "PIM",
    fullName: "Public Investment Management",
    description:
      "Strengthening systems for planning, prioritizing, and executing public investment programs to maximize development outcomes.",
  },
  {
    id: "pem",
    label: "PEM",
    fullName: "Public Expenditure Management",
    description:
      "Supporting budget formulation, execution, and reporting reforms to improve fiscal discipline and service delivery.",
  },
  {
    id: "drm",
    label: "DRM",
    fullName: "Domestic Revenue Mobilization",
    description:
      "Helping governments increase domestic revenue through tax policy, administration reform, and compliance improvement.",
  },
]

// ---------------------------------------------------------------------------
// COUNTRIES
// (Separate arrays per CONTEXT.md locked decision)
// ---------------------------------------------------------------------------

export interface Country {
  name: string
  region: "Sub-Saharan Africa" | "South Asia" | "Pacific"
  // Only present for Pacific countries
  years?: string
  // Only present on Solomon Islands
  badge?: string
}

export const currentCountries: Country[] = [
  {
    name: "Solomon Islands",
    region: "Pacific",
    years: "2024\u2013present",
    badge: "Current Engagement",
  },
]

export const completedCountries: Country[] = [
  // Pacific (left column)
  {
    name: "Federated States of Micronesia",
    region: "Pacific",
    years: "2021\u20132024",
  },
  { name: "Papua New Guinea", region: "Pacific" },
  // Sub-Saharan Africa (middle column)
  { name: "Somalia", region: "Sub-Saharan Africa" },
  { name: "Kenya", region: "Sub-Saharan Africa" },
  { name: "Tanzania", region: "Sub-Saharan Africa" },
  { name: "Malawi", region: "Sub-Saharan Africa" },
  { name: "Mozambique", region: "Sub-Saharan Africa" },
  { name: "Zambia", region: "Sub-Saharan Africa" },
  { name: "Liberia", region: "Sub-Saharan Africa" },
  { name: "Nigeria", region: "Sub-Saharan Africa" },
  { name: "Ghana", region: "Sub-Saharan Africa" },
  { name: "Sierra Leone", region: "Sub-Saharan Africa" },
  // South Asia (right column)
  { name: "Afghanistan", region: "South Asia" },
  { name: "Pakistan", region: "South Asia" },
]

// Convenience export: all 15 countries in one array (for Phase 3 map)
export const allCountries: Country[] = [...currentCountries, ...completedCountries]

// ---------------------------------------------------------------------------
// DONORS
// (6 total — World Bank, EU, USAID, MCC, DFAT, FCDO)
// ---------------------------------------------------------------------------

export interface Donor {
  id: string
  name: string
  // Path relative to public/ — used in next/image src prop
  logo: string
}

export const donors: Donor[] = [
  { id: "world-bank", name: "World Bank", logo: "/images/donors/world-bank.png" },
  { id: "eu", name: "European Union", logo: "/images/donors/eu.png" },
  { id: "usaid", name: "USAID", logo: "/images/donors/usaid.png" },
  { id: "mcc", name: "Millennium Challenge Corporation", logo: "/images/donors/mcc.png" },
  { id: "dfat", name: "DFAT (Australian Aid)", logo: "/images/donors/dfat.png" },
  { id: "fcdo", name: "FCDO", logo: "/images/donors/fcdo.png" },
]

// ---------------------------------------------------------------------------
// PROJECT STUBS
// (Tools showcase — "Coming Soon" state for Phase 3)
// ---------------------------------------------------------------------------

export interface Project {
  id: string
  title: string
  description: string
  status: "coming-soon" | "live"
  url?: string
}

export const projects: Project[] = [
  // Placeholder — real tool entries added in Phase 3 / v2
  {
    id: "placeholder",
    title: "Tools Coming Soon",
    description:
      "Technical PFM tools and analytical instruments developed by Pavitt Public Finance will be showcased here.",
    status: "coming-soon",
  },
]

// ---------------------------------------------------------------------------
// IMAGE PATHS
// (Normalized paths for hero and about photos — defined here so Phase 2
//  components can import them from one place without magic strings)
// ---------------------------------------------------------------------------

export const images = {
  // Hero: fieldwork photo selected during Phase 1 asset normalization
  hero: "/images/photo-hero.jpg",
  // About: professional headshot (gregg.jpg normalized, or placeholder)
  about: "/images/photo-about.jpg",
  // Logos — sourced from PFS Branding kit
  logoTransparent: "/images/logo-transparent.svg",
  logoTransparentSvg: "/images/logo-transparent.svg",
  logoOriginalSvg: "/images/logo-original.svg",
  logoSvg: "/images/logo.svg",
  ifmis: "/images/photo-ifmis.jpg",
  drm: "/images/photo-drm.png",
  drmAfrica: "/images/photo-drm-africa.jpg",
  ipsasPpf: "/images/photo-ipsas-ppf.jpg",
  checklist: "/images/photo-checklist.jpg",
  ssaAccounting: "/images/photo-ssa-accounting.jpg",
  ipsasAcctg: "/images/photo-ipsas-acctg.png",
} as const
