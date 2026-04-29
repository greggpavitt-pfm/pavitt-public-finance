import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://pfmexpert.net"
const SITE_TITLE = "Pavitt Public Finance — International PFM Expert"
const SITE_DESCRIPTION =
  "Gregg Pavitt brings 25+ years of public financial management expertise to governments and organizations across Sub-Saharan Africa, South Asia, and the Pacific."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — Pavitt Public Finance",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "IPSAS",
    "public financial management",
    "PFM",
    "PEFA",
    "IFMIS",
    "domestic revenue mobilisation",
    "public expenditure management",
    "public sector accounting",
    "Solomon Islands",
    "Pacific",
    "Sub-Saharan Africa",
  ],
  authors: [{ name: "Gregg Pavitt" }],
  creator: "Gregg Pavitt",
  publisher: "Pavitt Public Finance",
  alternates: {
    canonical: "/",
    // Per-locale alternates so search engines understand the site is multilingual.
    // Per-page metadata can override this with richer hreflang where needed.
    languages: {
      en: "/",
      fr: "/fr",
      es: "/es",
      pt: "/pt",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Pavitt Public Finance",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/Photos/Phot_05_of_19.jpg",
        width: 1200,
        height: 630,
        alt: "Gregg Pavitt — PFM fieldwork",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/Photos/Phot_05_of_19.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// JSON-LD Person + Organization schema for rich snippets
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Gregg Pavitt",
  jobTitle: "International PFM Expert",
  worksFor: {
    "@type": "Organization",
    name: "Pavitt Public Finance",
    url: SITE_URL,
  },
  url: SITE_URL,
  sameAs: ["https://www.linkedin.com/in/greggpavitt/"],
  description: SITE_DESCRIPTION,
  knowsAbout: [
    "IPSAS",
    "Public Financial Management",
    "PEFA",
    "IFMIS",
    "Public Expenditure Management",
    "Domestic Revenue Mobilisation",
    "Public Investment Management",
  ],
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pavitt Public Finance",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  founder: {
    "@type": "Person",
    name: "Gregg Pavitt",
  },
  areaServed: [
    { "@type": "Place", name: "Sub-Saharan Africa" },
    { "@type": "Place", name: "South Asia" },
    { "@type": "Place", name: "Pacific" },
  ],
  sameAs: ["https://www.linkedin.com/in/greggpavitt/"],
}

// Pre-generate every locale variant at build time so static pages don't need
// runtime locale negotiation. Required when using setRequestLocale() below.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  // In Next.js 16, dynamic route params arrive as a Promise — must be awaited.
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Hard 404 on unknown locales (e.g. /de/desk). The next-intl middleware
  // should already redirect or 404 these — this is a defensive check for
  // direct hits that bypass middleware.
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Tells next-intl which locale this render is for. Required for static
  // rendering so getTranslations() / useTranslations() work inside Server
  // Components without reading the request.
  setRequestLocale(locale)

  // Load only the active locale's messages.
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        {/* No-JS fallback: reveal-on-scroll sections are hidden by default via CSS;
            this ensures they're visible for users without JavaScript. */}
        <noscript>
          <style>{`.reveal-on-scroll { opacity: 1 !important; transform: none !important; transition: none !important; }`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
