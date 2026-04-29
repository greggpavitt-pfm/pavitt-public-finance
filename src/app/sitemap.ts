import type { MetadataRoute } from "next"
import { listInsights } from "@/lib/insights"
import { routing } from "@/i18n/routing"

const SITE_URL = "https://pfmexpert.net"

// Build a sitemap entry for a public path that exists in every locale.
// `url` is the canonical (English / default-locale) URL; the `alternates`
// block tells Google there is a French/Spanish/Portuguese version of the
// same page. With localePrefix: 'as-needed', the English URL stays bare
// while non-default locales are prefixed.
function localizedEntry(
  pathname: string,
  partial: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">
): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {}
  for (const locale of routing.locales) {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`
    languages[locale] = `${SITE_URL}${prefix}${pathname}`
  }
  return {
    url: `${SITE_URL}${pathname}`,
    alternates: { languages },
    ...partial,
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Public marketing + product routes. Login/register included so search
  // engines can surface them when a user explicitly looks for the brand;
  // protected routes (/admin, /advisor, /training, /onboarding) stay off
  // the sitemap and are also blocked by robots.ts.
  const staticRoutes: MetadataRoute.Sitemap = [
    localizedEntry("/", { lastModified: now, changeFrequency: "monthly", priority: 1.0 }),
    localizedEntry("/products", { lastModified: now, changeFrequency: "monthly", priority: 0.9 }),
    localizedEntry("/pricing", { lastModified: now, changeFrequency: "monthly", priority: 0.9 }),
    localizedEntry("/drills", { lastModified: now, changeFrequency: "weekly", priority: 0.85 }),
    localizedEntry("/desk", { lastModified: now, changeFrequency: "weekly", priority: 0.85 }),
    localizedEntry("/insights", { lastModified: now, changeFrequency: "weekly", priority: 0.8 }),
    localizedEntry("/lead-magnet", { lastModified: now, changeFrequency: "monthly", priority: 0.7 }),
    localizedEntry("/request-demo", { lastModified: now, changeFrequency: "monthly", priority: 0.7 }),
    localizedEntry("/login", { lastModified: now, changeFrequency: "yearly", priority: 0.4 }),
    localizedEntry("/register", { lastModified: now, changeFrequency: "yearly", priority: 0.5 }),
    localizedEntry("/practitioner-login", { lastModified: now, changeFrequency: "yearly", priority: 0.4 }),
  ]

  // Insights are per-slug; once Phase 2 ships per-locale markdown each slug
  // will exist in every language. For now we still emit alternates pointing
  // at the per-locale URL (which renders English content until translated).
  const insightRoutes: MetadataRoute.Sitemap = listInsights().map((post) =>
    localizedEntry(`/insights/${post.slug}`, {
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly",
      priority: 0.7,
    })
  )

  return [...staticRoutes, ...insightRoutes]
}
