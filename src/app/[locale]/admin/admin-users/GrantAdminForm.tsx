"use client"
// Form to grant admin role to an approved user.
// Shows a user search dropdown, role selector, and (for org_admin) org selector.

import { useActionState, useState } from "react"
import { grantAdminRole } from "@/app/[locale]/admin/actions"

interface User {
  id: string
  full_name: string
  email: string
}

interface Org {
  id: string
  name: string
}

interface Props {
  users: User[]
  orgs: Org[]
}

const initialState = { error: undefined as string | undefined, success: false }

export default function GrantAdminForm({ users, orgs }: Props) {
  const [state, formAction, isPending] = useActionState(grantAdminRole, initialState)
  const [selectedRole, setSelectedRole] = useState("")

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Admin role granted successfully.
        </div>
      )}

      <div>
        <label htmlFor="user_id" className="mb-1.5 block text-sm font-medium text-slate-700">
          User <span className="text-red-500">*</span>
        </label>
        <select
          id="user_id"
          name="user_id"
          required
          defaultValue=""
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
        >
          <option value="" disabled>— Select an approved user —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name} ({u.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-700">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          name="role"
          required
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
        >
          <option value="">— Select a role —</option>
          <option value="org_admin">Org admin — manage users within one organisation</option>
          <option value="super_admin">Super admin — full access to all organisations</option>
        </select>
      </div>

      {selectedRole === "org_admin" && (
        <div>
          <label htmlFor="org_id" className="mb-1.5 block text-sm font-medium text-slate-700">
            Organisation <span className="text-red-500">*</span>
          </label>
          <select
            id="org_id"
            name="org_id"
            required
            defaultValue=""
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-ppf-sky focus:outline-none focus:ring-1 focus:ring-ppf-sky"
          >
            <option value="" disabled>— Select organisation —</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-ppf-sky px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ppf-blue disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Grant admin access"}
      </button>
    </form>
  )
}
