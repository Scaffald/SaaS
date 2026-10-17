/**
 * Support content, kept free of component imports.
 *
 * Read by both the public /support page (marketing shell) and the signed-in
 * /dashboard/support screen (app shell, #1213), so the two cannot drift.
 * Copy ported verbatim from the retired Next.js site (apps/web/app/support).
 * The FAQ answers are user-facing support copy — keep the wording as-is.
 */

export const SUPPORT_EMAIL = 'support@scaffald.com'

export type SupportFaq = { q: string; a: string }

export const SUPPORT_FAQS: readonly SupportFaq[] = [
  {
    q: 'How do I reset my password?',
    a: 'On the sign-in screen, tap "Forgot password?" and enter your email address. You will receive a reset link within a few minutes. Check your spam folder if it does not arrive. You can also email support@scaffald.com and we will assist you.',
  },
  {
    q: 'How do I delete my account?',
    a: 'In the app, go to Settings → Account → Delete Account. Your account and all associated data will be permanently deleted within 30 days. Alternatively, email support@scaffald.com with the subject "Delete my account" and we will process your request.',
  },
  {
    q: 'How do I report a job posting or user?',
    a: 'On any job posting or user profile, tap the "⋯" (more) menu and select "Report". Choose the reason from the list and submit. Our team reviews all reports within 1–2 business days. For urgent safety concerns, email support@scaffald.com directly.',
  },
  {
    q: 'How do I update my profile or trade certifications?',
    a: 'Open your profile from the bottom navigation and tap "Edit profile". You can update your trade, certifications, skills, and work history at any time. To add a certification, tap "Add certification" and upload a photo of your credential.',
  },
  {
    q: 'I applied for a job — how do I track its status?',
    a: 'Go to Jobs → My Applications. You will see the current status for each application (Submitted, Viewed, Shortlisted, etc.). You will also receive a push notification when your application status changes.',
  },
  {
    q: 'How does the Scaffald score work?',
    a: 'Your Scaffald score is an algorithmic metric that reflects the completeness of your profile, your verified certifications, your activity on the platform, and feedback from employers and colleagues. A higher score increases your visibility to employers. Keep your profile complete and up to date to maximize your score.',
  },
  {
    q: 'Can employers see my contact information?',
    a: 'Your email address and phone number are never shared with employers without your explicit action (such as initiating contact). Employers can see your name, headline, trade, city/state, and public profile details.',
  },
]

/**
 * Matches an email address anywhere in a string. The trailing group cannot
 * end on a dot, so sentence punctuation ("… email support@scaffald.com.")
 * stays outside the link.
 */
const EMAIL_SPLIT = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g
const EMAIL_EXACT = /^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/

export type TextPart = { text: string; email: boolean }

/** Split copy into plain runs and email addresses, so addresses can render as links. */
export function splitOnEmails(text: string): TextPart[] {
  return text
    .split(EMAIL_SPLIT)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, email: EMAIL_EXACT.test(part) }))
}
