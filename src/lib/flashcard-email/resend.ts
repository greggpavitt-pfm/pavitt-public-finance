// Resend HTTP API wrapper.
//
// We avoid pulling in the resend SDK and call the API directly via fetch —
// one fewer dependency. RESEND_API_KEY must be set in env.
//
// Errors thrown here are caught by the caller and logged to flashcard_email_log
// with status='failed'.

const RESEND_URL = "https://api.resend.com/emails"

export interface SendEmailParams {
  to: string
  from: string  // e.g. "Pavitt Public Finance <noreply@pfmexpert.net>"
  subject: string
  html: string
  text: string
}

export interface SendEmailResult {
  id: string  // Resend message id
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("RESEND_API_KEY is not set")

  const r = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  })

  if (!r.ok) {
    const body = await r.text().catch(() => "")
    throw new Error(`Resend ${r.status}: ${body.slice(0, 200)}`)
  }

  const data = await r.json() as { id?: string }
  if (!data.id) throw new Error("Resend returned no message id")
  return { id: data.id }
}
