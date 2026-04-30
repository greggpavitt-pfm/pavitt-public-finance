// /login — email + password sign-in page.
// Uses a Client Component for the form so we can use useActionState for inline error display.
// On success, the server action redirects to /training (proxy handles
// further routing based on account_status and onboarding_complete).
//
// LoginForm uses useSearchParams() which requires a Suspense boundary.

import { Suspense } from "react"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import LoginForm from "./LoginForm"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Login" })
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  }
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Login" })

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
              <LoginForm />
            </Suspense>
            <p className="mt-6 text-center text-sm text-slate-500">
              {t("registerPrompt")}{" "}
              <a href="/register" className="font-medium text-ppf-sky hover:underline">
                {t("registerLink")}
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
