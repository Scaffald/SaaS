import { useState } from 'react'
import { YStack } from 'tamagui'
import { OfficeUniversitiesList } from './office-universities-list'
import { OfficeUniversitiesForm } from './office-universities-form'

type University = {
  id: string
  name: string
  slug: string
  country: string
  alpha_two_code: string
  state_province: string | null
  domains: string[]
  web_pages: string[]
  is_active: boolean
}

/**
 * Office Universities Screen
 * Main screen for managing universities catalog
 */
export function OfficeUniversitiesScreen() {
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEdit = (university: University) => {
    // Check if this is a new university (empty object)
    if (!university.id) {
      setSelectedUniversity(null)
      setShowForm(true)
    } else {
      setSelectedUniversity(university)
      setShowForm(true)
    }
  }

  const handleCancel = () => {
    setSelectedUniversity(null)
    setShowForm(false)
  }

  const handleSaved = () => {
    setSelectedUniversity(null)
    setShowForm(false)
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <YStack flex={1} gap="$4" p="$4">
      {showForm && (
        <OfficeUniversitiesForm
          selectedUniversity={selectedUniversity}
          onUniversitySaved={handleSaved}
          onCancel={handleCancel}
        />
      )}

      <OfficeUniversitiesList
        key={refreshKey}
        onEdit={handleEdit}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
      />
    </YStack>
  )
}
