import { ProfileExperienceLeft } from './profile-experience-left'
import { ProfileExperienceRight } from './profile-experience-right'

/**
 * Profile Experience Screen Component
 * Combines left and right components for the experience profile page
 */
export function ProfileExperienceScreen() {
  return (
    <>
      <ProfileExperienceLeft />
      <ProfileExperienceRight />
    </>
  )
}
