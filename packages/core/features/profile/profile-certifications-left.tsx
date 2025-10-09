import { useState } from 'react'
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  H4,
  TextArea,
  ScrollView,
  RadioGroup,
  Label,
  Card,
  Separator,
} from 'tamagui'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Plus,
  X,
  Link as LinkIcon,
  Upload as UploadIcon,
  Award,
  Calendar,
  ExternalLink,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
} from '@tamagui/lucide-icons'
import { DashboardWidget, FileUpload } from '@app/ui'
import { api } from '@app/core/utils/api'
import { ProfileEmptyState } from './components'
import { formatDate } from './utils/date-formatting'
import {
  certificationsProfileSchema,
  type CertificationsProfileFormData,
  certificationsProfileDefaults,
  createNewCertification,
} from './config'

/**
 * Profile Certifications Left Component
 * Form for managing certifications and credentials
 */
export function ProfileCertificationsLeft() {
  const [isLoading, setIsLoading] = useState(false)
  const [inputMethod, setInputMethod] = useState<Record<string, 'url' | 'file'>>({})
  const [pendingFiles, setPendingFiles] = useState<Record<number, File>>({})

  const {
    control,
    handleSubmit,
    setValue,
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

  // tRPC queries and mutations
  // @ts-ignore - Profile router will be available after type generation
  const { data: _existingCertifications, refetch: refetchCertifications } =
    api.profile?.getCertifications?.useQuery() || { data: [], refetch: () => {} }

  // @ts-ignore
  const saveMutation = api.profile?.saveCertifications?.useMutation()
  // @ts-ignore
  const uploadFileMutation = api.profile?.uploadCertificationFile?.useMutation()
  // @ts-ignore
  const deleteFileMutation = api.profile?.deleteCertificationFile?.useMutation()

  const onSubmit = async (data: CertificationsProfileFormData) => {
    if (!saveMutation) return

    setIsLoading(true)
    try {
      // 1. First, save all certifications to get database UUIDs
      const result = await saveMutation.mutateAsync({
        certifications: data.certifications || [],
      })

      // 2. Update form with returned IDs from database
      if (result.certifications) {
        // biome-ignore lint/suspicious/noExplicitAny: API response type
        result.certifications.forEach((savedCert: any, index: number) => {
          if (data.certifications?.[index]) {
            setValue(`certifications.${index}.id`, savedCert.id, { shouldDirty: false })
          }
        })
      }

      // 3. Now upload any pending files with the new UUIDs
      if (uploadFileMutation && Object.keys(pendingFiles).length > 0) {
        for (const [indexStr, file] of Object.entries(pendingFiles)) {
          const index = Number.parseInt(indexStr)
          const certId = result.certifications[index]?.id

          if (certId) {
            try {
              // Convert file to base64
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(file)
              })

              const uploadResult = await uploadFileMutation.mutateAsync({
                certificationId: certId,
                file: base64,
                fileName: file.name,
                contentType: file.type,
              })

              // Update form with the file path
              setValue(`certifications.${index}.certificate_file_path`, uploadResult.filePath, {
                shouldDirty: false,
              })
            } catch (error) {
              console.error(`Error uploading file for certification ${index}:`, error)
            }
          }
        }

        // Clear pending files after upload
        setPendingFiles({})
      }

      // 4. Refetch certifications to get latest data
      await refetchCertifications()

      console.log('Certifications saved successfully!')
    } catch (error) {
      console.error('Error saving certifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addCertification = () => {
    const newCert = createNewCertification()
    append(newCert)
    // Set default input method to URL
    setInputMethod((prev) => ({ ...prev, [fields.length]: 'url' }))
  }

  const handleFileSelect = (file: File, index: number) => {
    // Store file in pending state - will upload on form submit
    setPendingFiles((prev) => ({ ...prev, [index]: file }))
    // Mark form as dirty so save button enables
    setValue(`certifications.${index}.certificate_file_path`, 'pending', {
      shouldDirty: true,
    })
  }

  const handleFileRemove = async (index: number, certId: string | undefined, filePath: string) => {
    // If it's a pending file, just remove from state
    if (pendingFiles[index]) {
      setPendingFiles((prev) => {
        const newFiles = { ...prev }
        delete newFiles[index]
        return newFiles
      })
      setValue(`certifications.${index}.certificate_file_path`, undefined, {
        shouldDirty: true,
      })
      return
    }

    // If it's an uploaded file, delete from server
    if (certId && filePath && deleteFileMutation) {
      try {
        await deleteFileMutation.mutateAsync({
          certificationId: certId,
          filePath,
        })

        // Clear the file path from form
        setValue(`certifications.${index}.certificate_file_path`, undefined, {
          shouldDirty: true,
        })
      } catch (error) {
        console.error('Error deleting file:', error)
      }
    }
  }

  return (
    <DashboardWidget>
      <H4>Certifications & Credentials</H4>

      <YStack gap="$4">
        {/* Certifications List */}
        <YStack gap="$3">
          <XStack justify="space-between" items="center">
            <Text fontWeight="600">Your Certifications</Text>
            <Button size="$3" onPress={addCertification} icon={Plus}>
              Add Certification
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
                <Text fontWeight="600">Certification {index + 1}</Text>
                <Button size="$2" variant="outlined" onPress={() => remove(index)} icon={X}>
                  Remove
                </Button>
              </XStack>

              {/* Certification Name */}
              <YStack gap="$2">
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
              <YStack gap="$2">
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
              <XStack gap="$3">
                <YStack gap="$2" flex={1}>
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
                <YStack gap="$2" flex={1}>
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

              {/* Credential ID */}
              <YStack gap="$2">
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

              {/* Certificate Proof Section */}
              <YStack gap="$3" p="$3" bg="$background" rounded="$3">
                <Text fontWeight="600">Certificate Proof (Optional)</Text>
                <Text fontSize="$2" color="$color11">
                  Provide either a link to your certificate or upload a file
                </Text>

                {/* Radio Group for Input Method */}
                <RadioGroup
                  value={inputMethod[index] || 'url'}
                  onValueChange={(value) =>
                    setInputMethod((prev) => ({ ...prev, [index]: value as 'url' | 'file' }))
                  }
                >
                  <XStack gap="$4">
                    <XStack gap="$2" items="center">
                      <RadioGroup.Item value="url" id={`url-${index}`}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>
                      <Label htmlFor={`url-${index}`} display="flex" gap="$2" items="center">
                        <LinkIcon size={16} />
                        <Text>External URL</Text>
                      </Label>
                    </XStack>
                    <XStack gap="$2" items="center">
                      <RadioGroup.Item value="file" id={`file-${index}`}>
                        <RadioGroup.Indicator />
                      </RadioGroup.Item>
                      <Label htmlFor={`file-${index}`} display="flex" gap="$2" items="center">
                        <UploadIcon size={16} />
                        <Text>Upload File</Text>
                      </Label>
                    </XStack>
                  </XStack>
                </RadioGroup>

                {/* Conditional Input - URL or File Upload */}
                {(inputMethod[index] || 'url') === 'url' ? (
                  <YStack gap="$2">
                    <Text fontSize="$2">Credential URL</Text>
                    <Controller
                      name={`certifications.${index}.credential_url`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          placeholder="https://..."
                          value={field.value || ''}
                          onChangeText={field.onChange}
                          borderColor={
                            errors.certifications?.[index]?.credential_url
                              ? '$red8'
                              : '$borderColor'
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
                ) : (
                  <Controller
                    name={`certifications.${index}.certificate_file_path`}
                    control={control}
                    render={({ field: fileField }) => (
                      <FileUpload
                        onFileSelect={(file) => handleFileSelect(file, index)}
                        onFileRemove={
                          fileField.value && fileField.value !== 'pending'
                            ? () =>
                                handleFileRemove(
                                  index,
                                  fields[index].id as string | undefined,
                                  fileField.value || ''
                                )
                            : pendingFiles[index]
                              ? () => handleFileRemove(index, undefined, '')
                              : undefined
                        }
                        currentFileName={
                          pendingFiles[index]
                            ? pendingFiles[index].name
                            : fileField.value && fileField.value !== 'pending'
                              ? fileField.value.split('/').pop()
                              : undefined
                        }
                        disabled={false}
                        error={errors.certifications?.[index]?.certificate_file_path?.message}
                      />
                    )}
                  />
                )}
              </YStack>

              {/* Description */}
              <YStack gap="$2">
                <Text>Description</Text>
                <Controller
                  name={`certifications.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      placeholder="Describe what this certification covers..."
                      value={field.value || ''}
                      onChangeText={field.onChange}
                      minH={80}
                    />
                  )}
                />
              </YStack>
            </YStack>
          ))}

          {fields.length === 0 && (
            <YStack p="$4" items="center" gap="$2">
              <Text color="$color11">No certifications added yet</Text>
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

        {/* Saved Certifications Display */}
        <YStack gap="$3">
          <Text fontWeight="600" fontSize="$5">
            Saved Certifications
          </Text>

          {!_existingCertifications || _existingCertifications.length === 0 ? (
            <ProfileEmptyState
              icon={Award}
              message="No certifications saved yet. Add your first certification above and click Save Changes."
            />
          ) : (
            <YStack gap="$3">
              {/* biome-ignore lint/suspicious/noExplicitAny: API response type */}
              {_existingCertifications.map((cert: any) => (
                <Card key={cert.id} bordered size="$4">
                  <Card.Header gap="$3">
                    {/* Header */}
                    <YStack gap="$2">
                      <XStack justify="space-between" items="flex-start">
                        <YStack gap="$1" flex={1}>
                          <H4>{cert.name}</H4>
                          <Text color="$color11" fontSize="$3">
                            {cert.issuing_organization}
                          </Text>
                        </YStack>
                        {cert.verification_status === 'verified' && (
                          <XStack gap="$2" items="center">
                            <CheckCircle size={16} color="$green10" />
                            <Text color="$green10" fontSize="$2" fontWeight="600">
                              Verified
                            </Text>
                          </XStack>
                        )}
                        {cert.verification_status === 'pending' && (
                          <XStack gap="$2" items="center">
                            <Clock size={16} color="$yellow10" />
                            <Text color="$yellow10" fontSize="$2" fontWeight="600">
                              Pending
                            </Text>
                          </XStack>
                        )}
                        {!cert.verification_status && (
                          <XStack gap="$2" items="center">
                            <AlertCircle size={16} color="$color10" />
                            <Text color="$color10" fontSize="$2">
                              Not Verified
                            </Text>
                          </XStack>
                        )}
                      </XStack>
                    </YStack>

                    <Separator />

                    {/* Details */}
                    <YStack gap="$2">
                      {/* Dates */}
                      <XStack gap="$2" items="center">
                        <Calendar size={16} color="$color11" />
                        <Text fontSize="$2" color="$color11">
                          Issued: {formatDate(cert.issue_date)}
                          {cert.expiration_date &&
                            ` • Expires: ${formatDate(cert.expiration_date)}`}
                        </Text>
                      </XStack>

                      {/* Credential ID */}
                      {cert.credential_id && (
                        <Text fontSize="$2" color="$color11">
                          Credential ID: {cert.credential_id}
                        </Text>
                      )}

                      {/* Description */}
                      {cert.description && (
                        <Text fontSize="$3" color="$color11">
                          {cert.description}
                        </Text>
                      )}
                    </YStack>

                    {/* Actions */}
                    {(cert.credential_url || cert.certificate_file_path) && (
                      <>
                        <Separator />
                        <XStack gap="$2" flexWrap="wrap">
                          {cert.credential_url && (
                            <Button
                              size="$2"
                              variant="outlined"
                              icon={ExternalLink}
                              onPress={() => {
                                if (typeof window !== 'undefined') {
                                  window.open(cert.credential_url || '', '_blank')
                                }
                              }}
                            >
                              View Online
                            </Button>
                          )}
                          {cert.certificate_file_path && (
                            <Button
                              size="$2"
                              variant="outlined"
                              icon={Download}
                              onPress={() => {
                                const supabaseUrl =
                                  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
                                const fileUrl = `${supabaseUrl}/storage/v1/object/public/certifications/${cert.certificate_file_path}`
                                if (typeof window !== 'undefined') {
                                  window.open(fileUrl, '_blank')
                                }
                              }}
                            >
                              Download
                            </Button>
                          )}
                        </XStack>
                      </>
                    )}
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
