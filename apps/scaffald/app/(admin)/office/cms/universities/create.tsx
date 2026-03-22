import { OfficeUniversitiesForm } from '@scf/core/features/office/office-universities-form'

export default function CreateUniversityPage() {
  return (
    <OfficeUniversitiesForm
      onUniversitySaved={() => {
        // Navigation handled by form component
      }}
      onCancel={() => {
        // Navigation handled by form component
      }}
    />
  )
}
