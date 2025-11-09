import { useMemo, useState } from 'react'
import { Button, Card, ScrollView, Separator, Text, XStack, YStack } from 'tamagui'
import { CheckCircle2, FileWarning, Loader2, RotateCcw } from '@tamagui/lucide-icons'
import { useImportData } from '../hooks/useImportData'
import { ConfidenceBadge } from './ConfidenceBadge'
import { ImportSectionTabs } from './ImportSectionTabs'
import { EditableField } from './EditableField'
import { toConfidenceLevel } from '../utils/importConfidence'

interface SelectedState {
  [sectionId: string]: Record<string, boolean>
}

export function ImportReviewScreen() {
  const { importData, isLoading, isError, refetch } = useImportData()
  const [selectedItems, setSelectedItems] = useState<SelectedState>({})
  const [activeSection, setActiveSection] = useState<string>('experience')
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<{ completed: number; total: number }>({
    completed: 0,
    total: 0,
  })

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

  if (isLoading) {
    return (
      <YStack gap="$4" p="$4" items="center">
        <Loader2 size={32} color="$color10" />
        <Text color="$color11">Retrieving imported data...</Text>
      </YStack>
    )
  }

  if (isError || !importData) {
    return (
      <YStack gap="$3" p="$4" items="center">
        <FileWarning size={32} color="$red10" />
        <Text color="$red11" fontWeight="600">
          We couldn’t load your import data
        </Text>
        <Text color="$color11">Please retry. If the issue persists, try uploading your resume again.</Text>
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
    setIsImporting(true)
    setImportProgress({ completed: 0, total: selectedCount })

    try {
      // TODO: call profile import save endpoints for selected data
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setImportProgress({ completed: selectedCount, total: selectedCount })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <YStack gap="$4" p="$4">
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
        <YStack gap="$3" mt="$3">
          {currentSection?.items.length === 0 && (
            <Card bordered p="$4" bg="$color2">
              <Card.Header>
                <Text color="$color11">No items were detected for this section.</Text>
              </Card.Header>
            </Card>
          )}

          {currentSection?.items.map((item) => {
            const isSelected = selectedItems[currentSection.id]?.[item.id] ?? false
            const confidenceLevel = toConfidenceLevel((item as { confidenceScore?: number }).confidenceScore)
            return (
              <Card bordered key={item.id} bg={isSelected ? '$color3' : '$background'}>
                <Card.Header gap="$3">
                  <XStack justify="space-between" items="center">
                    <ConfidenceBadge level={confidenceLevel} />
                    <Button
                      size="$2"
                      variant={isSelected ? 'outlined' : 'ghost'}
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

      <XStack justify="space-between" items="center">
        <Button size="$3" variant="outlined" icon={RotateCcw} onPress={() => setSelectedItems({})}>
          Clear Selections
        </Button>
        <XStack gap="$3" items="center">
          {isImporting && (
            <Text color="$color10">
              Importing {importProgress.completed} of {importProgress.total}...
            </Text>
          )}
          <Button
            size="$4"
            iconAfter={CheckCircle2}
            disabled={selectedCount === 0 || isImporting}
            onPress={handleImportSelected}
          >
            Import Selected ({selectedCount})
          </Button>
        </XStack>
      </XStack>
    </YStack>
  )
}


