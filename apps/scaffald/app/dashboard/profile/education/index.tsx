import { ROUTES } from '@scf/core/constants/routes'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ProfileEducationLeft } from '@scf/core/features/profile/profile-education-left'
import { ProfileEducationRight } from '@scf/core/features/profile/profile-education-right'
import { useState } from 'react'

export default function ProfileEducationPage() {
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

  return (
    <ProfilePage
      breadcrumbs={[
        { route: ROUTES.DASHBOARD.PROFILE },
        { route: ROUTES.DASHBOARD.PROFILE.EDUCATION },
      ]}
      leftContent={
        <ProfileEducationLeft
          editingEntryId={editingEntryId}
          onEditComplete={() => setEditingEntryId(null)}
        />
      }
      rightContent={<ProfileEducationRight onEditEntry={(entryId) => setEditingEntryId(entryId)} />}
    />
  )
}
