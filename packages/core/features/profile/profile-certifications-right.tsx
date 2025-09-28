import { useState } from 'react'
import { YStack, XStack, Text, Button, Input, H4, TextArea } from 'tamagui'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from '@tamagui/lucide-icons'
import {
  certificationsProfileSchema,
  type CertificationsProfileFormData,
  certificationsProfileDefaults,
  createNewCertification,
} from './config'

/**
 * Profile Certifications Right Component
 * Form for managing certifications and credentials
 */
export function ProfileCertificationsRight() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CertificationsProfileFormData>({
    resolver: zodResolver(certificationsProfileSchema),
    defaultValues: certificationsProfileDefaults,
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'certifications',
  })

  const onSubmit = async (data: CertificationsProfileFormData) => {
    setIsLoading(true)
    try {
      console.log('Saving certifications data:', data)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error saving certifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addCertification = () => {
    append(createNewCertification())
  }

  return (
    <YStack space="$4" padding="$4" flex={1}>
      <H4>Certifications & Credentials</H4>

      <YStack space="$4">
        {/* Certifications List */}
        <YStack space="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontWeight="600">Your Certifications</Text>
            <Button size="$3" onPress={addCertification} icon={Plus}>
              Add Certification
            </Button>
          </XStack>

          {fields.map((field, index) => (
            <YStack
              key={field.id}
              space="$3"
              padding="$3"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
            >
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="600">Certification {index + 1}</Text>
                <Button size="$2" variant="outlined" onPress={() => remove(index)} icon={X}>
                  Remove
                </Button>
              </XStack>

              {/* Certification Name */}
              <YStack space="$2">
                <Text>Certification Name *</Text>
                <Controller
                  name={`certifications.${index}.name`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="e.g. AWS Certified Solutions Architect"
                      value={field.value}
                      onChangeText={field.onChange}
                      borderColor={errors.certifications?.[index]?.name ? '$red8' : '$borderColor'}
                    />
                  )}
                />
                {errors.certifications?.[index]?.name && (
                  <Text color="$red10" fontSize="$2">
                    {errors.certifications[index]?.name?.message}
                  </Text>
                )}
              </YStack>

              {/* Issuing Organization */}
              <YStack space="$2">
                <Text>Issuing Organization *</Text>
                <Controller
                  name={`certifications.${index}.issuing_organization`}
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="e.g. Amazon Web Services"
                      value={field.value}
                      onChangeText={field.onChange}
                      borderColor={
                        errors.certifications?.[index]?.issuing_organization
                          ? '$red8'
                          : '$borderColor'
                      }
                    />
                  )}
                />
                {errors.certifications?.[index]?.issuing_organization && (
                  <Text color="$red10" fontSize="$2">
                    {errors.certifications[index]?.issuing_organization?.message}
                  </Text>
                )}
              </YStack>

              {/* Issue and Expiration Dates */}
              <XStack space="$3">
                <YStack space="$2" flex={1}>
                  <Text>Issue Date</Text>
                  <Controller
                    name={`certifications.${index}.issue_date`}
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
                <YStack space="$2" flex={1}>
                  <Text>Expiration Date</Text>
                  <Controller
                    name={`certifications.${index}.expiration_date`}
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
              </XStack>

              {/* Credential ID and URL */}
              <XStack space="$3">
                <YStack space="$2" flex={1}>
                  <Text>Credential ID</Text>
                  <Controller
                    name={`certifications.${index}.credential_id`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="Certificate ID"
                        value={field.value || ''}
                        onChangeText={field.onChange}
                      />
                    )}
                  />
                </YStack>
                <YStack space="$2" flex={1}>
                  <Text>Credential URL</Text>
                  <Controller
                    name={`certifications.${index}.credential_url`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder="https://..."
                        value={field.value || ''}
                        onChangeText={field.onChange}
                        borderColor={
                          errors.certifications?.[index]?.credential_url ? '$red8' : '$borderColor'
                        }
                      />
                    )}
                  />
                  {errors.certifications?.[index]?.credential_url && (
                    <Text color="$red10" fontSize="$2">
                      {errors.certifications[index]?.credential_url?.message}
                    </Text>
                  )}
                </YStack>
              </XStack>

              {/* Description */}
              <YStack space="$2">
                <Text>Description</Text>
                <Controller
                  name={`certifications.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      placeholder="Describe what this certification covers..."
                      value={field.value || ''}
                      onChangeText={field.onChange}
                      minHeight={80}
                    />
                  )}
                />
              </YStack>
            </YStack>
          ))}

          {fields.length === 0 && (
            <YStack padding="$4" alignItems="center" space="$2">
              <Text color="$gray11">No certifications added yet</Text>
              <Button onPress={addCertification} icon={Plus}>
                Add Your First Certification
              </Button>
            </YStack>
          )}
        </YStack>

        {/* Save Button */}
        <XStack justifyContent="flex-end" paddingTop="$4">
          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={!isDirty || isLoading}
            opacity={!isDirty || isLoading ? 0.5 : 1}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </XStack>
      </YStack>
    </YStack>
  )
}
