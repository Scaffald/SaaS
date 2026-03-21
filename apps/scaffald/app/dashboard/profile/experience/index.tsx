import { ROUTES } from '@scf/core/constants/routes'
import { ExperienceEditProvider } from '@scf/core/features/profile/contexts/experience-edit-context'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ProfileEducationLeft } from '@scf/core/features/profile/profile-education-left'
import { ProfileEducationRight } from '@scf/core/features/profile/profile-education-right'
import { ProfileExperienceLeft } from '@scf/core/features/profile/profile-experience-left'
import { ProfileExperienceRight } from '@scf/core/features/profile/profile-experience-right'
import { Accordion, Stack, useResponsive } from '@scaffald/ui'
import { useState } from 'react'

export default function ProfileExperiencePage() {
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const { isDesktop } = useResponsive()

  const leftContent = (
    <Accordion mode="multiple" defaultValue={['experience', 'education']}>
      <Accordion.Item value="experience">
        <Accordion.Trigger>Work Experience</Accordion.Trigger>
        <Accordion.Content>
          <ProfileExperienceLeft />
          {!isDesktop && <ProfileExperienceRight />}
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="education">
        <Accordion.Trigger>Education</Accordion.Trigger>
        <Accordion.Content>
          <ProfileEducationLeft
            editingEntryId={editingEntryId}
            onEditComplete={() => setEditingEntryId(null)}
          />
          {!isDesktop && (
            <ProfileEducationRight
              onEditEntry={(entryId) => setEditingEntryId(entryId)}
            />
          )}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )

  const rightContent = isDesktop ? (
    <Stack gap={24}>
      <ProfileExperienceRight />
      <ProfileEducationRight
        onEditEntry={(entryId) => setEditingEntryId(entryId)}
      />
    </Stack>
  ) : null

  return (
    <ExperienceEditProvider>
      <ProfilePage
        breadcrumbs={[
          { route: ROUTES.DASHBOARD.PROFILE },
          { route: ROUTES.DASHBOARD.PROFILE.EXPERIENCE },
        ]}
        leftContent={leftContent}
        rightContent={rightContent}
      />
    </ExperienceEditProvider>
  )
}
