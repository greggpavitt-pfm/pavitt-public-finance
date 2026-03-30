// IPSAS regulation subgroups — expandable org panels with sub_jurisdiction codes

"use client"

import { useState, useTransition } from "react"
import { deleteIpsasSubgroup } from "@/app/admin/actions"
import type { IpsasOrg, IpsasSubgroup } from "@/app/admin/actions"
import CreateIpsasSubgroupForm from "./CreateIpsasSubgroupForm"

interface IpsasOrgsTableProps {
  orgs: IpsasOrg[]
  subgroupsByOrg: Map<string, IpsasSubgroup[]>
}

export default function IpsasOrgsTable({ orgs, subgroupsByOrg }: IpsasOrgsTableProps) {
  const [openOrgId, setOpenOrgId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDeleteClick = (subgroupId: string) => {
    startTransition(async () => {
      setDeleteError(null)
      const result = await deleteIpsasSubgroup(subgroupId)
      if (result.error) {
        setDeleteError(result.error)
      }
    })
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="mb-4 text-lg font-semibold text-ppf-navy">Regulation Subgroups (IPSAS)</h2>

      {orgs.length === 0 ? (
        <p className="text-slate-500">No organisations found in IPSAS Advisor.</p>
      ) : (
        <div className="space-y-3">
          {orgs.map((org) => {
            const subgroups = subgroupsByOrg.get(org.id) ?? []
            const isOpen = openOrgId === org.id

            return (
              <div key={org.id} className="rounded border border-slate-100">
                <button
                  onClick={() => setOpenOrgId(isOpen ? null : org.id)}
                  className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 hover:bg-slate-100"
                >
                  <span className="font-medium text-ppf-navy">
                    {isOpen ? "▼" : "▶"} {org.name}
                  </span>
                  <span className="text-sm text-slate-600">({subgroups.length})</span>
                </button>

                {isOpen && (
                  <div className="bg-slate-50 p-4">
                    {subgroups.length === 0 ? (
                      <p className="mb-4 text-sm text-slate-500">No regulation subgroups yet.</p>
                    ) : (
                      <div className="mb-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="px-3 py-2 text-left font-medium text-slate-700">
                                Subgroup Name
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-slate-700">
                                Sub-Jurisdiction Code
                              </th>
                              <th className="px-3 py-2 text-center font-medium text-slate-700">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {subgroups.map((sg) => (
                              <tr key={sg.id} className="border-b border-slate-100">
                                <td className="px-3 py-2 text-slate-900">{sg.name}</td>
                                <td className="px-3 py-2">
                                  <code className="rounded bg-slate-200 px-2 py-1 font-mono text-xs">
                                    {sg.sub_jurisdiction || "—"}
                                  </code>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    onClick={() => handleDeleteClick(sg.id)}
                                    disabled={isPending}
                                    className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {deleteError && (
                      <div className="mb-4 rounded border-l-4 border-red-400 bg-red-50 p-3 text-sm text-red-700">
                        {deleteError}
                      </div>
                    )}

                    <CreateIpsasSubgroupForm orgId={org.id} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
