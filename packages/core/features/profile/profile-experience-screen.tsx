import { ProfileExperienceLeft } from './profile-experience-left'
import { ProfileExperienceRight } from './profile-experience-right'

/**
 * Profile Experience Screen
 * Complete screen for managing work experience
 */
export function ProfileExperienceScreen() {
  return {
    left: <ProfileExperienceLeft />,
    right: <ProfileExperienceRight />,
  }
}

export { ProfileExperienceLeft, ProfileExperienceRight }
