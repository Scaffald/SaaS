import {
  useLuscherTest1Status,
  useLuscherTest2Status,
  useLuscherTestAvailability,
  useIPIPStatus,
} from '@scf/core/utils/personality-assessment-sdk-hooks'
import { useRIASECStatus, useOccupationStatus } from '@scf/core/utils/onet-sdk-hooks'

/**
 * Hook to fetch completion status for all isolated assessments
 * Returns status for each assessment type with loading states and cooldown information
 */
export function useAssessmentStatus() {
  // Personality assessment queries
  const luscher1Query = useLuscherTest1Status()
  const luscherAvailabilityQuery = useLuscherTestAvailability()
  const ipipQuery = useIPIPStatus()
  const luscher2Query = useLuscherTest2Status()

  // Career assessment queries
  const riasecQuery = useRIASECStatus()
  const occupationQuery = useOccupationStatus()

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
