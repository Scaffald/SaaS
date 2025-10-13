import { useEffect, useState } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  H4,
  TextArea,
  Select,
  Checkbox,
  Adapt,
  Sheet,
  useWindowDimensions,
  Spinner,
  Label,
  Card,
  Separator,
} from 'tamagui'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus,
  X,
  ChevronDown,
  Briefcase,
  Calendar,
  MapPin,
  Building2,
  TrendingUp,
} from '@tamagui/lucide-icons'
import { ProfileEmptyState } from './components'
import { formatDateRange } from './utils/date-formatting'
import { randomUUID } from 'expo-crypto'
import {
  experienceProfileSchema,
  type ExperienceProfileFormData,
  experienceProfileDefaults,
  createNewExperienceEntry,
  EMPLOYMENT_TYPE_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  CAREER_LEVEL_OPTIONS,
} from './config'
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'

/**
 * Profile Experience Left Component
 * Form for managing work experience history
 */
export function ProfileExperienceLeft() {
  const [isLoading, setIsLoading] = useState(false)
  const { width } = useWindowDimensions()
  const isMobile = width < 640

  // Queries
  const experienceQuery = api.profile.getExperience.useQuery()
  const experienceSummaryQuery = api.profile.getExperienceSummary.useQuery()

  // Mutations
  const saveExperienceMutation = api.profile.saveExperience.useMutation({
    onSuccess: () => {
      experienceQuery.refetch()
      experienceSummaryQuery.refetch()
    },
  })

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ExperienceProfileFormData>({
    resolver: zodResolver(experienceProfileSchema),
    defaultValues: experienceProfileDefaults,
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'experience_entries',
  })

  // Load data when queries succeed
  useEffect(() => {
    if (experienceQuery.data && experienceSummaryQuery.data) {
      reset({
        career_level: experienceSummaryQuery.data.career_level || undefined,
        // biome-ignore lint/suspicious/noExplicitAny: API response type
        experience_entries: experienceQuery.data.map((exp: any) => ({
          id: exp.id,
          job_title: exp.job_title,
          company_name: exp.company_name,
          employment_type: exp.employment_type || undefined,
          location: exp.location || undefined,
          is_remote: exp.is_remote,
          start_date: exp.start_date || undefined,
          end_date: exp.end_date || undefined,
          is_current: exp.is_current,
          description: exp.description || undefined,
          key_achievements: exp.key_achievements || undefined,
          skills_used: exp.skills_used || undefined,
          industry: exp.industry || undefined,
          company_size: exp.company_size || undefined,
          salary_range: exp.salary_range || undefined,
          is_verified: exp.is_verified,
        })),
      })
    }
  }, [experienceQuery.data, experienceSummaryQuery.data, reset])

  const onSubmit = async (data: ExperienceProfileFormData) => {
    setIsLoading(true)
    try {
      await saveExperienceMutation.mutateAsync({
        career_level: data.career_level || null,
        experience_entries: data.experience_entries || [],
      })
    } catch (error) {
      console.error('Error saving experience:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addExperienceEntry = () => {
    append(createNewExperienceEntry())
  }

  // Show loading state
  if (experienceQuery.isLoading || experienceSummaryQuery.isLoading) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading experience data...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  // Show error state
  if (experienceQuery.isError || experienceSummaryQuery.isError) {
    return (
      <DashboardWidget>
        <YStack items="center" justify="center" p="$8" gap="$4">
          <Text color="$red10">Failed to load experience data</Text>
          <Button onPress={() => experienceQuery.refetch()}>Retry</Button>
        </YStack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <H4>Work Experience</H4>

      <YStack gap="$4">
        {/* Experience Summary */}
        <XStack gap="$3">
          <YStack gap="$2" flex={1}>
            <Text fontWeight="600">Total Years Experience</Text>
            <Input placeholder="e.g. 5" keyboardType="numeric" disabled opacity={0.5} />
          </YStack>

          <YStack gap="$2" flex={1}>
            <Text fontWeight="600">Career Level</Text>
            <Controller
              name="career_level"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <Select.Trigger iconAfter={ChevronDown}>
                    <Select.Value placeholder="Select career level" />
                  </Select.Trigger>

                  <Adapt when={isMobile} platform="touch">
                    <Sheet
                      native
                      modal
                      dismissOnSnapToBottom
                      animationConfig={{
                        type: 'spring',
                        damping: 20,
                        mass: 1.2,
                        stiffness: 250,
                      }}
                    >
                      <Sheet.Frame>
                        <Sheet.ScrollView>
                          <Adapt.Contents />
                        </Sheet.ScrollView>
                      </Sheet.Frame>
                      <Sheet.Overlay
                        animation="lazy"
                        enterStyle={{ opacity: 0 }}
                        exitStyle={{ opacity: 0 }}
                      />
                    </Sheet>
                  </Adapt>

                  <Select.Content>
                    <Select.ScrollUpButton />
                    <Select.Viewport>
                      {CAREER_LEVEL_OPTIONS.map((level) => (
                        <Select.Item key={level} value={level} index={0}>
                          <Select.ItemText>{level}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                  </Select.Content>
                </Select>
              )}
            />
          </YStack>
        </XStack>

        {/* Experience Entries */}
        <YStack gap="$3">
          <XStack justify="space-between" items="center">
            <Text fontWeight="600">Work History</Text>
            <Button size="$3" onPress={addExperienceEntry} icon={Plus}>
              Add Experience
            </Button>
          </XStack>

          {fields.map((field, index) => (
            <YStack
              key={field.id}
              gap="$3"
              p="$3"
              borderWidth={1}
              borderColor="$borderColor"
              rounded="$4"
            >
              <XStack justify="space-between" items="center">
                <Text fontWeight="600">Position {index + 1}</Text>
                <Button size="$2" variant="outlined" onPress={() => remove(index)} icon={X}>
                  Remove
                </Button>
              </XStack>

              {/* Job Title and Company */}
              <XStack gap="$3">
                <YStack gap="$2" flex={1}>
                  <Text>Job Title *</Text>
                  <Controller
                    name={`experience_entries.${index}.job_title`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="e.g. Electrician"
                        value={field.value}
                        onChangeText={field.onChange}
                        borderColor={
                          errors.experience_entries?.[index]?.job_title ? '$red8' : '$borderColor'
                        }
                      />
                    )}
                  />
                  {errors.experience_entries?.[index]?.job_title && (
                    <Text color="$red10" fontSize="$2">
                      {errors.experience_entries[index]?.job_title?.message}
                    </Text>
                  )}
                </YStack>

                <YStack gap="$2" flex={1}>
                  <Text>Company Name *</Text>
                  <Controller
                    name={`experience_entries.${index}.company_name`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="e.g. ABC Construction"
                        value={field.value}
                        onChangeText={field.onChange}
                        borderColor={
                          errors.experience_entries?.[index]?.company_name
                            ? '$red8'
                            : '$borderColor'
                        }
                      />
                    )}
                  />
                  {errors.experience_entries?.[index]?.company_name && (
                    <Text color="$red10" fontSize="$2">
                      {errors.experience_entries[index]?.company_name?.message}
                    </Text>
                  )}
                </YStack>
              </XStack>

              {/* Employment Type and Location */}
              <XStack gap="$3">
                <YStack gap="$2" flex={1}>
                  <Text>Employment Type</Text>
                  <Controller
                    name={`experience_entries.${index}.employment_type`}
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <Select.Trigger iconAfter={ChevronDown}>
                          <Select.Value placeholder="Select type" />
                        </Select.Trigger>

                        <Adapt when={isMobile} platform="touch">
                          <Sheet
                            native
                            modal
                            dismissOnSnapToBottom
                            animationConfig={{
                              type: 'spring',
                              damping: 20,
                              mass: 1.2,
                              stiffness: 250,
                            }}
                          >
                            <Sheet.Frame>
                              <Sheet.ScrollView>
                                <Adapt.Contents />
                              </Sheet.ScrollView>
                            </Sheet.Frame>
                            <Sheet.Overlay
                              animation="lazy"
                              enterStyle={{ opacity: 0 }}
                              exitStyle={{ opacity: 0 }}
                            />
                          </Sheet>
                        </Adapt>

                        <Select.Content>
                          <Select.ScrollUpButton />
                          <Select.Viewport>
                            {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                              <Select.Item key={type} value={type} index={0}>
                                <Select.ItemText>{type}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                          <Select.ScrollDownButton />
                        </Select.Content>
                      </Select>
                    )}
                  />
                </YStack>

                <YStack gap="$2" flex={1}>
                  <Text>Location</Text>
                  <Controller
                    name={`experience_entries.${index}.location`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="e.g. San Francisco, CA"
                        value={field.value || ''}
                        onChangeText={field.onChange}
                      />
                    )}
                  />
                </YStack>
              </XStack>

              {/* Remote Work Checkbox */}
              <XStack gap="$2" items="center">
                <Controller
                  name={`experience_entries.${index}.is_remote`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id={`remote-${index}`}
                    >
                      <Checkbox.Indicator>
                        <X />
                      </Checkbox.Indicator>
                    </Checkbox>
                  )}
                />
                <Label htmlFor={`remote-${index}`}>Remote Work</Label>
              </XStack>

              {/* Start and End Dates */}
              <XStack gap="$3">
                <YStack gap="$2" flex={1}>
                  <Text>Start Date</Text>
                  <Controller
                    name={`experience_entries.${index}.start_date`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="YYYY-MM-DD"
                        value={field.value || ''}
                        onChangeText={field.onChange}
                      />
                    )}
                  />
                </YStack>

                <YStack gap="$2" flex={1}>
                  <Text>End Date</Text>
                  <Controller
                    name={`experience_entries.${index}.end_date`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="YYYY-MM-DD or 'Present'"
                        value={field.value || ''}
                        onChangeText={field.onChange}
                        disabled={watch(`experience_entries.${index}.is_current`)}
                      />
                    )}
                  />
                </YStack>
              </XStack>

              {/* Currently Working Checkbox */}
              <XStack gap="$2" items="center">
                <Controller
                  name={`experience_entries.${index}.is_current`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id={`current-${index}`}
                    >
                      <Checkbox.Indicator>
                        <X />
                      </Checkbox.Indicator>
                    </Checkbox>
                  )}
                />
                <Label htmlFor={`current-${index}`}>I currently work here</Label>
              </XStack>

              {/* Description */}
              <YStack gap="$2">
                <Text>Job Description</Text>
                <Controller
                  name={`experience_entries.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      placeholder="Describe your responsibilities and duties..."
                      value={field.value || ''}
                      onChangeText={field.onChange}
                      minH={80}
                    />
                  )}
                />
              </YStack>

              {/* Company Size */}
              <YStack gap="$2">
                <Text>Company Size</Text>
                <Controller
                  name={`experience_entries.${index}.company_size`}
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <Select.Trigger iconAfter={ChevronDown}>
                        <Select.Value placeholder="Select company size" />
                      </Select.Trigger>

                      <Adapt when={isMobile} platform="touch">
                        <Sheet
                          native
                          modal
                          dismissOnSnapToBottom
                          animationConfig={{
                            type: 'spring',
                            damping: 20,
                            mass: 1.2,
                            stiffness: 250,
                          }}
                        >
                          <Sheet.Frame>
                            <Sheet.ScrollView>
                              <Adapt.Contents />
                            </Sheet.ScrollView>
                          </Sheet.Frame>
                          <Sheet.Overlay
                            animation="lazy"
                            enterStyle={{ opacity: 0 }}
                            exitStyle={{ opacity: 0 }}
                          />
                        </Sheet>
                      </Adapt>

                      <Select.Content>
                        <Select.ScrollUpButton />
                        <Select.Viewport>
                          {COMPANY_SIZE_OPTIONS.map((size) => (
                            <Select.Item key={size} value={size} index={0}>
                              <Select.ItemText>{size}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                        <Select.ScrollDownButton />
                      </Select.Content>
                    </Select>
                  )}
                />
              </YStack>
            </YStack>
          ))}

          {fields.length === 0 && (
            <YStack p="$4" items="center" gap="$2">
              <Text color="$color11">No work experience added yet</Text>
            </YStack>
          )}
        </YStack>

        {/* Save Button */}
        <XStack justify="flex-end" pt="$4">
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || isLoading}
            opacity={!isDirty || isLoading ? 0.5 : 1}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </XStack>

        <Separator />

        {/* Saved Experience Display */}
        <YStack gap="$3">
          <Text fontWeight="600" fontSize="$5">
            Saved Experience
          </Text>

          {!experienceQuery.data || experienceQuery.data.length === 0 ? (
            <ProfileEmptyState
              icon={Briefcase}
              message="No work experience saved yet. Add your first experience entry above and click Save Changes."
            />
          ) : (
            <YStack gap="$3">
              {/* biome-ignore lint/suspicious/noExplicitAny: tRPC types not yet generated */}
              {experienceQuery.data.map((exp: any) => (
                <Card key={exp.id} bordered size="$4">
                  <Card.Header gap="$3">
                    {/* Header */}
                    <YStack gap="$2">
                      <XStack justify="space-between" items="flex-start">
                        <YStack gap="$1" flex={1}>
                          <H4>{exp.job_title}</H4>
                          <XStack gap="$2" items="center" flexWrap="wrap">
                            <Text color="$color11" fontSize="$3" fontWeight="600">
                              {exp.company_name}
                            </Text>
                            {exp.employment_type && (
                              <>
                                <Text color="$color11" fontSize="$2">
                                  •
                                </Text>
                                <Text color="$color11" fontSize="$2">
                                  {exp.employment_type}
                                </Text>
                              </>
                            )}
                            {exp.is_current && (
                              <>
                                <Text color="$color11" fontSize="$2">
                                  •
                                </Text>
                                <Text color="$green10" fontSize="$2" fontWeight="600">
                                  Current Position
                                </Text>
                              </>
                            )}
                          </XStack>
                        </YStack>
                      </XStack>
                    </YStack>

                    <Separator />

                    {/* Details */}
                    <YStack gap="$2">
                      {/* Dates */}
                      {(exp.start_date || exp.end_date) && (
                        <XStack gap="$2" items="center">
                          <Calendar size={16} color="$color11" />
                          <Text fontSize="$2" color="$color11">
                            {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                          </Text>
                        </XStack>
                      )}

                      {/* Location */}
                      {exp.location && (
                        <XStack gap="$2" items="center">
                          <MapPin size={16} color="$color11" />
                          <Text fontSize="$2" color="$color11">
                            {exp.location}
                            {exp.is_remote && ' (Remote)'}
                          </Text>
                        </XStack>
                      )}

                      {/* Company Size */}
                      {exp.company_size && (
                        <XStack gap="$2" items="center">
                          <Building2 size={16} color="$color11" />
                          <Text fontSize="$2" color="$color11">
                            {exp.company_size}
                          </Text>
                        </XStack>
                      )}

                      {/* Industry */}
                      {exp.industry && (
                        <XStack gap="$2" items="center">
                          <TrendingUp size={16} color="$color11" />
                          <Text fontSize="$2" color="$color11">
                            {exp.industry}
                          </Text>
                        </XStack>
                      )}

                      {/* Description */}
                      {exp.description && (
                        <YStack gap="$1">
                          <Text fontSize="$2" fontWeight="600" color="$color11">
                            Description:
                          </Text>
                          <Text fontSize="$3" color="$color11">
                            {exp.description}
                          </Text>
                        </YStack>
                      )}

                      {/* Key Achievements */}
                      {exp.key_achievements && exp.key_achievements.length > 0 && (
                        <YStack gap="$1">
                          <Text fontSize="$2" fontWeight="600" color="$color11">
                            Key Achievements:
                          </Text>
                          <YStack gap="$1" pl="$2">
                            {exp.key_achievements.map((achievement: string) => (
                              <XStack key={randomUUID()} gap="$2">
                                <Text fontSize="$2" color="$color11">
                                  •
                                </Text>
                                <Text fontSize="$2" color="$color11" flex={1}>
                                  {achievement}
                                </Text>
                              </XStack>
                            ))}
                          </YStack>
                        </YStack>
                      )}

                      {/* Skills Used */}
                      {exp.skills_used && exp.skills_used.length > 0 && (
                        <YStack gap="$1">
                          <Text fontSize="$2" fontWeight="600" color="$color11">
                            Skills:
                          </Text>
                          <XStack gap="$2" flexWrap="wrap">
                            {exp.skills_used.map((skill: string) => (
                              <XStack
                                key={randomUUID()}
                                px="$2"
                                py="$1"
                                bg="$backgroundHover"
                                rounded="$2"
                                borderWidth={1}
                                borderColor="$borderColor"
                              >
                                <Text fontSize="$2" color="$color11">
                                  {skill}
                                </Text>
                              </XStack>
                            ))}
                          </XStack>
                        </YStack>
                      )}
                    </YStack>
                  </Card.Header>
                </Card>
              ))}
            </YStack>
          )}
        </YStack>
      </YStack>
    </DashboardWidget>
  )
}
