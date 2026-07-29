/**
 * Shared chrome for the ported marketing/legal surfaces.
 *
 * Renders a scrollable page with a centred, narrow reading column — the RN
 * equivalent of the `max-w-3xl mx-auto px-6` wrapper used by the retired
 * Next.js site. Also exports the small data-driven renderer that both legal
 * screens use so the copy can live as plain data instead of hand-written JSX.
 *
 * Everything here is render-pure: no window/document access, no effects, so it
 * is safe under server-side rendering (react-native-web).
 */

import { ScrollView, Stack, Text } from '@scaffald/ui'
import { fontSize } from '@scaffald/ui/tokens'
import { Link } from 'expo-router'
import type { ReactNode } from 'react'
import { Linking, View } from 'react-native'
import { brand, layout } from '../theme'
import { MarketingFooter } from './MarketingFooter'
import { MarketingHeading } from './MarketingHeading'

type BodySize = 'xs' | 'sm' | 'md' | 'lg'

/**
 * Matches an email address anywhere in a string (used with String.split).
 * The trailing group deliberately cannot end on a dot so that sentence
 * punctuation ("… email support@scaffald.com.") stays outside the link.
 */
const EMAIL_SPLIT = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g
/** Same pattern, anchored, for testing a single split fragment. */
const EMAIL_EXACT = /^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/

/** Open a mailto: link. Kept in one place so every surface behaves the same. */
export function openEmail(address: string) {
  void Linking.openURL(`mailto:${address}`)
}

/**
 * Split a string on email addresses and render the addresses as tappable text.
 * Nested <Text> keeps the address inline in the paragraph flow (a Pressable
 * would break the line box on native), while still opening via Linking.
 */
export function renderTextWithEmails(text: string, size: BodySize, keyPrefix: string): ReactNode[] {
  return text.split(EMAIL_SPLIT).map((part, index) => {
    if (EMAIL_EXACT.test(part)) {
      return (
        <Text
          key={`${keyPrefix}-email-${index}`}
          size={size}
          color={brand.teal}
          onPress={() => openEmail(part)}
          accessibilityRole="link"
        >
          {part}
        </Text>
      )
    }
    return part
  })
}

/**
 * A cross-reference in the legal copy that points at another page of the site.
 *
 * These have to render as real anchors: on web `Link` emits `<a href>`, while a
 * Pressable + router.push renders a bare div that crawlers cannot follow.
 */
export type LegalLink = {
  /** Exact phrase inside the line's `text` to turn into a link. */
  phrase: string
  /** In-app route, e.g. '/support'. */
  href: string
}

/**
 * Split a string on the configured cross-reference phrases and render each hit
 * as a `Link`. Fragments between the links still go through the email
 * linkifier, so a line can carry both kinds of reference.
 */
export function renderTextWithLinks(
  text: string,
  size: BodySize,
  keyPrefix: string,
  links?: LegalLink[]
): ReactNode[] {
  if (!links || links.length === 0) {
    return renderTextWithEmails(text, size, keyPrefix)
  }

  const pattern = new RegExp(
    `(${links.map((link) => link.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'g'
  )

  return text.split(pattern).map((part, index) => {
    const match = links.find((link) => link.phrase === part)
    if (match) {
      return (
        <Link key={`${keyPrefix}-link-${index}`} href={match.href} asChild>
          <Text size={size} color={brand.teal}>
            {part}
          </Text>
        </Link>
      )
    }
    return renderTextWithEmails(part, size, `${keyPrefix}-part-${index}`)
  })
}

/** A single line of copy, optionally led by a bold label. */
export type LegalLine = {
  /** Bold lead-in, e.g. "Data controller:" */
  label?: string
  /** Body copy. Email addresses inside are turned into mailto links. */
  text?: string
  /** Phrases inside `text` that should navigate to another page. */
  links?: LegalLink[]
}

/** One renderable chunk inside a legal section. */
export type LegalBlock =
  | ({ kind: 'text' } & LegalLine)
  | { kind: 'bullets'; items: LegalLine[] }
  | { kind: 'table'; head: [string, string]; rows: Array<[string, string]> }

/** A numbered section of a legal document. */
export type LegalSection = {
  heading: string
  blocks: LegalBlock[]
}

function LegalLine({ label, text, links, keyPrefix }: LegalLine & { keyPrefix: string }) {
  return (
    <Text size="sm" color={brand.body} style={{ lineHeight: 22 }}>
      {label ? (
        <Text size="sm" weight="bold" color={brand.body}>
          {label}
        </Text>
      ) : null}
      {label && text ? ' ' : null}
      {text ? renderTextWithLinks(text, 'sm', keyPrefix, links) : null}
    </Text>
  )
}

function LegalBullets({ items, keyPrefix }: { items: LegalLine[]; keyPrefix: string }) {
  return (
    <Stack gap={8}>
      {items.map((item, index) => (
        <View key={`${keyPrefix}-bullet-${index}`} style={{ flexDirection: 'row', gap: 8 }}>
          <Text size="sm" color={brand.body} style={{ lineHeight: 22 }}>
            {'•'}
          </Text>
          <View style={{ flex: 1 }}>
            <LegalLine
              label={item.label}
              text={item.text}
              links={item.links}
              keyPrefix={`${keyPrefix}-bullet-${index}`}
            />
          </View>
        </View>
      ))}
    </Stack>
  )
}

function LegalTable({
  head,
  rows,
  keyPrefix,
}: {
  head: [string, string]
  rows: Array<[string, string]>
  keyPrefix: string
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: brand.border,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: brand.surfaceSunk,
        }}
      >
        <Text size="xs" weight="bold" color={brand.ink} style={{ flex: 1 }}>
          {head[0]}
        </Text>
        <Text size="xs" weight="bold" color={brand.ink} style={{ flex: 2 }}>
          {head[1]}
        </Text>
      </View>
      {rows.map(([label, value], index) => (
        <View
          key={`${keyPrefix}-row-${label}`}
          style={{
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: brand.border,
            backgroundColor: index % 2 === 1 ? brand.surfaceAlt : brand.surface,
          }}
        >
          <Text size="sm" weight="medium" color={brand.ink} style={{ flex: 1, lineHeight: 20 }}>
            {label}
          </Text>
          <Text size="sm" color={brand.body} style={{ flex: 2, lineHeight: 20 }}>
            {value}
          </Text>
        </View>
      ))}
    </View>
  )
}

function LegalBlockView({ block, keyPrefix }: { block: LegalBlock; keyPrefix: string }) {
  if (block.kind === 'bullets') {
    return <LegalBullets items={block.items} keyPrefix={keyPrefix} />
  }
  if (block.kind === 'table') {
    return <LegalTable head={block.head} rows={block.rows} keyPrefix={keyPrefix} />
  }
  return (
    <LegalLine label={block.label} text={block.text} links={block.links} keyPrefix={keyPrefix} />
  )
}

/** Renders an array of legal sections: numbered heading + its blocks. */
export function LegalSections({ sections }: { sections: LegalSection[] }) {
  return (
    <Stack gap={32}>
      {sections.map((section) => (
        <Stack key={section.heading} gap={12}>
          <MarketingHeading level={2} color={brand.deep} style={{ fontSize: fontSize.xl }}>
            {section.heading}
          </MarketingHeading>
          <Stack gap={12}>
            {section.blocks.map((block, index) => (
              <LegalBlockView
                key={`${section.heading}-block-${index}`}
                block={block}
                keyPrefix={`${section.heading}-block-${index}`}
              />
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  )
}

export type LegalLayoutProps = {
  /** Page title, rendered as the top-level heading. */
  title: string
  /** Optional "Effective date: …" line under the title. */
  effectiveDate?: string
  /** Optional supporting line under the title (used by the support page). */
  subtitle?: string
  children: ReactNode
}

/**
 * Page chrome: full-bleed scroll surface with a centred narrow column, closed
 * out by the shared marketing footer.
 *
 * The reading gutter lives on the inner column rather than on the scroll
 * container so the footer can span the full viewport width, matching the
 * landing and contact pages.
 */
export function LegalLayout({ title, effectiveDate, subtitle, children }: LegalLayoutProps) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: brand.surface }}>
      <View
        style={{
          width: '100%',
          maxWidth: layout.narrowMaxWidth,
          alignSelf: 'center',
          paddingHorizontal: layout.gutter,
          paddingTop: 48,
          paddingBottom: 64,
        }}
      >
        <Stack gap={32}>
          <Stack gap={8}>
            <MarketingHeading level={1} color={brand.ink} style={{ fontSize: 40 }}>
              {title}
            </MarketingHeading>
            {effectiveDate ? (
              <Text size="sm" color={brand.muted}>
                Effective date: {effectiveDate}
              </Text>
            ) : null}
            {subtitle ? (
              <Text size="md" color={brand.muted}>
                {subtitle}
              </Text>
            ) : null}
          </Stack>
          {children}
        </Stack>
      </View>
      <MarketingFooter />
    </ScrollView>
  )
}
