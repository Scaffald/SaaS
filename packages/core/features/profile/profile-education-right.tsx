import { YStack, XStack, Text, Spinner, H4, Button, Dialog } from 'tamagui'
import { GraduationCap, Calendar, Award, MapPin, Pencil, Trash2, CheckCircle, AlertCircle } from '@tamagui/lucide-icons'
import { DashboardWidget } from '@app/ui'
import { ProfileEmptyState, EducationEntryEditModal } from './components'
import { formatDateRange } from './utils/date-formatting'
import { api } from '@app/core/utils/api'
import { useState } from 'react'

/**
 * Profile Education Right Component
 * Displays saved education entries in the right column
 */
export function ProfileEducationRight() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  // biome-ignore lint/suspicious/noExplicitAny: tRPC types not yet generated
  const [editingEntry, setEditingEntry] = useState<any | null>(null)
  
  // Query saved education data
  const educationQuery = api.profile.getEducation.useQuery()
  
  // Delete mutation
  const deleteEducationMutation = api.profile.deleteEducation.useMutation({
    onSuccess: () => {
      educationQuery.refetch()
      setDeleteDialogOpen(null)
    },
  })
  
  const handleDelete = (educationId: string) => {
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

      {!educationQuery.data || educationQuery.data.length === 0 ? (
        <ProfileEmptyState
          icon={GraduationCap}
          message="No education history saved yet. Add your first education entry in the left panel."
        />
      ) : (
        <YStack gap="$3">
          {/* biome-ignore lint/suspicious/noExplicitAny: tRPC types not yet generated */}
          {educationQuery.data.map((edu: any) => (
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
              <XStack justify="space-between" items="flex-start">
                <YStack gap="$1" flex={1}>
                  <XStack gap="$2" items="center">
                    <Text fontSize="$6" fontWeight="700" color="$color12">
                      {edu.institution_name}
                    </Text>
                    {edu.is_verified ? (
                      <CheckCircle size={16} color="$green10" />
                    ) : (
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
                  {edu.gpa && (
                    <Text fontSize="$3" color="$color11">
                      GPA: {edu.gpa.toFixed(2)}/4.0
                    </Text>
                  )}
                </YStack>
                
                {/* Action Buttons */}
                <XStack gap="$2">
                  <Button
                    size="$2"
                    variant="outlined"
                    icon={Pencil}
                    onPress={() => setEditingEntry(edu)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="$2"
                    variant="outlined"
                    icon={Trash2}
                    onPress={() => setDeleteDialogOpen(edu.id)}
                  >
                    Delete
                  </Button>
                </XStack>
              </XStack>
              
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
                        theme="red"
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
                {/* Dates */}
                {(edu.start_date || edu.end_date || edu.is_current) && (
                  <YStack gap="$1">
                    <Calendar size={16} color="$color11" />
                    <Text fontSize="$2" color="$color11">
                      {formatDateRange(
                        edu.start_date, 
                        edu.end_date, 
                        edu.is_current,
                        edu.expected_graduation_date
                      )}
                    </Text>
                  </YStack>
                )}

                {/* Location */}
                {edu.location && (
                  <YStack gap="$1">
                    <MapPin size={16} color="$color11" />
                    <Text fontSize="$2" color="$color11">
                      {edu.location}
                    </Text>
                  </YStack>
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
          ))}
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
