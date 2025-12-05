import { api } from '@scf/core/utils/api'
import {
  CheckCircle2,
  Clock,
  FileWarning,
  Info,
  ListPlus,
  Loader2,
  RotateCcw,
} from '@tamagui/lucide-icons'
import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  H5,
  Paragraph,
  ScrollView,
  Separator,
  Text,
  XStack,
  YStack,
} from '@unicornlove/ui'
import { useImportData } from '../hooks/useImportData'
import { toConfidenceLevel } from '../utils/importConfidence'
import { ConfidenceBadge } from './ConfidenceBadge'
import { EditableField } from './EditableField'
import { ImportSectionTabs } from './ImportSectionTabs'

interface SelectedState {
  [sectionId: string]: Record<string, boolean>
}

export function ImportReviewScreen() {
  const { importData, metadata, isLoading, isError, refetch } = useImportData()
  const [selectedItems, setSelectedItems] = useState<SelectedState>({})
  const [activeSection, setActiveSection] = useState<string>('experience')
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<{ completed: number; total: number }>({
    completed: 0,
    total: 0,
  })

  const utils = api.useUtils()
  const saveImportMutation = api.profile.import.saveImportData.useMutation()
  const clearImportMutation = api.profile.import.clearImportData.useMutation()

  const sections = useMemo(() => {
    if (!importData) return []
    return [
      importData.experience,
      importData.education,
      importData.skills,
      importData.certifications,
      importData.general,
    ]
  }, [importData])

  const sectionTabs = sections.map((section) => ({
    id: section.id,
    label: section.title,
    count: section.items.length,
  }))

  const currentSection = sections.find((section) => section.id === activeSection) ?? sections[0]
  const totalItems = sections.reduce((total, section) => total + section.items.length, 0)
  const allSelected =
    totalItems > 0 &&
    sections.every((section) => section.items.every((item) => selectedItems[section.id]?.[item.id]))

  const expiresInLabel = useMemo(() => {
    if (!metadata?.expiresAt) return null
    const expiresAtMs = new Date(metadata.expiresAt).getTime()
    if (Number.isNaN(expiresAtMs)) return null
    const diffMs = expiresAtMs - Date.now()
    if (diffMs <= 0) {
      return {
        status: 'expired' as const,
        label: 'Import data expired — upload again to continue',
      }
    }
    const totalMinutes = Math.max(1, Math.round(diffMs / 60000))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    let label = 'Expires in '
    if (hours > 0) {
      label += `${hours}h`
      if (minutes > 0) {
        label += ` ${minutes}m`
      }
    } else if (minutes > 0) {
      label += `${minutes}m`
    } else {
      label += 'less than a minute'
    }
    return {
      status: 'active' as const,
      label,
    }
  }, [metadata?.expiresAt])

  const storedAtLabel = useMemo(() => {
    if (!metadata?.storedAt) return null
    const storedDate = new Date(metadata.storedAt)
    if (Number.isNaN(storedDate.getTime())) return null
    return storedDate.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }, [metadata?.storedAt])

  if (isLoading) {
    return (
      <YStack gap="$4" padding="$4" alignItems="center">
        <Loader2 size={32} color="$color10" />
        <Text color="$color11">Retrieving imported data...</Text>
      </YStack>
    )
  }

  if (isError || !importData) {
    return (
      <YStack gap="$3" padding="$4" alignItems="center">
        <FileWarning size={32} color="$red10" />
        <Text color="$red11" fontWeight="600">
          We couldn’t load your import data
        </Text>
        <Text color="$color11">
          Please retry. If the issue persists, try uploading your resume again.
        </Text>
        <Button size="$4" onPress={() => refetch()}>
          Retry
        </Button>
      </YStack>
    )
  }

  const handleToggleItem = (sectionId: string, itemId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] ?? {}),
        [itemId]: !(prev[sectionId]?.[itemId] ?? false),
      },
    }))
  }

  const selectedCount = Object.values(selectedItems).reduce((total, section) => {
    return total + Object.values(section).filter(Boolean).length
  }, 0)

  const handleImportSelected = async () => {
    if (!importData) return

    const buildSectionPayload = <T extends { id: string; raw?: Record<string, unknown> }>(
      sectionId: string,
      items: T[],
      mapper: (item: T) => Record<string, unknown>
    ) => {
      return items
        .filter((item) => selectedItems[sectionId]?.[item.id])
        .map((item) => {
          const base = item.raw ?? mapper(item)
          return Object.fromEntries(
            Object.entries(base).filter(
              ([, value]) => value !== undefined && value !== null && value !== ''
            )
          )
        })
    }

    const generalPayload = buildSectionPayload(
      importData.general.id,
      importData.general.items,
      (item) => ({
        first_name: item.firstName,
        last_name: item.lastName,
        headline: item.headline,
        summary: item.summary,
        confidence_score: item.confidenceScore,
      })
    )

    const experiencePayload = buildSectionPayload(
      importData.experience.id,
      importData.experience.items,
      (item) => ({
        job_title: item.jobTitle,
        company_name: item.companyName,
        start_date: item.startDate,
        end_date: item.endDate,
        is_current: item.isCurrent,
        confidence_score: item.confidenceScore,
      })
    )

    const educationPayload = buildSectionPayload(
      importData.education.id,
      importData.education.items,
      (item) => ({
        degree: item.degree,
        institution: item.institution,
        start_date: item.startDate,
        end_date: item.endDate,
        confidence_score: item.confidenceScore,
      })
    )

    const skillsPayload = buildSectionPayload(
      importData.skills.id,
      importData.skills.items,
      (item) => ({
        name: item.name,
        taxonomy: item.taxonomy,
        confidence_score: item.confidenceScore,
      })
    )

    const certificationsPayload = buildSectionPayload(
      importData.certifications.id,
      importData.certifications.items,
      (item) => ({
        name: item.name,
        issuer: item.issuer,
        issue_date: item.issueDate,
        confidence_score: item.confidenceScore,
      })
    )

    if (
      generalPayload.length === 0 &&
      experiencePayload.length === 0 &&
      educationPayload.length === 0 &&
      skillsPayload.length === 0 &&
      certificationsPayload.length === 0
    ) {
      return
    }

    const payload = {
      general: generalPayload,
      experience: experiencePayload,
      education: educationPayload,
      skills: skillsPayload,
      certifications: certificationsPayload,
    }

    const totalSelected =
      payload.general.length +
      payload.experience.length +
      payload.education.length +
      payload.skills.length +
      payload.certifications.length

    setIsImporting(true)
    setImportProgress({ completed: 0, total: totalSelected })

    try {
      await saveImportMutation.mutateAsync({
        source: metadata?.source ?? 'resume',
        // Payload is compatible with mutation input but transformed from UI format
        payload: payload as unknown as Parameters<
          typeof saveImportMutation.mutateAsync
        >[0]['payload'],
      })
      await utils.profile.import.getImportData.invalidate()
      setSelectedItems({})
      void refetch()

      setImportProgress({ completed: totalSelected, total: totalSelected })
    } catch (error) {
      console.error('[profile-import] Failed to save selected data', error)
    } finally {
      setIsImporting(false)
    }
  }

  const handleSelectAll = () => {
    if (sections.length === 0) return
    setSelectedItems(() => {
      const next: SelectedState = {}
      for (const section of sections) {
        const sectionSelections: Record<string, boolean> = {}
        for (const item of section.items) {
          sectionSelections[item.id] = true
        }
        next[section.id] = sectionSelections
      }
      return next
    })
  }

  return (
    <YStack gap="$4" padding="$4">
      <Card bordered backgroundColor="$color2">
        <Card.Header padded gap="$3">
          <XStack gap="$3" alignItems="flex-start" flexWrap="wrap">
            <Info size={20} color="$blue10" />
            <YStack flex={1} gap="$2">
              <XStack gap="$2" alignItems="center">
                <H5>Imported data overview</H5>
              </XStack>
              <Paragraph color="$color11">
                Review and confirm the details we extracted. You can import everything, bring over a
                subset, or clear the import and start again.
              </Paragraph>
              <XStack gap="$3" flexWrap="wrap">
                <XStack gap="$2" alignItems="center">
                  <Clock
                    size={16}
                    color={expiresInLabel?.status === 'expired' ? '$red10' : '$blue10'}
                  />
                  <Text
                    color={expiresInLabel?.status === 'expired' ? '$red10' : '$color11'}
                    fontWeight="600"
                  >
                    {expiresInLabel?.label ?? 'Expires 24 hours after upload'}
                  </Text>
                </XStack>
                {storedAtLabel && <Text color="$color10">Uploaded {storedAtLabel}</Text>}
                <Text color="$color10">
                  Source:{' '}
                  <Text fontWeight="600" color="$color12">
                    {metadata?.source === 'json' ? 'JSON export' : 'Resume upload'}
                  </Text>
                </Text>
                <Text color="$color10">
                  Items detected:{' '}
                  <Text fontWeight="600" color="$color12">
                    {totalItems}
                  </Text>
                </Text>
              </XStack>
            </YStack>
          </XStack>
        </Card.Header>
      </Card>

      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="700">
          Review Imported Data
        </Text>
        <Text color="$color11">
          Select the items you’d like to import. We’ll highlight anything that might need attention.
        </Text>
      </YStack>

      <ImportSectionTabs
        sections={sectionTabs}
        activeSection={currentSection?.id ?? 'experience'}
        onSectionChange={setActiveSection}
      />

      <Separator />

      <ScrollView flex={1}>
        <YStack gap="$3" marginTop="$3">
          {currentSection?.items.length === 0 && (
            <Card bordered padding="$4" backgroundColor="$color2">
              <Card.Header>
                <Text color="$color11">No items were detected for this section.</Text>
              </Card.Header>
            </Card>
          )}

          {currentSection?.items.map((item) => {
            const isSelected = selectedItems[currentSection.id]?.[item.id] ?? false
            const confidenceLevel = toConfidenceLevel(
              (item as { confidenceScore?: number }).confidenceScore
            )
            return (
              <Card bordered key={item.id} backgroundColor={isSelected ? '$color3' : '$background'}>
                <Card.Header gap="$3">
                  <XStack justifyContent="space-between" alignItems="center">
                    <ConfidenceBadge level={confidenceLevel} />
                    <Button
                      size="$2"
                      variant={isSelected ? 'outlined' : undefined}
                      onPress={() => handleToggleItem(currentSection.id, item.id)}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </Button>
                  </XStack>
                  <YStack gap="$2">
                    {'jobTitle' in item && (
                      <EditableField
                        label="Job Title"
                        value={item.jobTitle}
                        onChange={() => {}}
                        confidenceScore={item.confidenceScore}
                      />
                    )}
                    {'companyName' in item && (
                      <EditableField
                        label="Company"
                        value={item.companyName}
                        onChange={() => {}}
                        confidenceScore={item.confidenceScore}
                      />
                    )}
                    {'degree' in item && (
                      <EditableField
                        label="Degree"
                        value={item.degree}
                        onChange={() => {}}
                        confidenceScore={item.confidenceScore}
                      />
                    )}
                    {'institution' in item && (
                      <EditableField
                        label="Institution"
                        value={item.institution}
                        onChange={() => {}}
                        confidenceScore={item.confidenceScore}
                      />
                    )}
                    {'name' in item && !('jobTitle' in item) && (
                      <EditableField
                        label="Name"
                        value={item.name}
                        onChange={() => {}}
                        confidenceScore={item.confidenceScore}
                      />
                    )}
                    {'summary' in item && (
                      <EditableField
                        label="Summary"
                        value={item.summary}
                        fieldType="textarea"
                        onChange={() => {}}
                        confidenceScore={item.confidenceScore}
                      />
                    )}
                  </YStack>
                </Card.Header>
              </Card>
            )
          })}
        </YStack>
      </ScrollView>

      <Separator />

      <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$3">
        <XStack gap="$2" flexWrap="wrap">
          <Button
            size="$3"
            variant="outlined"
            icon={RotateCcw}
            onPress={() => setSelectedItems({})}
          >
            Clear selections
          </Button>
          <Button
            size="$3"
            variant="outlined"
            icon={ListPlus}
            onPress={handleSelectAll}
            disabled={allSelected || totalItems === 0}
          >
            Select all
          </Button>
        </XStack>
        <XStack gap="$3" alignItems="center" flexWrap="wrap">
          <Text color="$color10" aria-live="polite">
            Selected {selectedCount} of {totalItems}
          </Text>
          {isImporting && (
            <Text color="$color10" aria-live="assertive">
              Importing {importProgress.completed} of {importProgress.total}...
            </Text>
          )}
          <Button
            size="$3"
            variant="outlined"
            disabled={clearImportMutation.isPending}
            onPress={async () => {
              await clearImportMutation.mutateAsync({})
              await utils.profile.import.getImportData.invalidate()
              void refetch()
            }}
          >
            Clear import
          </Button>
          <Button
            size="$4"
            iconAfter={CheckCircle2}
            disabled={selectedCount === 0 || isImporting}
            onPress={handleImportSelected}
          >
            Import selected ({selectedCount})
          </Button>
        </XStack>
      </XStack>
    </YStack>
  )
}
