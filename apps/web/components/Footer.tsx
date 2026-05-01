import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#022d38] border-t border-white/10 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="text-white font-bold text-xl mb-4">Scaffald</div>
            <p className="text-[#7fd1de]/80 text-sm leading-relaxed max-w-lg">
              Scaffald is a unique platform that allows skilled tradespeople to
              connect with top general contractors and construction management
              firms by giving them a place to highlight their skills and find a
              place to apply their talent. Scaffald is positioned to allow top
              talent to meet top firms in a singular point of intersection that
              currently does not exist in the trades.
            </p>
          </div>

          <div>
            <p className="text-white font-semibold text-sm mb-4">Connect with us</p>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:hello@scaffald.com"
                className="text-[#7fd1de]/80 hover:text-[#7fd1de] text-sm transition-colors"
              >
                hello@scaffald.com
              </a>
              <a
                href="https://www.linkedin.com/company/scaffald/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7fd1de]/80 hover:text-[#7fd1de] text-sm transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[#6e6760] text-xs">
            © {new Date().getFullYear()} Scaffald — a{' '}
            <a
              href="https://unicorn.love/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#7fd1de] transition-colors"
            >
              Unicorn
            </a>{' '}
            company
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-[#6e6760] hover:text-[#7fd1de] text-xs transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[#6e6760] hover:text-[#7fd1de] text-xs transition-colors">
              Terms of Service
            </Link>
            <Link href="/support" className="text-[#6e6760] hover:text-[#7fd1de] text-xs transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
