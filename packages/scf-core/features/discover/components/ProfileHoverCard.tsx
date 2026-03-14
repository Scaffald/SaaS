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
} from 'lucide-react-native'
import { Button, Separator, Spinner, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
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
  jobData?: JobMapPin | null
}

function formatPayRange(job: JobMapPin): string | null {
  if (!job.pay_range_min_cents && !job.pay_range_max_cents) return null
  const fmt = (cents: number) => {
    const dollars = cents / 100
    return dollars >= 1000 ? `$${(dollars / 1000).toFixed(0)}k` : `$${dollars.toFixed(0)}`
  }
  const type = job.pay_range_type === 'hourly' ? '/hr' : job.pay_range_type === 'annual' ? '/yr' : ''
  if (job.pay_range_min_cents && job.pay_range_max_cents) {
    return `${fmt(job.pay_range_min_cents)} – ${fmt(job.pay_range_max_cents)}${type}`
  }
  if (job.pay_range_min_cents) return `${fmt(job.pay_range_min_cents)}+${type}`
  if (job.pay_range_max_cents) return `Up to ${fmt(job.pay_range_max_cents)}${type}`
  return null
}

function MetricRow({ icon: Icon, text, color = '#6e6760' }: { icon: typeof MapPin; text: string; color?: string }) {
  return (
    <Row gap={8} align="center">
      <Icon size={16} color={color} />
      <Text style={{ fontSize: 13, color }}>{text}</Text>
    </Row>
  )
}

function WorkerPreview({
  pinId,
  visible,
}: {
  pinId: string
  visible: boolean
}) {
  const { data: worker, isLoading } = useUserProfilePreview(pinId, {
    enabled: visible,
  })

  if (isLoading) return <LoadingState />
  if (!worker) return null

  const avatarUrl = worker.avatarPath
    ? getStorageUrl('avatars', worker.avatarPath)
    : worker.avatarUrl || null

  const profileUrl = buildPath(ROUTES.DASHBOARD.DISCOVER.WORKERS.DETAIL, { id: pinId })

  return (
    <Stack gap={10}>
      {/* Header */}
      <Row gap={12} align="center">
        {avatarUrl ? (
          <View style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f1efeb' }}>
            <Image source={{ uri: avatarUrl }} style={{ width: 48, height: 48 }} resizeMode="cover" />
          </View>
        ) : (
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#e8f6f9', alignItems: 'center', justifyContent: 'center' }}>
            <User size={22} color="#1d7282" />
          </View>
        )}
        <Stack flex={1} gap={2}>
          <Text style={{ fontSize: 15, fontWeight: '600' }}>{worker.displayName}</Text>
          {worker.headline && (
            <Text style={{ fontSize: 13, color: '#6e6760' }} numberOfLines={1}>{worker.headline}</Text>
          )}
        </Stack>
      </Row>

      <Separator />

      {/* Metrics */}
      <Stack gap={6}>
        {worker.location && <MetricRow icon={MapPin} text={worker.location} />}
      </Stack>

      {/* Skills */}
      {worker.topSkills && worker.topSkills.length > 0 && (
        <>
          <Separator />
          <Row gap={4} wrap>
            {worker.topSkills.slice(0, 3).map((skill: (typeof worker.topSkills)[0], i: number) => (
              <View
                key={skill.csiSkillId || skill.onetOccupationId || skill.taxonomy || `s-${i}`}
                style={{ backgroundColor: '#e8f6f9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}
              >
                <Text style={{ fontSize: 12, color: '#034550' }}>{skill.taxonomy || 'Skill'}</Text>
              </View>
            ))}
            {worker.topSkills.length > 3 && (
              <Text style={{ fontSize: 12, color: '#9e9790', alignSelf: 'center' }}>
                +{worker.topSkills.length - 3}
              </Text>
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

function OrganizationPreview({
  pinId,
  visible,
}: {
  pinId: string
  visible: boolean
}) {
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
      {/* Header */}
      <Row gap={12} align="center">
        <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#f5f0ff', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={22} color="#7c3aed" />
        </View>
        <Stack flex={1} gap={2}>
          <Text style={{ fontSize: 15, fontWeight: '600' }}>{org.name}</Text>
          {industryName && (
            <Text style={{ fontSize: 13, color: '#6e6760' }} numberOfLines={1}>{industryName}</Text>
          )}
        </Stack>
      </Row>

      <Separator />

      {/* Metrics */}
      <Stack gap={6}>
        {location && <MetricRow icon={MapPin} text={location} />}
        {employeeRange && <MetricRow icon={Users} text={employeeRange} />}
        {jobsCount > 0 && (
          <MetricRow
            icon={Briefcase}
            text={`${jobsCount} open ${jobsCount === 1 ? 'job' : 'jobs'}`}
            color="#16a34a"
          />
        )}
      </Stack>

      <Separator />

      {/* CTA */}
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
  const payRange = formatPayRange(job)
  const tags = [job.employment_type, job.remote_option].filter(Boolean)

  return (
    <Stack gap={10}>
      {/* Header */}
      <Row gap={12} align="center">
        <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#fdf5e6', alignItems: 'center', justifyContent: 'center' }}>
          <Briefcase size={22} color="#9a6614" />
        </View>
        <Stack flex={1} gap={2}>
          <Text style={{ fontSize: 15, fontWeight: '600' }} numberOfLines={1}>{job.title}</Text>
          {job.organization_name && (
            <Text style={{ fontSize: 13, color: '#6e6760' }} numberOfLines={1}>{job.organization_name}</Text>
          )}
        </Stack>
      </Row>

      <Separator />

      {/* Metrics */}
      <Stack gap={6}>
        {job.location && <MetricRow icon={MapPin} text={job.location} />}
        {payRange && <MetricRow icon={DollarSign} text={payRange} color="#9a6614" />}
        {tags.length > 0 && (
          <Row gap={6} align="center">
            <Tag size={16} color="#6e6760" />
            <Text style={{ fontSize: 13, color: '#6e6760' }}>{tags.join(' · ')}</Text>
          </Row>
        )}
        {job.position_level && (
          <MetricRow icon={Users} text={job.position_level} />
        )}
      </Stack>

      <Separator />

      {/* CTA */}
      <Button
        size="sm"
        variant="filled"
        color="primary"
        onPress={() => {
          // Navigate to job detail - use organization route if available
          const url = job.organization_id
            ? buildPath(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.DETAIL, { id: job.organization_id })
            : '#'
          if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer')
        }}
        iconEnd={ExternalLink}
      >
        View Job Details
      </Button>
    </Stack>
  )
}

function LoadingState() {
  return (
    <Stack align="center" paddingVertical={20} gap={8}>
      <Spinner size="sm" color="primary" />
      <Text style={{ fontSize: 13, color: '#9e9790' }}>Loading...</Text>
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
  jobData,
}: ProfileHoverCardProps) {
  const { theme } = useThemeContext()
  if (!visible || !pinId || !pinType) return null

  const isDark = theme === 'dark'

  return (
    <ViewWithMouse
      style={{
        position: 'absolute',
        backgroundColor: isDark ? '#2f2820' : '#fbf8f3',
        borderWidth: 1,
        borderColor: isDark ? '#504940' : '#e3dfd9',
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
      {pinType === 'worker' && <WorkerPreview pinId={pinId} visible={visible} />}
      {pinType === 'organization' && <OrganizationPreview pinId={pinId} visible={visible} />}
      {pinType === 'job' && jobData && <JobPreview job={jobData} />}
      {pinType === 'job' && !jobData && (
        <Stack align="center" paddingVertical={16}>
          <Text style={{ fontSize: 13, color: '#9e9790' }}>Job data unavailable</Text>
        </Stack>
      )}
    </ViewWithMouse>
  )
}
