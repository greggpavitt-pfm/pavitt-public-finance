"use client"
// ReviewDashboard — group summary + per-student drill-down with print support.
//
// Group view:   all students as rows with summary stats.
// Student view: click a row to expand the student's per-module results inline.
//
// Print modes:
//   "group"   — prints summary table only (expanded detail rows hidden)
//   "student" — prints only the selected student's expanded detail

import { useState, useRef, Fragment } from "react"
import type { StudentResult } from "@/app/training/reviewer-actions"

interface Props {
  students: StudentResult[]
  scopeType: "org" | "subgroup"
  scopeName: string
}

export default function ReviewDashboard({ students, scopeType, scopeName }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  function toggleStudent(userId: string) {
    setSelectedStudentId((prev) => prev === userId ? null : userId)
  }

  function handlePrint(mode: "group" | "student") {
    if (wrapperRef.current) {
      wrapperRef.current.setAttribute("data-print-mode", mode)
    }
    window.print()
    // Clean up after the print dialog closes
    setTimeout(() => {
      wrapperRef.current?.removeAttribute("data-print-mode")
    }, 1000)
  }

  // Compute summary stats for a student
  function stats(student: StudentResult) {
    const count = student.modules.length
    if (count === 0) return { completed: 0, avgScore: null, passRate: null }
    const avgScore = Math.round(
      student.modules.reduce((sum, m) => sum + m.score, 0) / count
    )
    const passRate = Math.round(
      (student.modules.filter((m) => m.passed).length / count) * 100
    )
    return { completed: count, avgScore, passRate }
  }

  const printDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  })

  return (
    <>
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #review-dashboard, #review-dashboard * { visibility: visible !important; }
          #review-dashboard { position: absolute; top: 0; left: 0; width: 100%; }

          .print-toolbar { display: none !important; }
          .no-print { display: none !important; }

          /* Group mode: hide expanded student details */
          [data-print-mode="group"] .student-detail-row { display: none !important; }

          /* Student mode: hide other rows, show only selected */
          [data-print-mode="student"] .summary-row:not(.is-selected) { display: none !important; }
          [data-print-mode="student"] .student-detail-row:not(.is-selected) { display: none !important; }

          .print-header { display: block !important; }

          @page { margin: 1cm; }
        }

        .print-header { display: none; }
      `}} />

      <div id="review-dashboard" ref={wrapperRef}>
        {/* Hidden print header — shown only when printing */}
        <div className="print-header mb-4">
          <p className="text-xs text-slate-500">{scopeName} · Printed {printDate}</p>
        </div>

        {/* Toolbar */}
        <div className="print-toolbar mb-6 flex items-center gap-3">
          <button
            onClick={() => handlePrint("group")}
            className="rounded-md border border-ppf-sky px-4 py-2 text-sm font-medium text-ppf-sky transition-colors hover:bg-ppf-pale"
          >
            Print group summary
          </button>
          <button
            onClick={() => handlePrint("student")}
            disabled={!selectedStudentId}
            className="rounded-md border border-ppf-sky px-4 py-2 text-sm font-medium text-ppf-sky transition-colors hover:bg-ppf-pale disabled:cursor-not-allowed disabled:opacity-40"
          >
            Print student report
          </button>
          {selectedStudentId && (
            <span className="text-sm text-slate-400">
              {students.find((s) => s.user_id === selectedStudentId)?.full_name} selected
            </span>
          )}
        </div>

        {students.length === 0 ? (
          <div className="rounded-lg border border-ppf-sky/20 bg-white p-10 text-center text-slate-400">
            No students found in this unit yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-ppf-sky/20 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Student</th>
                  {scopeType === "org" && <th className="px-4 py-3">Subgroup</th>}
                  <th className="px-4 py-3">Modules</th>
                  <th className="px-4 py-3">Avg score</th>
                  <th className="px-4 py-3">Pass rate</th>
                  <th className="px-4 py-3 no-print" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const { completed, avgScore, passRate } = stats(student)
                  const isSelected = selectedStudentId === student.user_id

                  return (
                    <Fragment key={student.user_id}>
                      {/* Summary row */}
                      <tr
                        className={`summary-row cursor-pointer transition-colors hover:bg-slate-50 ${
                          isSelected ? "is-selected bg-ppf-pale/40" : ""
                        }`}
                        onClick={() => toggleStudent(student.user_id)}
                      >
                        <td className="px-4 py-3 font-medium text-ppf-navy">
                          {student.full_name}
                        </td>
                        {scopeType === "org" && (
                          <td className="px-4 py-3 text-slate-500">
                            {student.subgroup_name ?? <span className="text-slate-300">—</span>}
                          </td>
                        )}
                        <td className="px-4 py-3 text-slate-600">{completed}</td>
                        <td className="px-4 py-3">
                          {avgScore !== null ? (
                            <span className={`font-semibold ${avgScore >= 70 ? "text-green-600" : "text-red-600"}`}>
                              {avgScore}%
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {passRate !== null ? (
                            <span className={`font-semibold ${passRate >= 70 ? "text-green-600" : "text-amber-600"}`}>
                              {passRate}%
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right no-print">
                          <span className="text-xs text-slate-400">
                            {isSelected ? "▲" : "▼"}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded student detail row */}
                      {isSelected && (
                        <tr className={`student-detail-row is-selected bg-slate-50`}>
                          <td
                            colSpan={scopeType === "org" ? 6 : 5}
                            className="px-6 py-4"
                          >
                            {student.modules.length === 0 ? (
                              <p className="text-sm text-slate-400">No modules completed yet.</p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-slate-200 text-left text-slate-500">
                                    <th className="pb-2 font-semibold">Module</th>
                                    <th className="pb-2 font-semibold">Score</th>
                                    <th className="pb-2 font-semibold">Result</th>
                                    <th className="pb-2 font-semibold">Date</th>
                                    <th className="pb-2 font-semibold">Attempt</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {student.modules.map((m) => (
                                    <tr key={m.module_id}>
                                      <td className="py-1.5 pr-4 font-medium text-ppf-navy">
                                        {m.module_title}
                                      </td>
                                      <td className={`py-1.5 pr-4 font-semibold ${m.score >= 70 ? "text-green-600" : "text-red-600"}`}>
                                        {m.score}%
                                      </td>
                                      <td className="py-1.5 pr-4">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                          m.passed
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                        }`}>
                                          {m.passed ? "Pass" : "Fail"}
                                        </span>
                                      </td>
                                      <td className="py-1.5 pr-4 text-slate-500">
                                        {new Date(m.submitted_at).toLocaleDateString("en-GB")}
                                      </td>
                                      <td className="py-1.5 text-slate-400">#{m.attempt_number}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
