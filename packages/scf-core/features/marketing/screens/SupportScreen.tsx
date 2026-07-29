/**
 * Support / FAQ.
 *
 * Copy ported verbatim from the retired Next.js site (apps/web/app/support).
 * The FAQ answers are user-facing support copy — keep the wording as-is.
 */

import { Row, Stack, Text } from '@scaffald/ui'
import { fontSize } from '@scaffald/ui/tokens'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { LegalLayout, openEmail, renderTextWithEmails } from '../components/LegalLayout'
import { MarketingHeading } from '../components/MarketingHeading'
import { brand } from '../theme'

const SUPPORT_EMAIL = 'support@scaffald.com'

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'How do I reset my password?',
    a: 'On the sign-in screen, tap "Forgot password?" and enter your email address. You will receive a reset link within a few minutes. Check your spam folder if it does not arrive. You can also email support@scaffald.com and we will assist you.',
  },
  {
    q: 'How do I delete my account?',
    a: 'In the app, go to Settings → Account → Delete Account. Your account and all associated data will be permanently deleted within 30 days. Alternatively, email support@scaffald.com with the subject "Delete my account" and we will process your request.',
  },
  {
    q: 'How do I report a job posting or user?',
    a: 'On any job posting or user profile, tap the "⋯" (more) menu and select "Report". Choose the reason from the list and submit. Our team reviews all reports within 1–2 business days. For urgent safety concerns, email support@scaffald.com directly.',
  },
  {
    q: 'How do I update my profile or trade certifications?',
    a: 'Open your profile from the bottom navigation and tap "Edit profile". You can update your trade, certifications, skills, and work history at any time. To add a certification, tap "Add certification" and upload a photo of your credential.',
  },
  {
    q: 'I applied for a job — how do I track its status?',
    a: 'Go to Jobs → My Applications. You will see the current status for each application (Submitted, Viewed, Shortlisted, etc.). You will also receive a push notification when your application status changes.',
  },
  {
    q: 'How does the Scaffald score work?',
    a: 'Your Scaffald score is an algorithmic metric that reflects the completeness of your profile, your verified certifications, your activity on the platform, and feedback from employers and colleagues. A higher score increases your visibility to employers. Keep your profile complete and up to date to maximize your score.',
  },
  {
    q: 'Can employers see my contact information?',
    a: 'Your email address and phone number are never shared with employers without your explicit action (such as initiating contact). Employers can see your name, headline, trade, city/state, and public profile details.',
  },
]

function ContactCard() {
  return (
    <Stack gap={16} padding={24} backgroundColor={brand.deep} borderRadius={16}>
      <Stack gap={8}>
        <Text size="xl" weight="bold" color={brand.surface}>
          Contact us
        </Text>
        <Text size="sm" color={brand.tealSoft} style={{ lineHeight: 22 }}>
          Scaffald is a talent platform connecting skilled trade workers with employers across the
          construction, MEP, and industrial sectors. We respond to all inquiries within{' '}
          <Text size="sm" weight="bold" color={brand.surface}>
            1 business day
          </Text>
          .
        </Text>
      </Stack>
      <Pressable
        onPress={() => openEmail(SUPPORT_EMAIL)}
        accessibilityRole="link"
        accessibilityLabel={`Email ${SUPPORT_EMAIL}`}
        style={{
          alignSelf: 'flex-start',
          backgroundColor: brand.teal,
          borderRadius: 12,
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <Text size="sm" weight="medium" color={brand.surface}>
          {SUPPORT_EMAIL}
        </Text>
      </Pressable>
    </Stack>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <View
      style={{
        backgroundColor: brand.surface,
        borderWidth: 1,
        borderColor: brand.border,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={() => setIsOpen((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        style={{ paddingHorizontal: 24, paddingVertical: 16 }}
      >
        <Row gap={16} align="flex-start" justify="space-between">
          <MarketingHeading
            level={3}
            color={brand.ink}
            style={{ flex: 1, fontSize: fontSize.sm, fontWeight: '500' }}
          >
            {question}
          </MarketingHeading>
          <Text size="lg" weight="medium" color={brand.teal}>
            {isOpen ? '−' : '+'}
          </Text>
        </Row>
      </Pressable>
      {/*
        The answer is always rendered and only collapsed visually. Google's
        FAQPage guidance requires the marked-up answer to exist in the served
        HTML, so mounting it on expand would drop it from the crawled page.
      */}
      <View
        style={{ height: isOpen ? undefined : 0, overflow: 'hidden' }}
        aria-hidden={!isOpen}
        accessibilityElementsHidden={!isOpen}
        importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}
      >
        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          <Text size="sm" color={brand.muted} style={{ lineHeight: 22 }}>
            {renderTextWithEmails(answer, 'sm', `faq-${question}`)}
          </Text>
        </View>
      </View>
    </View>
  )
}

export function SupportScreen() {
  return (
    <LegalLayout title="Support" subtitle="Get help with your Scaffald account">
      <ContactCard />

      <Stack gap={24}>
        <MarketingHeading level={2} color={brand.ink} style={{ fontSize: fontSize['2xl'] }}>
          Frequently asked questions
        </MarketingHeading>
        <Stack gap={12}>
          {FAQS.map((item) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </Stack>
      </Stack>

      <Stack
        padding={24}
        backgroundColor={brand.surfaceAlt}
        borderRadius={16}
        borderWidth={1}
        borderColor={brand.border}
      >
        <Text size="sm" color={brand.muted} style={{ lineHeight: 22 }}>
          For information about how we handle your data, see our{' '}
          <Link href="/privacy" asChild>
            <Text size="sm" color={brand.teal}>
              Privacy Policy
            </Text>
          </Link>
          . To request account deletion, email{' '}
          <Text
            size="sm"
            color={brand.teal}
            onPress={() => openEmail(SUPPORT_EMAIL)}
            accessibilityRole="link"
          >
            {SUPPORT_EMAIL}
          </Text>{' '}
          with the subject "Delete my account".
        </Text>
      </Stack>
    </LegalLayout>
  )
}
