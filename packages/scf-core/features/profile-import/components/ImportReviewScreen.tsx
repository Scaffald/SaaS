import {
  useSaveImportDataMutation,
  useClearImportDataMutation,
} from '@scf/core/utils/profile-import-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Clock,
  FileWarning,
  Info,
  ListPlus,
  Loader2,
  RotateCcw,
} from 'lucide-react-native'
import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  H5,
  Paragraph,
  ScrollView,
  Separator,
  Text,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'
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

  const queryClient = useQueryClient()
  const saveImportMutation = useSaveImportDataMutation()
  const clearImportMutation = useClearImportDataMutation()

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
      <Stack gap={16} padding="md" align="center">
        <Loader2 size={32} color="$gray11" />
        <Text color="$gray11">Retrieving imported data...</Text>
      </Stack>
    )
  }

  if (isError || !importData) {
    return (
      <Stack gap={12} padding="md" align="center">
        <FileWarning size={32} color="$red10" />
        <Text color="$red11">We couldn’t load your import data</Text>
        <Text color="$gray11">
          Please retry. If the issue persists, try uploading your resume again.
        </Text>
        <Button size="md" onPress={() => refetch()}>
          Retry
        </Button>
      </Stack>
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
      await queryClient.invalidateQueries({ queryKey: ['scaffald', 'profiles', 'import', 'data'] })
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
    <Stack gap={16} padding="md">
      <Card bordered backgroundColor="$color2">
        <Card.Header padded gap={12}>
          <Row gap={12} align="flex-start" flexWrap="wrap">
            <Info size="lg" color="$blue10" />
            <Stack flex={1} gap={8}>
              <Row gap={8} align="center">
                <H5>Imported data overview</H5>
              </Row>
              <Paragraph color="$gray11">
                Review and confirm the details we extracted. You can import everything, bring over a
                subset, or clear the import and start again.
              </Paragraph>
              <Row gap={12} flexWrap="wrap">
                <Row gap={8} align="center">
                  <Clock
                    size="md"
                    color={expiresInLabel?.status === 'expired' ? '$red10' : '$blue10'}
                  />
                  <Text color={expiresInLabel?.status === 'expired' ? '$red10' : '$color11'}>
                    {expiresInLabel?.label ?? 'Expires 24 hours after upload'}
                  </Text>
                </Row>
                {storedAtLabel && <Text color="$gray11">Uploaded {storedAtLabel}</Text>}
                <Text color="$gray11">
                  Source:{' '}
                  <Text color="$gray11">
                    {metadata?.source === 'json' ? 'JSON export' : 'Resume upload'}
                  </Text>
                </Text>
                <Text color="$gray11">
                  Items detected: <Text color="$gray11">{totalItems}</Text>
                </Text>
              </Row>
            </Stack>
          </Row>
        </Card.Header>
      </Card>

      <Stack gap={8}>
        <Text>Review Imported Data</Text>
        <Text color="$gray11">
          Select the items you’d like to import. We’ll highlight anything that might need attention.
        </Text>
      </Stack>

      <ImportSectionTabs
        sections={sectionTabs}
        activeSection={currentSection?.id ?? 'experience'}
        onSectionChange={setActiveSection}
      />

      <Separator />

      <ScrollView flex={1}>
        <Stack gap={12} marginTop={12}>
          {currentSection?.items.length === 0 && (
            <Card bordered padding="md" backgroundColor="$color2">
              <Card.Header>
                <Text color="$gray11">No items were detected for this section.</Text>
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
                <Card.Header gap={12}>
                  <Row justify="space-between" align="center">
                    <ConfidenceBadge level={confidenceLevel} />
                    <Button
                      size="xs"
                      variant={isSelected ? 'outlined' : undefined}
                      onPress={() => handleToggleItem(currentSection.id, item.id)}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </Button>
                  </Row>
                  <Stack gap={8}>
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
                  </Stack>
                </Card.Header>
              </Card>
            )
          })}
        </Stack>
      </ScrollView>

      <Separator />

      <Row justify="space-between" align="center" flexWrap="wrap" gap={12}>
        <Row gap={8} flexWrap="wrap">
          <Button size="sm" variant="outline" iconStart={RotateCcw} onPress={() => setSelectedItems({})}>
            Clear selections
          </Button>
          <Button
            size="sm"
            variant="outline"
            iconStart={ListPlus}
            onPress={handleSelectAll}
            disabled={allSelected || totalItems === 0}
          >
            Select all
          </Button>
        </Row>
        <Row gap={12} align="center" flexWrap="wrap">
          <Text color="$gray11" aria-live="polite">
            Selected {selectedCount} of {totalItems}
          </Text>
          {isImporting && (
            <Text color="$gray11" aria-live="assertive">
              Importing {importProgress.completed} of {importProgress.total}...
            </Text>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={clearImportMutation.isPending}
            onPress={async () => {
              await clearImportMutation.mutateAsync()
              await queryClient.invalidateQueries({
                queryKey: ['scaffald', 'profiles', 'import', 'data'],
              })
              void refetch()
            }}
          >
            Clear import
          </Button>
          <Button
            size="md"
            iconAfter={CheckCircle2}
            disabled={selectedCount === 0 || isImporting}
            onPress={handleImportSelected}
          >
            Import selected ({selectedCount})
          </Button>
        </Row>
      </Row>
    </Stack>
  )
}
