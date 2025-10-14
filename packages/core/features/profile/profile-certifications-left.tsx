import { useState, useEffect } from 'react'
import { YStack, XStack, Text, H4, Spinner, ScrollView } from 'tamagui'
import { Award } from '@tamagui/lucide-icons'
import { DashboardWidget } from '@app/ui'
import { CertificationSearch, CertificationChip, CertificationCheckbox, ToggleCard } from '@app/ui'
import { api } from '@app/core/utils/api'
import { ProfileEmptyState } from './components'

interface Certification {
  id: string
  slug: string
  title: string
  description: string | null
  depth: number
  parent_id: string | null
  sort_order: number
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

  // Queries
  const {
    data: certTree,
    refetch: refetchTree,
    isLoading: isLoadingTree,
  } = api.profile.certifications.getUserCertificationTree.useQuery()

  const { data: topLevelResults, isLoading: isLoadingSearch } =
    api.profile.certifications.getTopLevelCertifications.useQuery(
      { search: searchQuery },
      { enabled: searchQuery.length > 0 }
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
  const handleSelectTopLevel = async (cert: Certification) => {
    try {
      await addTopLevel.mutateAsync({ certification_id: cert.id })
    } catch (error) {
      console.error('Error adding top-level certification:', error)
    }
  }

  // Handle removing a depth 0 certification
  const handleRemoveTopLevel = async (topLevelId: string) => {
    try {
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
        }
      }
    } catch (error) {
      console.error('Error removing top-level certification:', error)
    }
  }

  // Handle toggling a depth 1 category
  const handleToggleCategory = async (categoryId: string, parentId: string) => {
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
          await addCategory.mutateAsync({
            category_id: categoryId,
            parent_id: parentId,
          })
        } catch (error) {
          console.error('Error adding category:', error)
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
    categoryId: string
  ) => {
    try {
      // If checking the first item, auto-expand the parent category
      if (checked) {
        setExpandedCategories((prev) => new Set([...prev, categoryId]))
      }

      await toggleCert.mutateAsync({
        certification_id: certId,
        parent_id: parentId,
        checked,
      })

      // After successful toggle, check if we should auto-collapse
      // (This will be handled by the useEffect that watches certTree)
    } catch (error) {
      console.error('Error toggling certification:', error)
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
}: {
  parentId: string
  expandedCategories: Set<string>
  onToggle: (categoryId: string, parentId: string) => void
  certTree: unknown
  onCheckCertification: (
    certId: string,
    parentId: string,
    checked: boolean,
    categoryId: string
  ) => void
  onSelectForProof?: (certId: string, certTitle: string) => void
  toggleCertMutation: { isLoading: boolean }
}) {
  const { data: childrenData } = api.profile.certifications.getCertificationChildren.useQuery(
    { parent_id: parentId },
    { enabled: true }
  )

  const depth1Categories = childrenData?.certifications || []
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
      {depth1Categories.map((category: Certification) => {
        const isExpanded = expandedCategories.has(category.id)
        const depth2Items = typedTree.depth2ByParent[category.id] || []

        return (
          <ToggleCard
            key={category.id}
            title={category.title}
            description={category.description || undefined}
            checked={isExpanded}
            onCheckedChange={() => onToggle(category.id, parentId)}
            expandedContent={
              <Depth2Certifications
                categoryId={category.id}
                parentId={category.id}
                savedDepth2={depth2Items}
                onCheck={onCheckCertification}
                onSelectForProof={onSelectForProof}
                toggleMutation={toggleCertMutation}
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
}: {
  categoryId: string
  parentId: string
  savedDepth2: UserCertification[]
  onCheck: (certId: string, parentId: string, checked: boolean, categoryId: string) => void
  onSelectForProof?: (certId: string, certTitle: string) => void
  toggleMutation: { isLoading: boolean }
}) {
  const { data: childrenData } = api.profile.certifications.getCertificationChildren.useQuery(
    { parent_id: parentId },
    { enabled: true }
  )

  const depth2Certs = childrenData?.certifications || []

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
      {depth2Certs.map((cert: Certification) => {
        const userCert = savedMap.get(cert.id)
        const isChecked = !!userCert
        const hasProof = !!(userCert?.credential_url || userCert?.certificate_file_path)

        return (
          <CertificationCheckbox
            key={cert.id}
            certification={cert}
            checked={isChecked}
            onCheckedChange={(checked: boolean) => onCheck(cert.id, parentId, checked, categoryId)}
            hasProof={hasProof}
            onAddProof={
              isChecked && onSelectForProof
                ? () => onSelectForProof(userCert?.id || cert.id, cert.title)
                : undefined
            }
            disabled={toggleMutation.isLoading}
          />
        )
      })}
    </YStack>
  )
}
