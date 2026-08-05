import { LegalDocumentLayout } from './components/LegalDocumentLayout'
import { useLegalDocumentInfo } from '@scf/core/utils/legal/useLegalDocumentInfo'
import { Paragraph, Stack, useThemeContext } from '@scaffald/ui'
import { colors, spacing } from '@scaffald/ui/tokens'

export default function TermsScreen() {
  const { theme } = useThemeContext()
  const docInfo = useLegalDocumentInfo('terms_of_service')

  const paragraphStyle = { color: colors.text[theme].secondary }

  const sections = [
    {
      id: 'acceptance',
      heading: '1. Acceptance of Terms',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            These Terms of Service (“Terms”) constitute a legally binding agreement between you
            (“User,” “you,” or “your”) and Scaffald Inc. (“Scaffald,” “we,” “us,” or “our”) governing
            your access to and use of the Scaffald platform, including any website, application, or
            service made available by Scaffald (collectively, the “Service”). By accessing or using
            the Service, you acknowledge that you have read, understood, and agree to be bound by
            these Terms and our Privacy Policy, which is incorporated herein by reference.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            If you do not agree to these Terms in their entirety, you may not access or use the
            Service. Your continued use of the Service after the effective date of any modifications
            constitutes your acceptance of the modified Terms. If you are using the Service on behalf
            of an organization, you represent and warrant that you have the authority to bind that
            organization to these Terms.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'description',
      heading: '2. Description of Service',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            Scaffald provides a professional platform designed for the construction industry,
            enabling contractors, tradespeople, project owners, and other industry participants to
            connect, collaborate, and manage construction-related activities. The Service may
            include, without limitation: workforce management tools, job posting and discovery,
            profile and credential management, professional networking, messaging, and other
            features as we may offer from time to time.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            We reserve the right to modify, suspend, or discontinue any part of the Service, with or
            without notice. We do not guarantee that the Service will be available at all times or
            that it will be error-free. You use the Service at your own risk.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'accounts',
      heading: '3. User Accounts',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            To access certain features of the Service, you must register for an account. You agree
            to provide accurate, current, and complete information during registration and to update
            such information as necessary to maintain its accuracy. You are solely responsible for
            maintaining the confidentiality of your account credentials and for all activities that
            occur under your account. You must notify us immediately of any unauthorized use of your
            account.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            You must be at least 18 years of age (or the age of majority in your jurisdiction) to
            use the Service. By using the Service, you represent and warrant that you meet this
            requirement. We reserve the right to suspend or terminate your account at any time for
            any reason, including breach of these Terms.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'acceptable-use',
      heading: '4. Acceptable Use',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            You agree to use the Service only for lawful purposes and in accordance with these
            Terms. You shall not: (a) post or transmit false, misleading, defamatory, or fraudulent
            information; (b) harass, abuse, or harm another user or person; (c) violate any applicable
            law, regulation, or third-party right; (d) attempt to gain unauthorized access to the
            Service, other accounts, or any network or system; (e) use the Service to distribute
            malware or engage in scraping or automated access without our consent; or (f) use the
            Service in any manner that could disable, overburden, or impair the Service or interfere
            with any other party’s use of the Service.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            We reserve the right to investigate suspected violations of this section and to remove
            content or suspend or terminate accounts in our sole discretion. We may report illegal
            activity to law enforcement and cooperate with authorities.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'data-privacy',
      heading: '5. Data and Privacy',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            Your use of the Service is also governed by our Privacy Policy, which describes how we
            collect, use, disclose, and safeguard your information. By using the Service, you
            consent to the practices described in the Privacy Policy. If you are located outside the
            United States, you consent to the transfer and processing of your data in the United
            States and other countries where we operate.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            You are responsible for any content or data you submit through the Service. You grant
            us a non-exclusive, royalty-free, worldwide license to use, store, display, and
            process such content as necessary to provide and improve the Service and as set forth
            in the Privacy Policy.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'intellectual-property',
      heading: '6. Intellectual Property',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            The Service, including all content, features, functionality, software, design, text,
            graphics, logos, and other materials (“Scaffald Materials”), is owned by Scaffald Inc. or
            its licensors and is protected by United States and international copyright, trademark,
            and other intellectual property laws. No right, title, or interest in or to the Service
            or Scaffald Materials is transferred to you.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            You may not reproduce, distribute, modify, create derivative works of, publicly display,
            or exploit any Scaffald Materials without our prior written consent. You may not remove
            or alter any proprietary notices. Any unauthorized use may violate law and result in
            liability.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'limitation-of-liability',
      heading: '7. Limitation of Liability',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED “AS IS” AND
            “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY,
            INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE
            WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            IN NO EVENT SHALL SCAFFALD INC., ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, OR
            AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
            DAMAGES (INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL) ARISING OUT OF OR IN CONNECTION
            WITH YOUR USE OF THE SERVICE OR THESE TERMS, WHETHER BASED ON WARRANTY, CONTRACT, TORT,
            OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH
            DAMAGES. OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATED TO THE SERVICE OR
            THESE TERMS SHALL NOT EXCEED THE GREATER OF ONE HUNDRED U.S. DOLLARS ($100) OR THE
            AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'changes',
      heading: '8. Changes to Terms',
      content: (
        <Stack gap={spacing[12]}>
          <Paragraph style={paragraphStyle}>
            We may modify these Terms at any time. We will provide notice of material changes by
            posting the updated Terms on the Service and updating the “Last updated” date, or by
            sending you an email or in-Service notification where required by law. Your continued
            use of the Service after the effective date of the changes constitutes your acceptance of
            the revised Terms.
          </Paragraph>
          <Paragraph style={paragraphStyle}>
            If you do not agree to the modified Terms, you must stop using the Service. We
            encourage you to review these Terms periodically.
          </Paragraph>
        </Stack>
      ),
    },
    {
      id: 'contact',
      heading: '9. Contact',
      content: (
        <Paragraph style={paragraphStyle}>
          For questions about these Terms of Service, please contact us at legal@scaffald.com or
          write to Scaffald Inc., Legal Department, San Francisco, CA. For general support, use the
          contact options provided within the Service.
        </Paragraph>
      ),
    },
  ]

  return (
    <LegalDocumentLayout
      title="Terms of Service"
      subtitle={`Last updated: ${new Date(docInfo.effective_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })} · Version ${docInfo.version}`}
      sections={sections}
    />
  )
}
