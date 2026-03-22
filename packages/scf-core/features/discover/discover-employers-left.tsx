import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { ScrollView, SkeletonCard, Text, Stack } from '@scaffald/ui'
import { type Employer, EmployerCard } from './components/EmployerCard'

interface DiscoverEmployersLeftProps {
  employers: Employer[]
  isLoading: boolean
}

/**
 * Discover Employers Left Component
 * Left panel content for the employers discovery page - displays employer listings
 */
export function DiscoverEmployersLeft({
  employers,
  isLoading,
}: DiscoverEmployersLeftProps) {
  const router = useRouter()

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
      <Stack gap={12} padding="md">
        {employers.map((employer: Employer) => (
          <EmployerCard key={employer.id} employer={employer} onViewDetails={handleViewDetails} />
        ))}
      </Stack>
    </ScrollView>
  )
}
