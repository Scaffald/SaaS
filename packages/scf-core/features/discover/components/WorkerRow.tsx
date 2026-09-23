import { Avatar, Lane, Row, Stack, Text, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import type { TalentProfile } from '../types'

/**
 * One worker, on a hairline.
 *
 * The directory drew each worker as a `DirectoryCard`: an avatar, a name, a
 * role, a location, three bordered metric cells, and then every skill and
 * every certification as a coloured chip — so a worker with eight skills
 * produced a card taller than the row above it, and a list of ten was a
 * column of uneven boxes you could not scan down.
 *
 * A row instead, leading with the score, because that is the number the
 * search is sorted by. Proof — certifications — comes before skills, since
 * a certification is verified and a skill is claimed; the first three of
 * each are enough to tell two candidates apart, and the profile has the
 * rest.
 */
/**
 * `Lane` sizes its columns to their content, so a worker with no certifications
 * pulled the years cell left and the column came out ragged down the list.
 * Fixed cells instead — narrow enough to still sit inside a 390pt phone once
 * the row stacks.
 */
const PROOF_CELL = { width: 190 } as const
const TERMS_CELL = { width: 84 } as const

export function WorkerRow({
  profile,
  isSelected,
  onSelect,
}: {
  profile: TalentProfile
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const proof = profile.certifications.slice(0, 3)
  const skills = profile.skills.slice(0, 3)
  const extraSkills = Math.max(profile.skills.length - skills.length, 0)

  return (
    <Lane
      age={profile.score > 0 ? String(profile.score) : undefined}
      ageLabel="score"
      selected={isSelected}
      onPress={() => onSelect(profile.id)}
      title={
        <Row gap={10} align="center">
          <Avatar
            size={32}
            src={profile.avatarUrl ?? undefined}
            initials={initialsFor(profile.name)}
            color="gray"
            alt={profile.name}
          />
          <Text style={{ color: colors.text[t].primary }}>{profile.name}</Text>
        </Row>
      }
      subtitle={
        [profile.title, shortLocation(profile.locationLabel)].filter(Boolean).join(' · ') ||
        undefined
      }
      columns={[
        <Stack key="proof" gap={2} style={PROOF_CELL}>
          {proof.length > 0 ? (
            <Text style={{ color: colors.text[t].secondary }}>{proof.join(' · ')}</Text>
          ) : null}
          {skills.length > 0 ? (
            <Text style={{ color: colors.text[t].tertiary }}>
              {skills.join(', ')}
              {extraSkills > 0 ? ` +${extraSkills}` : ''}
            </Text>
          ) : null}
        </Stack>,
        <Stack key="terms" gap={2} style={TERMS_CELL}>
          {profile.experienceYears > 0 ? (
            <Text style={{ color: colors.text[t].secondary }}>
              {profile.experienceYears} {profile.experienceYears === 1 ? 'year' : 'years'}
            </Text>
          ) : null}
          {profile.hourlyRate > 0 ? (
            <Text style={{ color: colors.text[t].tertiary }}>${profile.hourlyRate}/hr</Text>
          ) : null}
        </Stack>,
      ]}
    />
  )
}

/**
 * "Detroit, Michigan, United States" on all 42 rows says nothing about any of
 * them. Directories name a place the way people do — city and region — so
 * keep the first two segments and drop the country.
 */
function shortLocation(label: string | null | undefined): string | undefined {
  if (!label) return undefined
  const parts = label
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return undefined
  return parts.slice(0, 2).join(', ')
}

function initialsFor(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  )
}
