'use client'

import { useState } from 'react'

const ORG_FEATURES = [
  {
    title: 'Skilled talent',
    description:
      'Skills-based search and geolocation create a seamless experience for employers seeking skilled labor. Filter candidates based on certifications, skills, experience level, and more. By combining these filters with a search radius, Scaffald ensures you identify the best-matched professionals within your desired geographic area.',
    stats: [
      { value: '15 hrs', label: 'of time saved' },
      { value: '90%', label: 'retention rate' },
    ],
  },
  {
    title: 'Team building',
    description:
      'Manage teams with a hybrid of existing employees and potential new hires — particularly useful for pre-construction and project planning phases. Build actual and speculative teams to proactively plan out a project, building phase, or milestone based on anticipated resources. Essentially turning team building into a simple task list.',
    stats: [
      { value: '24%', label: 'increased efficiency' },
      { value: '2×', label: 'scalability' },
    ],
  },
  {
    title: 'Verified data',
    description:
      "Workers can upload and link their certifications (OSHA, CPR, etc.) to their profile, making it easy for an employer to reference and verify before onboarding. With a couple of clicks, you can also request a background search for criminal history, driving record, work history data, and certifications verified through our partner, NationSearch.",
    stats: [
      { value: '90%', label: 'profile accuracy' },
      { value: '1,000+', label: 'data points' },
    ],
  },
]

const WORKER_FEATURES = [
  {
    title: 'Shareable showcase',
    description:
      'Your profile on Scaffald is streamlined, professional, and importantly, shareable to recruiters, employers, or anyone you choose. You control how your experience, certifications, and skills are presented, making it easy to showcase your work and open new opportunities.',
    stats: [
      { value: '1-link', label: 'shareable profile' },
      { value: '100%', label: 'you in control' },
    ],
  },
  {
    title: 'Scaffald score',
    description:
      'A critical metric reflecting your skills, experience, and activity on the platform. A higher score boosts your chances of getting noticed and hired by employers. The more complete and active your profile, the more your score works for you.',
    stats: [
      { value: 'Algo', label: 'calculated score' },
      { value: 'Higher', label: 'visibility' },
    ],
  },
  {
    title: 'Two-way reviews',
    description:
      'You can review companies you have worked with and receive feedback from employers and colleagues, helping you build a stronger reputation over time. Transparent history benefits everyone.',
    stats: [
      { value: 'Both', label: 'sides reviewed' },
      { value: 'Trust', label: 'built over time' },
    ],
  },
]

export default function Benefits() {
  const [tab, setTab] = useState<'orgs' | 'workers'>('orgs')
  const [active, setActive] = useState(0)

  const features = tab === 'orgs' ? ORG_FEATURES : WORKER_FEATURES

  return (
    <section id="benefits" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-[#16110d] text-4xl md:text-5xl font-bold tracking-tight mb-6">
            {tab === 'orgs'
              ? 'Find skilled labor. Build better teams.'
              : 'Showcase Your Skills. Get Hired Faster.'}
          </h2>

          {/* Tab switcher */}
          <div className="inline-flex bg-[#f1efeb] rounded-xl p-1 gap-1">
            <button
              onClick={() => { setTab('orgs'); setActive(0) }}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'orgs'
                  ? 'bg-[#034550] text-white shadow-sm'
                  : 'text-[#6e6760] hover:text-[#16110d]'
              }`}
            >
              For Organizations
            </button>
            <button
              onClick={() => { setTab('workers'); setActive(0) }}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === 'workers'
                  ? 'bg-[#034550] text-white shadow-sm'
                  : 'text-[#6e6760] hover:text-[#16110d]'
              }`}
            >
              For Workers
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {features.map((f, i) => (
            <button
              key={f.title}
              onClick={() => setActive(i)}
              className={`text-left p-6 rounded-2xl border transition-all ${
                active === i
                  ? 'bg-[#034550] border-[#034550] text-white'
                  : 'bg-[#f9f8f6] border-[#e3dfd9] hover:border-[#1d7282]/40'
              }`}
            >
              <h3
                className={`font-semibold text-base mb-2 ${
                  active === i ? 'text-white' : 'text-[#16110d]'
                }`}
              >
                {f.title}
              </h3>
              <div className="flex gap-4 mt-3">
                {f.stats.map((s) => (
                  <div key={s.label}>
                    <div
                      className={`text-xl font-bold ${
                        active === i ? 'text-[#3fb5c7]' : 'text-[#1d7282]'
                      }`}
                    >
                      {s.value}
                    </div>
                    <div
                      className={`text-xs uppercase tracking-wide ${
                        active === i ? 'text-white/70' : 'text-[#9e9790]'
                      }`}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="bg-[#f9f8f6] rounded-2xl border border-[#e3dfd9] p-8">
          <p className="text-[#3c352c] text-lg leading-relaxed mb-8">
            {features[active].description}
          </p>
          <a
            href={tab === 'orgs' ? 'https://app.scaffald.com' : 'https://app.scaffald.com/register'}
            className="inline-flex items-center gap-2 bg-[#034550] hover:bg-[#022d38] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {tab === 'orgs' ? 'Register your Organization' : 'Create your Profile'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
