/**
 * Links to the developer-facing admin surfaces from the Office landing page.
 *
 * These pages were all built and then unreachable. Two separate reasons, both
 * fixed alongside this component (#424):
 *
 *   1. Their route files were named `page.tsx`, a Next.js convention. Expo
 *      Router treats that as a route *segment*, so the API keys portal lived at
 *      `/office/api-keys/page` rather than `/office/api-keys`. Renamed to
 *      `index.tsx`.
 *   2. Nothing linked to them — a repo-wide search for navigation to any of
 *      these paths returned zero hits. Correct URLs alone would not have made
 *      them findable, which is what this component is for.
 *
 * The portal itself was already complete: list, create, scope management, usage
 * chart and revoke-with-confirmation. #424 asked for it to be built; what it
 * actually needed was a way in.
 */

import { useCallback } from 'react'
import { Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import type { Href } from 'expo-router'
import { Caption, Paragraph, Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ChevronRight, KeyRound, Puzzle, Webhook } from 'lucide-react-native'

type DeveloperLink = {
  href: Href
  label: string
  description: string
  Icon: typeof KeyRound
}

const LINKS: DeveloperLink[] = [
  {
    href: '/office/api-keys',
    label: 'API keys',
    description: 'Mint, scope and revoke keys for automated callers.',
    Icon: KeyRound,
  },
  {
    href: '/office/oauth-apps',
    label: 'OAuth apps',
    description: 'Registered third-party applications and their allowed scopes.',
    Icon: Puzzle,
  },
  {
    href: '/office/webhooks',
    label: 'Webhooks',
    description: 'Outbound event subscriptions.',
    Icon: Webhook,
  },
]

export function OfficeDeveloperLinks() {
  const { theme } = useThemeContext()
  const router = useRouter()

  const go = useCallback((href: Href) => router.push(href), [router])

  return (
    <Stack gap={8}>
      <Caption color="tertiary">Developer</Caption>

      <Stack gap={4}>
        {LINKS.map(({ href, label, description, Icon }) => (
          <Pressable
            key={String(href)}
            onPress={() => go(href)}
            accessibilityRole="link"
            accessibilityLabel={label}
            style={({ pressed }) => ({
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border[theme].subtle,
              backgroundColor: pressed ? colors.bg[theme].muted : colors.bg[theme].subtle,
            })}
          >
            <Row align="center" gap={10}>
              <Icon size={18} color={colors.icon[theme].muted} />
              <Stack flex={1} gap={2}>
                <Text
                  style={{
                    color: colors.text[theme].primary,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  {label}
                </Text>
                <Paragraph size="sm" color="secondary">
                  {description}
                </Paragraph>
              </Stack>
              <ChevronRight size={16} color={colors.icon[theme].muted} />
            </Row>
          </Pressable>
        ))}
      </Stack>
    </Stack>
  )
}
