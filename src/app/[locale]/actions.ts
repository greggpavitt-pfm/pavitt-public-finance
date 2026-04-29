"use server"
// Server action for the contact form.
// The destination email address is read from the CONTACT_EMAIL env var —
// it never appears in the browser bundle.

export interface FormState {
  status: "idle" | "success" | "error"
  message: string
}

export async function sendContactEmail(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = (formData.get("name") as string | null)?.trim()
  const email = (formData.get("email") as string | null)?.trim()
  const message = (formData.get("message") as string | null)?.trim()

  // Basic validation
  if (!name || !email || !message) {
    return { status: "error", message: "Please fill in all fields." }
  }

  const toAddress = process.env.CONTACT_EMAIL
  if (!toAddress) {
    // Misconfigured server — don't expose details to the user
    console.error("CONTACT_EMAIL env var is not set")
    return { status: "error", message: "Contact form is temporarily unavailable. Please try again later." }
  }

  // NOTE: This is a stub. To actually send email you'd integrate a service
  // like Resend, SendGrid, or Nodemailer here. The structure is ready for that.
  // For now, log the submission so you can verify the form works end-to-end.
  console.log("Contact form submission:", { name, email, message, to: toAddress })

  // Simulate success
  return {
    status: "success",
    message: "Thank you! Your message has been sent. Gregg will be in touch shortly.",
  }
}
