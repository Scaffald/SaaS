import { ProfileEmploymentLeft } from './profile-employment-left'
import { ProfileEmploymentRight } from './profile-employment-right'

/**
 * Profile Employment Screen Component
 * Combines left and right components for the employment profile page
 */
export function ProfileEmploymentScreen() {
  return (
    <>
      <ProfileEmploymentLeft />
      <ProfileEmploymentRight />
    </>
  )
}
