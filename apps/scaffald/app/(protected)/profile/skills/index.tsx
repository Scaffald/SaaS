import { BuildProfileBlock } from '@scf/core/features/dashboard/components'
import {
  ProfileSkillsLeft,
  ProfileSkillsProvider,
  ProfileSkillsRight,
} from '@scf/core/features/profile'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ProfileCertificationsHighlightProvider } from '@scf/core/features/profile/profile-certifications-highlight-context'
import { ProfileCertificationsLeft } from '@scf/core/features/profile/profile-certifications-left'
import { ProfileCertificationsRight } from '@scf/core/features/profile/profile-certifications-right'
import { Accordion, Stack, useResponsive } from '@scaffald/ui'

export default function ProfileSkillsPage() {
  const { isDesktop } = useResponsive()

  const leftContent = (
    <Accordion mode="multiple" defaultValue={['skills', 'certifications']}>
      <Accordion.Item value="skills">
        <Accordion.Trigger>Skills</Accordion.Trigger>
        <Accordion.Content>
          <ProfileSkillsLeft />
          {!isDesktop && <ProfileSkillsRight />}
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="certifications">
        <Accordion.Trigger>Certifications</Accordion.Trigger>
        <Accordion.Content>
          <ProfileCertificationsLeft />
          {!isDesktop && <ProfileCertificationsRight showEmpty={false} />}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )

  // The rail is what is left to do, then the lists the picker on the left
  // feeds: your skills, and your certifications with their proof (#1190).
  const rightContent = isDesktop ? (
    <Stack gap={24}>
      <BuildProfileBlock />
      <ProfileSkillsRight />
      <ProfileCertificationsRight showEmpty={false} />
    </Stack>
  ) : null

  return (
    <ProfileSkillsProvider>
      <ProfileCertificationsHighlightProvider>
        <ProfilePage leftContent={leftContent} rightContent={rightContent} />
      </ProfileCertificationsHighlightProvider>
    </ProfileSkillsProvider>
  )
}
