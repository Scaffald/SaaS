import { ROUTES } from '@scf/core/constants/routes'
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
          {!isDesktop && <ProfileCertificationsRight />}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )

  const rightContent = isDesktop ? (
    <Stack gap={24}>
      <ProfileSkillsRight />
      <ProfileCertificationsRight />
    </Stack>
  ) : null

  return (
    <ProfileSkillsProvider>
      <ProfileCertificationsHighlightProvider>
        <ProfilePage
          breadcrumbs={[
            { route: ROUTES.PROFILE },
            { route: ROUTES.PROFILE.SKILLS },
          ]}
          leftContent={leftContent}
          rightContent={rightContent}
        />
      </ProfileCertificationsHighlightProvider>
    </ProfileSkillsProvider>
  )
}
