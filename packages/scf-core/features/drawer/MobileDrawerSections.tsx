/**
 * Mobile-only drawer body. Renders identity-focused sections:
 *   - Profile actions (View / Edit)
 *   - Embedded notifications feed
 *   - Organizations (list, create, invitations)
 *   - Settings, Help, Sign out
 *
 * Used inside DrawerContent when the viewport is small (<1024px).
 * Desktop sidebar keeps its existing nav-tree layout.
 */

import { useCallback, type ComponentType, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  Building2,
  ChevronRight,
  HelpCircle,
  LogOut,
  Mail,
  Plus,
  Settings as SettingsIcon,
  User as UserIcon,
} from 'lucide-react-native'
import { Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ROUTES } from '@scf/core/constants/routes'
import type { OrganizationMembership } from '@scf/core/utils/useOrganizations'
import { DrawerNotificationsFeed } from './DrawerNotificationsFeed'

type IconLike = ComponentType<{ size?: number; color?: string }>

type MobileDrawerSectionsProps = {
  organizations?: OrganizationMembership[] | null
  onNavigate?: (href: string) => void
  onProfilePress: () => void
  onSettingsPress: () => void
  onLogoutPress: () => void
}

export function MobileDrawerSections({
  organizations,
  onNavigate,
  onProfilePress,
  onSettingsPress,
  onLogoutPress,
}: MobileDrawerSectionsProps) {
  const router = useRouter()

  const go = useCallback(
    (href: string) => {
      router.push(href as never)
      onNavigate?.(href)
    },
    [onNavigate, router]
  )

  return (
    <Stack gap={20} width="100%">
      <Section title="Profile">
        <DrawerRow
          icon={UserIcon}
          label="View profile"
          onPress={onProfilePress}
        />
      </Section>

      <DrawerNotificationsFeed onNavigate={() => onNavigate?.(ROUTES.DASHBOARD.NOTIFICATIONS.path)} />

      <Section title="Organizations">
        {organizations && organizations.length > 0 ? (
          organizations.map((org) => (
            <DrawerRow
              key={org.organization_id}
              icon={Building2}
              label={org.organization_name || 'Untitled organization'}
              onPress={() =>
                go(
                  ROUTES.EMPLOYERS.ORG.DETAIL.path.replace(':slug', org.organization_slug)
                )
              }
            />
          ))
        ) : null}
        <DrawerRow
          icon={Plus}
          label="Create business profile"
          onPress={() => go(ROUTES.EMPLOYERS.CREATE.path)}
        />
        <DrawerRow
          icon={Mail}
          label="Invitations"
          onPress={() => go(ROUTES.EMPLOYERS.INVITATIONS.path)}
        />
      </Section>

      <Section title="Account">
        <DrawerRow icon={SettingsIcon} label="Settings" onPress={onSettingsPress} />
        <DrawerRow
          icon={HelpCircle}
          label="Help & support"
          onPress={() => go(ROUTES.DASHBOARD.SETTINGS.path)}
        />
        <DrawerRow
          icon={LogOut}
          label="Sign out"
          onPress={onLogoutPress}
          tone="destructive"
        />
      </Section>
    </Stack>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { theme } = useThemeContext()
  return (
    <Stack gap={6}>
      <Text
        style={{
          color: colors.text[theme].tertiary,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          paddingHorizontal: 4,
        }}
      >
        {title}
      </Text>
      <Stack
        gap={2}
        style={{
          borderRadius: 16,
          backgroundColor: colors.bg[theme].subtle,
          borderWidth: 1,
          borderColor: colors.border[theme].subtle,
          paddingVertical: 4,
          paddingHorizontal: 4,
        }}
      >
        {children}
      </Stack>
    </Stack>
  )
}

type DrawerRowProps = {
  icon: IconLike
  label: string
  onPress: () => void
  tone?: 'default' | 'destructive'
}

function DrawerRow({ icon: Icon, label, onPress, tone = 'default' }: DrawerRowProps) {
  const { theme } = useThemeContext()
  const labelColor =
    tone === 'destructive' ? colors.error[500] : colors.text[theme].primary
  const iconColor =
    tone === 'destructive' ? colors.error[500] : colors.icon[theme].default
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        backgroundColor: pressed ? colors.bg[theme].muted : 'transparent',
        borderRadius: 12,
      })}
    >
      <Row align="center" gap={12} style={{ paddingHorizontal: 8, paddingVertical: 12 }}>
        <Icon size={20} color={iconColor} />
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{ color: labelColor, fontSize: 15, fontWeight: '500' }}
          >
            {label}
          </Text>
        </View>
        {tone !== 'destructive' ? (
          <ChevronRight size={16} color={colors.icon[theme].muted} />
        ) : null}
      </Row>
    </Pressable>
  )
}
