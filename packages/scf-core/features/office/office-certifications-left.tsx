import { api } from '@scf/core/utils/api'
import {
  CustomCheckbox,
  DashboardWidget,
  ResponsiveSelect,
  useThemeContext,
} from '@scaffald/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Save, X } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
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
  Row,
  Stack,
} from '@scaffald/ui'
import { z } from 'zod'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()
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
      toast.show({
        title: 'Success',
        message: 'Certification created successfully',
        variant: 'success',
      })
      reset()
      onCertificationSaved()
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create certification'
      toast.show({
        title: 'Error',
        message: errorMessage,
        variant: 'error',
      })
    },
  })

  const updateMutation = api.office.updateCertification.useMutation({
    onSuccess: () => {
      toast.show({
        title: 'Success',
        message: 'Certification updated successfully',
        variant: 'success',
      })
      onCertificationSaved()
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update certification'
      toast.show({
        title: 'Error',
        message: errorMessage,
        variant: 'error',
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
      <Stack gap={16} padding="md">
        <Row justify="space-between" align="center">
          <H4>{isEditing ? 'Edit Certification' : 'New Certification'}</H4>
          {isEditing && (
            <Button size="xs" variant="outline" onPress={onCancel} iconStart={X}>
              Cancel
            </Button>
          )}
        </Row>

        <Stack gap={16}>
          {/* Name */}
          <Stack gap={8}>
            <Text>
              Name <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>*</Text>
            </Text>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  placeholder="e.g. OSHA 30-Hour Construction"
                  value={field.value}
                  onChangeText={(text) => handleNameChange(text, field.onChange)}
                  borderColor={
                    errors.name ? theme === "light" ? colors.error[300] : colors.error[700] : colors.border[theme].default
                  }
                />
              )}
            />
            {errors.name && (
              <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>{errors.name.message}</Text>
            )}
          </Stack>

          {/* Vanity URL */}
          <Stack gap={8}>
            <Text>
              Vanity URL <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>*</Text>
            </Text>
            <Text style={{ color: colors.text[theme].secondary }}>
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
                  borderColor={
                    errors.slug ? theme === "light" ? colors.error[300] : colors.error[700] : colors.border[theme].default
                  }
                />
              )}
            />
            {errors.slug && (
              <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>{errors.slug.message}</Text>
            )}
          </Stack>

          {/* Category */}
          <Stack gap={8}>
            <Text>
              Category <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>*</Text>
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
          </Stack>

          {/* Issuing Organization */}
          <Stack gap={8}>
            <Text>Issuing Organization</Text>
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
          </Stack>

          {/* Description */}
          <Stack gap={8}>
            <Text>Description</Text>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea
                  placeholder="Brief description of what this certification covers..."
                  value={field.value}
                  onChangeText={field.onChange}
                  minHeight={80}
                />
              )}
            />
          </Stack>

          {/* Typical Duration */}
          <Stack gap={8}>
            <Text>Typical Duration (days)</Text>
            <Text style={{ color: colors.text[theme].secondary }}>
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
          </Stack>

          {/* Requires Renewal */}
          <Stack gap={8}>
            <Controller
              name="requires_renewal"
              control={control}
              render={({ field }) => {
                const isChecked = Boolean(field.value)
                return (
                  <Row gap={12} align="center">
                    <CustomCheckbox
                      checked={isChecked}
                      onChange={field.onChange}
                      aria-label="Requires renewal"
                      testID="requires-renewal"
                    />
                    <Label cursor="pointer" onPress={() => field.onChange(!isChecked)}>
                      <Text>Requires Renewal</Text>
                    </Label>
                  </Row>
                )
              }}
            />
          </Stack>

          {/* Renewal Period (conditional) */}
          {requiresRenewal && (
            <Stack gap={8}>
              <Text>Renewal Period (months)</Text>
              <Text style={{ color: colors.text[theme].secondary }}>
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
            </Stack>
          )}

          {/* Submit Button */}
          <Row justify="flex-end" paddingTop={16} gap={8}>
            {isEditing && (
              <Button variant="outline" onPress={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button
              onPress={handleSubmit(onSubmit)}
              disabled={!isDirty || isLoading}
              opacity={!isDirty || isLoading ? 0.5 : 1}
              iconStart={isLoading ? <Spinner /> : isEditing ? Save : Plus}
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </Row>
        </Stack>
      </Stack>
    </DashboardWidget>
  )
}
