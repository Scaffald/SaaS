import {
  useAdminCheckTypes,
  useAdminPackages,
  useAdminSetCheckTypeActiveMutation,
  useAdminSetPackageActiveMutation,
  useAdminUpsertCheckTypeMutation,
  useAdminUpsertPackageMutation,
} from '@scf/core/utils/background-checks-sdk-hooks'
import type { AdminCheckType, AdminPackage } from '@scaffald/sdk'
import { DialogCompound as Dialog } from '@scf/core/components/ui/DialogCompound'
import {
  Button,
  Card,
  Checkbox,
  Input,
  Row,
  ScrollView,
  Separator,
  Spinner,
  Stack,
  Text,
  TextArea,
  useToast,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Edit3, PackagePlus, Plus, RefreshCcw, Shield } from 'lucide-react-native'
import { useMemo, useState } from 'react'

type AdminPackageRecord = AdminPackage
type AdminCheckTypeRecord = AdminCheckType

interface PackageDialogState {
  mode: 'create' | 'edit'
  data?: AdminPackageRecord
}

interface CheckTypeDialogState {
  mode: 'create' | 'edit'
  data?: AdminCheckTypeRecord
}

interface PackageFormState {
  slug: string
  displayName: string
  description: string
  providerCode: string
  platformCost: string
  retailCost: string
  estimatedCompletionDays: string
  metadata: string
  componentOverrides: string
  isActive: boolean
}

interface CheckTypeFormState {
  slug: string
  displayName: string
  description: string
  category: string
  providerCode: string
  validityDays: string
  platformCost: string
  retailCost: string
  estimatedCompletionDays: string
  requiredDocuments: string
  providerConfiguration: string
  metadata: string
  isActive: boolean
}

const emptyPackageForm: PackageFormState = {
  slug: '',
  displayName: '',
  description: '',
  providerCode: '',
  platformCost: '0',
  retailCost: '0',
  estimatedCompletionDays: '',
  metadata: '{}',
  componentOverrides: '[]',
  isActive: true,
}

const emptyCheckTypeForm: CheckTypeFormState = {
  slug: '',
  displayName: '',
  description: '',
  category: '',
  providerCode: '',
  validityDays: '',
  platformCost: '0',
  retailCost: '',
  estimatedCompletionDays: '',
  requiredDocuments: '',
  providerConfiguration: '{}',
  metadata: '{}',
  isActive: true,
}

const formatCurrency = (cents: number | null | undefined) => {
  if (cents == null) {
    return '—'
  }
  return `$${(cents / 100).toFixed(2)}`
}

const formatDays = (days: number | null | undefined) => {
  if (days == null) return '—'
  return `${days} day${days === 1 ? '' : 's'}`
}

const formatDocuments = (documents: string[]) => {
  if (!documents.length) {
    return 'None'
  }
  return documents.join(', ')
}

export function AdminCatalogManager() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const toast = useToast()

  const packagesQuery = useAdminPackages({ staleTime: 60_000 })
  const checkTypesQuery = useAdminCheckTypes({ staleTime: 60_000 })

  const upsertPackageMutation = useAdminUpsertPackageMutation()
  const upsertCheckTypeMutation = useAdminUpsertCheckTypeMutation()
  const setPackageActiveMutation = useAdminSetPackageActiveMutation()
  const setCheckTypeActiveMutation = useAdminSetCheckTypeActiveMutation()

  const [packageDialog, setPackageDialog] = useState<PackageDialogState | null>(null)
  const [checkTypeDialog, setCheckTypeDialog] = useState<CheckTypeDialogState | null>(null)
  const [packageForm, setPackageForm] = useState<PackageFormState>(emptyPackageForm)
  const [checkTypeForm, setCheckTypeForm] = useState<CheckTypeFormState>(emptyCheckTypeForm)
  const [selectedPackageTypeIds, setSelectedPackageTypeIds] = useState<Set<string>>(new Set())
  const [packageFormError, setPackageFormError] = useState<string | null>(null)
  const [checkTypeFormError, setCheckTypeFormError] = useState<string | null>(null)
  const [packageToggleId, setPackageToggleId] = useState<string | null>(null)
  const [checkTypeToggleId, setCheckTypeToggleId] = useState<string | null>(null)

  const packages: AdminPackageRecord[] = packagesQuery.data ?? []
  const checkTypes: AdminCheckTypeRecord[] = checkTypesQuery.data ?? []

  const resetPackageDialog = () => {
    setPackageDialog(null)
    setPackageForm(emptyPackageForm)
    setSelectedPackageTypeIds(new Set())
    setPackageFormError(null)
  }

  const resetCheckTypeDialog = () => {
    setCheckTypeDialog(null)
    setCheckTypeForm(emptyCheckTypeForm)
    setCheckTypeFormError(null)
  }

  const openPackageDialog = (mode: 'create' | 'edit', data?: AdminPackageRecord) => {
    if (mode === 'edit' && data) {
      setPackageForm({
        slug: data.slug,
        displayName: data.display_name,
        description: data.description ?? '',
        providerCode: data.provider_package_code ?? '',
        platformCost: String(data.platform_cost_cents),
        retailCost: String(data.retail_cost_cents),
        estimatedCompletionDays:
          data.estimated_completion_days != null ? String(data.estimated_completion_days) : '',
        metadata: JSON.stringify(data.metadata ?? {}, null, 2),
        componentOverrides: JSON.stringify(data.component_overrides ?? [], null, 2),
        isActive: data.is_active,
      })
      setSelectedPackageTypeIds(new Set(data.check_type_ids ?? []))
    } else {
      setPackageForm(emptyPackageForm)
      setSelectedPackageTypeIds(new Set())
    }
    setPackageFormError(null)
    setPackageDialog({ mode, data })
  }

  const openCheckTypeDialog = (mode: 'create' | 'edit', data?: AdminCheckTypeRecord) => {
    if (mode === 'edit' && data) {
      setCheckTypeForm({
        slug: data.slug,
        displayName: data.display_name,
        description: data.description ?? '',
        category: data.category ?? '',
        providerCode: data.provider_check_code ?? '',
        validityDays: data.validity_days != null ? String(data.validity_days) : '',
        platformCost: String(data.platform_cost_cents),
        retailCost: data.retail_cost_cents != null ? String(data.retail_cost_cents) : '',
        estimatedCompletionDays:
          data.estimated_completion_days != null ? String(data.estimated_completion_days) : '',
        requiredDocuments: data.required_documents.join(', '),
        providerConfiguration: JSON.stringify(data.provider_configuration ?? {}, null, 2),
        metadata: JSON.stringify(data.metadata ?? {}, null, 2),
        isActive: data.is_active,
      })
    } else {
      setCheckTypeForm(emptyCheckTypeForm)
    }
    setCheckTypeFormError(null)
    setCheckTypeDialog({ mode, data })
  }

  const handlePackageFieldChange = (field: keyof PackageFormState, value: string | boolean) => {
    setPackageForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCheckTypeFieldChange = (field: keyof CheckTypeFormState, value: string | boolean) => {
    setCheckTypeForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTogglePackageType = (typeId: string, checked: boolean) => {
    setSelectedPackageTypeIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(typeId)
      } else {
        next.delete(typeId)
      }
      return next
    })
  }

  const handlePackageSubmit = async () => {
    if (!packageDialog) return
    if (selectedPackageTypeIds.size === 0) {
      setPackageFormError('Select at least one check type for this package.')
      return
    }

    const platformCost = Number(packageForm.platformCost)
    const retailCost = Number(packageForm.retailCost)
    const estimatedDays = packageForm.estimatedCompletionDays.trim().length
      ? Number(packageForm.estimatedCompletionDays)
      : null

    if (!Number.isFinite(platformCost) || platformCost < 0) {
      setPackageFormError('Platform cost must be a non-negative number.')
      return
    }
    if (!Number.isFinite(retailCost) || retailCost < 0) {
      setPackageFormError('Retail cost must be a non-negative number.')
      return
    }
    if (estimatedDays != null && (!Number.isFinite(estimatedDays) || estimatedDays < 0)) {
      setPackageFormError('Estimated completion days must be a positive number.')
      return
    }

    let metadata: Record<string, unknown> = {}
    let componentOverrides: Record<string, unknown>[] = []

    try {
      metadata = packageForm.metadata.trim()
        ? (JSON.parse(packageForm.metadata) as Record<string, unknown>)
        : {}
    } catch (_error) {
      setPackageFormError('Metadata must be valid JSON.')
      return
    }

    try {
      componentOverrides = packageForm.componentOverrides.trim()
        ? (JSON.parse(packageForm.componentOverrides) as Record<string, unknown>[])
        : []
    } catch (_error) {
      setPackageFormError('Component overrides must be valid JSON.')
      return
    }

    setPackageFormError(null)

    try {
      await upsertPackageMutation.mutateAsync({
        id: packageDialog.mode === 'edit' ? packageDialog.data?.id : undefined,
        slug: packageForm.slug.trim(),
        display_name: packageForm.displayName.trim(),
        description:
          packageForm.description.trim().length > 0 ? packageForm.description.trim() : null,
        provider_package_code:
          packageForm.providerCode.trim().length > 0 ? packageForm.providerCode.trim() : null,
        platform_cost_cents: Math.round(platformCost),
        retail_cost_cents: Math.round(retailCost),
        estimated_completion_days: estimatedDays,
        metadata,
        component_overrides: componentOverrides,
        check_type_ids: Array.from(selectedPackageTypeIds),
        is_active: packageForm.isActive,
      })
      toast.show({
        title: 'Package saved',
        message: 'Background check package catalog updated.',
        variant: 'success',
      })
      resetPackageDialog()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save package.'
      toast.error('Failed to save package', { title: 'Failed to save package' })
      setPackageFormError(message)
    }
  }

  const handleCheckTypeSubmit = async () => {
    if (!checkTypeDialog) return

    const platformCost = Number(checkTypeForm.platformCost)
    const retailCost = checkTypeForm.retailCost.trim().length
      ? Number(checkTypeForm.retailCost)
      : null
    const validityDays = checkTypeForm.validityDays.trim().length
      ? Number(checkTypeForm.validityDays)
      : null
    const estimatedDays = checkTypeForm.estimatedCompletionDays.trim().length
      ? Number(checkTypeForm.estimatedCompletionDays)
      : null

    if (!Number.isFinite(platformCost) || platformCost < 0) {
      setCheckTypeFormError('Platform cost must be a non-negative number.')
      return
    }
    if (retailCost != null && (!Number.isFinite(retailCost) || retailCost < 0)) {
      setCheckTypeFormError('Retail cost must be a non-negative number.')
      return
    }
    if (validityDays != null && (!Number.isFinite(validityDays) || validityDays <= 0)) {
      setCheckTypeFormError('Validity days must be a positive number.')
      return
    }
    if (estimatedDays != null && (!Number.isFinite(estimatedDays) || estimatedDays < 0)) {
      setCheckTypeFormError('Estimated completion days must be zero or a positive number.')
      return
    }

    const requiredDocuments = checkTypeForm.requiredDocuments
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)

    let metadata: Record<string, unknown> = {}
    let providerConfiguration: Record<string, unknown> = {}

    try {
      metadata = checkTypeForm.metadata.trim()
        ? (JSON.parse(checkTypeForm.metadata) as Record<string, unknown>)
        : {}
    } catch (_error) {
      setCheckTypeFormError('Metadata must be valid JSON.')
      return
    }

    try {
      providerConfiguration = checkTypeForm.providerConfiguration.trim()
        ? (JSON.parse(checkTypeForm.providerConfiguration) as Record<string, unknown>)
        : {}
    } catch (_error) {
      setCheckTypeFormError('Provider configuration must be valid JSON.')
      return
    }

    setCheckTypeFormError(null)

    try {
      await upsertCheckTypeMutation.mutateAsync({
        id: checkTypeDialog.mode === 'edit' ? checkTypeDialog.data?.id : undefined,
        slug: checkTypeForm.slug.trim(),
        display_name: checkTypeForm.displayName.trim(),
        description:
          checkTypeForm.description.trim().length > 0 ? checkTypeForm.description.trim() : null,
        category: checkTypeForm.category.trim().length > 0 ? checkTypeForm.category.trim() : null,
        provider_check_code:
          checkTypeForm.providerCode.trim().length > 0 ? checkTypeForm.providerCode.trim() : null,
        validity_days: validityDays,
        platform_cost_cents: Math.round(platformCost),
        retail_cost_cents: retailCost != null ? Math.round(retailCost) : null,
        estimated_completion_days: estimatedDays,
        required_documents: requiredDocuments,
        provider_configuration: providerConfiguration,
        metadata,
        is_active: checkTypeForm.isActive,
      })
      toast.show({
        title: 'Check type saved',
        message: 'Background check components updated.',
        variant: 'success',
      })
      resetCheckTypeDialog()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save check type.'
      toast.error('Failed to save check type', { title: 'Failed to save check type' })
      setCheckTypeFormError(message)
    }
  }

  const handleTogglePackage = async (record: AdminPackageRecord) => {
    setPackageToggleId(record.id)
    try {
      await setPackageActiveMutation.mutateAsync({
        id: record.id,
        is_active: !record.is_active,
      })
      toast.success(`${record.display_name} is now ${record.is_active ? 'inactive' : 'active'}.`, {
        title: 'Package status updated',
      })
    } catch (error) {
      const _message = error instanceof Error ? error.message : 'Unable to update package status.'
      toast.error('Failed to update package', { title: 'Failed to update package' })
    } finally {
      setPackageToggleId(null)
    }
  }

  const handleToggleCheckType = async (record: AdminCheckTypeRecord) => {
    setCheckTypeToggleId(record.id)
    try {
      await setCheckTypeActiveMutation.mutateAsync({
        id: record.id,
        is_active: !record.is_active,
      })
      toast.success(`${record.display_name} is now ${record.is_active ? 'inactive' : 'active'}.`, {
        title: 'Check type status updated',
      })
    } catch (error) {
      const _message =
        error instanceof Error ? error.message : 'Unable to update check type status.'
      toast.error('Failed to update check type', { title: 'Failed to update check type' })
    } finally {
      setCheckTypeToggleId(null)
    }
  }

  const hasCatalogData = useMemo(
    () => packages.length > 0 || checkTypes.length > 0,
    [packages.length, checkTypes.length]
  )

  return (
    <>
      <Stack gap={16}>
        <Card
          padding="md"
          style={{ backgroundColor: colors.bg[t].muted, borderColor: colors.border[t].default, gap: 16 }}
          borderWidth={1}
          radius="xl"
        >
          <Row justify="space-between" align="center" wrap gap={12}>
            <Stack gap={4}>
              <Row gap={8} align="center">
                <PackagePlus size={18} color={colors.text[t].tertiary} />
                <Text style={{ color: colors.text[t].secondary }}>Packages</Text>
              </Row>
              <Text style={{ color: colors.text[t].secondary }}>
                Manage bundles of screening components that organizations can request.
              </Text>
            </Stack>
            <Row gap={8} wrap>
              <Button
                size="sm"
                variant="outline"
                iconStart={RefreshCcw}
                disabled={packagesQuery.isLoading || checkTypesQuery.isLoading}
                onPress={() => {
                  void packagesQuery.refetch()
                  void checkTypesQuery.refetch()
                }}
              >
                Refresh catalog
              </Button>
              <Button
                size="sm"
                iconStart={Plus}
                onPress={() => openPackageDialog('create')}
                disabled={checkTypes.length === 0}
              >
                New package
              </Button>
            </Row>
          </Row>

          {packagesQuery.isLoading ? (
            <Stack gap={8} align="center" paddingVertical={16}>
              <Spinner variant="ios" size="lg" />
              <Text style={{ color: colors.text[t].secondary }}>Loading packages…</Text>
            </Stack>
          ) : packages.length === 0 ? (
            <Stack gap={8} paddingVertical={16} align="center">
              <Text style={{ color: colors.text[t].secondary }}>
                {hasCatalogData ? 'No packages match the filters.' : 'No packages configured yet.'}
              </Text>
              <Button size="sm" onPress={() => openPackageDialog('create')}>
                Create your first package
              </Button>
            </Stack>
          ) : (
            <Stack gap={12}>
              {packages.map((pkg: AdminPackageRecord) => (
                <Card
                  key={pkg.id}
                  padding="md"
                  style={{ backgroundColor: colors.bg[t].default, borderColor: colors.border[t].default, gap: 12 }}
                  borderWidth={1}
                  radius="lg"
                >
                  <Row justify="space-between" align="flex-start" gap={12}>
                    <Stack gap={4} flex={1}>
                      <Text style={{ color: colors.text[t].secondary }}>{pkg.display_name}</Text>
                      <Text style={{ color: colors.text[t].secondary }}>{pkg.slug}</Text>
                      {pkg.description ? <Text style={{ color: colors.text[t].secondary }}>{pkg.description}</Text> : null}
                    </Stack>
                    <Row gap={8} wrap>
                      <Button
                        size="sm"
                        variant="outline"
                        iconStart={Edit3}
                        onPress={() => openPackageDialog('edit', pkg)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={packageToggleId === pkg.id}
                        onPress={() => {
                          void handleTogglePackage(pkg)
                        }}
                      >
                        {pkg.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </Row>
                  </Row>

                  <Row gap={12} wrap>
                    <InfoChip
                      label="Platform cost"
                      value={formatCurrency(pkg.platform_cost_cents)}
                    />
                    <InfoChip label="Retail price" value={formatCurrency(pkg.retail_cost_cents)} />
                    <InfoChip
                      label="Completion target"
                      value={formatDays(pkg.estimated_completion_days)}
                    />
                    <InfoChip label="Status" value={pkg.is_active ? 'Active' : 'Inactive'} />
                  </Row>

                  <Separator />

                  <Stack gap={8}>
                    <Text style={{ color: colors.text[t].secondary }}>Components</Text>
                    {pkg.components.length === 0 ? (
                      <Text style={{ color: colors.text[t].secondary }}>No check types linked to this package.</Text>
                    ) : (
                      pkg.components.map((component: AdminPackageRecord['components'][number]) => (
                        <Row
                          key={component.id}
                          justify="space-between"
                          align="center"
                          style={{ borderColor: colors.border[t].default, backgroundColor: colors.bg[t].default }}
                          borderWidth={1}
                          borderRadius={12}
                          paddingHorizontal={12}
                          paddingVertical={8}
                        >
                          <Stack gap={4} flex={1}>
                            <Text style={{ color: colors.text[t].secondary }}>{component.display_name}</Text>
                            <Row gap={8} wrap>
                              <InfoText label="Category" value={component.category ?? 'General'} />
                              <InfoText
                                label="Completion"
                                value={formatDays(component.estimated_completion_days)}
                              />
                              <InfoText
                                label="Status"
                                value={component.is_active ? 'Active' : 'Inactive'}
                              />
                            </Row>
                          </Stack>
                        </Row>
                      ))
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Card>

        <Card
          padding="md"
          style={{ backgroundColor: colors.bg[t].muted, borderColor: colors.border[t].default, gap: 16 }}
          borderWidth={1}
          radius="xl"
        >
          <Row justify="space-between" align="center" wrap gap={12}>
            <Stack gap={4}>
              <Row gap={8} align="center">
                <Shield size={18} color={colors.text[t].tertiary} />
                <Text style={{ color: colors.text[t].secondary }}>Check types</Text>
              </Row>
              <Text style={{ color: colors.text[t].secondary }}>
                Maintain granular screening components synchronized with NationSearch.
              </Text>
            </Stack>
            <Row gap={8} wrap>
              <Button size="sm" iconStart={Plus} onPress={() => openCheckTypeDialog('create')}>
                New check type
              </Button>
            </Row>
          </Row>

          {checkTypesQuery.isLoading ? (
            <Stack gap={8} align="center" paddingVertical={16}>
              <Spinner variant="ios" size="lg" />
              <Text style={{ color: colors.text[t].secondary }}>Loading check types…</Text>
            </Stack>
          ) : checkTypes.length === 0 ? (
            <Stack gap={8} paddingVertical={16} align="center">
              <Text style={{ color: colors.text[t].secondary }}>No check types configured yet.</Text>
              <Button size="sm" onPress={() => openCheckTypeDialog('create')}>
                Create your first check type
              </Button>
            </Stack>
          ) : (
            <Stack gap={12}>
              {checkTypes.map((type: AdminCheckTypeRecord) => (
                <Card
                  key={type.id}
                  padding="md"
                  style={{ backgroundColor: colors.bg[t].default, borderColor: colors.border[t].default, gap: 12 }}
                  borderWidth={1}
                  radius="lg"
                >
                  <Row justify="space-between" align="flex-start" gap={12}>
                    <Stack gap={4} flex={1}>
                      <Text style={{ color: colors.text[t].secondary }}>{type.display_name}</Text>
                      <Text style={{ color: colors.text[t].secondary }}>{type.slug}</Text>
                      {type.description ? <Text style={{ color: colors.text[t].secondary }}>{type.description}</Text> : null}
                    </Stack>
                    <Row gap={8} wrap>
                      <Button
                        size="sm"
                        variant="outline"
                        iconStart={Edit3}
                        onPress={() => openCheckTypeDialog('edit', type)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={checkTypeToggleId === type.id}
                        onPress={() => {
                          void handleToggleCheckType(type)
                        }}
                      >
                        {type.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </Row>
                  </Row>

                  <Row gap={12} wrap>
                    <InfoChip label="Category" value={type.category ?? 'General'} />
                    <InfoChip
                      label="Platform cost"
                      value={formatCurrency(type.platform_cost_cents)}
                    />
                    <InfoChip label="Retail price" value={formatCurrency(type.retail_cost_cents)} />
                    <InfoChip
                      label="Validity"
                      value={type.validity_days ? `${type.validity_days} days` : 'No expiry'}
                    />
                    <InfoChip
                      label="Completion target"
                      value={formatDays(type.estimated_completion_days)}
                    />
                    <InfoChip label="Status" value={type.is_active ? 'Active' : 'Inactive'} />
                  </Row>

                  <Separator />

                  <Row wrap gap={8}>
                    <InfoText
                      label="Required documents"
                      value={formatDocuments(type.required_documents)}
                    />
                  </Row>
                </Card>
              ))}
            </Stack>
          )}
        </Card>
      </Stack>

      <Dialog
        modal
        open={packageDialog !== null}
        onOpenChange={(open: boolean) => {
          if (!open) {
            resetPackageDialog()
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content style={{ backgroundColor: colors.bg[t].muted, borderColor: colors.border[t].default }} borderWidth={1}>
            <Dialog.Title>
              {packageDialog?.mode === 'edit'
                ? 'Edit background check package'
                : 'Create background check package'}
            </Dialog.Title>
            <Dialog.Description>
              Configure pricing and included check types for this package.
            </Dialog.Description>

            <ScrollView showsVerticalScrollIndicator>
              <Stack gap={12} marginTop={12} paddingBottom={16}>
                <Input
                  placeholder="Slug"
                  value={packageForm.slug}
                  onChangeText={(value) => handlePackageFieldChange('slug', value)}
                  autoCapitalize="none"
                />
                <Input
                  placeholder="Display name"
                  value={packageForm.displayName}
                  onChangeText={(value) => handlePackageFieldChange('displayName', value)}
                />
                <TextArea
                  placeholder="Description"
                  value={packageForm.description}
                  onChangeText={(value) => handlePackageFieldChange('description', value)}
                  rows={3}
                />

                <Row gap={12} wrap>
                  <Stack flex={1}>
                    <Text style={{ color: colors.text[t].secondary, marginBottom: 4 }}>
                      Platform cost (USD cents)
                    </Text>
                    <Input
                      keyboardType="numeric"
                      value={packageForm.platformCost}
                      onChangeText={(value) => handlePackageFieldChange('platformCost', value)}
                    />
                  </Stack>
                  <Stack flex={1}>
                    <Text style={{ color: colors.text[t].secondary, marginBottom: 4 }}>
                      Retail price (USD cents)
                    </Text>
                    <Input
                      keyboardType="numeric"
                      value={packageForm.retailCost}
                      onChangeText={(value) => handlePackageFieldChange('retailCost', value)}
                    />
                  </Stack>
                  <Stack flex={1}>
                    <Text style={{ color: colors.text[t].secondary, marginBottom: 4 }}>
                      Estimated completion (days)
                    </Text>
                    <Input
                      keyboardType="numeric"
                      value={packageForm.estimatedCompletionDays}
                      onChangeText={(value) =>
                        handlePackageFieldChange('estimatedCompletionDays', value)
                      }
                    />
                  </Stack>
                </Row>

                <Input
                  placeholder="Provider package code (optional)"
                  value={packageForm.providerCode}
                  onChangeText={(value) => handlePackageFieldChange('providerCode', value)}
                  autoCapitalize="none"
                />

                <Stack gap={8}>
                  <Text style={{ color: colors.text[t].secondary }}>Included check types</Text>
                  <Stack gap={8}>
                    {checkTypesQuery.isLoading ? (
                      <Row gap={8} align="center">
                        <Spinner variant="ios" size="sm" />
                        <Text style={{ color: colors.text[t].secondary }}>Loading check types…</Text>
                      </Row>
                    ) : checkTypes.length === 0 ? (
                      <Text style={{ color: colors.text[t].secondary }}>
                        No check types available. Create a check type before configuring packages.
                      </Text>
                    ) : (
                      checkTypes.map((type: AdminCheckTypeRecord) => {
                        const selected = selectedPackageTypeIds.has(type.id)
                        return (
                          <Row
                            key={type.id}
                            gap={8}
                            align="center"
                            style={{ borderColor: colors.border[t].default, backgroundColor: selected ? (t === 'dark' ? colors.blue[900] : colors.blue[50]) : colors.bg[t].default }}
                            borderWidth={1}
                            borderRadius={12}
                            paddingHorizontal={12}
                            paddingVertical={8}
                          >
                            <Checkbox
                              size="sm"
                              checked={selected}
                              onChange={(value) => handleTogglePackageType(type.id, value === true)}
                              labelElement={
                                <Stack gap={4} flex={1}>
                                  <Text style={{ color: colors.text[t].secondary }}>{type.display_name}</Text>
                                  <Text style={{ color: colors.text[t].secondary }}>
                                    {type.category ?? 'General'} ·{' '}
                                    {formatCurrency(type.platform_cost_cents)}
                                  </Text>
                                </Stack>
                              }
                            />
                          </Row>
                        )
                      })
                    )}
                  </Stack>
                </Stack>

                <Row gap={8} align="center">
                  <Checkbox
                    checked={packageForm.isActive}
                    onChange={(value) => handlePackageFieldChange('isActive', value === true)}
                    label="Package is active and selectable"
                  />
                </Row>

                <TextArea
                  placeholder="Metadata (JSON)"
                  value={packageForm.metadata}
                  onChangeText={(value) => handlePackageFieldChange('metadata', value)}
                  rows={4}
                />
                <TextArea
                  placeholder="Component overrides (JSON array)"
                  value={packageForm.componentOverrides}
                  onChangeText={(value) => handlePackageFieldChange('componentOverrides', value)}
                  rows={4}
                />

                {packageFormError ? <Text style={{ color: t === 'dark' ? colors.rose[300] : colors.rose[600] }}>{packageFormError}</Text> : null}

                <Row gap={8} justify="flex-end">
                  <Dialog.Close asChild>
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    size="sm"
                    disabled={upsertPackageMutation.isPending}
                    onPress={() => {
                      void handlePackageSubmit()
                    }}
                  >
                    {upsertPackageMutation.isPending ? 'Saving…' : 'Save package'}
                  </Button>
                </Row>
              </Stack>
            </ScrollView>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <Dialog
        modal
        open={checkTypeDialog !== null}
        onOpenChange={(open: boolean) => {
          if (!open) {
            resetCheckTypeDialog()
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content style={{ backgroundColor: colors.bg[t].muted, borderColor: colors.border[t].default }} borderWidth={1}>
            <Dialog.Title>
              {checkTypeDialog?.mode === 'edit'
                ? 'Edit background check type'
                : 'Create background check type'}
            </Dialog.Title>
            <Dialog.Description>
              Define the granular screening component synchronized with the provider.
            </Dialog.Description>

            <ScrollView showsVerticalScrollIndicator>
              <Stack gap={12} marginTop={12} paddingBottom={16}>
                <Input
                  placeholder="Slug"
                  value={checkTypeForm.slug}
                  onChangeText={(value) => handleCheckTypeFieldChange('slug', value)}
                  autoCapitalize="none"
                />
                <Input
                  placeholder="Display name"
                  value={checkTypeForm.displayName}
                  onChangeText={(value) => handleCheckTypeFieldChange('displayName', value)}
                />
                <TextArea
                  placeholder="Description"
                  rows={3}
                  value={checkTypeForm.description}
                  onChangeText={(value) => handleCheckTypeFieldChange('description', value)}
                />
                <Input
                  placeholder="Category"
                  value={checkTypeForm.category}
                  onChangeText={(value) => handleCheckTypeFieldChange('category', value)}
                />
                <Input
                  placeholder="Provider check code (optional)"
                  value={checkTypeForm.providerCode}
                  onChangeText={(value) => handleCheckTypeFieldChange('providerCode', value)}
                  autoCapitalize="none"
                />

                <Row gap={12} wrap>
                  <Stack flex={1}>
                    <Text style={{ color: colors.text[t].secondary, marginBottom: 4 }}>
                      Platform cost (USD cents)
                    </Text>
                    <Input
                      keyboardType="numeric"
                      value={checkTypeForm.platformCost}
                      onChangeText={(value) => handleCheckTypeFieldChange('platformCost', value)}
                    />
                  </Stack>
                  <Stack flex={1}>
                    <Text style={{ color: colors.text[t].secondary, marginBottom: 4 }}>
                      Retail price (USD cents, optional)
                    </Text>
                    <Input
                      keyboardType="numeric"
                      value={checkTypeForm.retailCost}
                      onChangeText={(value) => handleCheckTypeFieldChange('retailCost', value)}
                    />
                  </Stack>
                  <Stack flex={1}>
                    <Text style={{ color: colors.text[t].secondary, marginBottom: 4 }}>
                      Validity period (days, optional)
                    </Text>
                    <Input
                      keyboardType="numeric"
                      value={checkTypeForm.validityDays}
                      onChangeText={(value) => handleCheckTypeFieldChange('validityDays', value)}
                    />
                  </Stack>
                  <Stack flex={1}>
                    <Text style={{ color: colors.text[t].secondary, marginBottom: 4 }}>
                      Estimated completion (days)
                    </Text>
                    <Input
                      keyboardType="numeric"
                      value={checkTypeForm.estimatedCompletionDays}
                      onChangeText={(value) =>
                        handleCheckTypeFieldChange('estimatedCompletionDays', value)
                      }
                    />
                  </Stack>
                </Row>

                <TextArea
                  placeholder="Required documents (comma separated)"
                  value={checkTypeForm.requiredDocuments}
                  onChangeText={(value) => handleCheckTypeFieldChange('requiredDocuments', value)}
                  rows={2}
                />

                <Row gap={8} align="center">
                  <Checkbox
                    checked={checkTypeForm.isActive}
                    onChange={(value) => handleCheckTypeFieldChange('isActive', value === true)}
                    label="Check type is active"
                  />
                </Row>

                <TextArea
                  placeholder="Provider configuration (JSON)"
                  value={checkTypeForm.providerConfiguration}
                  onChangeText={(value) =>
                    handleCheckTypeFieldChange('providerConfiguration', value)
                  }
                  rows={4}
                />

                <TextArea
                  placeholder="Metadata (JSON)"
                  value={checkTypeForm.metadata}
                  onChangeText={(value) => handleCheckTypeFieldChange('metadata', value)}
                  rows={4}
                />

                {checkTypeFormError ? <Text style={{ color: t === 'dark' ? colors.rose[300] : colors.rose[600] }}>{checkTypeFormError}</Text> : null}

                <Row gap={8} justify="flex-end">
                  <Dialog.Close asChild>
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    size="sm"
                    disabled={upsertCheckTypeMutation.isPending}
                    onPress={() => {
                      void handleCheckTypeSubmit()
                    }}
                  >
                    {upsertCheckTypeMutation.isPending ? 'Saving…' : 'Save check type'}
                  </Button>
                </Row>
              </Stack>
            </ScrollView>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}

interface InfoChipProps {
  label: string
  value: string
}

function InfoChip({ label, value }: InfoChipProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack
      paddingHorizontal={12}
      paddingVertical={8}
      style={{ borderColor: colors.border[t].default, backgroundColor: colors.bg[t].default }}
      borderWidth={1}
      borderRadius={12}
      gap={4}
    >
      <Text style={{ color: colors.text[t].secondary }}>{label}</Text>
      <Text style={{ color: colors.text[t].secondary }}>{value}</Text>
    </Stack>
  )
}

interface InfoTextProps {
  label: string
  value: string
}

function InfoText({ label, value }: InfoTextProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Row gap={4} align="center">
      <Text style={{ color: colors.text[t].secondary }}>{label}:</Text>
      <Text style={{ color: colors.text[t].secondary }}>{value}</Text>
    </Row>
  )
}
