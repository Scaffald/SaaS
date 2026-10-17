import { IdVerificationBadge } from '@scf/core/features/id-verification'
import { buildTrustTags, identityFacts } from '@scf/core/features/profile/utils/identity'
import { useBackgroundChecks } from '@scf/core/utils/background-checks-sdk-hooks'
import {
  useCertificationsWidget,
  useGeneralInfoWidget,
  useSkillsWidget,
} from '@scf/core/utils/profile-widgets-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import { openPublicProfileInNewTab } from '@scf/core/utils/publicProfileUrl'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import { getInitials } from '@scf/core/features/discover/utils/getInitials'
import {
  Avatar,
  Button,
  Chip,
  DashboardWidget,
  H3,
  Skeleton,
  SkeletonAvatar,
  SkeletonBox,
  SkeletonGroup,
  SkeletonText,
  Text,
  Row,
  Stack,
  useResponsive,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { workerPalette } from '@scf/core/components/ui/styles'
import { Pill } from '@scf/core/components/ui/CardPrimitives'
import type { ProfileWidgetProps } from './types'

interface GeneralInfoWidgetProps extends ProfileWidgetProps {
  /** Whether this is the current user's own profile */
  isOwnProfile?: boolean
  /**
   * The page header already prints the name and the facts line (the worker
   * profile an employer opens, #1197), so the block leaves them out rather
   * than saying the name twice.
   */
  nameInTitle?: boolean
}

/**
 * GeneralInfoWidget
 * Displays user's general profile information including name, contact, location, and about
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 * @param isOwnProfile - Whether this is the current user's own profile
 * @param nameInTitle - The page header carries the name and facts
 */
export function GeneralInfoWidget({
  userId,
  variant = 'full',
  showEdit = false,
  isOwnProfile = false,
  nameInTitle = false,
}: GeneralInfoWidgetProps) {
  const { theme } = useThemeContext()
  const { isMobile } = useResponsive()
  const t = theme === 'dark' ? 'dark' : ('light' as const)
  const pal = workerPalette[t]
  const { user: currentUser } = useUser()
  const { data, isLoading, error, refetch, isFetching } = useGeneralInfoWidget(
    { userId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )
  // Treat the viewed profile as "self" when it's the current user's, even if the
  // caller didn't pass isOwnProfile (e.g. the profile overview passes only userId).
  const isSelf = isOwnProfile || (!!currentUser?.id && currentUser.id === userId)

  // The proof row's sources (#1187). Skills and certifications share their
  // query keys with the page's own widgets, so these are cache hits there;
  // background checks are listed for the signed-in user only, so they are
  // asked for only on the owner's own view.
  const { data: skills } = useSkillsWidget({ userId })
  const { data: certifications } = useCertificationsWidget({ userId })
  const { data: backgroundChecks } = useBackgroundChecks({ enabled: isSelf })

  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={12} animation="wave">
          <Stack gap={12} align="center">
            <SkeletonAvatar size={40} />
            <Skeleton width={160} height={16} shape="text" />
            <Skeleton width={120} height={14} shape="text" />
            <SkeletonBox width={100} height={28} borderRadius={99} />
          </Stack>
          <Stack gap={12}>
            <Skeleton width={60} height={14} shape="text" />
            <SkeletonText lines={3} lastLineWidth="80%" />
          </Stack>
          <Stack gap={8}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Stack key={i} gap={4}>
                <Skeleton width="30%" height={12} shape="text" />
                <Skeleton width="100%" height={14} shape="text" />
              </Stack>
            ))}
          </Stack>
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.fg[theme].error }}>Failed to load profile information</Text>
          <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            onPress={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            Retry
          </Button>
        </Stack>
      </DashboardWidget>
    )
  }

  if (!data) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.text[theme].secondary }}>No profile data available</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  const displayName =
    data.display_name ||
    (data.privateData?.first_name && data.privateData?.last_name
      ? `${data.privateData.first_name} ${data.privateData.last_name}`
      : data.username)

  const showPrivateInfo = !!data.privateData
  const badge = data.idVerificationBadge

  // Trade · location · years, the prototype's facts line.
  const facts = nameInTitle ? [] : identityFacts(data)

  // The proof is the first thing to read about the person (#1187): issuer-
  // checked facts as filled tags, derived proof outlined, nothing invented.
  // isSelf gates the checks again because a cached list from the owner's
  // own view must never be shown on somebody else's profile.
  const trustTags = buildTrustTags({
    backgroundChecks: isSelf ? backgroundChecks : null,
    certifications,
    skills,
  })

  return (
    <DashboardWidget>
      <Stack gap={12}>
        {/* One identity block (#1034): avatar beside name, headline, a
              facts line and the badges, with the actions on the same row —
              the prototype's shape. It was a centred avatar alone in a card,
              actions floating above it, and "Professional Details" further
              down repeating the years and the industry as loose label/value
              pairs; those two facts are on the facts line now. */}
        {/* Side by side from tablet up; stacked on a phone, where a wrapping
              row squeezed the name column to a few characters a line. */}
        <Stack
          gap={16}
          style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}
        >
          <Avatar
            size={64}
            src={getAvatarUrl(data.avatar_path) || data.avatar_url || ''}
            // slice(0, 2) rendered "MA" for "Marcus Rivera" — use the shared
            // helper so every surface shows first+last initials (#384).
            initials={displayName ? getInitials(displayName) : undefined}
          />

          <Stack gap={6} style={isMobile ? undefined : { flex: 1, minWidth: 0 }}>
            {nameInTitle ? null : (
              <H3 style={{ color: colors.text[theme].primary }}>{displayName}</H3>
            )}
            {data.headline ? (
              <Text style={{ color: colors.text[theme].secondary }}>{data.headline}</Text>
            ) : null}
            {facts.length > 0 ? (
              <Text style={{ color: colors.text[theme].primary }}>{facts.join(' · ')}</Text>
            ) : null}
            {badge || data.open_to_work || trustTags.length > 0 ? (
              <Row gap={8} align="center" wrap>
                {trustTags.map((tag) => (
                  <Chip key={tag.key} size="sm" tone={tag.tone} accessibilityRole="text">
                    {tag.label}
                  </Chip>
                ))}
                {badge && (
                  <IdVerificationBadge
                    status={badge.badge_status as 'active' | 'expired' | 'revoked' | null}
                    badgeExpiresAt={badge.badge_expires_at ?? undefined}
                    size="sm"
                    muted={false}
                  />
                )}
                {data.open_to_work && (
                  <Pill label="Open to Work" bgColor={pal.pillBg} textColor={pal.pillText} />
                )}
              </Row>
            ) : null}
          </Stack>

          {/* Connect / Follow / Add Review used to sit here for someone else's
                profile. The one screen that asked for them now puts its actions
                in the page header and leaves reviews to the Reviews section,
                so there is one way to leave a review on the page (#1197). */}
          {showEdit && data.slug ? (
            <Row gap={8} wrap>
              <Button
                size="sm"
                variant="outline"
                color="primary"
                onPress={() => {
                  const s = data.slug
                  if (s) openPublicProfileInNewTab(s)
                }}
              >
                <Text>View public profile</Text>
              </Button>
            </Row>
          ) : null}
        </Stack>

        {/* About Section */}
        {data.about && variant === 'full' && (
          <Stack gap={8}>
            <H3 style={{ color: colors.text[theme].primary }}>About</H3>
            <Text style={{ color: colors.text[theme].secondary, lineHeight: 20 }}>
              {data.about}
            </Text>
          </Stack>
        )}

        {/* Contact Information (Private - only for own profile) */}
        {showPrivateInfo && data.privateData && variant === 'full' && (
          <Stack gap={12}>
            <H3 style={{ color: colors.text[theme].primary }}>Contact information</H3>

            {data.privateData.email && (
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].secondary }}>Email</Text>
                <Text>{data.privateData.email}</Text>
              </Stack>
            )}

            {data.privateData.phone && (
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].secondary }}>Phone</Text>
                <Text>{data.privateData.phone}</Text>
              </Stack>
            )}

            {data.privateData.location && (
              <Stack gap={4}>
                <Text style={{ color: colors.text[theme].secondary }}>Location</Text>
                <Text>{data.privateData.location}</Text>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  )
}
