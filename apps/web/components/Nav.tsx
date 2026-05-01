'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#034550]/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-xl tracking-tight">
          Scaffald
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-white/70 hover:text-white text-sm transition-colors">
            How it works
          </a>
          <a href="#benefits" className="text-white/70 hover:text-white text-sm transition-colors">
            Benefits
          </a>
          <a href="#faq" className="text-white/70 hover:text-white text-sm transition-colors">
            FAQs
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://app.scaffald.com"
            className="text-white/80 hover:text-white text-sm transition-colors"
          >
            Sign in
          </a>
          <a
            href="https://app.scaffald.com/register"
            className="bg-[#1d7282] hover:bg-[#125b69] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Get started
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            {open ? (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              />
            ) : (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#022d38] border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          <a href="#how-it-works" onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-sm">
            How it works
          </a>
          <a href="#benefits" onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-sm">
            Benefits
          </a>
          <a href="#faq" onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-sm">
            FAQs
          </a>
          <hr className="border-white/10" />
          <a href="https://app.scaffald.com" className="text-white/80 hover:text-white text-sm">
            Sign in
          </a>
          <a
            href="https://app.scaffald.com/register"
            className="bg-[#1d7282] text-white text-sm font-medium px-4 py-2 rounded-lg text-center"
          >
            Get started
          </a>
        </div>
      )}
    </header>
  )
}
