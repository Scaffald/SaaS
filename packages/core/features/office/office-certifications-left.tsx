import { api } from '@app/core/utils/api'
import { CustomCheckbox, DashboardWidget, ResponsiveSelect } from '@scaffald/neue-ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Save, X } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  Button,
  H4,
  Input,
  Label,
  Spinner,
  Text,
  TextArea,
  useWindowDimensions,
  XStack,
  YStack,
} from 'tamagui'
import { z } from 'zod'

const certificationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Vanity URL is required'),
  issuing_organization: z.string().optional(),
  category: z.enum(['safety', 'trade', 'equipment', 'license', 'management', 'other']),
  description: z.string().optional(),
  typical_duration_days: z.number().int().positive().optional(),
  requires_renewal: z.boolean(),
  renewal_period_months: z.number().int().positive().optional(),
})

type CertificationFormData = z.infer<typeof certificationSchema>

const CATEGORY_OPTIONS = [
  { value: 'safety', label: 'Safety' },
  { value: 'trade', label: 'Trade' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'license', label: 'License' },
  { value: 'management', label: 'Management' },
  { value: 'other', label: 'Other' },
] as const

interface OfficeCertificationsLeftProps {
  selectedCertification?: {
    id: string
    name: string
    slug: string
    issuing_organization: string | null
    category: 'safety' | 'trade' | 'equipment' | 'license' | 'management' | 'other'
    description: string | null
    typical_duration_days: number | null
    requires_renewal: boolean
    renewal_period_months: number | null
    is_active: boolean
  } | null
  onCertificationSaved: () => void
  onCancel: () => void
}

/**
 * Office Certifications Left Component
 * Form for creating and editing certifications in the catalog
 */
export function OfficeCertificationsLeft({
  selectedCertification,
  onCertificationSaved,
  onCancel,
}: OfficeCertificationsLeftProps) {
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToastController()
  const { width } = useWindowDimensions()
  const _isMobile = width < 640

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: '',
      slug: '',
      issuing_organization: '',
      category: 'safety',
      description: '',
      typical_duration_days: undefined,
      requires_renewal: false,
      renewal_period_months: undefined,
    },
  })

  const requiresRenewal = watch('requires_renewal')

  // Mutations
  const createMutation = api.office.createCertification.useMutation({
    onSuccess: () => {
      toast.show('Success', {
        message: 'Certification created successfully',
      })
      reset()
      onCertificationSaved()
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create certification'
      toast.show('Error', {
        message: errorMessage,
      })
    },
  })

  const updateMutation = api.office.updateCertification.useMutation({
    onSuccess: () => {
      toast.show('Success', {
        message: 'Certification updated successfully',
      })
      onCertificationSaved()
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update certification'
      toast.show('Error', {
        message: errorMessage,
      })
    },
  })

  // Load selected certification data
  useEffect(() => {
    if (selectedCertification) {
      reset({
        name: selectedCertification.name,
        slug: selectedCertification.slug,
        issuing_organization: selectedCertification.issuing_organization || '',
        category: selectedCertification.category,
        description: selectedCertification.description || '',
        typical_duration_days: selectedCertification.typical_duration_days || undefined,
        requires_renewal: selectedCertification.requires_renewal,
        renewal_period_months: selectedCertification.renewal_period_months || undefined,
      })
    }
  }, [selectedCertification, reset])

  // Auto-generate slug from name
  const handleNameChange = (name: string, onChange: (value: string) => void) => {
    onChange(name)
    if (!selectedCertification) {
      // Only auto-generate slug for new certifications
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setValue('slug', slug, { shouldValidate: true })
    }
  }

  const onSubmit = async (data: CertificationFormData) => {
    setIsLoading(true)
    try {
      if (selectedCertification) {
        await updateMutation.mutateAsync({
          id: selectedCertification.id,
          ...data,
        })
      } else {
        await createMutation.mutateAsync(data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const isEditing = !!selectedCertification

  return (
    <DashboardWidget>
      <YStack gap="$4" p="$4">
        <XStack justify="space-between" items="center">
          <H4>{isEditing ? 'Edit Certification' : 'New Certification'}</H4>
          {isEditing && (
            <Button size="$2" variant="outlined" onPress={onCancel} icon={X}>
              Cancel
            </Button>
          )}
        </XStack>

        <YStack gap="$4">
          {/* Name */}
          <YStack gap="$2">
            <Text fontWeight="600">
              Name <Text color="$red10">*</Text>
            </Text>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="e.g. OSHA 30-Hour Construction"
                  value={field.value}
                  onChangeText={(text) => handleNameChange(text, field.onChange)}
                  borderColor={errors.name ? '$red8' : '$borderColor'}
                />
              )}
            />
            {errors.name && (
              <Text color="$red10" fontSize="$2">
                {errors.name.message}
              </Text>
            )}
          </YStack>

          {/* Vanity URL */}
          <YStack gap="$2">
            <Text fontWeight="600">
              Vanity URL <Text color="$red10">*</Text>
            </Text>
            <Text fontSize="$2" color="$color11">
              URL-friendly username (auto-generated from name)
            </Text>
            <Controller
              name="slug"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="e.g. osha-30-hour-construction"
                  value={field.value}
                  onChangeText={field.onChange}
                  borderColor={errors.slug ? '$red8' : '$borderColor'}
                />
              )}
            />
            {errors.slug && (
              <Text color="$red10" fontSize="$2">
                {errors.slug.message}
              </Text>
            )}
          </YStack>

          {/* Category */}
          <YStack gap="$2">
            <Text fontWeight="600">
              Category <Text color="$red10">*</Text>
            </Text>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <ResponsiveSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select category"
                  options={CATEGORY_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
              )}
            />
          </YStack>

          {/* Issuing Organization */}
          <YStack gap="$2">
            <Text fontWeight="600">Issuing Organization</Text>
            <Controller
              name="issuing_organization"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="e.g. OSHA, EPA, State Licensing Board"
                  value={field.value}
                  onChangeText={field.onChange}
                />
              )}
            />
          </YStack>

          {/* Description */}
          <YStack gap="$2">
            <Text fontWeight="600">Description</Text>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea
                  placeholder="Brief description of what this certification covers..."
                  value={field.value}
                  onChangeText={field.onChange}
                  minH={80}
                />
              )}
            />
          </YStack>

          {/* Typical Duration */}
          <YStack gap="$2">
            <Text fontWeight="600">Typical Duration (days)</Text>
            <Text fontSize="$2" color="$color11">
              How many days it typically takes to complete this certification
            </Text>
            <Controller
              name="typical_duration_days"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="e.g. 2"
                  value={field.value?.toString() || ''}
                  onChangeText={(text) =>
                    field.onChange(text ? Number.parseInt(text, 10) : undefined)
                  }
                  keyboardType="numeric"
                />
              )}
            />
          </YStack>

          {/* Requires Renewal */}
          <YStack gap="$2">
            <Controller
              name="requires_renewal"
              control={control}
              render={({ field }) => {
                const isChecked = Boolean(field.value)
                return (
                  <XStack gap="$3" items="center">
                    <CustomCheckbox
                      checked={isChecked}
                      onCheckedChange={field.onChange}
                      aria-label="Requires renewal"
                      testID="requires-renewal"
                    />
                    <Label cursor="pointer" onPress={() => field.onChange(!isChecked)}>
                      <Text fontWeight="600">Requires Renewal</Text>
                    </Label>
                  </XStack>
                )
              }}
            />
          </YStack>

          {/* Renewal Period (conditional) */}
          {requiresRenewal && (
            <YStack gap="$2">
              <Text fontWeight="600">Renewal Period (months)</Text>
              <Text fontSize="$2" color="$color11">
                How often this certification must be renewed
              </Text>
              <Controller
                name="renewal_period_months"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="e.g. 36"
                    value={field.value?.toString() || ''}
                    onChangeText={(text) =>
                      field.onChange(text ? Number.parseInt(text, 10) : undefined)
                    }
                    keyboardType="numeric"
                  />
                )}
              />
            </YStack>
          )}

          {/* Submit Button */}
          <XStack justify="flex-end" pt="$4" gap="$2">
            {isEditing && (
              <Button variant="outlined" onPress={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button
              onPress={handleSubmit(onSubmit)}
              disabled={!isDirty || isLoading}
              opacity={!isDirty || isLoading ? 0.5 : 1}
              icon={isLoading ? <Spinner /> : isEditing ? Save : Plus}
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </DashboardWidget>
  )
}
