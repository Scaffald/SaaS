import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { ScrollView, SkeletonCard, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { type Employer, EmployerCard } from './components/EmployerCard'
import { EmployerListRow } from './components/EmployerListRow'

interface DiscoverEmployersLeftProps {
  employers: Employer[]
  isLoading: boolean
  /** Ruled rows by default; the cards sit behind the toolbar switch (#1185). */
  view?: 'list' | 'cards'
}

/**
 * Discover Employers Left Component
 * Left panel content for the employers discovery page - displays employer listings
 */
export function DiscoverEmployersLeft({
  employers,
  isLoading,
  view = 'list',
}: DiscoverEmployersLeftProps) {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  const handleViewDetails = (employer: Employer) => {
    router.push(buildPath(ROUTES.EMPLOYERS.DETAIL, { id: employer.id }))
  }

  if (isLoading) {
    return (
      <Stack gap={12} padding="md">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} hasAvatar textLines={2} />
        ))}
      </Stack>
    )
  }

  if (employers.length === 0) {
    return (
      <Stack flex={1} align="center" justify="center" padding="md" gap={8}>
        <Text color="secondary">No employers found</Text>
        <Text color="secondary">Try adjusting your filters or search query</Text>
      </Stack>
    )
  }

  return (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {view === 'list' ? (
        <Stack style={{ borderTopWidth: 1, borderTopColor: colors.border[t].default }}>
          {employers.map((employer: Employer) => (
            <EmployerListRow
              key={employer.id}
              employer={employer}
              onViewDetails={handleViewDetails}
            />
          ))}
        </Stack>
      ) : (
        <Stack gap={12} padding="md">
          {employers.map((employer: Employer) => (
            <EmployerCard key={employer.id} employer={employer} onViewDetails={handleViewDetails} />
          ))}
        </Stack>
      )}
    </ScrollView>
  )
}
