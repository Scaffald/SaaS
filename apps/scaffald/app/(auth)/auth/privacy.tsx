import { LegalDocumentLayout } from './components/LegalDocumentLayout'
import { formatEffectiveDate } from '@scf/core/utils/legal/fetchLegalDocuments'
import { useLegalDocumentInfo } from '@scf/core/utils/legal/useLegalDocumentInfo'
import { Paragraph, Stack, useThemeContext } from '@scaffald/ui'
import { colors, spacing } from '@scaffald/ui/tokens'

export default function PrivacyScreen() {
  const { theme } = useThemeContext()
  const docInfo = useLegalDocumentInfo('privacy_policy')

  const paragraphStyle = { color: colors.text[theme].secondary }

  const sections = [
    {
      id: 'information-we-collect',
      heading: '1. Information We Collect',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            We collect information that you provide directly to us, that we obtain automatically
            when you use our services, and that we receive from third parties. “Personal data” means
            information that identifies, relates to, or could reasonably be linked with you or your
            household.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            Information you provide: name, email address, phone number, professional credentials,
            work history, profile information, and any other data you submit through the Scaffald
            platform. Information from use of the service: job postings, applications, connections,
            messages, search and usage data, and device and log information (e.g., IP address,
            browser type, operating system, access times). We may also receive information from
            third-party sign-in providers (e.g., Google, Apple) if you choose to link your account,
            and from publicly available sources to verify professional credentials.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'how-we-use',
      heading: '2. How We Use Your Information',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            We use the information we collect to: provide, operate, maintain, and improve the
            Service; create and manage your account; facilitate connections and communications
            between users; personalize your experience; send you service-related and administrative
            communications; detect, prevent, and address fraud, security, or technical issues;
            comply with legal obligations and enforce our terms; and conduct analytics and research
            to improve our products and services.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            We do not sell your personal data to third parties for their marketing purposes. We may
            use de-identified or aggregated data for product improvement, analytics, and other
            lawful purposes. Our processing is based on your consent, performance of a contract,
            legal obligation, or our legitimate interests where appropriate and not overridden by
            your rights.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'cookies-tracking',
      heading: '3. Cookies and Tracking',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            We and our service providers use cookies, web beacons, and similar technologies to
            operate the Service and to collect usage and performance data. Strictly necessary
            cookies are required for authentication, security, and core functionality and cannot
            be disabled. With your consent, we may use analytics cookies to understand how the
            Service is used, functional cookies to remember your preferences, and marketing
            cookies to deliver relevant content and measure campaign effectiveness.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            You can manage your cookie preferences through the cookie settings available in the
            Service. Disabling certain cookies may limit some features. We may also use
            third-party analytics and advertising partners who may collect information through
            their own cookies and similar technologies, subject to their privacy policies.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'data-sharing',
      heading: '4. Data Sharing',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            Your public profile and other information you choose to make visible may be seen by
            other users of the Service as part of the professional networking experience. We share
            personal data with service providers that perform services on our behalf (e.g.,
            hosting, analytics, email delivery, customer support) under contractual obligations to
            protect your data and use it only for the purposes we specify.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            We may disclose personal data if required by law, court order, or governmental request;
            to protect the rights, property, or safety of Scaffald, our users, or others; in
            connection with a merger, acquisition, or sale of assets; or with your consent. We do
            not sell personal data as defined under applicable state privacy laws.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'retention',
      heading: '5. Data Retention',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            We retain your personal data for as long as your account is active or as needed to
            provide you the Service, comply with legal obligations, resolve disputes, and enforce
            our agreements. When retention is no longer necessary, we securely delete or
            anonymize your data.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            You may request deletion of your account and associated personal data at any time by
            contacting privacy@scaffald.com or through account settings where available. We will
            process such requests in accordance with applicable law; some data may be retained
            where required for legal, security, or operational purposes.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'your-rights',
      heading: '6. Your Rights',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            Depending on your location, you may have rights to: access and receive a copy of your
            personal data; correct or update inaccurate data; request deletion of your data;
            restrict or object to certain processing; data portability; withdraw consent where
            processing is consent-based; and lodge a complaint with a supervisory authority.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            California residents have additional rights under the California Consumer Privacy Act
            (CCPA), including the right to know, delete, correct, and opt out of the “sale” or
            “sharing” of personal data, and the right to limit use of sensitive personal information.
            We do not sell or share personal data as defined under the CCPA. To exercise your
            rights, contact privacy@scaffald.com or use the mechanisms provided in the Service. We
            will verify your identity before processing requests.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'security',
      heading: '7. Security',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            We implement administrative, technical, and physical safeguards designed to protect
            your personal data, including encryption in transit and at rest, access controls,
            and regular security assessments. Despite these measures, no method of transmission or
            storage is completely secure, and we cannot guarantee absolute security.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            You are responsible for maintaining the confidentiality of your account credentials.
            You should use a strong, unique password and notify us immediately of any unauthorized
            access to your account.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'contact',
      heading: '8. Contact',
      content: (
        <Paragraph style={paragraphStyle}>
          For privacy-related questions, requests, or complaints, contact our Privacy Team at
          privacy@scaffald.com or write to Scaffald Inc., Privacy Department, San Francisco, CA. We
          will respond to verified requests within the timeframes required by applicable law.
        </Paragraph>
      ),
    },
  ]

  return (
    <LegalDocumentLayout
      title="Privacy Policy"
      subtitle={`Last updated: ${formatEffectiveDate(docInfo.effective_at)} · Version ${docInfo.version}`}
      sections={sections}
    />
  )
}
