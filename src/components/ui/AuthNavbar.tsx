"use client"
// Authenticated navigation bar for /training and /advisor routes
// Shows user name, Training link, Advisor link, and logout button

import Link from "next/link"
import { logoutUser } from "@/app/auth/actions"

interface AuthNavbarProps {
  userName?: string
  currentPath?: string
}

export default function AuthNavbar({ userName, currentPath }: AuthNavbarProps) {
  const handleLogout = async () => {
    await logoutUser()
  }

  return (
    <nav className="flex h-14 items-center justify-between bg-ppf-navy/95 px-6 md:px-16 border-b border-blue-900">
      {/* Logo + Brand */}
      <Link href="/training" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
        <span className="text-lg font-bold tracking-tight text-white">PFM IPSAS</span>
      </Link>

      {/* Nav Links + User Menu */}
      <div className="flex items-center gap-6">
        {/* Training and Advisor Links */}
        <ul className="flex gap-4">
          <li>
            <Link
              href="/training"
              className={`text-sm font-medium transition-colors ${
                currentPath?.startsWith("/training")
                  ? "text-white"
                  : "text-blue-200 hover:text-white"
              }`}
            >
              Training
            </Link>
          </li>
          <li>
            <Link
              href="/advisor"
              className={`text-sm font-medium transition-colors ${
                currentPath?.startsWith("/advisor")
                  ? "text-white"
                  : "text-blue-200 hover:text-white"
              }`}
            >
              Advisor
            </Link>
          </li>
        </ul>

        {/* User Name + Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-blue-800">
          {userName && (
            <span className="text-sm text-blue-200">{userName}</span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-blue-200 hover:text-white transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </nav>
  )
}
