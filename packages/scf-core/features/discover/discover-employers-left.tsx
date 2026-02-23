import { ROUTES, buildPath } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { ScrollView, Spinner, Text, Stack } from '@scaffald/ui'
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
      <Stack flex={1} align="center" justify="center" padding="md">
        <Spinner size="lg" color="primary" />
        <Text style={{ marginTop: 8 }} color="secondary">
          Loading employers...
        </Text>
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
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <Stack gap={12} padding="md">
        <Text color="secondary">
          {employers.length} {employers.length === 1 ? 'Employer' : 'Employers'}
        </Text>

        {employers.map((employer: Employer) => (
          <EmployerCard key={employer.id} employer={employer} onViewDetails={handleViewDetails} />
        ))}
      </Stack>
    </ScrollView>
  )
}
