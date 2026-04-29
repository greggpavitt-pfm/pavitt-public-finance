"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"

const STORAGE_KEY = "ppf-mobile-banner-dismissed"

export default function MobileBanner() {
  const t = useTranslations("MobileBanner")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== "1") {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-ppf-navy px-4 py-3 md:hidden">
      <div className="flex items-center gap-3">
        <span className="text-base" aria-hidden>💻</span>
        <div>
          <p className="text-xs font-semibold text-white leading-tight">{t("headline")}</p>
          <p className="text-xs text-blue-300 leading-tight">{t("subline")}</p>
        </div>
      </div>
      <button
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="shrink-0 text-blue-300 hover:text-white transition-colors text-lg leading-none"
      >
        ✕
      </button>
    </div>
  )
}
