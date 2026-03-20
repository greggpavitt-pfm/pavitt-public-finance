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
  paragraphs: [
    "Gregg Pavitt is the founder of Pavitt Public Finance, where he consults with organizations and governments to solve their public finance management challenges. He brings more than twenty-five years of experience in public financial management and administration, both managerial and technical assistance in Sub Saharan Africa, South Asia, and the Pacific. Capacity building, systems review and manual development, economic and accounting health studies, business process and review.",
    "Gregg is a strategic thinker who is adept at building and maintaining relationships with government clients (politicians, ministers, secretaries, senior officials and ministry/agency staff), and development partners. He has demonstrated leadership, organization, communication and management skills, and is experienced in leading and managing small and large projects, leading multi-disciplinary teams of international advisers, national advisers and local staff during long-term (2+years) and short-term assignments. He has extensive experience developing and delivering capacity development and training programs, workshops, training of trainers, training needs assessments, training materials (manuals, training tools, analytical tools), training evaluation and improving or developing operation manuals and SOPs.",
  ],
} as const

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
  {
    id: "pim",
    label: "PIM",
    fullName: "Public Investment Management",
    description:
      "Strengthening systems for planning, prioritizing, and executing public investment programs to maximize development outcomes.",
  },
  {
    id: "ifms",
    label: "IFMS",
    fullName: "Integrated Financial Management Systems",
    description:
      "Advising on the design, implementation, and improvement of government financial information systems.",
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
  {
    id: "pfm-studies",
    label: "PFM Studies",
    fullName: "PFM Studies & Assessments",
    description:
      "Conducting diagnostic assessments (PEFA, fiduciary reviews) and research to inform PFM reform strategies.",
  },
  {
    id: "ipsas",
    label: "IPSAS",
    fullName: "International Public Sector Accounting Standards",
    description:
      "Supporting governments transitioning to accrual-basis accounting and IPSAS-compliant financial reporting.",
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
  { name: "Afghanistan", region: "South Asia" },
  { name: "Pakistan", region: "South Asia" },
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
  {
    name: "Federated States of Micronesia",
    region: "Pacific",
    years: "2021\u20132024",
  },
  { name: "Papua New Guinea", region: "Pacific" },
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
  // Logos
  logoTransparent: "/images/logo.png",
  logoSvg: "/images/logo.svg",
} as const
