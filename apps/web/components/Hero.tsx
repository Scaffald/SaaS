const TRADES = [
  'MEP Trades',
  'Estimators',
  'Project Managers',
  'Robotics',
  'Engineers',
  'Architects',
  'Machinists',
  'Technicians',
  'Heavy Equipment Operators',
  'Security Specialists',
  'Linemen',
  'Leadership',
  'Installers',
  'Mechanics',
]

export default function Hero() {
  const doubled = [...TRADES, ...TRADES]

  return (
    <section className="bg-[#034550] pt-16 pb-0 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#1d7282]/30 border border-[#3fb5c7]/30 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-[#3fb5c7] inline-block" />
          <span className="text-[#bde9f0] text-sm font-medium">
            Now available for iOS &amp; Android
          </span>
        </div>

        <h1 className="text-white text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight max-w-4xl mx-auto mb-6">
          Connecting skilled trade workers to great employers
        </h1>

        <p className="text-[#7fd1de] text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Scaffald is a comprehensive talent platform designed to streamline the
          process of finding, hiring, and managing professionals in the trades.
          Advanced job matching, workflows, and review systems enhance workforce
          efficiency and reliability.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="https://app.scaffald.com/register"
            className="w-full sm:w-auto bg-[#1d7282] hover:bg-[#125b69] text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors shadow-lg shadow-black/20"
          >
            Create Your Worker Profile
          </a>
          <a
            href="https://app.scaffald.com"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl text-base transition-colors"
          >
            Register your Organization
          </a>
        </div>
      </div>

      {/* Trade ticker */}
      <div className="border-t border-white/10 py-4 bg-[#022d38]/50">
        <div className="overflow-hidden">
          <div className="animate-marquee">
            {doubled.map((trade, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-3 px-4 text-[#7fd1de] text-sm font-medium whitespace-nowrap"
              >
                {i > 0 && <span className="text-[#1d7282]">•</span>}
                {trade}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
