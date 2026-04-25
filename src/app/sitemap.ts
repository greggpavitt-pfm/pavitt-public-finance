import type { MetadataRoute } from "next"
import { listInsights } from "@/lib/insights"

const SITE_URL = "https://pfmexpert.net"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/insights`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/lead-magnet`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/ipsas-training`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/practitioner-login`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ]

  const insightRoutes: MetadataRoute.Sitemap = listInsights().map((post) => ({
    url: `${SITE_URL}/insights/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [...staticRoutes, ...insightRoutes]
}
