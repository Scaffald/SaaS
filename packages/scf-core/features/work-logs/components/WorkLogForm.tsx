import { MapPin, Plus, Save } from '@tamagui/lucide-icons'
import { useMemo, useState } from 'react'
import { Controller, FormProvider } from 'react-hook-form'
import { Platform } from 'react-native'
import {
  Button,
  Checkbox,
  Input,
  ScrollView,
  Separator,
  Spinner,
  Text,
  XStack,
  YStack,
} from '@unicornlove/ui'
import { type UseWorkLogFormOptions, useWorkLogForm } from '../hooks/useWorkLogForm'
import { PhotoUpload } from './PhotoUpload'
import { ProjectSelector } from './ProjectSelector'
import { TimeEntryInput } from './TimeEntryInput'
import { mapExplicitSkillsToOptions, normalizeProjectOptions } from '../utils/data-normalizers'

const getDateInputProps = () => {
  if (Platform.OS === 'web') {
    return { type: 'date' as const }
  }
  return {
    inputMode: 'numeric' as const,
    keyboardType: 'numbers-and-punctuation' as const,
  }
}

export interface WorkLogFormProps extends UseWorkLogFormOptions {
  /**
   * Label for the primary submit button.
   */
  submitLabel?: string
}

export function WorkLogForm({ submitLabel = 'Save Work Log', ...options }: WorkLogFormProps) {
  const {
    form,
    timeEntryFields,
    addTimeEntry,
    removeTimeEntry,
    totalHours,
    overlapDetected,
    autoSaveStatus,
    submit,
    isSubmitting,
    captureLocation,
    location,
    projectOptionsQuery,
    organizationFilter,
    setOrganizationFilter,
    skillsQuery,
    pendingOfflineDraft,
    workLogId,
  } = useWorkLogForm(options)

  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = form

  const tasksCompleted = watch('tasksCompleted') ?? []
  const selectedSkills = watch('skillsUsed') ?? []

  const [taskDraft, setTaskDraft] = useState('')

  const projectData = normalizeProjectOptions(projectOptionsQuery.data)

  const projectError = projectOptionsQuery.error
    ? (projectOptionsQuery.error.message ?? 'Unable to load project options.')
    : null

  const tasksWithKeys = useMemo(() => {
    const counts = new Map<string, number>()
    return tasksCompleted.map((task, index) => {
      const current = counts.get(task) ?? 0
      counts.set(task, current + 1)
      return {
        task,
        key: `${task}-${current}`,
        index,
      }
    })
  }, [tasksCompleted])

  const skillOptions = useMemo(
    () => mapExplicitSkillsToOptions(skillsQuery.data),
    [skillsQuery.data]
  )

  const addTask = () => {
    const trimmed = taskDraft.trim()
    if (!trimmed) {
      return
    }
    setValue('tasksCompleted', [...tasksCompleted, trimmed])
    setTaskDraft('')
  }

  const removeTask = (index: number) => {
    const nextTasks = tasksCompleted.filter((_, taskIndex) => taskIndex !== index)
    setValue('tasksCompleted', nextTasks)
  }

  const toggleSkill = (skillId: string, checked: boolean) => {
    if (checked) {
      if (selectedSkills.includes(skillId)) {
        return
      }
      setValue('skillsUsed', [...selectedSkills, skillId])
    } else {
      setValue(
        'skillsUsed',
        selectedSkills.filter((id) => id !== skillId)
      )
    }
  }

  return (
    <FormProvider {...form}>
      <ScrollView>
        <YStack gap="$5" padding="$4" paddingBottom="$8">
          <YStack gap="$2">
            <Text fontSize="$6" fontWeight="700">
              Work Log Details
            </Text>
            <Text fontSize="$3" color="$color10">
              Provide information about the work performed, including project, schedule, and skills.
            </Text>
          </YStack>

          <YStack gap="$3">
            <Controller
              control={control}
              name="projectId"
              render={({ field }) => (
                <ProjectSelector
                  value={field.value}
                  onChange={field.onChange}
                  organizations={projectData.organizations}
                  projects={projectData.projects}
                  isLoading={projectOptionsQuery.isLoading}
                  error={projectError}
                  onRetry={projectOptionsQuery.refetch}
                  organizationFilter={organizationFilter}
                  onOrganizationFilterChange={setOrganizationFilter}
                  disabled={projectOptionsQuery.isLoading}
                  helperText={
                    errors.projectId?.message ??
                    'Projects are filtered to the organizations you belong to.'
                  }
                />
              )}
            />
          </YStack>

          <YStack gap="$3">
            <Text fontWeight="600" fontSize="$4">
              Log Date
            </Text>
            <Controller
              control={control}
              name="logDate"
              render={({ field }) => (
                <Input {...field} {...getDateInputProps()} placeholder="YYYY-MM-DD" />
              )}
            />
            {errors.logDate?.message && (
              <Text fontSize="$2" color="$red10">
                {errors.logDate.message}
              </Text>
            )}
          </YStack>

          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="600" fontSize="$4">
                Time Entries
              </Text>
              <Button size="$3" icon={Plus} onPress={addTimeEntry} variant="outlined">
                Add Entry
              </Button>
            </XStack>

            <YStack gap="$3">
              {timeEntryFields.map((field, index) => (
                <TimeEntryInput
                  key={field.id}
                  index={index}
                  onRemove={() => removeTimeEntry(index)}
                  disableRemove={timeEntryFields.length <= 1}
                />
              ))}
            </YStack>

            <XStack gap="$2" alignItems="center">
              <Text fontWeight="600" fontSize="$3">
                Total Hours: {totalHours.toFixed(2)}
              </Text>
              {overlapDetected && (
                <Text fontSize="$2" color="$red10">
                  Overlapping time entries detected.
                </Text>
              )}
            </XStack>
          </YStack>

          <YStack gap="$3">
            <Text fontWeight="600" fontSize="$4">
              Work Description
            </Text>
            <Controller
              control={control}
              name="workDescription"
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Describe the work that was completed during this period"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />
            {errors.workDescription?.message && (
              <Text fontSize="$2" color="$red10">
                {errors.workDescription.message}
              </Text>
            )}
          </YStack>

          <YStack gap="$3">
            <Text fontWeight="600" fontSize="$4">
              Tasks Completed
            </Text>
            <XStack gap="$2" alignItems="center">
              <Input
                value={taskDraft}
                onChangeText={setTaskDraft}
                placeholder="Add a task and press the plus icon"
                flex={1}
              />
              <Button size="$3" icon={Plus} onPress={addTask}>
                Add
              </Button>
            </XStack>

            <YStack gap="$2">
              {tasksWithKeys.length === 0 && (
                <Text fontSize="$3" color="$color10">
                  No tasks added yet.
                </Text>
              )}

              {tasksWithKeys.map(({ task, key, index }) => (
                <XStack
                  key={key}
                  alignItems="center"
                  justifyContent="space-between"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$3"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  gap="$3"
                >
                  <Text flex={1} fontSize="$3">
                    {task}
                  </Text>
                  <Button size="$2" variant="outlined" onPress={() => removeTask(index)}>
                    Remove
                  </Button>
                </XStack>
              ))}
            </YStack>
          </YStack>

          <Separator />

          <YStack gap="$3">
            <Text fontWeight="600" fontSize="$4">
              Skills Used
            </Text>
            {skillsQuery.isLoading && (
              <XStack gap="$2" alignItems="center">
                <Spinner size="small" />
                <Text fontSize="$3">Loading your skills…</Text>
              </XStack>
            )}

            {skillsQuery.error && (
              <Text fontSize="$3" color="$red10">
                Unable to load skills at this time.
              </Text>
            )}

            {skillOptions.length === 0 && !skillsQuery.isLoading && (
              <Text fontSize="$3" color="$color10">
                You do not have any skills associated with your profile yet.
              </Text>
            )}

            <YStack gap="$2">
              {skillOptions.map((skill) => (
                <XStack key={skill.id} gap="$2" alignItems="center">
                  <Checkbox
                    checked={selectedSkills.includes(skill.id)}
                    onCheckedChange={(next) => toggleSkill(skill.id, next === true)}
                  />
                  <Text fontSize="$3">{skill.name}</Text>
                </XStack>
              ))}
            </YStack>
          </YStack>

          <Separator />

          <YStack gap="$3">
            <Text fontWeight="600" fontSize="$4">
              Location Capture
            </Text>
            <XStack gap="$2" alignItems="center">
              <Button
                icon={MapPin}
                onPress={captureLocation}
                size="$3"
                variant="outlined"
                disabled={location.isLoading}
              >
                {location.isLoading ? 'Capturing…' : 'Capture Location'}
              </Button>
              {location.error && (
                <Text fontSize="$3" color="$red10">
                  {location.error}
                </Text>
              )}
            </XStack>

            {form.watch('gpsCapture') && (
              <YStack
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$3"
                paddingHorizontal="$3"
                paddingVertical="$2"
                gap="$1"
              >
                <Text fontSize="$3" fontWeight="600">
                  Captured Location
                </Text>
                <Text fontSize="$3">
                  Latitude: {form.watch('gpsCapture')?.latitude}, Longitude:{' '}
                  {form.watch('gpsCapture')?.longitude}
                </Text>
                {form.watch('gpsCapture')?.accuracyMeters && (
                  <Text fontSize="$3">
                    Accuracy: {form.watch('gpsCapture')?.accuracyMeters} meters
                  </Text>
                )}
              </YStack>
            )}
          </YStack>

          <Separator />

          <PhotoUpload workLogId={workLogId} />

          <Separator />

          <YStack gap="$2">
            <Text fontWeight="600" fontSize="$4">
              Draft Status
            </Text>
            {autoSaveStatus.state === 'saving' && (
              <Text fontSize="$3" color="$color10">
                Saving draft…
              </Text>
            )}
            {autoSaveStatus.state === 'saved' && (
              <Text fontSize="$3" color="$green10">
                {autoSaveStatus.message ?? 'Draft saved'}{' '}
                {autoSaveStatus.savedAt
                  ? new Date(autoSaveStatus.savedAt).toLocaleTimeString()
                  : ''}
              </Text>
            )}
            {autoSaveStatus.state === 'error' && (
              <Text fontSize="$3" color="$red10">
                {autoSaveStatus.message ?? 'Auto-save encountered an error.'}
              </Text>
            )}
            {autoSaveStatus.state === 'invalid' && (
              <Text fontSize="$3" color="$orange10">
                {autoSaveStatus.message ??
                  'Form is incomplete. Fill in required fields to auto-save.'}
              </Text>
            )}
            {pendingOfflineDraft && (
              <Text fontSize="$3" color="$orange10">
                Offline draft queued. It will sync automatically when you are online.
              </Text>
            )}
          </YStack>

          <Button icon={Save} size="$5" onPress={() => submit()} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
        </YStack>
      </ScrollView>
    </FormProvider>
  )
}
