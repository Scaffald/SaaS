import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Scaffald — how we collect, use, and protect your data.',
}

const EFFECTIVE_DATE = 'May 1, 2025'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f9f8f6]">
      <header className="bg-[#034550] py-12">
        <div className="max-w-3xl mx-auto px-6">
          <Link href="/" className="text-[#7fd1de] text-sm hover:text-white transition-colors mb-4 inline-block">
            ← Scaffald
          </Link>
          <h1 className="text-white text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-[#7fd1de] mt-2 text-sm">Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border border-[#e3dfd9] p-8 md:p-12 prose prose-stone max-w-none">

          <Section title="1. Introduction">
            <p>
              This Privacy Policy describes how Unicorn LLC ("<strong>Scaffald</strong>", "we", "our", or "us")
              collects, uses, and shares information about you when you use the Scaffald mobile application
              and website (collectively, the "<strong>Service</strong>").
            </p>
            <p>
              <strong>Data controller:</strong> Unicorn LLC<br />
              <strong>Contact:</strong>{' '}
              <a href="mailto:support@scaffald.com">support@scaffald.com</a>
            </p>
            <p>
              By using the Service, you agree to the collection and use of information as described in
              this policy. If you do not agree, please do not use the Service.
            </p>
          </Section>

          <Section title="2. What we collect">
            <p>We collect the following categories of personal data:</p>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Why we collect it</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Name</td>
                  <td>Account creation and display on your profile</td>
                </tr>
                <tr>
                  <td>Email address</td>
                  <td>Authentication, account management, transactional email</td>
                </tr>
                <tr>
                  <td>Phone number</td>
                  <td>Optional — account recovery, two-factor authentication</td>
                </tr>
                <tr>
                  <td>Precise location</td>
                  <td>Show nearby jobs and workers on the map (foreground only)</td>
                </tr>
                <tr>
                  <td>Coarse location</td>
                  <td>Same as above</td>
                </tr>
                <tr>
                  <td>Photos / video</td>
                  <td>Profile photo and optional project photos</td>
                </tr>
                <tr>
                  <td>Messages</td>
                  <td>In-app direct messaging between workers and employers</td>
                </tr>
                <tr>
                  <td>User ID</td>
                  <td>Internal account identifier</td>
                </tr>
                <tr>
                  <td>Device ID</td>
                  <td>Crash diagnostics and analytics (not linked to your identity)</td>
                </tr>
                <tr>
                  <td>Usage data — product interaction</td>
                  <td>Feature analytics to improve the app (not linked to your identity)</td>
                </tr>
                <tr>
                  <td>Crash data</td>
                  <td>Sentry crash reporting</td>
                </tr>
                <tr>
                  <td>Performance data</td>
                  <td>App stability monitoring</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section title="3. What we do NOT collect">
            <p>We do not collect:</p>
            <ul>
              <li>Physical or mailing address</li>
              <li>Search history or browsing history</li>
              <li>Purchase history</li>
              <li>Financial information (payments processed by Stripe — we do not store card data)</li>
              <li>Health or fitness data</li>
            </ul>
          </Section>

          <Section title="4. How we use your data">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and operate the Scaffald Service (matching workers and employers)</li>
              <li>Send transactional notifications (application updates, messages, account alerts)</li>
              <li>Improve the app via anonymized analytics</li>
              <li>Respond to support requests</li>
              <li>Prevent fraud and enforce our Terms of Service</li>
            </ul>
            <p>
              <strong>We do not sell your data.</strong> We do not use your data for cross-app
              tracking or advertising.
            </p>
          </Section>

          <Section title="5. How we share your data">
            <ul>
              <li>
                <strong>With employers:</strong> Your name, headline, trade, location (city/state), and
                certifications are visible to employers when you apply or when your profile is public.
                Your contact details (email, phone) are never shared without your explicit action.
              </li>
              <li>
                <strong>With workers:</strong> Employers&apos; company name, location, and job listings are
                visible to workers searching the platform.
              </li>
              <li>
                <strong>Service providers:</strong> Supabase (database and authentication), Sentry
                (crash reporting), Expo/EAS (build delivery), Apple Push Notification Service (push
                notifications), NationSearch (background check services — only when you or your
                employer initiates a background check), Stripe (payment processing), Resend (transactional
                email). All service providers are bound by data processing agreements and may not use
                your data for their own purposes.
              </li>
              <li>
                <strong>Legal:</strong> We may disclose your information if required by law, regulation,
                or legal process, or to protect the safety and rights of Scaffald or its users.
              </li>
            </ul>
          </Section>

          <Section title="6. Location data">
            <p>
              Location is accessed only while the app is in the foreground to show nearby jobs and
              workers on a map. We do not track your location in the background. Location data is
              not sold or shared with third parties for advertising purposes.
            </p>
          </Section>

          <Section title="7. Data retention">
            <p>
              We retain your personal data for as long as your account is active. If you delete your
              account, we will delete or anonymize your personal data within 30 days, except where
              retention is required by law or necessary to resolve disputes.
            </p>
          </Section>

          <Section title="8. Children">
            <p>
              Scaffald is not directed at children under the age of 13. We do not knowingly collect
              personal data from children. If we become aware that a child under 13 has provided us
              with personal information, we will delete that information promptly. Contact us at{' '}
              <a href="mailto:support@scaffald.com">support@scaffald.com</a> if you believe we have
              inadvertently collected data from a child.
            </p>
          </Section>

          <Section title="9. Your rights and data deletion">
            <p>You have the right to access, correct, or delete your personal data at any time.</p>
            <p>
              <strong>To delete your account and all associated data:</strong>
            </p>
            <ul>
              <li>
                <strong>In the app:</strong> Settings → Account → Delete Account
              </li>
              <li>
                <strong>By email:</strong>{' '}
                <a href="mailto:support@scaffald.com">support@scaffald.com</a> — include
                &quot;Delete my account&quot; in the subject line
              </li>
            </ul>
            <p>
              California residents have additional rights under the California Consumer Privacy Act
              (CCPA), including the right to know what data we collect, the right to delete it, and
              the right to opt out of sale (we do not sell data). Contact{' '}
              <a href="mailto:support@scaffald.com">support@scaffald.com</a> to exercise any of
              these rights.
            </p>
          </Section>

          <Section title="10. Security">
            <p>
              We implement industry-standard security measures including encryption in transit (TLS)
              and at rest, access controls, and regular security reviews. No system is 100% secure —
              please contact us immediately at{' '}
              <a href="mailto:support@scaffald.com">support@scaffald.com</a> if you believe your
              account has been compromised.
            </p>
          </Section>

          <Section title="11. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. When we make material changes, we
              will update the effective date above and notify users in-app. Continued use of the
              Service after changes take effect constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              Unicorn LLC<br />
              <a href="mailto:support@scaffald.com">support@scaffald.com</a>
            </p>
            <p>
              <Link href="/support">Visit our support page</Link> for help with your account.
            </p>
          </Section>

        </div>
      </main>

      <footer className="bg-[#022d38] py-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[#6e6760] text-xs">© {new Date().getFullYear()} Scaffald — a Unicorn company</p>
          <div className="flex gap-4">
            <Link href="/terms" className="text-[#6e6760] hover:text-[#7fd1de] text-xs transition-colors">Terms of Service</Link>
            <Link href="/support" className="text-[#6e6760] hover:text-[#7fd1de] text-xs transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-[#034550] text-xl font-bold mb-3">{title}</h2>
      <div className="text-[#3c352c] leading-relaxed space-y-3 text-sm">{children}</div>
    </section>
  )
}
