import { useState, useEffect, useCallback, useRef } from 'react'
import {
  YStack,
  XStack,
  Text,
  H4,
  Spinner,
  ScrollView,
  Button,
  Input,
  Separator,
  Card,
  TextArea,
} from 'tamagui'
import { Award, PlusCircle, UploadCloud } from '@tamagui/lucide-icons'
import { DashboardWidget, MonthYearPicker } from '@app/ui'
import { CertificationSearch, CertificationChip, CertificationCheckbox, ToggleCard } from '@app/ui'
import { api } from '@app/core/utils/api'
import { ProfileEmptyState } from './components'
import { useToastController } from '@tamagui/toast'
import { invalidateProfileQueries } from './utils/profile-sync'
import {
  startProfileSync,
  completeProfileSync,
  failProfileSync,
  resetProfileSyncError,
} from './utils/profile-sync-store'

interface Certification {
  id: string
  slug: string
  title: string
  description: string | null
  depth: number
  sort_order: number
}

interface CertificationWithParent extends Certification {
  parent_id: string | null
}

interface UserCertification {
  id: string
  certification_id: string
  credential_url: string | null
  certificate_file_path: string | null
  catalog: Certification
}

interface CertificationTree {
  depth0: UserCertification[]
  depth1ByParent: Record<string, UserCertification[]>
  depth2ByParent: Record<string, UserCertification[]>
}

interface ProfileCertificationsLeftProps {
  onSelectCertificationForProof?: (certId: string, certTitle: string) => void
}

/**
 * Profile Certifications Left Component
 * Hierarchical certification selection with progressive saving
 */
export function ProfileCertificationsLeft({
  onSelectCertificationForProof,
}: ProfileCertificationsLeftProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Certification[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({})
  const [customForm, setCustomForm] = useState({
    name: '',
    organization: '',
    issueDate: null as Date | null,
    expirationDate: null as Date | null,
    credentialId: '',
    credentialUrl: '',
    description: '',
    file: null as File | null,
  })
  const [recentlyChangedCerts, setRecentlyChangedCerts] = useState<Record<string, 'added' | 'removed'>>({})
  const highlightTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const toast = useToastController()

  useEffect(() => {
    return () => {
      for (const timer of Object.values(highlightTimers.current)) {
        clearTimeout(timer)
      }
    }
  }, [])

  const triggerHighlight = useCallback((certId: string, status: 'added' | 'removed') => {
    setRecentlyChangedCerts((prev) => ({ ...prev, [certId]: status }))

    if (highlightTimers.current[certId]) {
      clearTimeout(highlightTimers.current[certId])
    }

    highlightTimers.current[certId] = setTimeout(() => {
      setRecentlyChangedCerts((prev) => {
        const next = { ...prev }
        delete next[certId]
        return next
      })
      delete highlightTimers.current[certId]
    }, 3000)
  }, [])

  const formatMonthYear = useCallback((date: Date | null) => {
    if (!date) return undefined
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${date.getFullYear()}-${month}-01`
  }, [])

  const resetCustomForm = useCallback(() => {
    setCustomForm({
      name: '',
      organization: '',
      issueDate: null,
      expirationDate: null,
      credentialId: '',
      credentialUrl: '',
      description: '',
      file: null,
    })
    setCustomErrors({})
  }, [])

  const convertFileToBase64 = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }, [])

  const handleCustomFileSelect = useCallback(() => {
    if (typeof document === 'undefined') {
      toast.show('Upload Unsupported', {
        message: 'File uploads are only available on web right now.',
      })
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.jpg,.jpeg,.png'
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0] ?? null
      setCustomForm((prev) => ({ ...prev, file }))
    }
    input.click()
  }, [toast])

  const handleClearCustomFile = useCallback(() => {
    setCustomForm((prev) => ({ ...prev, file: null }))
  }, [])

  // Queries
  const {
    data: certTree,
    refetch: refetchTree,
    isLoading: isLoadingTree,
  } = api.profile.certifications.getUserCertificationTree.useQuery()
  const utils = api.useContext()

  const { data: topLevelResults, isLoading: isLoadingSearch } =
    api.profile.certifications.getTopLevelCertifications.useQuery(
      { search: searchQuery },
      {
        enabled: searchQuery.length > 0,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
      },
    )

  // Mutations
  const addTopLevel = api.profile.certifications.addTopLevelCertification.useMutation({
    onSuccess: () => refetchTree(),
  })

  const addCategory = api.profile.certifications.addCategoryCertification.useMutation({
    onSuccess: () => refetchTree(),
  })

  const toggleCert = api.profile.certifications.toggleSpecificCertification.useMutation({
    onSuccess: () => refetchTree(),
  })

  const removeTopLevel = api.profile.certifications.removeTopLevelCertification.useMutation({
    onSuccess: () => refetchTree(),
  })

  const saveCustomCertMutation = api.profile.certifications.saveCertifications.useMutation()
  const uploadCustomFileMutation = api.profile.certifications.uploadCertificationFile.useMutation()

  const isSavingCustom = saveCustomCertMutation.isPending || uploadCustomFileMutation.isPending

  const handleCustomFormSubmit = useCallback(async () => {
    const errors: Record<string, string> = {}
    if (!customForm.name.trim()) {
      errors.name = 'Certification name is required'
    }
    if (!customForm.organization.trim()) {
      errors.organization = 'Issuing organization is required'
    }
    if (customForm.credentialUrl.trim()) {
      try {
        // Throws if invalid
        // eslint-disable-next-line no-new
        new URL(customForm.credentialUrl.trim())
      } catch {
        errors.credentialUrl = 'Enter a valid URL'
      }
    }
    if (customForm.issueDate && customForm.expirationDate) {
      if (customForm.issueDate > customForm.expirationDate) {
        errors.expirationDate = 'Expiration must be after the issue date'
      }
    }

    if (Object.keys(errors).length > 0) {
      setCustomErrors(errors)
      return
    }

    setCustomErrors({})

    try {
      resetProfileSyncError()
      startProfileSync()
      const response = await saveCustomCertMutation.mutateAsync({
        certifications: [
          {
            name: customForm.name.trim(),
            issuing_organization: customForm.organization.trim(),
            issue_date: formatMonthYear(customForm.issueDate),
            expiration_date: formatMonthYear(customForm.expirationDate),
            credential_id: customForm.credentialId.trim() || undefined,
            credential_url: customForm.credentialUrl.trim() || undefined,
            description: customForm.description.trim() || undefined,
            is_active: true,
            verification_status: 'unverified',
          },
        ],
      })

      const createdCertification = response.certifications[0]

      if (customForm.file && createdCertification?.id) {
        const base64 = await convertFileToBase64(customForm.file)
        await uploadCustomFileMutation.mutateAsync({
          certificationId: createdCertification.id,
          file: base64,
          fileName: customForm.file.name,
          contentType: customForm.file.type || 'application/pdf',
        })
      }

      toast.show('Certification Added', {
        message: `${customForm.name.trim()} saved to your profile.`,
      })

      resetCustomForm()
      setShowCustomForm(false)
      await refetchTree()
      await invalidateProfileQueries(utils)
      completeProfileSync()
    } catch (error) {
      console.error('Error saving custom certification:', error)
      toast.show('Error', {
        message:
          error instanceof Error
            ? error.message
            : 'Unable to save that certification right now.',
      })
      failProfileSync()
    }
  }, [
    convertFileToBase64,
    customForm,
    formatMonthYear,
    refetchTree,
    resetCustomForm,
    saveCustomCertMutation,
    toast,
    uploadCustomFileMutation,
    utils,
  ])

  // Update search results when query returns
  useEffect(() => {
    if (topLevelResults?.certifications) {
      setSearchResults(topLevelResults.certifications)
    }
  }, [topLevelResults])

  // Auto-expand categories that have checked depth 2 certifications
  useEffect(() => {
    if (!certTree) return

    const categoriesToExpand = new Set<string>()
    const typedTree = certTree as unknown as CertificationTree

    // Check all depth 2 items by parent (depth 1 category)
    const depth2ByParent = typedTree.depth2ByParent || {}

    // If a depth 1 category has any depth 2 items, it should be expanded
    for (const [categoryId, items] of Object.entries(depth2ByParent)) {
      if (Array.isArray(items) && items.length > 0) {
        categoriesToExpand.add(categoryId)
      }
    }

    setExpandedCategories(categoriesToExpand)
  }, [certTree])

  // Handle search query changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  // Handle selecting a depth 0 certification
  const handleSelectTopLevel = async (cert: Certification): Promise<void> => {
    try {
      resetProfileSyncError()
      startProfileSync()
      await addTopLevel.mutateAsync({ certification_id: cert.id })
      toast.show('Category Added', {
        message: `${cert.title} is now part of your certifications.`,
      })
      await invalidateProfileQueries(utils)
      completeProfileSync()
    } catch (error) {
      console.error('Error adding top-level certification:', error)
      toast.show('Error', {
        message:
          error instanceof Error
            ? error.message
            : 'Unable to add this certification category right now.',
      })
      failProfileSync()
    }
  }

  // Handle removing a depth 0 certification
  const handleRemoveTopLevel = async (topLevelId: string) => {
    try {
      resetProfileSyncError()
      startProfileSync()
      const result = await removeTopLevel.mutateAsync({
        top_level_id: topLevelId,
        confirmed: false,
      })

      if (result.needsConfirmation) {
        // Show confirmation dialog
        const confirmed = confirm(
          `${result.message}\n\nAre you sure you want to remove this certification and all related items?`
        )

        if (confirmed) {
          await removeTopLevel.mutateAsync({
            top_level_id: topLevelId,
            confirmed: true,
          })
          toast.show('Category Removed', {
            message: 'Certification category removed from your profile.',
          })
          await invalidateProfileQueries(utils)
          completeProfileSync()
        } else {
          completeProfileSync()
        }
      } else {
        toast.show('Category Removed', {
          message: 'Certification category removed from your profile.',
        })
        await invalidateProfileQueries(utils)
        completeProfileSync()
      }
    } catch (error) {
      console.error('Error removing top-level certification:', error)
      toast.show('Error', {
        message:
          error instanceof Error
            ? error.message
            : 'Unable to remove that certification right now.',
      })
      failProfileSync()
    }
  }

  // Handle toggling a depth 1 category
  const handleToggleCategory = async (categoryId: string, parentId: string, categoryTitle: string) => {
    const isExpanded = expandedCategories.has(categoryId)

    if (!isExpanded) {
      // Check if already saved
      const depth1Items = certTree?.depth1ByParent[parentId] || []
      const alreadySaved = depth1Items.some(
        (item: UserCertification) => item.certification_id === categoryId
      )

      if (!alreadySaved) {
        // First time expanding - save to DB
        try {
          resetProfileSyncError()
          startProfileSync()
          await addCategory.mutateAsync({
            category_id: categoryId,
            parent_id: parentId,
          })
          toast.show('Category Saved', {
            message: `${categoryTitle} added to your certifications.`,
          })
          await invalidateProfileQueries(utils)
          completeProfileSync()
        } catch (error) {
          console.error('Error adding category:', error)
          toast.show('Error', {
            message:
              error instanceof Error
                ? error.message
                : 'Unable to add that category right now.',
          })
          failProfileSync()
          return
        }
      }

      // Expand in UI
      setExpandedCategories((prev) => new Set([...prev, categoryId]))
    } else {
      // Just collapse UI (don't delete from DB)
      setExpandedCategories((prev) => {
        const next = new Set(prev)
        next.delete(categoryId)
        return next
      })
    }
  }

  // Handle checking/unchecking a depth 2 certification
  const handleCheckCertification = async (
    certId: string,
    parentId: string,
    checked: boolean,
    categoryId: string,
    certTitle: string
  ) => {
    try {
      // If checking the first item, auto-expand the parent category
      if (checked) {
        setExpandedCategories((prev) => new Set([...prev, categoryId]))
      }

      resetProfileSyncError()
      startProfileSync()
      await toggleCert.mutateAsync({
        certification_id: certId,
        parent_id: parentId,
        checked,
      })

      // After successful toggle, check if we should auto-collapse
      // (This will be handled by the useEffect that watches certTree)
      triggerHighlight(certId, checked ? 'added' : 'removed')
      toast.show(checked ? 'Certification Added' : 'Certification Removed', {
        message: checked
          ? `${certTitle} added to your profile.`
          : `${certTitle} removed from your profile.`,
      })
      await invalidateProfileQueries(utils)
      completeProfileSync()
    } catch (error) {
      console.error('Error toggling certification:', error)
      toast.show('Error', {
        message:
          error instanceof Error
            ? error.message
            : 'Unable to update that certification right now.',
      })
      failProfileSync()
    }
  }

  // Get selected top-level certification IDs
  const selectedTopLevelIds = (certTree?.depth0 || []).map(
    (item: UserCertification) => item.certification_id
  )

  if (isLoadingTree) {
    return (
      <DashboardWidget>
        <YStack gap="$4" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <Spinner size="large" />
          <Text>Loading certifications...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <YStack gap="$4">
        <H4>Certifications & Credentials</H4>

        {/* Search for depth 0 certifications */}
        <CertificationSearch
          onSelect={handleSelectTopLevel}
          searchResults={searchResults}
          onSearchChange={handleSearchChange}
          isLoading={isLoadingSearch}
          selectedIds={selectedTopLevelIds}
        />

        {/* Selected top-level certifications as chips */}
        {certTree?.depth0 && certTree.depth0.length > 0 && (
          <YStack gap="$3">
            <Text fontWeight="600" fontSize="$4">
              Selected Categories
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              {certTree.depth0.map((item: UserCertification) => (
                <CertificationChip
                  key={item.id}
                  certification={{
                    id: item.certification_id,
                    title: item.catalog.title,
                  }}
                  onRemove={handleRemoveTopLevel}
                  disabled={removeTopLevel.isLoading}
                />
              ))}
            </XStack>
          </YStack>
        )}

        <Separator />

        <YStack gap="$3">
          <XStack justify="space-between" items="center">
            <Text fontWeight="600" fontSize="$4">
              Custom Certifications
            </Text>
            <Button
              size="$3"
              icon={PlusCircle}
              variant={showCustomForm ? 'outlined' : undefined}
              theme={showCustomForm ? undefined : 'accent'}
              onPress={() =>
                setShowCustomForm((prev) => {
                  if (prev) {
                    resetCustomForm()
                  }
                  return !prev
                })
              }
            >
              {showCustomForm ? 'Cancel' : 'Add Custom Certification'}
            </Button>
          </XStack>

          {showCustomForm && (
            <Card bordered bg="$color2">
              <YStack gap="$3" p="$4">
                <Text fontSize="$2" color="$color11">
                  Add certifications that are not in our catalog. These appear alongside saved certifications on the right panel.
                </Text>

                <YStack gap="$2">
                  <Text fontWeight="600">Certification Name *</Text>
                  <Input
                    placeholder="e.g. OSHA 30-Hour Construction"
                    value={customForm.name}
                    onChangeText={(text) => setCustomForm((prev) => ({ ...prev, name: text }))}
                    disabled={isSavingCustom}
                  />
                  {customErrors.name && (
                    <Text fontSize="$2" color="$red10">
                      {customErrors.name}
                    </Text>
                  )}
                </YStack>

                <YStack gap="$2">
                  <Text fontWeight="600">Issuing Organization *</Text>
                  <Input
                    placeholder="Issuing organization"
                    value={customForm.organization}
                    onChangeText={(text) => setCustomForm((prev) => ({ ...prev, organization: text }))}
                    disabled={isSavingCustom}
                  />
                  {customErrors.organization && (
                    <Text fontSize="$2" color="$red10">
                      {customErrors.organization}
                    </Text>
                  )}
                </YStack>

                <XStack gap="$3" flexWrap="wrap">
                  <YStack flex={1} minWidth={200} gap="$2">
                    <Text fontWeight="600">Issue Date</Text>
                    <MonthYearPicker
                      value={customForm.issueDate}
                      onChange={(date) => setCustomForm((prev) => ({ ...prev, issueDate: date }))}
                      disabled={isSavingCustom}
                      error={customErrors.issueDate}
                    />
                  </YStack>
                  <YStack flex={1} minWidth={200} gap="$2">
                    <Text fontWeight="600">Expiration Date</Text>
                    <MonthYearPicker
                      value={customForm.expirationDate}
                      onChange={(date) => setCustomForm((prev) => ({ ...prev, expirationDate: date }))}
                      disabled={isSavingCustom}
                      error={customErrors.expirationDate}
                    />
                  </YStack>
                </XStack>

                <XStack gap="$3" flexWrap="wrap">
                  <YStack flex={1} minWidth={200} gap="$2">
                    <Text fontWeight="600">Credential ID</Text>
                    <Input
                      placeholder="Credential ID or number"
                      value={customForm.credentialId}
                      onChangeText={(text) => setCustomForm((prev) => ({ ...prev, credentialId: text }))}
                      disabled={isSavingCustom}
                    />
                  </YStack>
                  <YStack flex={1} minWidth={200} gap="$2">
                    <Text fontWeight="600">Credential URL</Text>
                    <Input
                      placeholder="https://..."
                      value={customForm.credentialUrl}
                      onChangeText={(text) => setCustomForm((prev) => ({ ...prev, credentialUrl: text }))}
                      keyboardType="url"
                      autoCapitalize="none"
                      disabled={isSavingCustom}
                    />
                    {customErrors.credentialUrl && (
                      <Text fontSize="$2" color="$red10">
                        {customErrors.credentialUrl}
                      </Text>
                    )}
                  </YStack>
                </XStack>

                <YStack gap="$2">
                  <Text fontWeight="600">Description</Text>
                  <TextArea
                    rows={3}
                    placeholder="Add notes about this certification"
                    value={customForm.description}
                    onChangeText={(text) => setCustomForm((prev) => ({ ...prev, description: text }))}
                    disabled={isSavingCustom}
                  />
                </YStack>

                <YStack gap="$2">
                  <Text fontWeight="600">Proof (optional)</Text>
                  <XStack gap="$2" flexWrap="wrap" items="center">
                    <Button
                      size="$3"
                      icon={UploadCloud}
                      variant="outlined"
                      onPress={handleCustomFileSelect}
                      disabled={isSavingCustom}
                    >
                      {customForm.file ? customForm.file.name : 'Upload PDF or image'}
                    </Button>
                    {customForm.file && (
                      <Button size="$2" variant="outlined" onPress={handleClearCustomFile} disabled={isSavingCustom}>
                        Remove file
                      </Button>
                    )}
                  </XStack>
                </YStack>

                <XStack gap="$3" justify="flex-end">
                  <Button
                    variant="outlined"
                    onPress={() => {
                      resetCustomForm()
                      setShowCustomForm(false)
                    }}
                    disabled={isSavingCustom}
                  >
                    Cancel
                  </Button>
                  <Button theme="blue" onPress={handleCustomFormSubmit} disabled={isSavingCustom}>
                    {isSavingCustom ? 'Saving...' : 'Save Certification'}
                  </Button>
                </XStack>
              </YStack>
            </Card>
          )}
        </YStack>

        {/* Depth 1 categories and depth 2 certifications */}
        <ScrollView height={600}>
          <YStack gap="$3">
            {certTree?.depth0 && certTree.depth0.length > 0 ? (
              certTree.depth0.map((topLevel: UserCertification) => {
                return (
                  <YStack key={topLevel.id} gap="$2">
                    <Text fontWeight="600" fontSize="$5" color="$blue11">
                      {topLevel.catalog.title}
                    </Text>

                    {/* Fetch and display depth 1 categories */}
                    <Depth1Categories
                      parentId={topLevel.certification_id}
                      expandedCategories={expandedCategories}
                      onToggle={handleToggleCategory}
                      certTree={certTree}
                      onCheckCertification={handleCheckCertification}
                      onSelectForProof={onSelectCertificationForProof}
                      toggleCertMutation={toggleCert}
                      recentlyChangedCerts={recentlyChangedCerts}
                    />
                  </YStack>
                )
              })
            ) : (
              <ProfileEmptyState
                icon={Award}
                message="Search and select certification categories above to get started."
              />
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </DashboardWidget>
  )
}

// Component to handle depth 1 categories
function Depth1Categories({
  parentId,
  expandedCategories,
  onToggle,
  certTree,
  onCheckCertification,
  onSelectForProof,
  toggleCertMutation,
  recentlyChangedCerts,
}: {
  parentId: string
  expandedCategories: Set<string>
  onToggle: (categoryId: string, parentId: string, categoryTitle: string) => void
  certTree: unknown
  onCheckCertification: (
    certId: string,
    parentId: string,
    checked: boolean,
    categoryId: string,
    certTitle: string
  ) => void
  onSelectForProof?: (certId: string, certTitle: string) => void
  toggleCertMutation: { isLoading: boolean }
  recentlyChangedCerts: Record<string, 'added' | 'removed'>
}) {
  const { data: childrenData } = api.profile.certifications.getCertificationChildren.useQuery(
    { parent_id: parentId },
    { enabled: true }
  )

  const depth1Categories: CertificationWithParent[] = childrenData?.certifications || []
  const typedTree = certTree as unknown as CertificationTree

  if (depth1Categories.length === 0) {
    return (
      <Text fontSize="$2" color="$color11">
        No sub-categories available
      </Text>
    )
  }

  return (
    <YStack gap="$2">
      {depth1Categories.map((category: CertificationWithParent) => {
        const isExpanded = expandedCategories.has(category.id)
        const depth2Items = typedTree.depth2ByParent[category.id] || []
        const categoryDescription =
          typeof category.description === 'string' ? category.description : undefined

        return (
          <ToggleCard
            key={category.id}
            title={category.title}
            description={categoryDescription}
            checked={isExpanded}
            onCheckedChange={() => onToggle(category.id, parentId, category.title)}
            expandedContent={
              <Depth2Certifications
                categoryId={category.id}
                parentId={category.id}
                savedDepth2={depth2Items}
                onCheck={onCheckCertification}
                onSelectForProof={onSelectForProof}
                toggleMutation={toggleCertMutation}
                recentlyChangedCerts={recentlyChangedCerts}
              />
            }
          />
        )
      })}
    </YStack>
  )
}

// Component to handle depth 2 certifications
function Depth2Certifications({
  categoryId,
  parentId,
  savedDepth2,
  onCheck,
  onSelectForProof,
  toggleMutation,
  recentlyChangedCerts,
}: {
  categoryId: string
  parentId: string
  savedDepth2: UserCertification[]
  onCheck: (
    certId: string,
    parentId: string,
    checked: boolean,
    categoryId: string,
    certTitle: string
  ) => void
  onSelectForProof?: (certId: string, certTitle: string) => void
  toggleMutation: { isLoading: boolean }
  recentlyChangedCerts: Record<string, 'added' | 'removed'>
}) {
  const { data: childrenData } = api.profile.certifications.getCertificationChildren.useQuery(
    { parent_id: parentId },
    { enabled: true }
  )

  const depth2Certs: CertificationWithParent[] = childrenData?.certifications || []

  if (depth2Certs.length === 0) {
    return (
      <Text fontSize="$2" color="$color11">
        No specific certifications available
      </Text>
    )
  }

  // Create a map of saved certifications
  const savedMap = new Map(
    savedDepth2.map((item: UserCertification) => [item.certification_id, item])
  )

  return (
    <YStack gap="$2">
      {depth2Certs.map((cert: CertificationWithParent) => {
        const userCert = savedMap.get(cert.id)
        const isChecked = !!userCert
        const hasProof = !!(userCert?.credential_url || userCert?.certificate_file_path)
        const changeStatus = recentlyChangedCerts[cert.id]
        const sanitizedCert = {
          ...cert,
          description: typeof cert.description === 'string' ? cert.description : null,
        }

        return (
          <YStack
            key={cert.id}
            p="$3"
            borderRadius="$4"
            borderWidth={1}
            animation="quick"
            backgroundColor={
              changeStatus === 'added'
                ? '$green2'
                : changeStatus === 'removed'
                  ? '$red2'
                  : '$color1'
            }
            borderColor={
              changeStatus === 'added'
                ? '$green7'
                : changeStatus === 'removed'
                  ? '$red7'
                  : '$borderColor'
            }
            mt="$2"
          >
            <CertificationCheckbox
                certification={sanitizedCert}
              checked={isChecked}
              onCheckedChange={(checked: boolean) =>
                onCheck(cert.id, parentId, checked, categoryId, cert.title)
              }
              hasProof={hasProof}
              onAddProof={
                isChecked && onSelectForProof
                  ? () => onSelectForProof(userCert?.id || cert.id, cert.title)
                  : undefined
              }
              disabled={toggleMutation.isLoading}
                description={certificationDescription}
            />
            {changeStatus === 'added' && (
              <Text mt="$2" fontSize="$2" color="$green11">
                ✓ Added to profile
              </Text>
            )}
            {changeStatus === 'removed' && (
              <Text mt="$2" fontSize="$2" color="$red11">
                Removed from profile
              </Text>
            )}
          </YStack>
        )
      })}
    </YStack>
  )
}
