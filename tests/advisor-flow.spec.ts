// Critical-path test: marketing surfaces and advisor entry-point load.
//
// Authenticated advisor flow (set context, ask question, see citation) cannot
// run without a seeded test user + valid OpenRouter / OpenAI keys. This test
// asserts the unauthenticated surface area: products page, insights, advisor
// route gating, and SEO endpoints.

import { test, expect } from "@playwright/test"

test("products page renders training + advisor sections", async ({ page }) => {
  await page.goto("/products")
  await expect(page.getByText(/IPSAS Training/i).first()).toBeVisible()
  await expect(page.getByText(/Practitioner Advisor/i).first()).toBeVisible()
})

test("insights index lists posts", async ({ page }) => {
  await page.goto("/insights")
  // Expect at least one post link
  const links = page.locator('a[href^="/insights/"]')
  expect(await links.count()).toBeGreaterThan(0)
})

test("lead magnet page accepts input", async ({ page }) => {
  await page.goto("/lead-magnet")
  await expect(page.locator('input[type="email"]').first()).toBeVisible()
})

test("sitemap.xml is reachable", async ({ request }) => {
  const r = await request.get("/sitemap.xml")
  expect(r.status()).toBe(200)
  const body = await r.text()
  expect(body).toContain("<urlset")
  expect(body).toContain("https://pfmexpert.net")
})

test("robots.txt disallows protected routes", async ({ request }) => {
  const r = await request.get("/robots.txt")
  expect(r.status()).toBe(200)
  const body = await r.text()
  expect(body.toLowerCase()).toContain("disallow")
  expect(body).toMatch(/\/admin|\/advisor|\/training/i)
})

test("advisor route gated for unauthenticated user", async ({ page }) => {
  await page.goto("/advisor")
  // Either redirect to login or show login prompt — protected route either way
  const url = page.url()
  const bodyText = (await page.locator("body").textContent()) ?? ""
  const gated =
    url.includes("/login") ||
    url.includes("/practitioner-login") ||
    bodyText.toLowerCase().includes("sign in") ||
    bodyText.toLowerCase().includes("log in")
  expect(gated).toBeTruthy()
})
