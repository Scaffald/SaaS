/**
 * Account and role sheet — what the masthead avatar opens on a phone.
 *
 * The prototype's mobile masthead is logo / notifications / avatar, and the
 * avatar is titled "Account and role": it raises a bottom sheet carrying who
 * you are signed in as, which context you are using Scaffald in, notifications,
 * and sign out.
 *
 * Ours opened the whole navigation drawer instead. That was the right call
 * while the phone tab bar existed only for workers — the drawer was an
 * employer's only way to move. Now the bar mirrors the role you are in (#639),
 * navigation has a home, and the avatar can be the account control it is
 * labelled as.
 *
 * ─── On the number of roles ────────────────────────────────────────────────
 *
 * The prototype lists five contexts: Worker, Employer, Recruiter, NationSearch,
 * Admin. We have two. `useAppMode` is `'worker' | 'employer'`, and the recruiter
 * and NationSearch surfaces do not exist yet.
 *
 * So this lists two. A sheet headed "Using Scaffald as" that offered five
 * choices, three of which went nowhere, would be a worse lie than a short list
 * — the same reason the employer tab bar has no Recruiting tab. The row list is
 * data-driven; a third context becomes a third row when it becomes real.
 */
import { useCallback, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Check } from 'lucide-react-native'
import { Avatar, Row, Sheet, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { ROUTES } from '@scf/core/constants/routes'
import { supabase } from '@scf/core/utils/supabase/client'
import { useAppMode, type AppMode } from '@scf/core/utils/useAppMode'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'

export interface MobileAccountSheetProps {
  visible: boolean
  onClose: () => void
  avatarUrl?: string
  avatarInitials: string
  /** Display name for the identity row. */
  name: string
  /** Secondary line — headline, or the email when there is no headline. */
  subtitle?: string
  verified?: boolean
  unreadCount?: number
}

/** One row under "Using Scaffald as". */
interface ContextRow {
  mode: AppMode
  label: string
  /** Where picking this row lands you. */
  href: string
  /** Slug to remember alongside employer mode. */
  slug?: string | null
}

const SECTION_LABEL = {
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: 'uppercase' as const,
  fontWeight: '600' as const,
}

export function MobileAccountSheet({
  visible,
  onClose,
  avatarUrl,
  avatarInitials,
  name,
  subtitle,
  verified,
  unreadCount = 0,
}: MobileAccountSheetProps) {
  const { theme } = useThemeContext()
  const router = useRouter()
  const { mode, orgSlug, setAppMode } = useAppMode()
  const { data: organizations } = useOrganizations()
  const { hasOfficeRole } = useUserRoles()

  const memberships = useMemo(() => organizations ?? [], [organizations])

  const contexts = useMemo<ContextRow[]>(() => {
    const rows: ContextRow[] = [{ mode: 'worker', label: 'Worker', href: ROUTES.DASHBOARD.path }]

    // Same gate the drawer's ModeSelector uses: an office role, or membership
    // of at least one organization. Without either there is no employer context
    // to switch into, and a row that only leads to "create an organization"
    // belongs in the drawer, not in a context switcher.
    if (hasOfficeRole || memberships.length > 0) {
      const slug =
        memberships.find((m) => m.organization_slug === orgSlug)?.organization_slug ??
        memberships[0]?.organization_slug ??
        null
      rows.push({
        mode: 'employer',
        label: 'Employer',
        slug,
        href: slug
          ? ROUTES.EMPLOYERS.ORG.DETAIL.path.replace(':slug', slug)
          : ROUTES.EMPLOYERS.CREATE.path,
      })
    }

    return rows
  }, [hasOfficeRole, memberships, orgSlug])

  const pick = useCallback(
    (row: ContextRow) => {
      void setAppMode(row.mode, row.slug ?? undefined)
      onClose()
      router.push(row.href as never)
    },
    [setAppMode, onClose, router]
  )

  const goNotifications = useCallback(() => {
    onClose()
    router.push(ROUTES.DASHBOARD.NOTIFICATIONS.path as never)
  }, [onClose, router])

  const signOut = useCallback(async () => {
    onClose()
    try {
      await supabase.auth.signOut()
      // Same destination as the drawer's sign out: the login screen, not the
      // marketing carousel a returning user has already seen (#387).
      router.replace(ROUTES.AUTH.LOGIN.path)
    } catch (error) {
      console.error('Error signing out from account sheet:', error)
    }
  }, [onClose, router])

  const divider = {
    borderBottomWidth: 1,
    borderBottomColor: colors.border[theme].subtle,
  }

  return (
    <Sheet visible={visible} onClose={onClose} height="auto">
      <View accessibilityRole="menu" accessibilityLabel="Account and role">
        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <Text style={{ ...SECTION_LABEL, color: colors.text[theme].tertiary }}>Account</Text>
        </View>

        {/* Identity */}
        <Row
          gap={12}
          align="center"
          style={{ paddingHorizontal: 20, paddingBottom: 14, ...divider }}
        >
          <Avatar
            size={40}
            src={avatarUrl}
            initials={avatarInitials}
            verified={verified}
            alt={name}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{ fontSize: 14, fontWeight: '600', color: colors.text[theme].primary }}
            >
              {name}
            </Text>
            {subtitle ? (
              <Text numberOfLines={1} style={{ fontSize: 12, color: colors.text[theme].secondary }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </Row>

        {/* Context switch. Rendered even when there is only one row: "Using
            Scaffald as Worker" is a useful statement of where you are, not just
            a control. */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
          <Text style={{ ...SECTION_LABEL, color: colors.text[theme].tertiary }}>
            Using Scaffald as
          </Text>
        </View>

        {contexts.map((row) => {
          const active = row.mode === mode
          return (
            <Pressable
              key={row.mode}
              onPress={() => pick(row)}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: active }}
              aria-selected={active}
              accessibilityLabel={`Use Scaffald as ${row.label}${active ? ' (current)' : ''}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                paddingHorizontal: 20,
                // 44 is the smallest comfortable touch target; the prototype
                // sets the same floor on every row of this sheet.
                minHeight: 44,
                paddingVertical: 13,
                opacity: pressed ? 0.6 : 1,
                ...divider,
              })}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: active ? '600' : '400',
                  color: active ? colors.text[theme].emphasis : colors.text[theme].primary,
                }}
              >
                {row.label}
              </Text>
              {active ? <Check size={16} color={colors.text[theme].emphasis} /> : null}
            </Pressable>
          )
        })}

        <Pressable
          onPress={goNotifications}
          accessibilityRole="menuitem"
          accessibilityLabel={
            unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
          }
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            minHeight: 44,
            paddingVertical: 13,
            opacity: pressed ? 0.6 : 1,
            ...divider,
          })}
        >
          <Text style={{ fontSize: 14, color: colors.text[theme].primary }}>Notifications</Text>
          {unreadCount > 0 ? (
            <View
              style={{
                minWidth: 20,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: colors.primary[600],
                alignItems: 'center',
              }}
            >
              <Text
                style={{ fontSize: 11, fontWeight: '600', color: colors.text[theme].quaternary }}
              >
                {unreadCount}
              </Text>
            </View>
          ) : null}
        </Pressable>

        <Pressable
          onPress={signOut}
          accessibilityRole="menuitem"
          accessibilityLabel="Sign out"
          style={({ pressed }) => ({
            paddingHorizontal: 20,
            minHeight: 44,
            paddingVertical: 14,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ fontSize: 14, color: colors.text[theme].secondary }}>Sign out</Text>
        </Pressable>
      </View>
    </Sheet>
  )
}
