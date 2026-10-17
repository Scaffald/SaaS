import { BuildProfileBlock } from '@scf/core/features/dashboard/components'
import { ExperienceEditProvider } from '@scf/core/features/profile/contexts/experience-edit-context'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ProfileEducationLeft } from '@scf/core/features/profile/profile-education-left'
import { ProfileExperienceLeft } from '@scf/core/features/profile/profile-experience-left'
import { Accordion, useResponsive } from '@scaffald/ui'

export default function ProfileExperiencePage() {
  const { isDesktop } = useResponsive()

  // The forms on the left are the lists: every saved position and school is
  // an editable entry there, with its own Remove. The rail used to draw the
  // same entries again ("Saved Work Experience", "Saved Education") under
  // cards restating the section titles, with a second empty state beside the
  // first. It holds the shared build-your-profile block instead (#1190).
  const leftContent = (
    <Accordion mode="multiple" defaultValue={['experience', 'education']}>
      <Accordion.Item value="experience">
        <Accordion.Trigger>Work Experience</Accordion.Trigger>
        <Accordion.Content>
          <ProfileExperienceLeft />
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="education">
        <Accordion.Trigger>Education</Accordion.Trigger>
        <Accordion.Content>
          <ProfileEducationLeft />
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )

  const rightContent = isDesktop ? <BuildProfileBlock /> : null

  return (
    <ExperienceEditProvider>
      <ProfilePage leftContent={leftContent} rightContent={rightContent} />
    </ExperienceEditProvider>
  )
}
