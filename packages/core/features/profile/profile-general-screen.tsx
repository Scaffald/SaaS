import { ProfileGeneralLeft } from './profile-general-left'
import { ProfileGeneralRight } from './profile-general-right'

/**
 * Profile General Screen Component
 * Combines left and right components for the general profile page
 */
export function ProfileGeneralScreen() {
  return (
    <>
      <ProfileGeneralLeft />
      <ProfileGeneralRight />
    </>
  )
}
