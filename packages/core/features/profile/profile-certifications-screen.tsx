import { ProfileCertificationsLeft } from './profile-certifications-left'
import { ProfileCertificationsRight } from './profile-certifications-right'

/**
 * Profile Certifications Screen Component
 * Combines left and right components for the certifications profile page
 */
export function ProfileCertificationsScreen() {
  return (
    <>
      <ProfileCertificationsLeft />
      <ProfileCertificationsRight />
    </>
  )
}
