// Daily flashcard email template.
//
// Plain-text + HTML versions. Kept simple (table-based HTML for max client
// compatibility — Outlook, Gmail, mobile webmail). No images, no tracking pixels.

export interface FlashcardForEmail {
  question: string
  answer: string
  module_title: string
}

export interface RenderedEmail {
  subject: string
  text: string
  html: string
}

export function renderDailyFlashcardEmail(params: {
  user_name: string | null
  cards: FlashcardForEmail[]
  open_url: string
}): RenderedEmail {
  const { user_name, cards, open_url } = params
  const greeting = user_name ? `Hi ${user_name},` : "Hi,"
  const subject = `Your daily IPSAS flashcards (${cards.length})`

  // Plain text
  const textCards = cards
    .map(
      (c, i) =>
        `${i + 1}. [${c.module_title}]\nQ: ${c.question}\nA: ${c.answer}`
    )
    .join("\n\n")
  const text = [
    greeting,
    "",
    "Three flashcards due for review today:",
    "",
    textCards,
    "",
    `Continue your training: ${open_url}`,
    "",
    "To stop these emails, sign in and uncheck 'Daily flashcard email' in your profile.",
    "",
    "Pavitt Public Finance",
  ].join("\n")

  // HTML — simple table for client compatibility
  const htmlCards = cards
    .map(
      (c, i) => `
<tr>
  <td style="padding:12px 0;border-bottom:1px solid #e5e7eb">
    <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">
      ${i + 1}. ${escapeHtml(c.module_title)}
    </div>
    <div style="font-weight:600;margin-top:4px;color:#111827">
      ${escapeHtml(c.question)}
    </div>
    <div style="margin-top:6px;color:#374151">
      ${escapeHtml(c.answer)}
    </div>
  </td>
</tr>`
    )
    .join("")

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f9fafb">
  <tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="background:#fff;border-radius:8px;padding:24px;max-width:560px">
      <tr><td style="color:#111827;font-size:16px">
        <div style="font-weight:600;font-size:18px">${escapeHtml(greeting)}</div>
        <div style="margin-top:8px;color:#6b7280">Three flashcards due for review today.</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px">
          ${htmlCards}
        </table>
        <div style="margin-top:24px">
          <a href="${escapeAttr(open_url)}"
             style="display:inline-block;background:#1e40af;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">
            Continue training
          </a>
        </div>
        <div style="margin-top:24px;color:#9ca3af;font-size:12px">
          To stop these emails, sign in and uncheck Daily flashcard email in your profile.
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`

  return { subject, text, html }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeAttr(s: string): string {
  return escapeHtml(s)
}
