// @ts-nocheck
import React from 'react'
import { Link } from 'expo-router'
import { Paragraph, Text, View, XStack, YStack } from '@app/ui'
import { NAV_SECTIONS } from './navigation/sections'
import { StyleguidePage } from './_components/StyleguidePage'
import { AnchorHeading } from './_components/AnchorHeading'
import { TodoCallout } from './_components/TodoCallout'

export default function StyleguideWelcomePage() {
  return (
    <StyleguidePage
      title="Scaffald Component Showcase"
      description="A Bootstrap 2–inspired documentation hub for Scaffald’s Tamagui-powered UI system. Browse component examples, design tokens, and full-screen compositions alongside live code snippets."
      leadIn={<QuickLinks />}
    >
      <YStack gap="$6">
        <AnchorHeading
          id="layout-overview"
          title="Information architecture"
          description="The showcase mirrors Bootstrap’s left-nav + content layout and organizes pages by foundations, components, utilities, and composite examples."
        />
        <Paragraph fontSize={14} color="$color10">
          Pages are grouped into the sidebar with sticky positioning for quick reference. Use the global search (shortcut <Text fontFamily="monospace">/</Text>) to locate components, tokens, and guidance. Each page provides anchored subsections for deep links and code snippets you can copy directly into Expo projects.
        </Paragraph>
        <AnchorHeading
          id="a11y-and-security"
          title="Accessibility & security posture"
          description="We mapped WCAG focus treatments to Tamagui tokens and reused Supabase session context for future gating."
        />
        <Paragraph fontSize={14} color="$color10">
          All interactive examples include keyboard focus states that inherit Tamagui’s focus ring tokens. On web, section anchors expose copy buttons for deep linking. The styleguide currently mounts publicly inside the Expo web bundle—confirm whether we should enforce an auth guard before production deploys.
        </Paragraph>
        <TodoCallout id="auth-gate" />
      </YStack>
    </StyleguidePage>
  )
}

const QuickLinks = () => (
  <YStack gap="$3">
    <Text fontSize={14} color="$color10">
      Quick start
    </Text>
    <XStack gap="$3" flexWrap="wrap">
      {NAV_SECTIONS.slice(0, 4).flatMap((section) => section.items.slice(0, 2)).map((item) => (
        <Link key={item.href} href={item.href} asChild>
          <View
            paddingVertical={12}
            paddingHorizontal={16}
            borderRadius={10}
            borderWidth={1}
            borderColor="$color6"
            backgroundColor="$color2"
            hoverStyle={{ backgroundColor: '$color3' }}
            pressStyle={{ backgroundColor: '$color4' }}
          >
            <Text fontSize={13} fontWeight="600" color="$color11">
              {item.title}
            </Text>
            {item.description ? (
              <Text fontSize={12} color="$color10" marginTop={4} maxWidth={220}>
                {item.description}
              </Text>
            ) : null}
          </View>
        </Link>
      ))}
    </XStack>
  </YStack>
)
