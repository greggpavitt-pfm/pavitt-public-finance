import type { MetadataRoute } from "next"

const SITE_URL = "https://pfmexpert.net"

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
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
