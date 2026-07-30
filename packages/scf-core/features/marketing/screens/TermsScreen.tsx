/**
 * Terms of Service.
 *
 * Copy ported verbatim from the retired Next.js site (apps/web/app/terms).
 * Do not paraphrase, reorder, or "improve" the wording — it is the published
 * legal text. Structural changes only.
 */

import { LegalLayout, LegalSections, type LegalSection } from '../components/LegalLayout'

const EFFECTIVE_DATE = 'May 1, 2025'

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Agreement to terms',
    blocks: [
      {
        kind: 'text',
        text: 'These Terms of Service ("Terms") govern your access to and use of the Scaffald platform — including the mobile application and website (collectively, the "Service") — operated by Unicorn LLC ("Scaffald", "we", "our", or "us"). By creating an account or otherwise using the Service, you agree to these Terms. If you do not agree, do not use the Service.',
      },
      {
        kind: 'text',
        text: 'Scaffald is incorporated in the State of Delaware. These Terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.',
      },
    ],
  },
  {
    heading: '2. Account types',
    blocks: [
      { kind: 'text', text: 'Scaffald offers two primary account types:' },
      {
        kind: 'bullets',
        items: [
          {
            label: 'Worker Accounts',
            text: '— for individuals seeking employment or project-based work in the skilled trades. Workers create profiles showcasing their skills, certifications, and work history.',
          },
          {
            label: 'Organization Accounts',
            text: '— for companies, general contractors, subcontractors, and other employers seeking to find, hire, and manage skilled-trade workers.',
          },
        ],
      },
      {
        kind: 'text',
        text: 'You must be at least 18 years old to create an account. By registering, you represent that all information you provide is accurate, current, and complete.',
      },
    ],
  },
  {
    heading: '3. Acceptable use',
    blocks: [
      { kind: 'text', text: 'You agree not to:' },
      {
        kind: 'bullets',
        items: [
          {
            text: 'Post false, misleading, or fraudulent information on your profile or job listings',
          },
          { text: 'Harass, threaten, or discriminate against other users' },
          {
            text: 'Use the Service to solicit users outside of Scaffald in violation of these Terms',
          },
          { text: 'Scrape, crawl, or harvest data from the Service without written permission' },
          {
            text: 'Reverse-engineer, decompile, or attempt to extract source code from the Service',
          },
          { text: 'Use automated tools to create accounts or send messages' },
          { text: 'Violate any applicable local, state, federal, or international law' },
        ],
      },
      {
        kind: 'text',
        text: 'We reserve the right to suspend or terminate accounts that violate these Terms or that we determine, in our sole discretion, are harmful to the Service or its users.',
      },
    ],
  },
  {
    heading: '4. Worker profiles and the Scaffald score',
    blocks: [
      {
        kind: 'text',
        text: 'Workers own their profile content. By submitting content to Scaffald (text, photos, certifications, etc.) you grant Scaffald a non-exclusive, worldwide, royalty-free license to display and distribute that content as part of providing the Service.',
      },
      {
        kind: 'text',
        text: "The Scaffald Score is an algorithmically calculated metric that reflects a worker's profile completeness, verified credentials, platform activity, and peer feedback. Scaffald does not guarantee any specific employment outcome based on a worker's score. Scores may change over time as your activity and profile evolve.",
      },
    ],
  },
  {
    heading: '5. Profile claiming (Organizations)',
    blocks: [
      {
        kind: 'text',
        text: 'Organization Accounts may "claim" profiles of their current employees, subject to the following conditions:',
      },
      {
        kind: 'bullets',
        items: [
          { text: 'Claimed workers are removed from public search results while claimed' },
          {
            text: 'Claimed workers may not be directly solicited by other employers on the platform',
          },
          {
            text: 'Workers own their own data and may reject a claim at any time, at which point they become visible on the platform again',
          },
          {
            text: 'Claiming is a premium feature billed per active claimed employee. See current pricing in the app.',
          },
        ],
      },
    ],
  },
  {
    heading: '6. Payments and subscriptions',
    blocks: [
      {
        kind: 'text',
        text: 'Certain features of the Service require payment. All payments are processed securely by Stripe. Scaffald does not store payment card details.',
      },
      {
        kind: 'text',
        text: 'Subscriptions automatically renew at the end of each billing period unless cancelled. You may cancel at any time through the app or by contacting support@scaffald.com. Cancellation takes effect at the end of the current billing period — we do not provide prorated refunds for partial periods.',
      },
      {
        kind: 'text',
        text: "We reserve the right to change pricing with 30 days' notice. Continued use after a pricing change takes effect constitutes acceptance of the new pricing.",
      },
    ],
  },
  {
    heading: '7. Background checks',
    blocks: [
      {
        kind: 'text',
        text: "Scaffald partners with NationSearch to provide optional background check services. Background checks are initiated only with the consent of the worker being checked and are subject to NationSearch's own terms and applicable federal and state background check laws, including the Fair Credit Reporting Act (FCRA). Scaffald is not a consumer reporting agency under the FCRA.",
      },
    ],
  },
  {
    heading: '8. Third-party content and services',
    blocks: [
      {
        kind: 'text',
        text: 'The Service may contain links to third-party websites or services. Scaffald is not responsible for the content, privacy practices, or availability of any third-party sites. Your use of third-party services is governed by their respective terms.',
      },
    ],
  },
  {
    heading: '9. Intellectual property',
    blocks: [
      {
        kind: 'text',
        text: 'The Scaffald name, logo, product design, and all proprietary technology are the exclusive property of Unicorn LLC. Nothing in these Terms grants you any right to use our trademarks, trade names, or service marks without prior written permission.',
      },
    ],
  },
  {
    heading: '10. Disclaimers',
    blocks: [
      {
        kind: 'text',
        text: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND. SCAFFALD DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS. SCAFFALD MAKES NO GUARANTEES REGARDING EMPLOYMENT OUTCOMES, WORKER QUALITY, OR THE ACCURACY OF ANY PROFILE INFORMATION SUBMITTED BY USERS.',
      },
    ],
  },
  {
    heading: '11. Limitation of liability',
    blocks: [
      {
        kind: 'text',
        text: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, SCAFFALD AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID TO SCAFFALD IN THE 12 MONTHS PRIOR TO THE CLAIM OR (B) $100.',
      },
    ],
  },
  {
    heading: '12. Dispute resolution',
    blocks: [
      {
        kind: 'text',
        text: 'Any dispute arising from these Terms or your use of the Service shall be resolved by binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules, with proceedings conducted in Delaware. You waive any right to a jury trial or to participate in a class-action lawsuit.',
      },
      {
        kind: 'text',
        text: 'Notwithstanding the above, either party may seek emergency injunctive relief in a court of competent jurisdiction to prevent irreparable harm pending arbitration.',
      },
    ],
  },
  {
    heading: '13. Changes to these Terms',
    blocks: [
      {
        kind: 'text',
        text: 'We may update these Terms from time to time. Material changes will be communicated via in-app notification or email at least 14 days before taking effect. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.',
      },
    ],
  },
  {
    heading: '14. Termination',
    blocks: [
      {
        kind: 'text',
        text: 'You may delete your account at any time through the app (Settings → Account → Delete Account) or by contacting support@scaffald.com. We may terminate or suspend your access immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to the Service, other users, or third parties.',
      },
    ],
  },
  {
    heading: '15. Contact',
    blocks: [
      { kind: 'text', text: 'Unicorn LLC' },
      { kind: 'text', text: 'support@scaffald.com' },
      {
        kind: 'text',
        text: 'Visit our support page for help with your account.',
        links: [{ phrase: 'support page', href: '/support' }],
      },
      {
        kind: 'text',
        text: 'View our Privacy Policy for information on data handling.',
        links: [{ phrase: 'Privacy Policy', href: '/privacy' }],
      },
    ],
  },
]

export function TermsScreen() {
  return (
    <LegalLayout title="Terms of Service" effectiveDate={EFFECTIVE_DATE}>
      <LegalSections sections={SECTIONS} />
    </LegalLayout>
  )
}
