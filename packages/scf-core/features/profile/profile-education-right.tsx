import { api } from '@scf/core/utils/api'
import { DashboardWidget, Dialog } from '@unicornlove/beyond-ui'
import { AlertCircle, Calendar, GraduationCap, MapPin, Pencil, Trash2 } from '@tamagui/lucide-icons'
import { useToast } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Button, H4, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { ProfileEmptyState } from './components'
import type { EducationEntry } from './types/education'
import { formatDateRange } from './utils/date-formatting'

interface ProfileEducationRightProps {
  onEditEntry?: (entryId: string) => void
}

/**
 * Profile Education Right Component
 * Displays saved education entries in the right column
 */
export function ProfileEducationRight({ onEditEntry }: ProfileEducationRightProps = {}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)
  const toast = useToast()

  // Query saved education data
  const educationQuery = api.profile.education.getEducation.useQuery()
  const educationEntries = (educationQuery.data ?? []) as EducationEntry[]

  // Delete mutation
  const deleteEducationMutation = api.profile.education.deleteEducation.useMutation({
    onError: (error: unknown) => {
      toast.show({
          title: 'Delete Failed',
          message: error instanceof Error
            ? error.message
            : 'Failed to delete education entry. Please try again.',
          variant: 'error',
        })
    },
    onSuccess: () => {
      toast.show({
          title: 'Education Deleted',
          message: 'The education entry has been removed.',
        })
      educationQuery.refetch()
      setDeleteDialogOpen(null)
    },
  })

  const handleDelete = (educationId: string | null | undefined) => {
    if (!educationId) {
      toast.show({
          title: 'Delete Failed',
          message: 'Missing education identifier. Please try again.',
          variant: 'error',
        })
      return
    }
    deleteEducationMutation.mutate({ educationId })
  }

  // Show loading state
  if (educationQuery.isLoading) {
    return (
      <DashboardWidget>
        <Stack alignItems="center" justifyContent="center" padding="$8" gap="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading education data...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  // Show error state
  if (educationQuery.isError) {
    return (
      <DashboardWidget>
        <Stack alignItems="center" justifyContent="center" padding="$8" gap="$4">
          <Text color="$red10">Failed to load education data</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <H4>Saved Education</H4>

      <Text color="$color11" fontSize="$3" marginBottom="$4">
        Your education history is displayed here. Edit entries in the left panel.
      </Text>

      {educationEntries.length === 0 ? (
        <ProfileEmptyState
          icon={GraduationCap}
          message="No education history saved yet. Add your first education entry in the left panel."
        />
      ) : (
        <Stack gap="$3">
          {educationEntries.map((edu) => {
            const normalizedGpa =
              typeof edu.gpa === 'number' ? edu.gpa : edu.gpa != null ? Number(edu.gpa) : undefined
            const hasValidGpa = typeof normalizedGpa === 'number' && !Number.isNaN(normalizedGpa)

            return (
              <Stack
                key={edu.id}
                padding="$4"
                gap="$3"
                backgroundColor="$background"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                hoverStyle={{
                  borderColor: '$borderColorHover',
                  backgroundColor: '$backgroundHover',
                }}
              >
                {/* Institution Name with Verification Badge */}
                <Stack gap="$1">
                  <Row gap="$2" alignItems="center" flexWrap="wrap">
                    <Text fontSize="$6" fontWeight="700" color="$color12">
                      {edu.institution_name}
                    </Text>
                    {!edu.is_verified && (
                      <Row gap="$1" alignItems="center">
                        <AlertCircle size={14} color="$orange10" />
                        <Text fontSize="$1" color="$orange10">
                          Pending verification
                        </Text>
                      </Row>
                    )}
                  </Row>

                  {/* Current Education Badge */}
                  {edu.is_current && (
                    <Row gap="$1" alignItems="center">
                      <Text fontSize="$2" fontWeight="600" color="$blue10">
                        Current
                      </Text>
                    </Row>
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
                </Stack>

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
                        Are you sure you want to delete this education entry? This action cannot be
                        undone.
                      </Dialog.Description>
                      <Row gap="$3" justifyContent="flex-end" marginTop="$4">
                        <Button variant="outlined" onPress={() => setDeleteDialogOpen(null)}>
                          Cancel
                        </Button>
                        <Button
                          theme="error"
                          onPress={() => handleDelete(edu.id)}
                          disabled={deleteEducationMutation.isPending}
                        >
                          {deleteEducationMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                      </Row>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog>

                {/* Details */}
                <Stack gap="$2">
                  <Row alignItems="center" flexWrap="wrap" gap="$3">
                    {(edu.start_date || edu.end_date || edu.is_current) && (
                      <Row gap="$2" alignItems="center">
                        <Calendar size={16} color="$color11" />
                        <Text fontSize="$2" color="$color11">
                          {formatDateRange(
                            edu.start_date,
                            edu.end_date,
                            Boolean(edu.is_current),
                            edu.expected_graduation_date
                          )}
                        </Text>
                      </Row>
                    )}

                    <Row gap="$2" marginLeft="auto">
                      <Button
                        size="$2"
                        variant="outlined"
                        circular
                        icon={Pencil}
                        aria-label="Edit education entry"
                        accessibilityLabel="Edit education entry"
                        onPress={() => {
                          if (edu.id && onEditEntry) {
                            onEditEntry(edu.id)
                          } else {
                            toast.show({
          title: 'Error',
          message: 'Unable to edit this entry. Please try again.',
          variant: 'error',
        })
                          }
                        }}
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
                    </Row>
                  </Row>

                  {/* Location */}
                  {edu.location && (
                    <Row gap="$2" alignItems="center">
                      <MapPin size={16} color="$color11" />
                      <Text fontSize="$2" color="$color11">
                        {edu.location}
                      </Text>
                    </Row>
                  )}

                  {/* Description */}
                  {edu.description && (
                    <Stack gap="$1">
                      <Text fontSize="$2" fontWeight="600" color="$color11">
                        Description:
                      </Text>
                      <Text fontSize="$2" color="$color11">
                        {edu.description}
                      </Text>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            )
          })}
        </Stack>
      )}
    </DashboardWidget>
  )
}
