import { Paragraph, Text, YStack } from '@my/ui'
import type { ReactNode } from 'react'

import { LegalBulletList } from './legal-bullet-list'
import { LegalSection } from './legal-section'

const LegalSubheading = ({ children }: { children: ReactNode }) => {
  return (
    <Text fontWeight="700" size="$5">
      {children}
    </Text>
  )
}

export const PrivacyPolicyContent = () => {
  return (
    <YStack gap="$6">
      <LegalSection title="1. Introduction">
        <Paragraph>
          Welcome to Scaffald. We are committed to protecting your privacy and ensuring that your
          personal information is handled with care. This Privacy Policy explains what we collect, how
          we use it, and the choices you have when you interact with SCF Neue.
        </Paragraph>
        <Paragraph>
          By accessing or using our platform, you agree to this policy. If you do not agree, you should
          discontinue use of the service. We may update this policy as our product evolves and will let
          you know when important changes take place.
        </Paragraph>
      </LegalSection>

      <LegalSection
        title="2. Information We Collect"
        description="We collect information that helps us deliver the product, maintain security, and improve your experience."
      >
        <YStack gap="$4">
          <YStack gap="$2">
            <LegalSubheading>Personal Information</LegalSubheading>
            <LegalBulletList
              items={[
                'Account details such as your name, email address, encrypted password, and profile image.',
                'Profile information supplied by workers (experience, certifications, education, location, availability) or organizations (company name, industry, size, and similar business information).',
                'Identity verification details when we need to confirm who you are.',
                'Billing information used to process payments. We partner with Stripe to handle sensitive payment data securely.',
                'Messages and other communications you send through the platform.',
              ]}
            />
          </YStack>

          <YStack gap="$2">
            <LegalSubheading>Usage Data</LegalSubheading>
            <LegalBulletList
              items={[
                'Technical details such as device type, browser, operating system, and IP address.',
                'Log and analytics data describing how you navigate the platform, the features you use, and time spent in the product.',
                'Approximate location information derived from your device settings or IP address.',
                'Information stored in cookies or similar technologies that help us remember preferences and understand product performance.',
              ]}
            />
          </YStack>

          <YStack gap="$2">
            <LegalSubheading>Content You Provide</LegalSubheading>
            <LegalBulletList
              items={[
                'Media such as photos, documents, and other files uploaded to your profile or shared with teammates.',
                'User-generated content including reviews, ratings, notes, and other collaboration data captured inside SCF Neue.',
              ]}
            />
          </YStack>
        </YStack>
      </LegalSection>

      <LegalSection title="3. How We Use Your Information">
        <YStack gap="$4">
          <YStack gap="$2">
            <LegalSubheading>Provide and Improve the Platform</LegalSubheading>
            <LegalBulletList
              items={[
                'Match organizations with verified workers and help teams coordinate active projects.',
                'Manage hiring requests, invitations, and project workflows.',
                'Authenticate users, maintain account security, and detect suspicious activity.',
                'Enhance the product experience by studying how features are used and where we can improve.',
                'Develop new capabilities that make staffing and collaboration more effective.',
              ]}
            />
          </YStack>

          <YStack gap="$2">
            <LegalSubheading>Communications</LegalSubheading>
            <LegalBulletList
              items={[
                'Send confirmations, updates, and reminders related to your account or projects.',
                'Provide customer support and respond to inbound requests.',
                'Share product announcements or marketing communications when you opt in.',
              ]}
            />
          </YStack>

          <YStack gap="$2">
            <LegalSubheading>Analytics and Research</LegalSubheading>
            <LegalBulletList
              items={[
                'Analyze product usage to understand what is working and where to iterate.',
                'Generate aggregated insights that help the construction industry learn from workforce trends.',
              ]}
            />
          </YStack>

          <YStack gap="$2">
            <LegalSubheading>Safety and Compliance</LegalSubheading>
            <LegalBulletList
              items={[
                'Verify identities, prevent fraud, and enforce our Terms of Service.',
                'Monitor for misuse, abuse, or illegal activity across the platform.',
                'Review uploaded media for safety or policy violations.',
              ]}
            />
          </YStack>
        </YStack>
      </LegalSection>

      <LegalSection title="4. How We Share Information">
        <YStack gap="$4">
          <YStack gap="$2">
            <LegalSubheading>With Other Users</LegalSubheading>
            <LegalBulletList
              items={[
                'Worker profiles are visible to organizations that have appropriate access.',
                'Organization profiles help workers learn more about potential employers and teammates.',
                'Messages and collaboration content are shared with the people you communicate with on the platform.',
              ]}
            />
          </YStack>

          <YStack gap="$2">
            <LegalSubheading>With Service Providers</LegalSubheading>
            <Paragraph>
              We rely on trusted partners to process payments, send communications, analyze product usage, and host the
              infrastructure that powers SCF Neue. These providers may access your information only to perform services on
              our behalf and must handle the data according to this policy.
            </Paragraph>
          </YStack>

          <YStack gap="$2">
            <LegalSubheading>For Legal Reasons</LegalSubheading>
            <Paragraph>
              We may disclose information if required by law or a valid legal request, to enforce our agreements, or to
              protect the rights, property, or safety of our users and the public.
            </Paragraph>
          </YStack>

          <YStack gap="$2">
            <LegalSubheading>Business Transfers</LegalSubheading>
            <Paragraph>
              If all or part of our company is involved in a merger, acquisition, or asset sale, your information may be
              transferred as part of that transaction. We will notify you of any ownership changes or new uses of your
              personal information.
            </Paragraph>
          </YStack>
        </YStack>
      </LegalSection>

      <LegalSection title="5. Data Storage and Security">
        <Paragraph>
          We implement administrative, technical, and physical safeguards to protect your information. While no system can
          be completely secure, we continually evaluate our controls and work with reputable vendors to keep data safe.
          Your information may be processed in countries where we or our service providers operate. By using SCF Neue, you
          consent to those transfers.
        </Paragraph>
        <Paragraph>
          We retain personal data for as long as your account is active or as needed to deliver the service, comply with
          legal obligations, resolve disputes, and enforce our agreements. You can request deletion of your account at any
          time.
        </Paragraph>
      </LegalSection>

      <LegalSection title="6. Your Rights and Choices">
        <Paragraph>
          Depending on where you live, you may have rights to access, correct, delete, or restrict how we use your personal
          information. You can also request a copy of your data or object to certain processing.
        </Paragraph>
        <Paragraph>
          To exercise these rights, contact us using the information in the final section. We will respond in accordance with
          applicable laws and may need to verify your identity before fulfilling a request.
        </Paragraph>
      </LegalSection>

      <LegalSection title="7. Cookies and Similar Technologies">
        <Paragraph>
          Cookies are small files stored on your device that help us operate and improve the platform. We use strictly
          necessary cookies for core functionality, functional cookies to remember preferences, analytics cookies to keep
          improving the experience, and marketing cookies when we need to measure campaigns.
        </Paragraph>
        <Paragraph>
          You can manage cookie preferences through your browser settings and, where available, our consent tools.
        </Paragraph>
      </LegalSection>

      <LegalSection title="8. Contact Us">
        <Paragraph>
          Questions or concerns about this Privacy Policy? Reach out at <Text fontWeight="600">support@scaffald.com</Text>
          and our team will be happy to help.
        </Paragraph>
      </LegalSection>
    </YStack>
  )
}
