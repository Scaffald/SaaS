const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: 'Digital resumés',
    description:
      'Explore or create in-depth, skills-based profiles with project photos and detailed capability descriptions.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    title: 'Skills-based search & geolocation',
    description:
      'Filter candidates based on search radius, certifications, skills, experience level, and more.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Two-way reviews',
    description:
      'Provide and read feedback from both workers and employers to build a trusted reputation on both sides.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: 'Verified certifications',
    description:
      'Upload and confirm certifications like OSHA, CPR, and more so employers can verify before onboarding.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#f9f8f6]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[#1d7282] text-sm font-semibold tracking-widest uppercase mb-3">
            Tools to hire &amp; get hired
          </p>
          <h2 className="text-[#16110d] text-4xl md:text-5xl font-bold tracking-tight">
            Built to meet the needs of the Trades
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 border border-[#e3dfd9] hover:border-[#1d7282]/30 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[#e8f6f9] text-[#1d7282] flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-[#16110d] font-semibold text-base mb-2">{f.title}</h3>
              <p className="text-[#6e6760] text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
