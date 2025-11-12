import { YStack, XStack, Text, Spinner, H4, Button, Dialog } from 'tamagui'
import { GraduationCap, Calendar, MapPin, Pencil, Trash2, AlertCircle } from '@tamagui/lucide-icons'
import { DashboardWidget } from '@app/ui'
import { ProfileEmptyState, EducationEntryEditModal } from './components'
import { formatDateRange } from './utils/date-formatting'
import { api } from '@app/core/utils/api'
import { useState } from 'react'
import { useToastController } from '@tamagui/toast'
import type { EducationEntry } from './types/education'

/**
 * Profile Education Right Component
 * Displays saved education entries in the right column
 */
export function ProfileEducationRight() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<EducationEntry | null>(null)
  const toast = useToastController()
  
  // Query saved education data
  const educationQuery = api.profile.getEducation.useQuery()
  const educationEntries = (educationQuery.data ?? []) as EducationEntry[]
  
  // Delete mutation
  const deleteEducationMutation = api.profile.deleteEducation.useMutation({
    onError: (error: unknown) => {
      toast.show('Delete Failed', {
        message: error instanceof Error ? error.message : 'Failed to delete education entry. Please try again.',
      })
    },
    onSuccess: () => {
      toast.show('Education Deleted', {
        message: 'The education entry has been removed.',
      })
      educationQuery.refetch()
      setDeleteDialogOpen(null)
    },
  })
  
  const handleDelete = (educationId: string | null | undefined) => {
    if (!educationId) {
      toast.show('Delete Failed', {
        message: 'Missing education identifier. Please try again.',
      })
      return
    }
    deleteEducationMutation.mutate({ educationId })
  }

  // Show loading state
  if (educationQuery.isLoading) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading education data...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  // Show error state
  if (educationQuery.isError) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Text color="$red10">Failed to load education data</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <H4>Saved Education</H4>

      <Text color="$color11" fontSize="$3" mb="$4">
        Your education history is displayed here. Edit entries in the left panel.
      </Text>

      {educationEntries.length === 0 ? (
        <ProfileEmptyState
          icon={GraduationCap}
          message="No education history saved yet. Add your first education entry in the left panel."
        />
      ) : (
        <YStack gap="$3">
          {educationEntries.map((edu) => {
            const normalizedGpa =
              typeof edu.gpa === 'number' ? edu.gpa : edu.gpa != null ? Number(edu.gpa) : undefined
            const hasValidGpa =
              typeof normalizedGpa === 'number' && !Number.isNaN(normalizedGpa)

            return (
            <YStack
              key={edu.id}
              p="$4"
              gap="$3"
              bg="$background"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$4"
              hoverStyle={{
                borderColor: '$borderColorHover',
                bg: '$backgroundHover',
              }}
            >
              {/* Institution Name with Verification Badge */}
              <YStack gap="$1">
                <XStack gap="$2" items="center" flexWrap="wrap">
                  <Text fontSize="$6" fontWeight="700" color="$color12">
                    {edu.institution_name}
                  </Text>
                  {!edu.is_verified && (
                    <XStack gap="$1" items="center">
                      <AlertCircle size={14} color="$orange10" />
                      <Text fontSize="$1" color="$orange10">
                        Pending verification
                      </Text>
                    </XStack>
                  )}
                </XStack>
                
                {/* Current Education Badge */}
                {edu.is_current && (
                  <XStack gap="$1" items="center">
                    <Text fontSize="$2" fontWeight="600" color="$blue10">
                      Current
                    </Text>
                  </XStack>
                )}

                {/* Degree Type */}
                {edu.degree_type && (
                  <Text fontSize="$4" fontWeight="600" color="$color11">
                    {edu.degree_type}
                  </Text>
                )}

                {/* Field of Study */}
                {edu.field_of_study && (
                  <Text fontSize="$3" color="$color11">
                    {edu.field_of_study}
                  </Text>
                )}
                
                {/* GPA */}
                {hasValidGpa && (
                  <Text fontSize="$3" color="$color11">
                    GPA: {normalizedGpa.toFixed(1)}/4.0
                  </Text>
                )}
              </YStack>
              
              {/* Delete Confirmation Dialog */}
              <Dialog
                open={deleteDialogOpen === edu.id}
                onOpenChange={(open) => !open && setDeleteDialogOpen(null)}
              >
                <Dialog.Portal>
                  <Dialog.Overlay />
                  <Dialog.Content>
                    <Dialog.Title>Delete Education Entry</Dialog.Title>
                    <Dialog.Description>
                      Are you sure you want to delete this education entry? This action cannot be undone.
                    </Dialog.Description>
                    <XStack gap="$3" justify="flex-end" mt="$4">
                      <Button
                        variant="outlined"
                        onPress={() => setDeleteDialogOpen(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        theme="error"
                        onPress={() => handleDelete(edu.id)}
                        disabled={deleteEducationMutation.isLoading}
                      >
                        {deleteEducationMutation.isLoading ? 'Deleting...' : 'Delete'}
                      </Button>
                    </XStack>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog>

              {/* Details */}
              <YStack gap="$2">
                <XStack items="center" flexWrap="wrap" gap="$3">
                  {(edu.start_date || edu.end_date || edu.is_current) && (
                    <XStack gap="$2" items="center">
                      <Calendar size={16} color="$color11" />
                      <Text fontSize="$2" color="$color11">
                        {formatDateRange(
                          edu.start_date,
                          edu.end_date,
                          Boolean(edu.is_current),
                          edu.expected_graduation_date
                        )}
                      </Text>
                    </XStack>
                  )}

                  <XStack gap="$2" ml="auto">
                    <Button
                      size="$2"
                      variant="outlined"
                      circular
                      icon={Pencil}
                      aria-label="Edit education entry"
                      accessibilityLabel="Edit education entry"
                      onPress={() => setEditingEntry(edu)}
                    />
                    <Button
                      size="$2"
                      variant="outlined"
                      circular
                      icon={Trash2}
                      aria-label="Delete education entry"
                      accessibilityLabel="Delete education entry"
                      onPress={() => setDeleteDialogOpen(edu.id ?? null)}
                    />
                  </XStack>
                </XStack>

                {/* Location */}
                {edu.location && (
                  <XStack gap="$2" items="center">
                    <MapPin size={16} color="$color11" />
                    <Text fontSize="$2" color="$color11">
                      {edu.location}
                    </Text>
                  </XStack>
                )}

                {/* Description */}
                {edu.description && (
                  <YStack gap="$1">
                    <Text fontSize="$2" fontWeight="600" color="$color11">
                      Description:
                    </Text>
                    <Text fontSize="$2" color="$color11">
                      {edu.description}
                    </Text>
                  </YStack>
                )}
              </YStack>
            </YStack>
            )
          })}
        </YStack>
      )}

      {/* Edit Modal */}
      <EducationEntryEditModal
        open={!!editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
        educationEntry={editingEntry}
        onSuccess={() => {
          educationQuery.refetch()
        }}
      />
    </DashboardWidget>
  )
}
