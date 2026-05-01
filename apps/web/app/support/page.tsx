import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Get help with your Scaffald account. Contact our support team or browse common questions.',
}

const FAQS = [
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

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#f9f8f6]">
      <header className="bg-[#034550] py-12">
        <div className="max-w-3xl mx-auto px-6">
          <Link href="/" className="text-[#7fd1de] text-sm hover:text-white transition-colors mb-4 inline-block">
            ← Scaffald
          </Link>
          <h1 className="text-white text-4xl font-bold tracking-tight">Support</h1>
          <p className="text-[#7fd1de] mt-2">
            Get help with your Scaffald account
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">

        {/* Contact card */}
        <div className="bg-[#034550] rounded-2xl p-8 text-white">
          <h2 className="text-xl font-bold mb-2">Contact us</h2>
          <p className="text-[#7fd1de] text-sm mb-4">
            Scaffald is a talent platform connecting skilled trade workers with employers
            across the construction, MEP, and industrial sectors. We respond to all inquiries
            within <strong className="text-white">1 business day</strong>.
          </p>
          <a
            href="mailto:support@scaffald.com"
            className="inline-flex items-center gap-2 bg-[#1d7282] hover:bg-[#125b69] text-white font-medium px-5 py-3 rounded-xl text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4l6 4 6-4" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="1" y="3" width="14" height="10" rx="2" />
            </svg>
            support@scaffald.com
          </a>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-[#16110d] text-2xl font-bold mb-6">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map((item) => (
              <details
                key={item.q}
                className="bg-white border border-[#e3dfd9] rounded-xl group"
              >
                <summary className="flex items-start justify-between gap-4 px-6 py-4 cursor-pointer list-none">
                  <span className="text-[#16110d] font-medium text-sm">{item.q}</span>
                  <span className="text-[#1d7282] shrink-0 mt-0.5 group-open:rotate-45 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 4v10M4 9h10" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="px-6 pb-4 text-[#6e6760] text-sm leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Privacy link */}
        <div className="bg-white rounded-2xl border border-[#e3dfd9] p-6 text-sm text-[#6e6760]">
          For information about how we handle your data, see our{' '}
          <Link href="/privacy" className="text-[#1d7282] hover:underline">Privacy Policy</Link>.
          To request account deletion, email{' '}
          <a href="mailto:support@scaffald.com" className="text-[#1d7282] hover:underline">
            support@scaffald.com
          </a>{' '}
          with the subject &quot;Delete my account&quot;.
        </div>
      </main>

      <footer className="bg-[#022d38] py-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[#6e6760] text-xs">© {new Date().getFullYear()} Scaffald — a Unicorn company</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-[#6e6760] hover:text-[#7fd1de] text-xs transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-[#6e6760] hover:text-[#7fd1de] text-xs transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
