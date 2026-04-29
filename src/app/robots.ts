import type { MetadataRoute } from "next"

const SITE_URL = "https://pfmexpert.net"

// Block crawlers from protected and per-request paths in every locale.
// `*` is a robots.txt wildcard that matches any sequence of characters,
// including the locale prefix (/fr, /es, /pt) when present.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/auth/",
          "/advisor/",
          "/training/",
          "/onboarding/",
          "/pending/",
          // Locale-prefixed variants of the same protected paths.
          "/*/admin/",
          "/*/advisor/",
          "/*/training/",
          "/*/onboarding/",
          "/*/pending/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
