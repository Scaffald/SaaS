import { Row, Text } from '@scaffald/ui'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { FAQ_TABS, type FaqEntry } from '../content/faq'
import { brand, layout } from '../theme'
import { PlusMinusIcon } from './FeatureIcons'
import { MarketingHeading } from './MarketingHeading'
import { SectionHeading } from './SectionHeading'

export { FAQ_TABS, type FaqEntry }

const TAB_NAMES = Object.keys(FAQ_TABS)

function AccordionItem({ entry, isLast }: { entry: FaqEntry; isLast: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <View
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: brand.border,
      }}
    >
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={{ paddingVertical: 20 }}
      >
        <Row align="flex-start" justify="space-between" gap={16}>
          <MarketingHeading level={3} style={{ flex: 1, fontSize: 16, lineHeight: 22 }}>
            {entry.q}
          </MarketingHeading>
          <PlusMinusIcon color={brand.teal} open={open} />
        </Row>
      </Pressable>
      {/* Always rendered, only visually collapsed. Google requires FAQPage
          structured-data content to exist on the page, and conditional
          rendering kept the answers out of the server HTML entirely. */}
      <View style={{ height: open ? undefined : 0, overflow: 'hidden' }}>
        <Text
          size="sm"
          color={brand.muted}
          style={{ lineHeight: 21, paddingBottom: 20, paddingRight: 32 }}
        >
          {entry.a}
        </Text>
      </View>
    </View>
  )
}

export function FAQ() {
  const [tab, setTab] = useState<string>('General')
  const entries = FAQ_TABS[tab] ?? []

  return (
    <View nativeID="faq" style={{ backgroundColor: brand.surfaceAlt, paddingVertical: 96 }}>
      <View
        style={{
          width: '100%',
          maxWidth: layout.narrowMaxWidth,
          marginHorizontal: 'auto',
          paddingHorizontal: layout.gutter,
        }}
      >
        <SectionHeading eyebrow="FAQs" title="Common questions" />

        <Row
          gap={8}
          style={{
            backgroundColor: brand.surfaceSunk,
            padding: 4,
            borderRadius: 12,
            marginBottom: 32,
          }}
        >
          {TAB_NAMES.map((name) => (
            <Pressable
              key={name}
              onPress={() => setTab(name)}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === name }}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: tab === name ? brand.surface : 'transparent',
              }}
            >
              <Text size="sm" weight="medium" color={tab === name ? brand.ink : brand.muted}>
                {name}
              </Text>
            </Pressable>
          ))}
        </Row>

        <View
          style={{
            backgroundColor: brand.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: brand.border,
            paddingHorizontal: 24,
          }}
        >
          {entries.map((entry, i) => (
            <AccordionItem key={entry.q} entry={entry} isLast={i === entries.length - 1} />
          ))}
        </View>
      </View>
    </View>
  )
}
