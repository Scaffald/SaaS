import { ProfileSkillsLeft } from './profile-skills-left'
import { ProfileSkillsRight } from './profile-skills-right'

/**
 * Profile Skills Screen Component
 * Combines left and right components for the skills profile page
 */
export function ProfileSkillsScreen() {
  return (
    <>
      <ProfileSkillsLeft />
      <ProfileSkillsRight />
    </>
  )
}
