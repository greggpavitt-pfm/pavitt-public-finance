"use client"
// Authenticated navigation bar for /training and /advisor routes.
// Desktop (≥768px): horizontal logo + links + user menu.
// Mobile (<768px): single row with hamburger toggle dropdown.

import Link from "next/link"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { logoutUser } from "@/app/auth/actions"
import LanguagePicker from "@/components/ui/LanguagePicker"

interface AuthNavbarProps {
  userName?: string
  currentPath?: string
}

export default function AuthNavbar({ userName, currentPath }: AuthNavbarProps) {
  const t = useTranslations("AuthNavbar")
  const tCommon = useTranslations("Common")
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logoutUser()
  }

  // Active-state detection ignores the leading locale segment so /fr/training
  // still matches the "Training" link as active.
  const stripped = currentPath?.replace(/^\/(en|fr|es|pt)(?=\/|$)/, "") ?? ""
  const isActive = (path: string) => stripped.startsWith(path)

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      isActive(path) ? "text-white" : "text-blue-200 hover:text-white"
    }`

  return (
    <nav className="border-b border-blue-900 bg-ppf-navy/95">
      {/* ── DESKTOP (≥ 768px) ── */}
      <div className="hidden md:flex h-14 items-center justify-between px-16">
        <Link href="/training" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <span className="text-lg font-bold tracking-tight text-white">{t("brand")}</span>
        </Link>
        <div className="flex items-center gap-6">
          <ul className="flex gap-4">
            <li><Link href="/training" className={linkClass("/training")}>{t("training")}</Link></li>
            <li><Link href="/advisor" className={linkClass("/advisor")}>{t("advisor")}</Link></li>
          </ul>
          <div className="flex items-center gap-3 pl-3 border-l border-blue-800">
            {/* Language picker sits to the left of the user menu on the
                authenticated nav. onDark={true} matches the navy bar. */}
            <LanguagePicker variant="compact" onDark />
            {userName && <span className="text-sm text-blue-200">{userName}</span>}
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-blue-200 hover:text-white transition-colors"
            >
              {tCommon("logOut")}
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE (< 768px) ── */}
      <div className="md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/training" className="text-base font-bold tracking-tight text-white">
            {t("brand")}
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            className="text-white text-2xl leading-none px-1"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Dropdown */}
        {menuOpen && (
          <div className="border-t border-blue-900 bg-ppf-navy px-4 pb-4 flex flex-col gap-3">
            <Link
              href="/training"
              onClick={() => setMenuOpen(false)}
              className={`pt-3 text-sm font-semibold ${isActive("/training") ? "text-white" : "text-blue-200"}`}
            >
              {t("training")}
            </Link>
            <Link
              href="/advisor"
              onClick={() => setMenuOpen(false)}
              className={`text-sm font-semibold ${isActive("/advisor") ? "text-white" : "text-blue-200"}`}
            >
              {t("advisor")}
            </Link>
            <div className="border-t border-blue-900 pt-3 flex items-center justify-between">
              {/* Language picker on the left, user + logout on the right. */}
              <LanguagePicker variant="compact" onDark />
              <div className="flex items-center gap-3">
                {userName && <span className="text-sm text-blue-300">{userName}</span>}
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-blue-200 hover:text-white transition-colors"
                >
                  {tCommon("logOut")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
