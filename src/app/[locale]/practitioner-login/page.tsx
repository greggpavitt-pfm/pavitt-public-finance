// /practitioner-login — sign-in page for practitioners accessing the IPSAS Advisor.
// Same underlying auth as /login, but redirects to /advisor on success and uses
// practitioner-focused copy.
//
// LoginForm uses useSearchParams() which requires a Suspense boundary.

import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import LoginForm from "@/app/[locale]/login/LoginForm"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "PractitionerLogin" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function PractitionerLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "PractitionerLogin" })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-ppf-light flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-ppf-sky/20 bg-white p-8 shadow-sm">
            <h1 className="mb-2 text-2xl font-bold text-ppf-navy">{t("title")}</h1>
            <p className="mb-8 text-sm text-slate-500">
              {t("subtitle")}
            </p>
            {/* Suspense required because LoginForm reads useSearchParams() */}
            <Suspense fallback={null}>
              {/* redirectTo=/advisor sends the user to the advisor after login */}
              <LoginForm redirectTo="/advisor" />
            </Suspense>
            <p className="mt-6 text-center text-sm text-slate-500">
              {t("registerPrompt")}{" "}
              <a href="/register" className="font-medium text-ppf-sky hover:underline">
                {t("registerLink")}
              </a>
            </p>
            <p className="mt-2 text-center text-sm text-slate-500">
              {t("studentPrompt")}{" "}
              <a href="/login" className="font-medium text-ppf-sky hover:underline">
                {t("studentLink")}
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
