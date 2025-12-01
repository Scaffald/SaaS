import { ROUTES, buildPath } from '@app/core/constants/routes'
import { useRouter } from 'expo-router'
import { ScrollView, Spinner, Text, YStack } from '@unicornlove/ui'
import { type Employer, EmployerCard } from './components/EmployerCard'

interface DiscoverEmployersLeftProps {
  employers: Employer[]
  isLoading: boolean
}

/**
 * Discover Employers Left Component
 * Left panel content for the employers discovery page - displays employer listings
 */
export function DiscoverEmployersLeft({ employers, isLoading }: DiscoverEmployersLeftProps) {
  const router = useRouter()

  const handleViewDetails = (employer: Employer) => {
    router.push(buildPath(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.DETAIL, { id: employer.id }))
  }

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Spinner size="large" color="$blue10" />
        <Text marginTop="$2" color="$color11">
          Loading employers...
        </Text>
      </YStack>
    )
  }

  if (employers.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$2">
        <Text fontSize="$6" fontWeight="600" color="$color12">
          No employers found
        </Text>
        <Text fontSize="$4" color="$color11">
          Try adjusting your filters or search query
        </Text>
      </YStack>
    )
  }

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <YStack gap="$3" padding="$4">
        <Text fontSize="$5" fontWeight="600" color="$color12">
          {employers.length} {employers.length === 1 ? 'Employer' : 'Employers'}
        </Text>

        {employers.map((employer: Employer) => (
          <EmployerCard key={employer.id} employer={employer} onViewDetails={handleViewDetails} />
        ))}
      </YStack>
    </ScrollView>
  )
}
