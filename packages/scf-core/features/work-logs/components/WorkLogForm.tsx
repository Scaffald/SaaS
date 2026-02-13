import { MapPin, Plus, Save } from 'lucide-react-native'
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
  Row,
  Stack,
  useThemeContext,
} from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
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
  const { theme } = useThemeContext()
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
        <Stack gap={20} padding="md" paddingBottom={32}>
          <Stack gap={8}>
            <Text>Work Log Details</Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              Provide information about the work performed, including project, schedule, and skills.
            </Text>
          </Stack>

          <Stack gap={12}>
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
          </Stack>

          <Stack gap={12}>
            <Text>Log Date</Text>
            <Controller
              control={control}
              name="logDate"
              render={({ field }) => (
                <Input {...field} {...getDateInputProps()} placeholder="YYYY-MM-DD" />
              )}
            />
            {errors.logDate?.message && <Text style={{ color: colors.text[theme].error }}>{errors.logDate.message}</Text>}
          </Stack>

          <Stack gap={12}>
            <Row justify="space-between" align="center">
              <Text>Time Entries</Text>
              <Button size="sm" iconStart={Plus} onPress={addTimeEntry} variant="outline">
                Add Entry
              </Button>
            </Row>

            <Stack gap={12}>
              {timeEntryFields.map((field, index) => (
                <TimeEntryInput
                  key={field.id}
                  index={index}
                  onRemove={() => removeTimeEntry(index)}
                  disableRemove={timeEntryFields.length <= 1}
                />
              ))}
            </Stack>

            <Row gap={8} align="center">
              <Text>Total Hours: {totalHours.toFixed(2)}</Text>
              {overlapDetected && <Text style={{ color: colors.text[theme].error }}>Overlapping time entries detected.</Text>}
            </Row>
          </Stack>

          <Stack gap={12}>
            <Text>Work Description</Text>
            <Controller
              control={control}
              name="workDescription"
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Describe the work that was completed during this period"
                  multiline
                  
                  textAlignVertical="top"
                />
              )}
            />
            {errors.workDescription?.message && (
              <Text style={{ color: colors.text[theme].error }}>{errors.workDescription.message}</Text>
            )}
          </Stack>

          <Stack gap={12}>
            <Text>Tasks Completed</Text>
            <Row gap={8} align="center">
              <Input
                value={taskDraft}
                onChangeText={setTaskDraft}
                placeholder="Add a task and press the plus icon"
                flex={1}
              />
              <Button size="sm" iconStart={Plus} onPress={addTask}>
                Add
              </Button>
            </Row>

            <Stack gap={8}>
              {tasksWithKeys.length === 0 && <Text style={{ color: colors.text[theme].secondary }}>No tasks added yet.</Text>}

              {tasksWithKeys.map(({ task, key, index }) => (
                <Row
                  key={key}
                  align="center"
                  justify="space-between"
                  borderWidth={1}
                  style={{ borderColor: colors.border[theme].default }}
                  borderRadius={12}
                  paddingHorizontal={12}
                  paddingVertical={8}
                  gap={12}
                >
                  <Text flex={1}>{task}</Text>
                  <Button size="xs" variant="outline" onPress={() => removeTask(index)}>
                    Remove
                  </Button>
                </Row>
              ))}
            </Stack>
          </Stack>

          <Separator />

          <Stack gap={12}>
            <Text>Skills Used</Text>
            {skillsQuery.isLoading && (
              <Row gap={8} align="center">
                <Spinner size="sm" />
                <Text>Loading your skills…</Text>
              </Row>
            )}

            {skillsQuery.error && <Text style={{ color: colors.text[theme].error }}>Unable to load skills at this time.</Text>}

            {skillOptions.length === 0 && !skillsQuery.isLoading && (
              <Text style={{ color: colors.text[theme].secondary }}>You do not have any skills associated with your profile yet.</Text>
            )}

            <Stack gap={8}>
              {skillOptions.map((skill) => (
                <Row key={skill.id} gap={8} align="center">
                  <Checkbox
                    checked={selectedSkills.includes(skill.id)}
                    onChange={(next) => toggleSkill(skill.id, next === true)}
                  />
                  <Text>{skill.name}</Text>
                </Row>
              ))}
            </Stack>
          </Stack>

          <Separator />

          <Stack gap={12}>
            <Text>Location Capture</Text>
            <Row gap={8} align="center">
              <Button
                iconStart={MapPin}
                onPress={captureLocation}
                size="sm"
                variant="outline"
                disabled={location.isLoading}
              >
                {location.isLoading ? 'Capturing…' : 'Capture Location'}
              </Button>
              {location.error && <Text style={{ color: colors.text[theme].error }}>{location.error}</Text>}
            </Row>

            {form.watch('gpsCapture') && (
              <Stack
                borderWidth={1}
                style={{ borderColor: colors.border[theme].default }}
                borderRadius={12}
                paddingHorizontal={12}
                paddingVertical={8}
                gap={4}
              >
                <Text>Captured Location</Text>
                <Text>
                  Latitude: {form.watch('gpsCapture')?.latitude}, Longitude:{' '}
                  {form.watch('gpsCapture')?.longitude}
                </Text>
                {form.watch('gpsCapture')?.accuracyMeters && (
                  <Text>Accuracy: {form.watch('gpsCapture')?.accuracyMeters} meters</Text>
                )}
              </Stack>
            )}
          </Stack>

          <Separator />

          <PhotoUpload workLogId={workLogId} />

          <Separator />

          <Stack gap={8}>
            <Text>Draft Status</Text>
            {autoSaveStatus.state === 'saving' && <Text style={{ color: colors.text[theme].secondary }}>Saving draft…</Text>}
            {autoSaveStatus.state === 'saved' && (
              <Text style={{ color: colors.text[theme].success }}>
                {autoSaveStatus.message ?? 'Draft saved'}{' '}
                {autoSaveStatus.savedAt
                  ? new Date(autoSaveStatus.savedAt).toLocaleTimeString()
                  : ''}
              </Text>
            )}
            {autoSaveStatus.state === 'error' && (
              <Text style={{ color: colors.text[theme].error }}>
                {autoSaveStatus.message ?? 'Auto-save encountered an error.'}
              </Text>
            )}
            {autoSaveStatus.state === 'invalid' && (
              <Text style={{ color: colors.text[theme].warning }}>
                {autoSaveStatus.message ??
                  'Form is incomplete. Fill in required fields to auto-save.'}
              </Text>
            )}
            {pendingOfflineDraft && (
              <Text style={{ color: colors.text[theme].warning }}>
                Offline draft queued. It will sync automatically when you are online.
              </Text>
            )}
          </Stack>

          <Button iconStart={Save} size="lg" onPress={() => submit()} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
        </Stack>
      </ScrollView>
    </FormProvider>
  )
}
