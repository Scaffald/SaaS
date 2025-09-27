// Export all profile hooks from a central location
export * from './useProfileDetails'
export * from './useBasicInfo'
export * from './useWorkSkills'
export * from './useTravelCompliance'
export * from './useContactAvailability'
export * from './useProfileOverview'
export * from './useProfileMutations'

// Re-export with new names for backward compatibility
export { useBasicInfo as useGeneral } from './useBasicInfo'
export { useWorkSkills as useSkills } from './useWorkSkills'
export { useTravelCompliance as useBackground } from './useTravelCompliance'
