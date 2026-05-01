'use client'

import { useState } from 'react'

const ORG_TYPES = [
  'General contractor',
  'Construction',
  'Real Estate',
  'HR/Recruiting',
  'Education/Training',
  'Other',
]

export default function ContactForm() {
  const [orgType, setOrgType] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('sent')
      form.reset()
      setOrgType('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="py-24 bg-[#034550]">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-white text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Ready to start Scaffalding?
          </h2>
          <p className="text-[#7fd1de] text-lg">
            Tell us about your organization and we will be in touch.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="bg-[#1d7282]/30 border border-[#3fb5c7]/40 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-white font-semibold text-lg mb-1">Message received!</p>
            <p className="text-[#7fd1de]">We will be in touch within 1 business day.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col gap-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[#bde9f0] text-sm font-medium mb-1.5">
                  Name <span className="text-[#3fb5c7]">*</span>
                </label>
                <input
                  name="name"
                  required
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#3fb5c7] transition-colors"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-[#bde9f0] text-sm font-medium mb-1.5">
                  Email <span className="text-[#3fb5c7]">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#3fb5c7] transition-colors"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#bde9f0] text-sm font-medium mb-1.5">
                Organization / Company <span className="text-[#3fb5c7]">*</span>
              </label>
              <input
                name="company"
                required
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#3fb5c7] transition-colors"
                placeholder="Company name"
              />
            </div>

            <div>
              <label className="block text-[#bde9f0] text-sm font-medium mb-1.5">
                Organization type <span className="text-[#3fb5c7]">*</span>
              </label>
              <select
                name="orgType"
                required
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#3fb5c7] transition-colors"
              >
                <option value="" disabled className="bg-[#034550]">Select a type…</option>
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#034550]">{t}</option>
                ))}
              </select>
            </div>

            {orgType === 'Other' && (
              <div>
                <label className="block text-[#bde9f0] text-sm font-medium mb-1.5">
                  Please describe your organization
                </label>
                <input
                  name="orgTypeOther"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#3fb5c7] transition-colors"
                  placeholder="Tell us about your organization"
                />
              </div>
            )}

            <div>
              <label className="block text-[#bde9f0] text-sm font-medium mb-1.5">
                How can we help you?
              </label>
              <textarea
                name="message"
                rows={4}
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#3fb5c7] transition-colors resize-none"
                placeholder="Tell us what you are looking for…"
              />
            </div>

            {status === 'error' && (
              <p className="text-red-300 text-sm">
                Something went wrong. Please try again or email us at{' '}
                <a href="mailto:hello@scaffald.com" className="underline">hello@scaffald.com</a>.
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="bg-[#1d7282] hover:bg-[#125b69] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              {status === 'sending' ? 'Sending…' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
