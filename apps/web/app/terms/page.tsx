import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Scaffald — the rules governing use of the platform.',
}

const EFFECTIVE_DATE = 'May 1, 2025'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f9f8f6]">
      <header className="bg-[#034550] py-12">
        <div className="max-w-3xl mx-auto px-6">
          <Link href="/" className="text-[#7fd1de] text-sm hover:text-white transition-colors mb-4 inline-block">
            ← Scaffald
          </Link>
          <h1 className="text-white text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-[#7fd1de] mt-2 text-sm">Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-[#e3dfd9] p-8 md:p-12 space-y-8">

          <Section title="1. Agreement to terms">
            <p>
              These Terms of Service ("Terms") govern your access to and use of the Scaffald
              platform — including the mobile application and website (collectively, the
              "Service") — operated by Unicorn LLC ("Scaffald", "we", "our", or "us"). By
              creating an account or otherwise using the Service, you agree to these Terms. If
              you do not agree, do not use the Service.
            </p>
            <p>
              Scaffald is incorporated in the State of Delaware. These Terms are governed by
              the laws of the State of Delaware, without regard to conflict of law principles.
            </p>
          </Section>

          <Section title="2. Account types">
            <p>Scaffald offers two primary account types:</p>
            <ul>
              <li>
                <strong>Worker Accounts</strong> — for individuals seeking employment or
                project-based work in the skilled trades. Workers create profiles showcasing
                their skills, certifications, and work history.
              </li>
              <li>
                <strong>Organization Accounts</strong> — for companies, general contractors,
                subcontractors, and other employers seeking to find, hire, and manage
                skilled-trade workers.
              </li>
            </ul>
            <p>
              You must be at least 18 years old to create an account. By registering, you
              represent that all information you provide is accurate, current, and complete.
            </p>
          </Section>

          <Section title="3. Acceptable use">
            <p>You agree not to:</p>
            <ul>
              <li>Post false, misleading, or fraudulent information on your profile or job listings</li>
              <li>Harass, threaten, or discriminate against other users</li>
              <li>Use the Service to solicit users outside of Scaffald in violation of these Terms</li>
              <li>Scrape, crawl, or harvest data from the Service without written permission</li>
              <li>Reverse-engineer, decompile, or attempt to extract source code from the Service</li>
              <li>Use automated tools to create accounts or send messages</li>
              <li>Violate any applicable local, state, federal, or international law</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms
              or that we determine, in our sole discretion, are harmful to the Service or its
              users.
            </p>
          </Section>

          <Section title="4. Worker profiles and the Scaffald score">
            <p>
              Workers own their profile content. By submitting content to Scaffald (text,
              photos, certifications, etc.) you grant Scaffald a non-exclusive, worldwide,
              royalty-free license to display and distribute that content as part of providing
              the Service.
            </p>
            <p>
              The <strong>Scaffald Score</strong> is an algorithmically calculated metric that
              reflects a worker&apos;s profile completeness, verified credentials, platform
              activity, and peer feedback. Scaffald does not guarantee any specific employment
              outcome based on a worker&apos;s score. Scores may change over time as your
              activity and profile evolve.
            </p>
          </Section>

          <Section title="5. Profile claiming (Organizations)">
            <p>
              Organization Accounts may "claim" profiles of their current employees, subject
              to the following conditions:
            </p>
            <ul>
              <li>Claimed workers are removed from public search results while claimed</li>
              <li>Claimed workers may not be directly solicited by other employers on the platform</li>
              <li>
                Workers own their own data and may reject a claim at any time, at which point
                they become visible on the platform again
              </li>
              <li>
                Claiming is a premium feature billed per active claimed employee. See current
                pricing in the app.
              </li>
            </ul>
          </Section>

          <Section title="6. Payments and subscriptions">
            <p>
              Certain features of the Service require payment. All payments are processed
              securely by Stripe. Scaffald does not store payment card details.
            </p>
            <p>
              Subscriptions automatically renew at the end of each billing period unless
              cancelled. You may cancel at any time through the app or by contacting{' '}
              <a href="mailto:support@scaffald.com">support@scaffald.com</a>. Cancellation
              takes effect at the end of the current billing period — we do not provide
              prorated refunds for partial periods.
            </p>
            <p>
              We reserve the right to change pricing with 30 days&apos; notice. Continued use
              after a pricing change takes effect constitutes acceptance of the new pricing.
            </p>
          </Section>

          <Section title="7. Background checks">
            <p>
              Scaffald partners with NationSearch to provide optional background check
              services. Background checks are initiated only with the consent of the worker
              being checked and are subject to NationSearch&apos;s own terms and applicable
              federal and state background check laws, including the Fair Credit Reporting Act
              (FCRA). Scaffald is not a consumer reporting agency under the FCRA.
            </p>
          </Section>

          <Section title="8. Third-party content and services">
            <p>
              The Service may contain links to third-party websites or services. Scaffald is
              not responsible for the content, privacy practices, or availability of any
              third-party sites. Your use of third-party services is governed by their
              respective terms.
            </p>
          </Section>

          <Section title="9. Intellectual property">
            <p>
              The Scaffald name, logo, product design, and all proprietary technology are the
              exclusive property of Unicorn LLC. Nothing in these Terms grants you any right
              to use our trademarks, trade names, or service marks without prior written
              permission.
            </p>
          </Section>

          <Section title="10. Disclaimers">
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY
              KIND. SCAFFALD DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
              ERROR-FREE, OR FREE OF HARMFUL COMPONENTS. SCAFFALD MAKES NO GUARANTEES
              REGARDING EMPLOYMENT OUTCOMES, WORKER QUALITY, OR THE ACCURACY OF ANY PROFILE
              INFORMATION SUBMITTED BY USERS.
            </p>
          </Section>

          <Section title="11. Limitation of liability">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SCAFFALD AND ITS OFFICERS, DIRECTORS,
              EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE
              SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL
              LIABILITY TO YOU FOR ANY CLAIM SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS
              YOU PAID TO SCAFFALD IN THE 12 MONTHS PRIOR TO THE CLAIM OR (B) $100.
            </p>
          </Section>

          <Section title="12. Dispute resolution">
            <p>
              Any dispute arising from these Terms or your use of the Service shall be
              resolved by binding arbitration administered by the American Arbitration
              Association under its Commercial Arbitration Rules, with proceedings conducted
              in Delaware. You waive any right to a jury trial or to participate in a
              class-action lawsuit.
            </p>
            <p>
              Notwithstanding the above, either party may seek emergency injunctive relief in
              a court of competent jurisdiction to prevent irreparable harm pending arbitration.
            </p>
          </Section>

          <Section title="13. Changes to these Terms">
            <p>
              We may update these Terms from time to time. Material changes will be
              communicated via in-app notification or email at least 14 days before taking
              effect. Continued use of the Service after changes take effect constitutes
              acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="14. Termination">
            <p>
              You may delete your account at any time through the app (Settings → Account →
              Delete Account) or by contacting{' '}
              <a href="mailto:support@scaffald.com">support@scaffald.com</a>. We may
              terminate or suspend your access immediately, without prior notice, for conduct
              that we believe violates these Terms or is harmful to the Service, other users,
              or third parties.
            </p>
          </Section>

          <Section title="15. Contact">
            <p>
              Unicorn LLC<br />
              <a href="mailto:support@scaffald.com">support@scaffald.com</a>
            </p>
            <p>
              <Link href="/support">Visit our support page</Link> for help with your account.
              <br />
              <Link href="/privacy">View our Privacy Policy</Link> for information on data handling.
            </p>
          </Section>

        </div>
      </main>

      <footer className="bg-[#022d38] py-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[#6e6760] text-xs">© {new Date().getFullYear()} Scaffald — a Unicorn company</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-[#6e6760] hover:text-[#7fd1de] text-xs transition-colors">Privacy Policy</Link>
            <Link href="/support" className="text-[#6e6760] hover:text-[#7fd1de] text-xs transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[#034550] text-xl font-bold mb-3">{title}</h2>
      <div className="text-[#3c352c] leading-relaxed space-y-3 text-sm">{children}</div>
    </section>
  )
}
