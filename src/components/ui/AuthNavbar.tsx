"use client"
// Authenticated navigation bar for /training and /advisor routes.
// Desktop (≥768px): horizontal logo + links + user menu.
// Mobile (<768px): single row with hamburger toggle dropdown.

import Link from "next/link"
import { useState } from "react"
import { logoutUser } from "@/app/auth/actions"

interface AuthNavbarProps {
  userName?: string
  currentPath?: string
}

export default function AuthNavbar({ userName, currentPath }: AuthNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logoutUser()
  }

  const linkClass = (path: string) =>
    `text-sm font-medium transition-colors ${
      currentPath?.startsWith(path) ? "text-white" : "text-blue-200 hover:text-white"
    }`

  return (
    <nav className="border-b border-blue-900 bg-ppf-navy/95">
      {/* ── DESKTOP (≥ 768px) ── */}
      <div className="hidden md:flex h-14 items-center justify-between px-16">
        <Link href="/training" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <span className="text-lg font-bold tracking-tight text-white">PFM IPSAS</span>
        </Link>
        <div className="flex items-center gap-6">
          <ul className="flex gap-4">
            <li><Link href="/training" className={linkClass("/training")}>Training</Link></li>
            <li><Link href="/advisor" className={linkClass("/advisor")}>Advisor</Link></li>
          </ul>
          <div className="flex items-center gap-3 pl-3 border-l border-blue-800">
            {userName && <span className="text-sm text-blue-200">{userName}</span>}
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-blue-200 hover:text-white transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE (< 768px) ── */}
      <div className="md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/training" className="text-base font-bold tracking-tight text-white">
            PFM IPSAS
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
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
              className={`pt-3 text-sm font-semibold ${currentPath?.startsWith("/training") ? "text-white" : "text-blue-200"}`}
            >
              Training
            </Link>
            <Link
              href="/advisor"
              onClick={() => setMenuOpen(false)}
              className={`text-sm font-semibold ${currentPath?.startsWith("/advisor") ? "text-white" : "text-blue-200"}`}
            >
              Advisor
            </Link>
            <div className="border-t border-blue-900 pt-3 flex items-center justify-between">
              {userName && <span className="text-sm text-blue-300">{userName}</span>}
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-blue-200 hover:text-white transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
