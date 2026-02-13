import {
  useEducation,
  useDeleteEducationMutation,
} from '@scf/core/utils/profile-education-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { DashboardWidget, Dialog } from '@unicornlove/beyond-ui'
import { AlertCircle, Calendar, GraduationCap, MapPin, Pencil, Trash2 } from 'lucide-react-native'
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
  const queryClient = useQueryClient()

  // Query saved education data
  const educationQuery = useEducation()
  const educationEntries = (educationQuery.data ?? []) as EducationEntry[]

  // Delete mutation
  const deleteEducationMutation = useDeleteEducationMutation({
    onError: (error: unknown) => {
      toast.show({
        title: 'Delete Failed',
        message:
          error instanceof Error
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
      queryClient.invalidateQueries({ queryKey: ['profiles', 'education'] })
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
  if (educationQuery.isPending) {
    return (
      <DashboardWidget>
        <Stack align="center" justify="center" padding={32} gap={16}>
          <Spinner size="lg" />
          <Text color="$gray11">Loading education data...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  // Show error state
  if (educationQuery.isError) {
    return (
      <DashboardWidget>
        <Stack align="center" justify="center" padding={32} gap={16}>
          <Text color="$red10">Failed to load education data</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <H4>Saved Education</H4>

      <Text color="$gray11" marginBottom={16}>
        Your education history is displayed here. Edit entries in the left panel.
      </Text>

      {educationEntries.length === 0 ? (
        <ProfileEmptyState
          iconStart={GraduationCap}
          message="No education history saved yet. Add your first education entry in the left panel."
        />
      ) : (
        <Stack gap={12}>
          {educationEntries.map((edu) => {
            const normalizedGpa =
              typeof edu.gpa === 'number' ? edu.gpa : edu.gpa != null ? Number(edu.gpa) : undefined
            const hasValidGpa = typeof normalizedGpa === 'number' && !Number.isNaN(normalizedGpa)

            return (
              <Stack
                key={edu.id}
                padding="md"
                gap={12}
                backgroundColor="$background"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius={16}
                hoverStyle={{
                  borderColor: '$borderColorHover',
                  backgroundColor: '$backgroundHover',
                }}
              >
                {/* Institution Name with Verification Badge */}
                <Stack gap={4}>
                  <Row gap={8} align="center" flexWrap="wrap">
                    <Text color="$gray11">{edu.institution_name}</Text>
                    {!edu.is_verified && (
                      <Row gap={4} align="center">
                        <AlertCircle size="md" color="$orange10" />
                        <Text color="$orange10">Pending verification</Text>
                      </Row>
                    )}
                  </Row>

                  {/* Current Education Badge */}
                  {edu.is_current && (
                    <Row gap={4} align="center">
                      <Text color="$blue10">Current</Text>
                    </Row>
                  )}

                  {/* Degree Type */}
                  {edu.degree_type && <Text color="$gray11">{edu.degree_type}</Text>}

                  {/* Field of Study */}
                  {edu.field_of_study && <Text color="$gray11">{edu.field_of_study}</Text>}

                  {/* GPA */}
                  {hasValidGpa && <Text color="$gray11">GPA: {normalizedGpa.toFixed(1)}/4.0</Text>}
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
                      <Row gap={12} justify="flex-end" marginTop={16}>
                        <Button variant="outline" onPress={() => setDeleteDialogOpen(null)}>
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
                <Stack gap={8}>
                  <Row align="center" flexWrap="wrap" gap={12}>
                    {(edu.start_date || edu.end_date || edu.is_current) && (
                      <Row gap={8} align="center">
                        <Calendar size="md" color="$gray11" />
                        <Text color="$gray11">
                          {formatDateRange(
                            edu.start_date,
                            edu.end_date,
                            Boolean(edu.is_current),
                            edu.expected_graduation_date
                          )}
                        </Text>
                      </Row>
                    )}

                    <Row gap={8} marginLeft="auto">
                      <Button
                        size="xs"
                        variant="outline"
                        iconStart={Pencil}
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
                        size="xs"
                        variant="outline"
                        iconStart={Trash2}
                        aria-label="Delete education entry"
                        accessibilityLabel="Delete education entry"
                        onPress={() => setDeleteDialogOpen(edu.id ?? null)}
                      />
                    </Row>
                  </Row>

                  {/* Location */}
                  {edu.location && (
                    <Row gap={8} align="center">
                      <MapPin size="md" color="$gray11" />
                      <Text color="$gray11">{edu.location}</Text>
                    </Row>
                  )}

                  {/* Description */}
                  {edu.description && (
                    <Stack gap={4}>
                      <Text color="$gray11">Description:</Text>
                      <Text color="$gray11">{edu.description}</Text>
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
