/**
 * Support content, kept free of component imports.
 *
 * Read by both the public /support page (marketing shell) and the signed-in
 * /dashboard/support screen (app shell, #1213), so the two cannot drift.
 * Every answer describes the app as it is, with the labels it shows (#1300).
 * The copy ported from the retired Next.js site described a "Forgot
 * password?" link, a Settings → Account → Delete Account path and a "⋯ →
 * Report" menu on jobs and profiles; the app has none of those as written.
 * When a screen's labels or paths change, change the answer here too.
 */

export const SUPPORT_EMAIL = 'support@scaffald.com'

export type SupportFaq = { q: string; a: string }

export const SUPPORT_FAQS: readonly SupportFaq[] = [
  {
    // Sign-in is passwordless first (login-screen.tsx); there is no reset flow.
    q: 'I forgot my password. How do I sign in?',
    a: 'You don\'t need a password. On the sign-in screen, enter your email and tap "Email me a sign-in link", or tap "Use one-time code" to get a code instead. You can also continue with Google, or with Apple on iPhone and the web. If you still can\'t get in, email support@scaffald.com and we will help.',
  },
  {
    // Settings → Account renders AccountDeletionPanel. It files a request and
    // signs you out; the account-deletion-process job carries it out 14 days
    // later, and signing back in before then offers Cancel (#1313).
    q: 'How do I delete my account?',
    a: 'Open Settings (on a phone, tap More, then Settings; on a larger screen, tap your name at the foot of the menu, then "Account & settings") and choose the Account tab. Under Delete Account, tap "Request Account Deletion", type DELETE to confirm, and tap "Delete Account". You will be signed out straight away. Your account is deleted 14 days later, and always within 30 days; if you change your mind, sign back in before then and tap "Cancel deletion". You can also email support@scaffald.com with the subject "Delete my account".',
  },
  {
    // ReportAction is on community posts and inquiry messages only; job
    // postings and profiles have no Report control.
    q: 'How do I report a post, a message, a job posting or a person?',
    a: 'On a community post, or a message in an inquiry thread, tap Report, choose what\'s wrong and tap "Send report". Our moderation team reviews every report, and you can block the person too. Job postings and profiles don\'t have a Report button yet: email support@scaffald.com with a link to the posting or profile and tell us what happened.',
  },
  {
    q: 'How do I update my profile or trade certifications?',
    a: 'Open Profile from the menu (on a phone, it is a tab in the bottom bar). Your name, headline and work preferences are under Resumé, your work history and education under Experience, and your certifications under Skills. To add a certification, search the list, or tap "Add Custom Certification" and attach a PDF or photo of your credential. Uploading files works on the web for now.',
  },
  {
    // Statuses from application-status.ts. No status-change notification is
    // sent yet, so the answer promises none.
    q: 'I applied for a job — how do I track its status?',
    a: 'Open Jobs → Applications (on a phone, the Apps tab in the bottom bar). Each application shows where it stands: Applied, Under review, Interview, Question for you, Offer, Hired, Not selected or Withdrawn. The tabs at the top narrow the list to active applications, interviews, offers or closed ones.',
  },
  {
    // The score is community reputation (migrations 313, 315): it starts at
    // 100 and moves only with community activity.
    q: 'How does the Scaffald score work?',
    a: 'Your Scaffald score is your community reputation. Everyone starts at 100. It changes with what you do in Communities: publishing posts and comments, giving and receiving ratings, receiving upvotes, and having your licence verified by a community raise it, and unpublishing or deleting a post lowers it. It shows on your profile and your public profile, and employers see it when they view you.',
  },
  {
    // Public profiles never return email or phone; an employer reads them only
    // once the success fee for that application is paid (user-profiles.ts).
    q: 'Can employers see my contact information?',
    a: "Not on your profile. Employers see your name, headline, location, experience and the other details on your public profile, never your email address or phone number. When you apply to a job, that employer can see your email and phone only after they pay Scaffald's fee for your application. Anything you include in a résumé or file you attach to an application is visible to that employer.",
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
