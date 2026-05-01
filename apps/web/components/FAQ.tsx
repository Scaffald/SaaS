'use client'

import { useState } from 'react'

const TABS = {
  Subcontractors: [
    {
      q: 'Can subcontractors use Scaffald to promote their crew?',
      a: 'Absolutely. Subcontractors can build a company profile that highlights their team, specialties, and project history — making it easier to win bids or get found by general contractors.',
    },
    {
      q: 'Can I link my workers\' profiles to my subcontractor profile?',
      a: 'Yes. Your company profile can connect directly to individual worker profiles, creating a verified record of the skills and people behind your work.',
    },
    {
      q: 'How does Scaffald help subcontractors find new projects?',
      a: 'Scaffald helps you get visibility with GCs and employers searching for qualified crews. With transparent profiles and verified credentials, you can stand out and get matched to the right opportunities.',
    },
  ],
  Workers: [
    {
      q: 'Do I need to already have experience to make a Scaffald profile?',
      a: "Not at all. Whether you're just getting started or have years in the field, your Scaffald profile grows with you. Add skills, certifications, and project photos anytime — it's built to show your progress.",
    },
    {
      q: 'Can I use my Scaffald profile to apply for jobs directly?',
      a: 'Yes. You can share your Scaffald profile link with recruiters or on applications, so they can instantly see your verified experience — no more juggling multiple resumes.',
    },
    {
      q: 'How do I make my profile stand out?',
      a: 'Keep it complete and visual. Add recent projects, upload proof of certifications, and include photos or endorsements from previous work. Scaffald helps your work speak for itself.',
    },
  ],
  General: [
    {
      q: 'Does someone need a Scaffald account to see my profile?',
      a: "Nope. You can choose to make your profile public and share a link with anyone. They'll be able to view your experience, certifications, and details. No account or sign-in needed.",
    },
    {
      q: 'Is this for employers or job seekers?',
      a: 'Both — and subcontractors too. Scaffald was built to empower workers and companies across every level of a project. Job seekers build a digital profile that serves as a single source of truth. Subcontractors can showcase their crew\'s capabilities and project portfolio. Employers streamline hiring by searching, verifying, and connecting with qualified talent fast.',
    },
    {
      q: 'Can my employees be poached?',
      a: "Scaffald allows employers to claim the profiles of their employees. This takes the employee out of search results and they are no longer able to be directly solicited while claimed. Users own their own data — a user can reject a claim at any point and make themselves available on the market.",
    },
    {
      q: 'When will you have workers in my region?',
      a: "We are quickly expanding into new markets. The fastest way to activate the platform for your organization is to add our 'Apply with Scaffald' button to your existing job postings. This encourages applicants to build out their robust profile, saving you time vetting candidates.",
    },
    {
      q: 'Is this a job board or applicant tracking system?',
      a: 'Scaffald is a bit of both. We aim to replace the need for traditional job boards or ATS through profiles and robust databases. Think of Scaffald as a more refined LinkedIn tailored to specific industry needs.',
    },
  ],
}

type Tab = keyof typeof TABS

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#e3dfd9] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left"
      >
        <span className="text-[#16110d] font-medium text-base">{q}</span>
        <span className={`shrink-0 text-[#1d7282] transition-transform mt-0.5 ${open ? 'rotate-45' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 4v12M4 10h12" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="text-[#6e6760] text-sm leading-relaxed pb-5 pr-8">{a}</p>
      )}
    </div>
  )
}

export default function FAQ() {
  const [tab, setTab] = useState<Tab>('General')

  return (
    <section id="faq" className="py-24 bg-[#f9f8f6]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[#1d7282] text-sm font-semibold tracking-widest uppercase mb-3">
            FAQs
          </p>
          <h2 className="text-[#16110d] text-4xl font-bold tracking-tight">
            Common questions
          </h2>
        </div>

        <div className="flex gap-2 mb-8 bg-[#f1efeb] p-1 rounded-xl">
          {(Object.keys(TABS) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-white text-[#16110d] shadow-sm'
                  : 'text-[#6e6760] hover:text-[#16110d]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#e3dfd9] px-6">
          {TABS[tab].map((item) => (
            <AccordionItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  )
}
