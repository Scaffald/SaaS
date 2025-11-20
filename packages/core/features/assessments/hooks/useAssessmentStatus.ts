import { api } from '@app/core/utils/api'

/**
 * Hook to fetch completion status for all isolated assessments
 * Returns status for each assessment type with loading states and cooldown information
 */
export function useAssessmentStatus() {
  // Personality assessment queries
  const luscher1Query = api.personalityAssessment.getLuscherTest1Status.useQuery()
  const luscherAvailabilityQuery = api.personalityAssessment.getLuscherTestAvailability.useQuery()
  const ipipQuery = api.personalityAssessment.getIPIPStatus.useQuery()
  const luscher2Query = api.personalityAssessment.getLuscherTest2Status.useQuery()

  // Career assessment queries
  const riasecQuery = api.onet.getRIASECStatus.useQuery()
  const occupationQuery = api.onet.getOccupationStatus.useQuery()

  const luscher1Completed = luscher1Query.data?.isCompleted ?? false
  const luscher1OnCooldown = luscherAvailabilityQuery.data?.isOnCooldown ?? false

  return {
    luscher1: {
      isCompleted: luscher1Completed,
      isLoading: luscher1Query.isLoading || luscherAvailabilityQuery.isLoading,
      isOnCooldown: luscher1OnCooldown,
      nextAvailableAt: luscherAvailabilityQuery.data?.nextAvailableAt ?? null,
    },
    ipip: {
      isCompleted: ipipQuery.data?.isCompleted ?? false,
      isLoading: ipipQuery.isLoading,
    },
    luscher2: {
      isCompleted: luscher2Query.data?.isCompleted ?? false,
      isLoading: luscher2Query.isLoading,
    },
    riasec: {
      isCompleted: riasecQuery.data?.isCompleted ?? false,
      isLoading: riasecQuery.isLoading,
    },
    occupation: {
      isCompleted: occupationQuery.data?.isCompleted ?? false,
      isLoading: occupationQuery.isLoading,
    },
  }
}
