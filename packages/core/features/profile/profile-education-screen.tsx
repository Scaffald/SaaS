import { ProfileEducationLeft } from './profile-education-left'
import { ProfileEducationRight } from './profile-education-right'

/**
 * Profile Education Screen Component
 * Combines left and right components for the education profile page
 */
export function ProfileEducationScreen() {
  return (
    <>
      <ProfileEducationLeft />
      <ProfileEducationRight />
    </>
  )
}
