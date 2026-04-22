"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"

interface Props {
  subgroups: { id: string; name: string }[]
  selectedId: string | null
}

export default function SubgroupFilter({ subgroups, selectedId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (subgroups.length === 0) return null

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set("subgroup", e.target.value)
    } else {
      params.delete("subgroup")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <label htmlFor="subgroup-filter" className="text-sm text-slate-500 whitespace-nowrap">
        Subgroup:
      </label>
      <select
        id="subgroup-filter"
        value={selectedId ?? ""}
        onChange={handleChange}
        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-ppf-sky"
      >
        <option value="">All subgroups</option>
        {subgroups.map((sg) => (
          <option key={sg.id} value={sg.id}>
            {sg.name}
          </option>
        ))}
      </select>
    </div>
  )
}
