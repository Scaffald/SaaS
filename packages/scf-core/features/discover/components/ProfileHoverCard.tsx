import { ROUTES, buildPath } from '@scf/core/constants/routes'
import {
  useOrganization,
  useOrganizationOpenJobsCount,
} from '@scf/core/utils/organizations-sdk-hooks'
import { useUserProfilePreview } from '@scf/core/utils/user-profiles-sdk-hooks'
import { getStorageUrl } from '@scf/core/utils/supabase/storage'
import type { ComponentType } from 'react'
import type { ViewProps } from 'react-native'
import { View, Image } from 'react-native'
import {
  Briefcase,
  Building2,
  DollarSign,
  ExternalLink,
  MapPin,
  Tag,
  User,
  Users,
  X,
} from 'lucide-react-native'
import { Button, Separator, Spinner, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  workerPalette,
  orgPalette,
  jobPalette,
  textSmall,
  iconCircleStyle,
  CardHeader,
  MetricRow,
  Pill,
  OverflowCount,
} from '@scf/core/components/ui'
import type { JobMapPin } from '../hooks/useJobs'

type ViewWithMouseProps = ViewProps & {
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}
const ViewWithMouse = View as ComponentType<ViewWithMouseProps>

interface ProfileHoverCardProps {
  pinId: string | null
  pinType: 'worker' | 'organization' | 'job' | null
  visible: boolean
  position?: { x: number; y: number }
  onHoverCardEnter?: () => void
  onHoverCardLeave?: () => void
  onClose?: () => void
  jobData?: JobMapPin | null
}

function formatPayRange(job: JobMapPin): string | null {
  if (!job.pay_range_min_cents && !job.pay_range_max_cents) return null
  const fmt = (cents: number) => {
    const dollars = cents / 100
    return dollars >= 1000 ? `$${(dollars / 1000).toFixed(0)}k` : `$${dollars.toFixed(0)}`
  }
  const type =
    job.pay_range_type === 'hourly' ? '/hr' : job.pay_range_type === 'annual' ? '/yr' : ''
  if (job.pay_range_min_cents && job.pay_range_max_cents) {
    return `${fmt(job.pay_range_min_cents)} – ${fmt(job.pay_range_max_cents)}${type}`
  }
  if (job.pay_range_min_cents) return `${fmt(job.pay_range_min_cents)}+${type}`
  if (job.pay_range_max_cents) return `Up to ${fmt(job.pay_range_max_cents)}${type}`
  return null
}

function WorkerPreview({ pinId, visible }: { pinId: string; visible: boolean }) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const pal = workerPalette[t]
  const { data: worker, isLoading } = useUserProfilePreview(pinId, {
    enabled: visible,
  })

  if (isLoading) return <LoadingState />
  if (!worker) return null

  const avatarUrl = worker.avatarPath
    ? getStorageUrl('avatars', worker.avatarPath)
    : worker.avatarUrl || null

  const profileUrl = buildPath(ROUTES.WORKERS.DETAIL, { id: pinId })

  return (
    <Stack gap={10}>
      {/* Header */}
      <Row gap={12} align="center">
        {avatarUrl ? (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: colors.gray[t === 'dark' ? 700 : 100],
            }}
          >
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 48, height: 48 }}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={iconCircleStyle(48, pal.iconBg)}>
            <User size={22} color={pal.iconFg} />
          </View>
        )}
        <Stack flex={1} gap={2}>
          <Text style={{ fontSize: 15, fontWeight: '600' }}>{worker.displayName}</Text>
          {worker.headline && (
            <Text style={{ ...textSmall, color: colors.text[t].tertiary }} numberOfLines={1}>
              {worker.headline}
            </Text>
          )}
        </Stack>
      </Row>

      <Separator />

      {/* Metrics */}
      <Stack gap={6}>
        {worker.location && <MetricRow icon={MapPin} text={worker.location} theme={t} />}
      </Stack>

      {/* Skills */}
      {worker.topSkills && worker.topSkills.length > 0 && (
        <>
          <Separator />
          <Row gap={4} wrap>
            {worker.topSkills.slice(0, 3).map((skill: (typeof worker.topSkills)[0], i: number) => (
              <Pill
                key={skill.csiSkillId || skill.onetOccupationId || skill.taxonomy || `s-${i}`}
                label={skill.taxonomy || 'Skill'}
                bgColor={pal.pillBg}
                textColor={pal.pillText}
              />
            ))}
            {worker.topSkills.length > 3 && (
              <OverflowCount count={worker.topSkills.length - 3} theme={t} />
            )}
          </Row>
        </>
      )}

      <Separator />

      {/* CTA */}
      <Button
        size="sm"
        variant="filled"
        color="primary"
        onPress={() => window.open(profileUrl, '_blank', 'noopener,noreferrer')}
        iconEnd={ExternalLink}
      >
        View Profile
      </Button>
    </Stack>
  )
}

function OrganizationPreview({ pinId, visible }: { pinId: string; visible: boolean }) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const pal = orgPalette[t]
  const { data: org, isLoading } = useOrganization(pinId, { enabled: visible })
  const jobsCountQuery = useOrganizationOpenJobsCount(pinId, { enabled: visible })
  const jobsCount: number = (() => {
    const data = jobsCountQuery.data
    if (typeof data === 'number') return data
    if (data && typeof data === 'object' && 'count' in data) {
      return (data as { count: number }).count
    }
    return 0
  })()

  if (isLoading) return <LoadingState />
  if (!org) return null

  const profileUrl = buildPath(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.DETAIL, { id: pinId })
  const address = org.address as { city?: string; state?: string } | null
  const location = address ? [address.city, address.state].filter(Boolean).join(', ') : null
  const employeeRange = (org as { employee_count_range?: string }).employee_count_range
  const industryName = (org as { industry_name?: string }).industry_name

  return (
    <Stack gap={10}>
      <CardHeader
        icon={Building2}
        iconBg={pal.iconBg}
        iconColor={pal.iconFg}
        title={org.name}
        subtitle={industryName}
        theme={t}
      />

      <Separator />

      {/* Metrics */}
      <Stack gap={6}>
        {location && <MetricRow icon={MapPin} text={location} theme={t} />}
        {employeeRange && <MetricRow icon={Users} text={employeeRange} theme={t} />}
        {jobsCount > 0 && (
          <MetricRow
            icon={Briefcase}
            text={`${jobsCount} open ${jobsCount === 1 ? 'job' : 'jobs'}`}
            color={colors.green[600]}
            theme={t}
          />
        )}
      </Stack>

      <Separator />

      <Button
        size="sm"
        variant="filled"
        color="primary"
        onPress={() => window.open(profileUrl, '_blank', 'noopener,noreferrer')}
        iconEnd={ExternalLink}
      >
        View Organization
      </Button>
    </Stack>
  )
}

function JobPreview({ job }: { job: JobMapPin }) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const jPal = jobPalette[t]
  const payRange = formatPayRange(job)
  const tags = [job.employment_type, job.remote_option].filter(Boolean) as string[]

  return (
    <Stack gap={10}>
      <CardHeader
        icon={Briefcase}
        iconBg={jPal.iconBg}
        iconColor={jPal.iconFg}
        title={job.title}
        subtitle={job.organization_name}
        theme={t}
      />

      <Separator />

      {/* Metrics */}
      <Stack gap={6}>
        {job.location && <MetricRow icon={MapPin} text={job.location} theme={t} />}
        {payRange && <MetricRow icon={DollarSign} text={payRange} color={jPal.accent} theme={t} />}
        {tags.length > 0 && (
          <Row gap={6} align="center">
            <Tag size={16} color={colors.text[t].tertiary} />
            <Text style={{ ...textSmall, color: colors.text[t].tertiary }}>{tags.join(' · ')}</Text>
          </Row>
        )}
        {job.position_level && <MetricRow icon={Users} text={job.position_level} theme={t} />}
      </Stack>

      <Separator />

      <Button
        size="sm"
        variant="filled"
        color="primary"
        onPress={() => {
          const url = buildPath(ROUTES.DASHBOARD.DISCOVER.JOBS.DETAIL, { id: job.id })
          window.open(url, '_blank', 'noopener,noreferrer')
        }}
        iconEnd={ExternalLink}
      >
        View Job Details
      </Button>
    </Stack>
  )
}

function LoadingState() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack align="center" paddingVertical={20} gap={8}>
      <Spinner variant="ios" size="sm" color="primary" />
      <Text style={{ ...textSmall, color: colors.text[t].disabled }}>Loading...</Text>
    </Stack>
  )
}

export function ProfileHoverCard({
  pinId,
  pinType,
  visible,
  position,
  onHoverCardEnter,
  onHoverCardLeave,
  onClose,
  jobData,
}: ProfileHoverCardProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  if (!visible || !pinId || !pinType) return null

  return (
    <ViewWithMouse
      style={{
        position: 'absolute',
        backgroundColor: colors.bg[t].subtle,
        borderWidth: 1,
        borderColor: colors.border[t].default,
        borderRadius: 16,
        padding: 16,
        minWidth: 280,
        maxWidth: 320,
        zIndex: 1000,
        top: position?.y ?? 0,
        left: position?.x ?? 0,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        pointerEvents: 'auto',
        transform: [{ translateY: -8 }],
      }}
      onMouseEnter={onHoverCardEnter}
      onMouseLeave={onHoverCardLeave}
    >
      {onClose && (
        <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <Button
            size="sm"
            variant="text"
            iconStart={X}
            onPress={onClose}
            aria-label="Close"
          />
        </View>
      )}
      {pinType === 'worker' && <WorkerPreview pinId={pinId} visible={visible} />}
      {pinType === 'organization' && <OrganizationPreview pinId={pinId} visible={visible} />}
      {pinType === 'job' && jobData && <JobPreview job={jobData} />}
      {pinType === 'job' && !jobData && (
        <Stack align="center" paddingVertical={16}>
          <Text style={{ ...textSmall, color: colors.text[t].disabled }}>Job data unavailable</Text>
        </Stack>
      )}
    </ViewWithMouse>
  )
}
