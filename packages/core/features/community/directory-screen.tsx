import { useMemo, useState } from 'react'
import type { JSX } from 'react'
import {
  Avatar,
  Bento,
  Button,
  Chip,
  FullscreenSpinner,
  Paragraph,
  Text,
  XStack,
  YStack,
} from '@app/ui'
import { Building2, Filter, Users } from '@tamagui/lucide-icons'

import { useTalentProfiles } from '../discover-map/hooks/useTalentProfiles'
import type { TalentProfile } from '../discover-map/types'
import type { DataTableColumn } from '@app/ui'

const { DataTable } = Bento.Tables

type CommunityTableRow = TalentProfile

type ExperienceFilter = 'all' | '3+' | '5+' | '10+'

type ScoreFilter = 'all' | '60+' | '80+'

type OrganizationFilter = 'all' | 'Worker' | 'Organization'

const experienceOptions: { value: ExperienceFilter; label: string }[] = [
  { value: 'all', label: 'All experience' },
  { value: '3+', label: '3+ years' },
  { value: '5+', label: '5+ years' },
  { value: '10+', label: '10+ years' },
]

const scoreOptions: { value: ScoreFilter; label: string }[] = [
  { value: 'all', label: 'All scores' },
  { value: '60+', label: 'Score 60+' },
  { value: '80+', label: 'Top performers' },
]

const organizationOptions: {
  value: OrganizationFilter
  label: string
  icon?: (props: { size?: number; color?: string }) => JSX.Element
}[] = [
  { value: 'all', label: 'All types' },
  { value: 'Worker', label: 'Independent talent', icon: Users },
  { value: 'Organization', label: 'Organizations', icon: Building2 },
]

const getScoreTheme = (score: number) => {
  if (score >= 80) return 'green' as const
  if (score >= 60) return 'yellow' as const
  return 'gray' as const
}

const formatOrganization = (value?: string) => {
  if (!value) return 'Independent'
  if (value === 'Worker') return 'Independent'
  return value
}

const scoreThemeForButton = (value: ScoreFilter, active: boolean) => {
  if (!active) return 'gray' as const
  if (value === '80+') return 'green' as const
  if (value === '60+') return 'yellow' as const
  return 'gray' as const
}

export const CommunityDirectoryScreen = () => {
  const { data: talentProfiles = [], isPending } = useTalentProfiles()
  const [experienceFilter, setExperienceFilter] = useState<ExperienceFilter>('all')
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all')
  const [organizationFilter, setOrganizationFilter] = useState<OrganizationFilter>('all')

  const columns = useMemo<DataTableColumn<CommunityTableRow>[]>(
    () => [
      {
        id: 'profile',
        header: 'Professional',
        align: 'start',
        width: '$22',
        accessor: (row) => row.name,
        renderCell: (_value, row) => (
          <XStack alignItems="center" gap="$3">
            <Avatar circular size="$4">
              <Avatar.Image accessibilityLabel={`${row.name} avatar`} src={row.avatarUrl || undefined} />
              <Avatar.Fallback backgroundColor="$gray5" />
            </Avatar>
            <YStack gap="$1" flex={1} minWidth={0}>
              <Text fontWeight="$7" fontSize="$5">
                {row.name}
              </Text>
              <Paragraph size="$2" color="$gray11" numberOfLines={2}>
                {row.title}
              </Paragraph>
              <XStack alignItems="center" gap="$1">
                <Users size={14} color="$gray10" />
                <Text color="$gray10" fontSize="$2">
                  {formatOrganization(row.organization)}
                </Text>
              </XStack>
            </YStack>
          </XStack>
        ),
        filterValue: (row) => [row.name, row.title, row.organization ?? ''],
      },
      {
        key: 'locationLabel',
        header: 'Location',
        align: 'start',
        width: '$16',
      },
      {
        key: 'experienceYears',
        header: 'Experience',
        align: 'center',
        width: '$10',
        renderCell: (value) => <Text>{`${value as number} yrs`}</Text>,
      },
      {
        key: 'score',
        header: 'Score',
        align: 'center',
        width: '$9',
        renderCell: (value, _row) => (
          <Chip size="$2" theme={getScoreTheme(typeof value === 'number' ? value : 0)} backgroundColor="$color4">
            <Chip.Text fontWeight="$6">{value as number}</Chip.Text>
          </Chip>
        ),
        filterValue: (row) => [row.scoreLabel ?? '', String(row.score ?? '')],
      },
      {
        id: 'skills',
        header: 'Top skills',
        align: 'start',
        width: '$24',
        accessor: (row) => row.skills,
        renderCell: (value) => {
          const skills = Array.isArray(value) ? value : []
          const topSkills = skills.slice(0, 3)

          if (topSkills.length === 0) {
            return <Text color="$gray10">No skills listed</Text>
          }

          return (
            <XStack gap="$2" flexWrap="wrap">
              {topSkills.map((skill) => (
                <Chip key={skill} size="$2" theme="gray" backgroundColor="$gray3">
                  <Chip.Text fontSize="$2">{skill}</Chip.Text>
                </Chip>
              ))}
            </XStack>
          )
        },
        filterValue: (row) => row.skills,
        sortable: false,
      },
    ],
    [],
  )

  const filteredProfiles = useMemo(() => {
    return talentProfiles.filter((profile) => {
      if (experienceFilter !== 'all') {
        const minimumYears = Number(experienceFilter.replace('+', ''))
        if (profile.experienceYears < minimumYears) {
          return false
        }
      }

      if (scoreFilter !== 'all') {
        const minimumScore = Number(scoreFilter.replace('+', ''))
        if (profile.score < minimumScore) {
          return false
        }
      }

      if (organizationFilter !== 'all') {
        if ((profile.organization ?? 'Worker') !== organizationFilter) {
          return false
        }
      }

      return true
    })
  }, [experienceFilter, organizationFilter, scoreFilter, talentProfiles])

  if (isPending && talentProfiles.length === 0) {
    return (
      <YStack gap="$4" padding="$6" alignItems="center">
        <Text fontSize="$9" fontWeight="$8">
          Community directory
        </Text>
        <Paragraph size="$4" color="$gray11" textAlign="center">
          Discover talent and collaborators from across the Scaffald network.
        </Paragraph>
        <FullscreenSpinner size="large" />
      </YStack>
    )
  }

  return (
    <YStack gap="$5" width="100%">
      <YStack gap="$2">
        <Text fontSize="$9" fontWeight="$8">
          Community directory
        </Text>
        <Paragraph size="$4" color="$gray11">
          Search, sort, and filter peers to find collaborators who match your project needs.
        </Paragraph>
      </YStack>
      <DataTable
        data={filteredProfiles}
        columns={columns}
        pageSize={12}
        searchPlaceholder="Search by name, skill, or location"
        searchableColumns={['profile', 'locationLabel', 'skills']}
        renderToolbar={({ searchInput, totalItems, visibleItems }) => (
          <YStack gap="$3" width="100%">
            <XStack gap="$3" alignItems="center" justifyContent="space-between" flexWrap="wrap">
              <XStack flex={1} minWidth={260} maxWidth="100%">
                {searchInput}
              </XStack>
              <Text color="$gray11" fontSize="$3">
                Showing {visibleItems} of {totalItems} professionals
              </Text>
            </XStack>
            <XStack gap="$2" flexWrap="wrap" alignItems="center">
              <Button
                size="$2"
                icon={Filter}
                variant="outlined"
                onPress={() => {
                  setExperienceFilter('all')
                  setScoreFilter('all')
                  setOrganizationFilter('all')
                }}
              >
                Reset filters
              </Button>
              {scoreOptions.map((option) => {
                const active = scoreFilter === option.value
                return (
                  <Button
                    key={option.value}
                    size="$2"
                    variant={active ? 'solid' : 'outlined'}
                    theme={scoreThemeForButton(option.value, active)}
                    onPress={() => setScoreFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                )
              })}
              <Paragraph size="$2" color="$gray10">
                Experience
              </Paragraph>
              {experienceOptions.map((option) => {
                const active = experienceFilter === option.value
                return (
                  <Button
                    key={option.value}
                    size="$2"
                    variant={active ? 'solid' : 'outlined'}
                    theme={active ? 'blue' : 'gray'}
                    onPress={() => setExperienceFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                )
              })}
              <Paragraph size="$2" color="$gray10">
                Type
              </Paragraph>
              {organizationOptions.map((option) => {
                const active = organizationFilter === option.value
                return (
                  <Button
                    key={option.value}
                    size="$2"
                    variant={active ? 'solid' : 'outlined'}
                    theme={active ? 'purple' : 'gray'}
                    icon={option.icon}
                    onPress={() => setOrganizationFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </XStack>
          </YStack>
        )}
        renderEmptyState={({ totalItems }) => (
          <YStack alignItems="center" gap="$2" padding="$6">
            <Text fontWeight="$7" fontSize="$6">
              {totalItems === 0
                ? 'No community members yet'
                : 'No profiles match your filters'}
            </Text>
            <Paragraph size="$3" color="$gray11" textAlign="center" maxWidth={420}>
              {totalItems === 0
                ? 'Once team members join, their profiles will appear here so you can connect and collaborate.'
                : 'Try adjusting the experience, score, or type filters to widen your search.'}
            </Paragraph>
          </YStack>
        )}
      />
    </YStack>
  )
}
