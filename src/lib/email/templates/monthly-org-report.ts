// Monthly per-org usage report — HTML + plaintext renderer.
//
// Pure function: takes the aggregated stats and returns a subject/html/text
// triple. No DB calls, no env reads — easy to unit-test by passing fixtures.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pfmexpert.net"

export interface MonthlyOrgReportInput {
  org_name: string
  month_label: string                 // e.g. "March 2026"

  advisor_submissions: number
  advisor_submissions_prev: number    // last month, for delta calc

  total_tokens: number
  monthly_token_quota: number | null  // null = no cap

  top_standards: string[]             // up to 3 ids, e.g. ['IPSAS-1', 'IPSAS-17']

  active_users: number

  training_completions: number
  training_avg_score: number | null   // 0..100
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export function renderMonthlyOrgReport(input: MonthlyOrgReportInput): RenderedEmail {
  const delta = input.advisor_submissions - input.advisor_submissions_prev
  const deltaText =
    input.advisor_submissions_prev === 0
      ? input.advisor_submissions > 0 ? "first month of activity" : "no advisor activity"
      : `${delta >= 0 ? "+" : ""}${delta} vs last month`

  const quotaText = input.monthly_token_quota
    ? `${pct(input.total_tokens, input.monthly_token_quota)}% of ${input.monthly_token_quota.toLocaleString()} cap`
    : "no quota set"

  const avgScoreText =
    input.training_avg_score === null
      ? "—"
      : `${Math.round(input.training_avg_score)}%`

  const topStandardsText =
    input.top_standards.length === 0
      ? "—"
      : input.top_standards.join(", ")

  const subject = `${input.org_name} — usage for ${input.month_label}`

  const text = [
    `Monthly usage report for ${input.org_name}`,
    `Period: ${input.month_label}`,
    ``,
    `Advisor`,
    `  Submissions: ${input.advisor_submissions} (${deltaText})`,
    `  Tokens used: ${input.total_tokens.toLocaleString()} (${quotaText})`,
    `  Top standards: ${topStandardsText}`,
    ``,
    `Training`,
    `  Active users: ${input.active_users}`,
    `  Module completions: ${input.training_completions}`,
    `  Average score: ${avgScoreText}`,
    ``,
    `View detailed usage: ${SITE_URL}/admin/usage`,
    ``,
    `— Pavitt Public Finance`,
  ].join("\n")

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <h2 style="color:#0c4a6e;margin-bottom:4px">${escapeHtml(input.org_name)}</h2>
      <p style="color:#64748b;margin-top:0">Usage report for <strong>${escapeHtml(input.month_label)}</strong></p>

      <h3 style="color:#0c4a6e;margin-top:24px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">Advisor</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#475569">Submissions</td><td style="text-align:right"><strong>${input.advisor_submissions}</strong> <span style="color:#64748b">(${escapeHtml(deltaText)})</span></td></tr>
        <tr><td style="padding:6px 0;color:#475569">Tokens used</td><td style="text-align:right"><strong>${input.total_tokens.toLocaleString()}</strong> <span style="color:#64748b">(${escapeHtml(quotaText)})</span></td></tr>
        <tr><td style="padding:6px 0;color:#475569">Top standards</td><td style="text-align:right"><strong>${escapeHtml(topStandardsText)}</strong></td></tr>
      </table>

      <h3 style="color:#0c4a6e;margin-top:24px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">Training</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#475569">Active users</td><td style="text-align:right"><strong>${input.active_users}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#475569">Module completions</td><td style="text-align:right"><strong>${input.training_completions}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#475569">Average score</td><td style="text-align:right"><strong>${escapeHtml(avgScoreText)}</strong></td></tr>
      </table>

      <p style="margin-top:28px"><a href="${SITE_URL}/admin/usage" style="background:#0ea5e9;color:white;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">View detailed usage</a></p>

      <p style="color:#94a3b8;font-size:11px;margin-top:32px;border-top:1px solid #e2e8f0;padding-top:12px">
        You receive this email as an admin contact for ${escapeHtml(input.org_name)} on Pavitt Public Finance.
      </p>
    </div>
  `

  return { subject, html, text }
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0
  return Math.round((part / whole) * 100)
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!
  ))
}
