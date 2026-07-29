/**
 * Privacy Policy.
 *
 * Copy ported verbatim from the retired Next.js site (apps/web/app/privacy).
 * Do not paraphrase, reorder, or "improve" the wording — it is the published
 * legal text. Structural changes only.
 */

import { LegalLayout, LegalSections, type LegalSection } from '../components/LegalLayout'

const EFFECTIVE_DATE = 'May 1, 2025'

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Introduction',
    blocks: [
      {
        kind: 'text',
        text: 'This Privacy Policy describes how Unicorn LLC ("Scaffald", "we", "our", or "us") collects, uses, and shares information about you when you use the Scaffald mobile application and website (collectively, the "Service").',
      },
      { kind: 'text', label: 'Data controller:', text: 'Unicorn LLC' },
      { kind: 'text', label: 'Contact:', text: 'support@scaffald.com' },
      {
        kind: 'text',
        text: 'By using the Service, you agree to the collection and use of information as described in this policy. If you do not agree, please do not use the Service.',
      },
    ],
  },
  {
    heading: '2. What we collect',
    blocks: [
      { kind: 'text', text: 'We collect the following categories of personal data:' },
      {
        kind: 'table',
        head: ['Data', 'Why we collect it'],
        rows: [
          ['Name', 'Account creation and display on your profile'],
          ['Email address', 'Authentication, account management, transactional email'],
          ['Phone number', 'Optional — account recovery, two-factor authentication'],
          ['Precise location', 'Show nearby jobs and workers on the map (foreground only)'],
          ['Coarse location', 'Same as above'],
          ['Photos / video', 'Profile photo and optional project photos'],
          ['Messages', 'In-app direct messaging between workers and employers'],
          ['User ID', 'Internal account identifier'],
          ['Device ID', 'Crash diagnostics and analytics (not linked to your identity)'],
          [
            'Usage data — product interaction',
            'Feature analytics to improve the app (not linked to your identity)',
          ],
          ['Crash data', 'Sentry crash reporting'],
          ['Performance data', 'App stability monitoring'],
        ],
      },
    ],
  },
  {
    heading: '3. What we do NOT collect',
    blocks: [
      { kind: 'text', text: 'We do not collect:' },
      {
        kind: 'bullets',
        items: [
          { text: 'Physical or mailing address' },
          { text: 'Search history or browsing history' },
          { text: 'Purchase history' },
          {
            text: 'Financial information (payments processed by Stripe — we do not store card data)',
          },
          { text: 'Health or fitness data' },
        ],
      },
    ],
  },
  {
    heading: '4. How we use your data',
    blocks: [
      { kind: 'text', text: 'We use the information we collect to:' },
      {
        kind: 'bullets',
        items: [
          { text: 'Provide and operate the Scaffald Service (matching workers and employers)' },
          {
            text: 'Send transactional notifications (application updates, messages, account alerts)',
          },
          { text: 'Improve the app via anonymized analytics' },
          { text: 'Respond to support requests' },
          { text: 'Prevent fraud and enforce our Terms of Service' },
        ],
      },
      {
        kind: 'text',
        label: 'We do not sell your data.',
        text: 'We do not use your data for cross-app tracking or advertising.',
      },
    ],
  },
  {
    heading: '5. How we share your data',
    blocks: [
      {
        kind: 'bullets',
        items: [
          {
            label: 'With employers:',
            text: 'Your name, headline, trade, location (city/state), and certifications are visible to employers when you apply or when your profile is public. Your contact details (email, phone) are never shared without your explicit action.',
          },
          {
            label: 'With workers:',
            text: "Employers' company name, location, and job listings are visible to workers searching the platform.",
          },
          {
            label: 'Service providers:',
            text: 'Supabase (database and authentication), Sentry (crash reporting), Expo/EAS (build delivery), Apple Push Notification Service (push notifications), NationSearch (background check services — only when you or your employer initiates a background check), Stripe (payment processing), Resend (transactional email). All service providers are bound by data processing agreements and may not use your data for their own purposes.',
          },
          {
            label: 'Legal:',
            text: 'We may disclose your information if required by law, regulation, or legal process, or to protect the safety and rights of Scaffald or its users.',
          },
        ],
      },
    ],
  },
  {
    heading: '6. Location data',
    blocks: [
      {
        kind: 'text',
        text: 'Location is accessed only while the app is in the foreground to show nearby jobs and workers on a map. We do not track your location in the background. Location data is not sold or shared with third parties for advertising purposes.',
      },
    ],
  },
  {
    heading: '7. Data retention',
    blocks: [
      {
        kind: 'text',
        text: 'We retain your personal data for as long as your account is active. If you delete your account, we will delete or anonymize your personal data within 30 days, except where retention is required by law or necessary to resolve disputes.',
      },
    ],
  },
  {
    heading: '8. Children',
    blocks: [
      {
        kind: 'text',
        text: 'Scaffald is not directed at children under the age of 13. We do not knowingly collect personal data from children. If we become aware that a child under 13 has provided us with personal information, we will delete that information promptly. Contact us at support@scaffald.com if you believe we have inadvertently collected data from a child.',
      },
    ],
  },
  {
    heading: '9. Your rights and data deletion',
    blocks: [
      {
        kind: 'text',
        text: 'You have the right to access, correct, or delete your personal data at any time.',
      },
      { kind: 'text', label: 'To delete your account and all associated data:' },
      {
        kind: 'bullets',
        items: [
          { label: 'In the app:', text: 'Settings → Account → Delete Account' },
          {
            label: 'By email:',
            text: 'support@scaffald.com — include "Delete my account" in the subject line',
          },
        ],
      },
      {
        kind: 'text',
        text: 'California residents have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what data we collect, the right to delete it, and the right to opt out of sale (we do not sell data). Contact support@scaffald.com to exercise any of these rights.',
      },
    ],
  },
  {
    heading: '10. Security',
    blocks: [
      {
        kind: 'text',
        text: 'We implement industry-standard security measures including encryption in transit (TLS) and at rest, access controls, and regular security reviews. No system is 100% secure — please contact us immediately at support@scaffald.com if you believe your account has been compromised.',
      },
    ],
  },
  {
    heading: '11. Changes to this policy',
    blocks: [
      {
        kind: 'text',
        text: 'We may update this Privacy Policy from time to time. When we make material changes, we will update the effective date above and notify users in-app. Continued use of the Service after changes take effect constitutes acceptance of the revised policy.',
      },
    ],
  },
  {
    heading: '12. Contact',
    blocks: [
      { kind: 'text', text: 'Unicorn LLC' },
      { kind: 'text', text: 'support@scaffald.com' },
      {
        kind: 'text',
        text: 'Visit our support page for help with your account.',
        links: [{ phrase: 'support page', href: '/support' }],
      },
    ],
  },
]

export function PrivacyScreen() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate={EFFECTIVE_DATE}>
      <LegalSections sections={SECTIONS} />
    </LegalLayout>
  )
}
