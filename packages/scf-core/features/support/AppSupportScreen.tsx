/**
 * Support inside the app shell (#1213).
 *
 * A signed-in user who opened /support used to leave the app for the
 * marketing page: dark-teal site header, no drawer, a bold sans title, a
 * rounded teal contact panel and boxed accordions — none of it in the
 * redesign's language. This is the same help drawn the way the rest of the
 * app is: the shared ScreenHeader (via DashboardPage), a hairline contact
 * card, and ruled FAQ rows, all on theme tokens so it holds in dark mode.
 *
 * The copy is the public page's (content/support.ts).
 */

import { ROUTES } from '@scf/core/constants/routes'
import { Button, H4, Text, useThemeContext } from '@scaffald/ui'
import { colors, fontScale, radius } from '@scaffald/ui/tokens'
import { type Href, Link } from 'expo-router'
import { ChevronDown, ChevronUp } from 'lucide-react-native'
import { useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import {
  SUPPORT_EMAIL,
  SUPPORT_FAQS,
  type SupportFaq,
  splitOnEmails,
} from '../marketing/content/support'

const openEmail = (address: string) => {
  void Linking.openURL(`mailto:${address}`)
}

/** Copy with any email address in it rendered as a mail link. */
function WithEmailLinks({
  text,
  color,
  linkColor,
}: {
  text: string
  color: string
  linkColor: string
}) {
  return (
    <Text style={{ color, fontSize: fontScale.step3, lineHeight: 22 }}>
      {splitOnEmails(text).map((part, i) =>
        part.email ? (
          <Text
            key={`${i}-${part.text}`}
            style={{ color: linkColor, textDecorationLine: 'underline' }}
            onPress={() => openEmail(part.text)}
            accessibilityRole="link"
          >
            {part.text}
          </Text>
        ) : (
          part.text
        )
      )}
    </Text>
  )
}

function ContactCard() {
  const { theme } = useThemeContext()
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border[theme].default,
        borderRadius: radius.md,
        backgroundColor: colors.bg[theme].default,
        padding: 20,
        gap: 12,
      }}
      testID="support-contact-card"
    >
      <H4 weight="regular" style={{ color: colors.text[theme].primary }}>
        Contact us
      </H4>
      <Text
        style={{ color: colors.text[theme].secondary, fontSize: fontScale.step3, lineHeight: 22 }}
      >
        Write to us about your account, your profile or a job listing. We answer every message
        within 1 business day.
      </Text>
      <Button
        variant="outline"
        onPress={() => openEmail(SUPPORT_EMAIL)}
        accessibilityLabel={`Email ${SUPPORT_EMAIL}`}
        style={{ alignSelf: 'flex-start' }}
      >
        {SUPPORT_EMAIL}
      </Button>
    </View>
  )
}

function FaqRow({ item }: { item: SupportFaq }) {
  const { theme } = useThemeContext()
  const [open, setOpen] = useState(false)
  const Chevron = open ? ChevronUp : ChevronDown
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border[theme].default }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          paddingVertical: 14,
        }}
      >
        <Text
          style={{
            flex: 1,
            color: colors.text[theme].primary,
            fontSize: fontScale.step3,
            lineHeight: 22,
            fontWeight: '500',
          }}
        >
          {item.q}
        </Text>
        <Chevron size={16} color={colors.icon[theme].muted} />
      </Pressable>
      {open ? (
        <View style={{ paddingBottom: 16, paddingRight: 32 }}>
          <WithEmailLinks
            text={item.a}
            color={colors.text[theme].secondary}
            linkColor={colors.text[theme].emphasis}
          />
        </View>
      ) : null}
    </View>
  )
}

export function AppSupportScreen() {
  const { theme } = useThemeContext()
  const muted = colors.text[theme].tertiary
  const link = colors.text[theme].emphasis

  return (
    <View style={{ gap: 32 }}>
      <ContactCard />

      <View>
        <Text
          style={{
            fontSize: fontScale.step1,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: muted,
            marginBottom: 8,
          }}
        >
          Frequently asked questions
        </Text>
        {/* Ruled rows: a heavier rule opens the list, hairlines between rows. */}
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border[theme].emphasis }}>
          {SUPPORT_FAQS.map((item) => (
            <FaqRow key={item.q} item={item} />
          ))}
        </View>
      </View>

      <Text style={{ color: muted, fontSize: fontScale.step2, lineHeight: 20 }}>
        For how we handle your data, see our{' '}
        <Link href={ROUTES.LEGAL.PRIVACY.path as Href} style={{ color: link }}>
          Privacy Policy
        </Link>
        . To request account deletion, email{' '}
        <Text
          style={{ color: link }}
          onPress={() => openEmail(SUPPORT_EMAIL)}
          accessibilityRole="link"
        >
          {SUPPORT_EMAIL}
        </Text>{' '}
        with the subject "Delete my account".
      </Text>
    </View>
  )
}
