// Public demo-request landing page.
// Routes off the marketing nav as a "Request demo" CTA. Anonymous-accessible —
// no auth required. Submission goes to org_requests via the action; admin
// reviews on /admin/org-requests.

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import DemoRequestForm from "./DemoRequestForm"

// generateMetadata replaces the static `metadata` export so the page title
// and description are localised. next-intl exposes the active locale via the
// route params; getTranslations() with an explicit locale loads the right
// dictionary without depending on setRequestLocale ordering.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "RequestDemo" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function RequestDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "RequestDemo" })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light px-6 py-16 md:px-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-3 text-3xl font-bold text-ppf-navy md:text-4xl">
            {t("headline")}
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-slate-700">
            {t("lead")}
          </p>

          <div className="mb-8 rounded-md border border-ppf-sky/20 bg-white p-5 text-sm text-slate-700">
            <p className="mb-2 font-semibold text-ppf-navy">{t("whatYouGet")}</p>
            <ul className="list-inside list-disc space-y-1">
              <li>{t("benefits.fullAccess")}</li>
              <li>{t("benefits.advisor")}</li>
              <li>{t("benefits.seats")}</li>
              <li>{t("benefits.admin")}</li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              {t("noCard")}
            </p>
          </div>

          <DemoRequestForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
