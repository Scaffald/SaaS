/**
 * Support / FAQ — the public page, under the site header.
 *
 * Signed-in users get the same content inside the app shell instead
 * (AppSupportScreen, /dashboard/support, #1213); the copy lives in
 * content/support.ts so the two read from one place.
 */

import { Row, Stack, Text } from '@scaffald/ui'
import { fontSize } from '@scaffald/ui/tokens'
import { type Href, Link } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { LegalLayout, openEmail, renderTextWithEmails } from '../components/LegalLayout'
import { MarketingHeading } from '../components/MarketingHeading'
import { brand } from '../theme'
import { ROUTES } from '@scf/core/constants/routes'
import { SUPPORT_EMAIL, SUPPORT_FAQS } from '../content/support'
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
          borderRadius: 7,
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
        borderRadius: 7,
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
          {SUPPORT_FAQS.map((item) => (
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
          <Link href={ROUTES.LEGAL.PRIVACY.path as Href} asChild>
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
