import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import {
  Button,
  Dialog,
  Input,
  ScrollView,
  Separator,
  Spinner,
  Text,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'
import { Check, Edit3, PackagePlus, Plus, RefreshCcw, Shield } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import type { inferRouterOutputs } from '@trpc/server'
import { useCallback, useMemo, useState } from 'react'
import { Card, Checkbox, TextArea } from '@unicornlove/beyond-ui'

type RouterOutputs = inferRouterOutputs<AppRouter>
type AdminPackageRecord = RouterOutputs['backgroundChecks']['adminListPackages'][number]
type AdminCheckTypeRecord = RouterOutputs['backgroundChecks']['adminListCheckTypes'][number]

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
  const toast = useToast()
  const utils = api.useUtils()

  const packagesQuery = api.backgroundChecks.adminListPackages.useQuery(undefined, {
    staleTime: 60_000,
  })
  const checkTypesQuery = api.backgroundChecks.adminListCheckTypes.useQuery(undefined, {
    staleTime: 60_000,
  })

  const upsertPackageMutation = api.backgroundChecks.adminUpsertPackage.useMutation()
  const upsertCheckTypeMutation = api.backgroundChecks.adminUpsertCheckType.useMutation()
  const setPackageActiveMutation = api.backgroundChecks.adminSetPackageActive.useMutation()
  const setCheckTypeActiveMutation = api.backgroundChecks.adminSetCheckTypeActive.useMutation()

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

  const invalidateCatalog = useCallback(async () => {
    await Promise.all([
      utils.backgroundChecks.adminListPackages.invalidate(),
      utils.backgroundChecks.adminListCheckTypes.invalidate(),
    ])
  }, [utils])

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
      await invalidateCatalog()
      toast.show({
          title: 'Package saved',
          message: 'Background check package catalog updated.',
          variant: 'success',
        })
      resetPackageDialog()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save package.'
      toast.show({
          title: 'Failed to save package',
          variant: 'error',
        })
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
      await invalidateCatalog()
      toast.show({
          title: 'Check type saved',
          message: 'Background check components updated.',
          variant: 'success',
        })
      resetCheckTypeDialog()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save check type.'
      toast.show({
          title: 'Failed to save check type',
          variant: 'error',
        })
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
      await invalidateCatalog()
      toast.show('Package status updated', {
        message: `${record.display_name} is now ${record.is_active ? 'inactive' : 'active'}.`,
      })
    } catch (error) {
      const _message = error instanceof Error ? error.message : 'Unable to update package status.'
      toast.show({
          title: 'Failed to update package',
          variant: 'error',
        })
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
      await invalidateCatalog()
      toast.show('Check type status updated', {
        message: `${record.display_name} is now ${record.is_active ? 'inactive' : 'active'}.`,
      })
    } catch (error) {
      const _message = error instanceof Error ? error.message : 'Unable to update check type status.'
      toast.show({
          title: 'Failed to update check type',
          variant: 'error',
        })
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
      <Stack gap="$4">
        <Card
          padding="$4"
          gap="$4"
          backgroundColor="$color2"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$5"
        >
          <Row justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
            <Stack gap="$1">
              <Row gap="$2" alignItems="center">
                <PackagePlus size={18} color="$color10" />
                <Text fontSize="$4" fontWeight="700" color="$color12">
                  Packages
                </Text>
              </Row>
              <Text fontSize="$2" color="$color10">
                Manage bundles of screening components that organizations can request.
              </Text>
            </Stack>
            <Row gap="$2" flexWrap="wrap">
              <Button
                size="$3"
                variant="outlined"
                icon={RefreshCcw}
                disabled={packagesQuery.isLoading || checkTypesQuery.isLoading}
                onPress={() => {
                  void packagesQuery.refetch()
                  void checkTypesQuery.refetch()
                }}
              >
                Refresh catalog
              </Button>
              <Button
                size="$3"
                icon={Plus}
                onPress={() => openPackageDialog('create')}
                disabled={checkTypes.length === 0}
              >
                New package
              </Button>
            </Row>
          </Row>

          {packagesQuery.isLoading ? (
            <Stack gap="$2" alignItems="center" paddingVertical="$4">
              <Spinner size="large" />
              <Text fontSize="$3" color="$color10">
                Loading packages…
              </Text>
            </Stack>
          ) : packages.length === 0 ? (
            <Stack gap="$2" paddingVertical="$4" alignItems="center">
              <Text fontSize="$3" color="$color10">
                {hasCatalogData ? 'No packages match the filters.' : 'No packages configured yet.'}
              </Text>
              <Button size="$3" onPress={() => openPackageDialog('create')}>
                Create your first package
              </Button>
            </Stack>
          ) : (
            <Stack gap="$3">
              {packages.map((pkg: AdminPackageRecord) => (
                <Card
                  key={pkg.id}
                  padding="$4"
                  gap="$3"
                  backgroundColor="$color1"
                  borderColor="$borderColor"
                  borderWidth={1}
                  borderRadius="$4"
                >
                  <Row justifyContent="space-between" alignItems="flex-start" gap="$3">
                    <Stack gap="$1" flex={1}>
                      <Text fontSize="$5" fontWeight="700" color="$color12">
                        {pkg.display_name}
                      </Text>
                      <Text fontSize="$2" color="$color10">
                        {pkg.slug}
                      </Text>
                      {pkg.description ? (
                        <Text fontSize="$3" color="$color11">
                          {pkg.description}
                        </Text>
                      ) : null}
                    </Stack>
                    <Row gap="$2" flexWrap="wrap">
                      <Button
                        size="$2"
                        variant="outlined"
                        icon={Edit3}
                        onPress={() => openPackageDialog('edit', pkg)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="$2"
                        variant="outlined"
                        disabled={packageToggleId === pkg.id}
                        onPress={() => {
                          void handleTogglePackage(pkg)
                        }}
                      >
                        {pkg.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </Row>
                  </Row>

                  <Row gap="$3" flexWrap="wrap">
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

                  <Stack gap="$2">
                    <Text fontSize="$3" fontWeight="600" color="$color12">
                      Components
                    </Text>
                    {pkg.components.length === 0 ? (
                      <Text fontSize="$2" color="$color10">
                        No check types linked to this package.
                      </Text>
                    ) : (
                      pkg.components.map((component: AdminPackageRecord['components'][number]) => (
                        <Row
                          key={component.id}
                          justifyContent="space-between"
                          alignItems="center"
                          borderColor="$borderColor"
                          borderWidth={1}
                          borderRadius="$3"
                          paddingHorizontal="$3"
                          paddingVertical="$2"
                          backgroundColor="$background"
                        >
                          <Stack gap="$1" flex={1}>
                            <Text fontSize="$3" fontWeight="600" color="$color12">
                              {component.display_name}
                            </Text>
                            <Row gap="$2" flexWrap="wrap">
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
          padding="$4"
          gap="$4"
          backgroundColor="$color2"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius="$5"
        >
          <Row justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
            <Stack gap="$1">
              <Row gap="$2" alignItems="center">
                <Shield size={18} color="$color10" />
                <Text fontSize="$4" fontWeight="700" color="$color12">
                  Check types
                </Text>
              </Row>
              <Text fontSize="$2" color="$color10">
                Maintain granular screening components synchronized with NationSearch.
              </Text>
            </Stack>
            <Row gap="$2" flexWrap="wrap">
              <Button size="$3" icon={Plus} onPress={() => openCheckTypeDialog('create')}>
                New check type
              </Button>
            </Row>
          </Row>

          {checkTypesQuery.isLoading ? (
            <Stack gap="$2" alignItems="center" paddingVertical="$4">
              <Spinner size="large" />
              <Text fontSize="$3" color="$color10">
                Loading check types…
              </Text>
            </Stack>
          ) : checkTypes.length === 0 ? (
            <Stack gap="$2" paddingVertical="$4" alignItems="center">
              <Text fontSize="$3" color="$color10">
                No check types configured yet.
              </Text>
              <Button size="$3" onPress={() => openCheckTypeDialog('create')}>
                Create your first check type
              </Button>
            </Stack>
          ) : (
            <Stack gap="$3">
              {checkTypes.map((type: AdminCheckTypeRecord) => (
                <Card
                  key={type.id}
                  padding="$4"
                  gap="$3"
                  backgroundColor="$color1"
                  borderColor="$borderColor"
                  borderWidth={1}
                  borderRadius="$4"
                >
                  <Row justifyContent="space-between" alignItems="flex-start" gap="$3">
                    <Stack gap="$1" flex={1}>
                      <Text fontSize="$5" fontWeight="700" color="$color12">
                        {type.display_name}
                      </Text>
                      <Text fontSize="$2" color="$color10">
                        {type.slug}
                      </Text>
                      {type.description ? (
                        <Text fontSize="$3" color="$color11">
                          {type.description}
                        </Text>
                      ) : null}
                    </Stack>
                    <Row gap="$2" flexWrap="wrap">
                      <Button
                        size="$2"
                        variant="outlined"
                        icon={Edit3}
                        onPress={() => openCheckTypeDialog('edit', type)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="$2"
                        variant="outlined"
                        disabled={checkTypeToggleId === type.id}
                        onPress={() => {
                          void handleToggleCheckType(type)
                        }}
                      >
                        {type.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </Row>
                  </Row>

                  <Row gap="$3" flexWrap="wrap">
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

                  <Row flexWrap="wrap" gap="$2">
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
          <Dialog.Content backgroundColor="$color2" borderColor="$borderColor" borderWidth={1}>
            <Dialog.Title>
              {packageDialog?.mode === 'edit'
                ? 'Edit background check package'
                : 'Create background check package'}
            </Dialog.Title>
            <Dialog.Description>
              Configure pricing and included check types for this package.
            </Dialog.Description>

            <ScrollView showsVerticalScrollIndicator>
              <Stack gap="$3" marginTop="$3" paddingBottom="$4">
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

                <Row gap="$3" flexWrap="wrap">
                  <Stack flex={1}>
                    <Text fontSize="$2" color="$color10" marginBottom="$1">
                      Platform cost (USD cents)
                    </Text>
                    <Input
                      keyboardType="numeric"
                      value={packageForm.platformCost}
                      onChangeText={(value) => handlePackageFieldChange('platformCost', value)}
                    />
                  </Stack>
                  <Stack flex={1}>
                    <Text fontSize="$2" color="$color10" marginBottom="$1">
                      Retail price (USD cents)
                    </Text>
                    <Input
                      keyboardType="numeric"
                      value={packageForm.retailCost}
                      onChangeText={(value) => handlePackageFieldChange('retailCost', value)}
                    />
                  </Stack>
                  <Stack flex={1}>
                    <Text fontSize="$2" color="$color10" marginBottom="$1">
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

                <Stack gap="$2">
                  <Text fontSize="$3" fontWeight="600" color="$color12">
                    Included check types
                  </Text>
                  <Stack gap="$2">
                    {checkTypesQuery.isLoading ? (
                      <Row gap="$2" alignItems="center">
                        <Spinner size="small" />
                        <Text fontSize="$2" color="$color10">
                          Loading check types…
                        </Text>
                      </Row>
                    ) : checkTypes.length === 0 ? (
                      <Text fontSize="$2" color="$color10">
                        No check types available. Create a check type before configuring packages.
                      </Text>
                    ) : (
                      checkTypes.map((type: AdminCheckTypeRecord) => {
                        const selected = selectedPackageTypeIds.has(type.id)
                        return (
                          <Row
                            key={type.id}
                            gap="$2"
                            alignItems="center"
                            borderColor="$borderColor"
                            borderWidth={1}
                            borderRadius="$3"
                            paddingHorizontal="$3"
                            paddingVertical="$2"
                            backgroundColor={selected ? '$blue3' : '$background'}
                          >
                            <Checkbox
                              size="$3"
                              checked={selected}
                              onCheckedChange={(value) =>
                                handleTogglePackageType(type.id, value === true)
                              }
                            >
                              <Checkbox.Indicator>
                                <Check size={16} />
                              </Checkbox.Indicator>
                            </Checkbox>
                            <Stack gap="$1" flex={1}>
                              <Text fontSize="$3" fontWeight="600" color="$color12">
                                {type.display_name}
                              </Text>
                              <Text fontSize="$2" color="$color10">
                                {type.category ?? 'General'} ·{' '}
                                {formatCurrency(type.platform_cost_cents)}
                              </Text>
                            </Stack>
                          </Row>
                        )
                      })
                    )}
                  </Stack>
                </Stack>

                <Row gap="$2" alignItems="center">
                  <Checkbox
                    checked={packageForm.isActive}
                    onCheckedChange={(value) =>
                      handlePackageFieldChange('isActive', value === true)
                    }
                  >
                    <Checkbox.Indicator>
                      <Check size={16} />
                    </Checkbox.Indicator>
                  </Checkbox>
                  <Text fontSize="$2" color="$color12">
                    Package is active and selectable
                  </Text>
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

                {packageFormError ? (
                  <Text fontSize="$2" color="$red10">
                    {packageFormError}
                  </Text>
                ) : null}

                <Row gap="$2" justifyContent="flex-end">
                  <Dialog.Close asChild>
                    <Button variant="outlined" size="$3">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    size="$3"
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
          <Dialog.Content backgroundColor="$color2" borderColor="$borderColor" borderWidth={1}>
            <Dialog.Title>
              {checkTypeDialog?.mode === 'edit'
                ? 'Edit background check type'
                : 'Create background check type'}
            </Dialog.Title>
            <Dialog.Description>
              Define the granular screening component synchronized with the provider.
            </Dialog.Description>

            <ScrollView showsVerticalScrollIndicator>
              <Stack gap="$3" marginTop="$3" paddingBottom="$4">
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

                <Row gap="$3" flexWrap="wrap">
                  <Stack flex={1}>
                    <Text fontSize="$2" color="$color10" marginBottom="$1">
                      Platform cost (USD cents)
                    </Text>
                    <Input
                      keyboardType="numeric"
                      value={checkTypeForm.platformCost}
                      onChangeText={(value) => handleCheckTypeFieldChange('platformCost', value)}
                    />
                  </Stack>
                  <Stack flex={1}>
                    <Text fontSize="$2" color="$color10" marginBottom="$1">
                      Retail price (USD cents, optional)
                    </Text>
                    <Input
                      keyboardType="numeric"
                      value={checkTypeForm.retailCost}
                      onChangeText={(value) => handleCheckTypeFieldChange('retailCost', value)}
                    />
                  </Stack>
                  <Stack flex={1}>
                    <Text fontSize="$2" color="$color10" marginBottom="$1">
                      Validity period (days, optional)
                    </Text>
                    <Input
                      keyboardType="numeric"
                      value={checkTypeForm.validityDays}
                      onChangeText={(value) => handleCheckTypeFieldChange('validityDays', value)}
                    />
                  </Stack>
                  <Stack flex={1}>
                    <Text fontSize="$2" color="$color10" marginBottom="$1">
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

                <Row gap="$2" alignItems="center">
                  <Checkbox
                    checked={checkTypeForm.isActive}
                    onCheckedChange={(value) =>
                      handleCheckTypeFieldChange('isActive', value === true)
                    }
                  >
                    <Checkbox.Indicator>
                      <Check size={16} />
                    </Checkbox.Indicator>
                  </Checkbox>
                  <Text fontSize="$2" color="$color12">
                    Check type is active
                  </Text>
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

                {checkTypeFormError ? (
                  <Text fontSize="$2" color="$red10">
                    {checkTypeFormError}
                  </Text>
                ) : null}

                <Row gap="$2" justifyContent="flex-end">
                  <Dialog.Close asChild>
                    <Button variant="outlined" size="$3">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    size="$3"
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
  return (
    <Stack
      paddingHorizontal="$3"
      paddingVertical="$2"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius="$3"
      backgroundColor="$background"
      gap="$1"
    >
      <Text fontSize="$2" color="$color10">
        {label}
      </Text>
      <Text fontSize="$3" fontWeight="600" color="$color12">
        {value}
      </Text>
    </Stack>
  )
}

interface InfoTextProps {
  label: string
  value: string
}

function InfoText({ label, value }: InfoTextProps) {
  return (
    <Row gap="$1" alignItems="center">
      <Text fontSize="$2" color="$color10">
        {label}:
      </Text>
      <Text fontSize="$2" color="$color12">
        {value}
      </Text>
    </Row>
  )
}
