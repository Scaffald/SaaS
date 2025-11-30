import { ArrowLeft, ChevronRight, Search, X } from '@tamagui/lucide-icons'
import { useCallback, useMemo, useState } from 'react'
import {
  Button,
  Card,
  type GetThemeValueForKey,
  Input,
  ScrollView,
  Separator,
  Slider,
  Spinner,
  Text,
  useWindowDimensions,
  XStack,
  YStack,
} from 'tamagui'
import { Dialog } from '../dialog/Dialog'
import { Sheet } from '../sheets/Sheet'

/**
 * Parent skill from search (multi-taxonomy format)
 * Now includes hierarchy information for CSI skills
 */
export interface ParentSkill {
  id: string
  name: string
  code: string
  depth: number
  childCount?: number
  parentId?: string | null
  parentName?: string | null
  hierarchyPath?: string | null
}

/**
 * Child skill with hierarchy (not used in multi-taxonomy)
 */
export interface SkillChild {
  id: string
  name: string
  code: string
  depth: number
}

/**
 * Props for SkillSearchModal
 */
export interface SkillSearchModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal is closed */
  onClose: () => void
  /** Callback when skill is selected */
  onSelectSkill: (skillId: string, proficiency: number) => void
  /** Callback when skill is updated */
  onUpdateSkill?: (skillId: string, proficiency: number) => void
  /** Function to search parent skills */
  onSearchParents: (query: string) => Promise<ParentSkill[]>
  /** Function to get children of a parent */
  onGetChildren: (parentId: string) => Promise<SkillChild[]>
  /** Whether search is loading */
  isSearching?: boolean
  /** Existing skill IDs that user has already added */
  existingSkillIds?: string[]
}

/**
 * Proficiency levels for skills
 */
const PROFICIENCY_LEVELS = [
  { value: 1, label: 'Beginner', description: 'Learning the basics' },
  { value: 2, label: 'Novice', description: 'Some experience' },
  { value: 3, label: 'Intermediate', description: 'Comfortable with most tasks' },
  { value: 4, label: 'Advanced', description: 'Highly skilled' },
  { value: 5, label: 'Expert', description: 'Industry leader' },
] as const

type SelectionStep = 'search-parent' | 'select-child' | 'set-proficiency'

/**
 * SkillSearchModal Component
 *
 * Modal for searching and selecting skills with cascading selection
 *
 * @example
 * ```tsx
 * <SkillSearchModal
 *   open={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onSelectSkill={(skillId, proficiency) => {
 *     addSkillMutation.mutate({ skillId, proficiency })
 *   }}
 *   onSearchParents={async (query) => {
 *     const result = await searchParentSkills({ query, industryId })
 *     return result.skills
 *   }}
 *   onGetChildren={async (parentId) => {
 *     const result = await getSkillChildren({ parentId })
 *     return result.children
 *   }}
 * />
 * ```
 */
export function SkillSearchModal({
  open,
  onClose,
  onSelectSkill,
  onUpdateSkill,
  onSearchParents,
  onGetChildren: _onGetChildren,
  isSearching = false,
  existingSkillIds = [],
}: SkillSearchModalProps) {
  // Use window dimensions for conditional rendering
  // Breakpoint: 800px (matches Tamagui $sm/$md breakpoint)
  const { width } = useWindowDimensions()
  const isMobile = width <= 800
  const [step, setStep] = useState<SelectionStep>('search-parent')
  const [searchQuery, setSearchQuery] = useState('')
  const [parentResults, setParentResults] = useState<ParentSkill[]>([])
  const [selectedParent, setSelectedParent] = useState<ParentSkill | null>(null)
  const [children, setChildren] = useState<SkillChild[]>([])
  const [selectedChild, setSelectedChild] = useState<SkillChild | null>(null)
  const [proficiency, setProficiency] = useState(3)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingChildren, setIsLoadingChildren] = useState(false)

  // Search parent skills
  const handleSearchParents = useCallback(
    async (query: string) => {
      if (query.trim().length < 2) {
        setParentResults([])
        return
      }

      setIsLoading(true)
      try {
        const results = await onSearchParents(query)
        setParentResults(results)
      } catch (error) {
        console.error('Search error:', error)
        setParentResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [onSearchParents]
  )

  // Handle search input change with debounce
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text)
      const timeoutId = setTimeout(() => {
        handleSearchParents(text)
      }, 300)
      return () => clearTimeout(timeoutId)
    },
    [handleSearchParents]
  )

  // Handle parent selection (multi-taxonomy: go straight to proficiency)
  const handleParentSelect = useCallback(async (parent: ParentSkill) => {
    // In multi-taxonomy, we select the skill directly (no children)
    setSelectedChild(parent as unknown as SkillChild)
    setProficiency(3)
    setStep('set-proficiency')
  }, [])

  // Handle child selection
  const handleChildSelect = useCallback((child: SkillChild) => {
    setSelectedChild(child)
    setProficiency(3)
    setStep('set-proficiency')
  }, [])

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (step === 'set-proficiency') {
      setStep('select-child')
      setSelectedChild(null)
    } else if (step === 'select-child') {
      setStep('search-parent')
      setSelectedParent(null)
      setChildren([])
    }
  }, [step])

  // Handle confirm selection
  const handleConfirm = useCallback(() => {
    if (selectedChild) {
      const isExisting = existingSkillIds.includes(selectedChild.id)

      if (isExisting && onUpdateSkill) {
        onUpdateSkill(selectedChild.id, proficiency)
      } else {
        onSelectSkill(selectedChild.id, proficiency)
      }

      // Reset state
      setStep('search-parent')
      setSelectedParent(null)
      setSelectedChild(null)
      setChildren([])
      setSearchQuery('')
      setParentResults([])
      setProficiency(3)
      onClose()
    }
  }, [selectedChild, proficiency, onSelectSkill, onUpdateSkill, onClose, existingSkillIds])

  // Handle modal close
  const handleClose = useCallback(() => {
    setStep('search-parent')
    setSelectedParent(null)
    setSelectedChild(null)
    setChildren([])
    setSearchQuery('')
    setParentResults([])
    setProficiency(3)
    onClose()
  }, [onClose])

  // Get current proficiency level details
  const currentLevel = useMemo(
    () => PROFICIENCY_LEVELS.find((level) => level.value === proficiency),
    [proficiency]
  )

  // Get proficiency color (green gradient)
  const getProficiencyColor = useCallback(
    (value: number): GetThemeValueForKey<'backgroundColor'> => {
      const opacity = 0.2 + (value - 1) * 0.2 // 0.2, 0.4, 0.6, 0.8, 1.0
      return `rgba(34, 197, 94, ${opacity})` // green color with varying opacity
    },
    []
  )

  // Get step title
  const getStepTitle = () => {
    if (step === 'search-parent') return 'Search Skills'
    if (step === 'select-child') return `Select from ${selectedParent?.name}`
    return 'Set Proficiency Level'
  }

  // Group results by parent (similar to certifications)
  const groupedResults = useMemo(() => {
    const groups: {
      depth1: ParentSkill[] // Top-level (no parent)
      depth2ByParent: Record<string, ParentSkill[]>
      depth3ByParent: Record<string, ParentSkill[]>
      depth4ByParent: Record<string, ParentSkill[]>
    } = {
      depth1: [],
      depth2ByParent: {},
      depth3ByParent: {},
      depth4ByParent: {},
    }

    for (const skill of parentResults) {
      if (skill.depth === 1 || !skill.parentId) {
        groups.depth1.push(skill)
      } else if (skill.depth === 2) {
        const parentId = skill.parentId || 'none'
        if (!groups.depth2ByParent[parentId]) {
          groups.depth2ByParent[parentId] = []
        }
        groups.depth2ByParent[parentId].push(skill)
      } else if (skill.depth === 3) {
        const parentId = skill.parentId || 'none'
        if (!groups.depth3ByParent[parentId]) {
          groups.depth3ByParent[parentId] = []
        }
        groups.depth3ByParent[parentId].push(skill)
      } else if (skill.depth === 4) {
        const parentId = skill.parentId || 'none'
        if (!groups.depth4ByParent[parentId]) {
          groups.depth4ByParent[parentId] = []
        }
        groups.depth4ByParent[parentId].push(skill)
      }
    }

    return groups
  }, [parentResults])

  // Get parent name for grouping display
  const getParentName = (parentId: string | null | undefined): string => {
    if (!parentId) return 'Other'
    const parent = parentResults.find((s) => s.id === parentId)
    return parent?.name || 'Unknown Parent'
  }

  // Depth badge component (for CSI skills)
  const DepthBadge = ({ depth }: { depth: number }) => {
    const labels = ['', 'Division', 'Subdivision', 'Detail', 'Sub-detail']
    const colors: Array<'$blue9' | '$green9' | '$purple9' | '$orange9' | '$gray9'> = [
      '$gray9',
      '$blue9',
      '$green9',
      '$purple9',
      '$orange9',
    ]
    const bgColor = (colors[depth] || '$gray9') as
      | '$blue9'
      | '$green9'
      | '$purple9'
      | '$orange9'
      | '$gray9'
    const label = labels[depth] || `Level ${depth}`

    if (depth === 0 || !label) return null

    return (
      <XStack bg={bgColor} px="$2" py="$0.5" rounded="$2" borderWidth={1} borderColor={bgColor}>
        <Text color="$background" fontSize="$1" fontWeight="600">
          {label}
        </Text>
      </XStack>
    )
  }

  // Render content based on step
  const renderContent = () => {
    if (step === 'search-parent') {
      return (
        <YStack gap="$4" flex={1}>
          {/* Search Input */}
          <XStack gap="$2" items="center">
            <Input
              flex={1}
              placeholder="Search for a skill category (e.g., Concrete, Plumbing)..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              size="$4"
            />
            {(isLoading || isSearching) && <Spinner size="small" />}
          </XStack>

          {/* Search Results */}
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <YStack gap="$2">
              {parentResults.length === 0 && searchQuery.trim().length >= 2 && !isLoading && (
                <YStack p="$4" items="center" gap="$2">
                  <Text color="$color11">No skill categories found</Text>
                  <Text fontSize="$2" color="$color11" text="center">
                    Try a different search term
                  </Text>
                </YStack>
              )}

              {parentResults.length === 0 && searchQuery.trim().length < 2 && (
                <YStack p="$4" items="center" gap="$2">
                  <Search size={32} color="$color11" />
                  <Text color="$color11">Start typing to search skill categories</Text>
                  <Text fontSize="$2" color="$color11" text="center">
                    Search for top-level categories like "Concrete" or "Electrical"
                  </Text>
                </YStack>
              )}

              {/* Top-level skills (depth 1, no parent) */}
              {groupedResults.depth1.length > 0 && (
                <YStack gap="$2">
                  {groupedResults.depth1.map((skill) => (
                    <Card
                      key={skill.id}
                      size="$4"
                      bordered
                      pressStyle={{ scale: 0.98, backgroundColor: '$color5' }}
                      animation="quick"
                      onPress={() => handleParentSelect(skill)}
                    >
                      <Card.Header>
                        <XStack justify="space-between" items="center">
                          <YStack flex={1} gap="$1">
                            <XStack gap="$2" items="center" flexWrap="wrap">
                              <Text fontSize="$4" fontWeight="600">
                                {skill.name}
                              </Text>
                              {skill.depth > 0 && <DepthBadge depth={skill.depth} />}
                            </XStack>
                            {skill.code && (
                              <Text fontSize="$2" color="$color10">
                                {skill.code}
                              </Text>
                            )}
                          </YStack>
                          <ChevronRight size={20} color="$color11" />
                        </XStack>
                      </Card.Header>
                    </Card>
                  ))}
                </YStack>
              )}

              {/* Depth 2 skills grouped by parent */}
              {Object.keys(groupedResults.depth2ByParent).length > 0 && (
                <YStack gap="$3">
                  {Object.entries(groupedResults.depth2ByParent).map(([parentId, skills]) => (
                    <YStack key={parentId} gap="$2">
                      <XStack gap="$2" items="center" px="$2">
                        <Text fontSize="$3" fontWeight="600" color="$color11">
                          {getParentName(parentId)}
                        </Text>
                        <Separator flex={1} />
                      </XStack>
                      {skills.map((skill) => (
                        <Card
                          key={skill.id}
                          size="$4"
                          bordered
                          pressStyle={{ scale: 0.98, backgroundColor: '$color5' }}
                          animation="quick"
                          onPress={() => handleParentSelect(skill)}
                        >
                          <Card.Header>
                            <YStack gap="$1">
                              <XStack justify="space-between" items="center" flexWrap="wrap">
                                <XStack gap="$2" items="center" flexWrap="wrap" flex={1}>
                                  <Text fontSize="$3" fontWeight="600">
                                    {skill.name}
                                  </Text>
                                  <DepthBadge depth={skill.depth} />
                                </XStack>
                                <ChevronRight size={20} color="$color11" />
                              </XStack>
                              {skill.hierarchyPath && (
                                <Text fontSize="$2" color="$color10">
                                  {skill.hierarchyPath}
                                </Text>
                              )}
                              {skill.code && (
                                <Text fontSize="$2" color="$color10">
                                  {skill.code}
                                </Text>
                              )}
                            </YStack>
                          </Card.Header>
                        </Card>
                      ))}
                    </YStack>
                  ))}
                </YStack>
              )}

              {/* Depth 3 skills grouped by parent */}
              {Object.keys(groupedResults.depth3ByParent).length > 0 && (
                <YStack gap="$3">
                  {Object.entries(groupedResults.depth3ByParent).map(([parentId, skills]) => (
                    <YStack key={parentId} gap="$2">
                      <XStack gap="$2" items="center" px="$2">
                        <Text fontSize="$3" fontWeight="600" color="$color11">
                          {getParentName(parentId)}
                        </Text>
                        <Separator flex={1} />
                      </XStack>
                      {skills.map((skill) => (
                        <Card
                          key={skill.id}
                          size="$4"
                          bordered
                          pressStyle={{ scale: 0.98, backgroundColor: '$color5' }}
                          animation="quick"
                          onPress={() => handleParentSelect(skill)}
                        >
                          <Card.Header>
                            <YStack gap="$1">
                              <XStack justify="space-between" items="center" flexWrap="wrap">
                                <XStack gap="$2" items="center" flexWrap="wrap" flex={1}>
                                  <Text fontSize="$3" fontWeight="600">
                                    {skill.name}
                                  </Text>
                                  <DepthBadge depth={skill.depth} />
                                </XStack>
                                <ChevronRight size={20} color="$color11" />
                              </XStack>
                              {skill.hierarchyPath && (
                                <Text fontSize="$2" color="$color10">
                                  {skill.hierarchyPath}
                                </Text>
                              )}
                              {skill.code && (
                                <Text fontSize="$2" color="$color10">
                                  {skill.code}
                                </Text>
                              )}
                            </YStack>
                          </Card.Header>
                        </Card>
                      ))}
                    </YStack>
                  ))}
                </YStack>
              )}

              {/* Depth 4 skills grouped by parent */}
              {Object.keys(groupedResults.depth4ByParent).length > 0 && (
                <YStack gap="$3">
                  {Object.entries(groupedResults.depth4ByParent).map(([parentId, skills]) => (
                    <YStack key={parentId} gap="$2">
                      <XStack gap="$2" items="center" px="$2">
                        <Text fontSize="$3" fontWeight="600" color="$color11">
                          {getParentName(parentId)}
                        </Text>
                        <Separator flex={1} />
                      </XStack>
                      {skills.map((skill) => (
                        <Card
                          key={skill.id}
                          size="$4"
                          bordered
                          pressStyle={{ scale: 0.98, backgroundColor: '$color5' }}
                          animation="quick"
                          onPress={() => handleParentSelect(skill)}
                        >
                          <Card.Header>
                            <YStack gap="$1">
                              <XStack justify="space-between" items="center" flexWrap="wrap">
                                <XStack gap="$2" items="center" flexWrap="wrap" flex={1}>
                                  <Text fontSize="$3" fontWeight="600">
                                    {skill.name}
                                  </Text>
                                  <DepthBadge depth={skill.depth} />
                                </XStack>
                                <ChevronRight size={20} color="$color11" />
                              </XStack>
                              {skill.hierarchyPath && (
                                <Text fontSize="$2" color="$color10">
                                  {skill.hierarchyPath}
                                </Text>
                              )}
                              {skill.code && (
                                <Text fontSize="$2" color="$color10">
                                  {skill.code}
                                </Text>
                              )}
                            </YStack>
                          </Card.Header>
                        </Card>
                      ))}
                    </YStack>
                  ))}
                </YStack>
              )}
            </YStack>
          </ScrollView>
        </YStack>
      )
    }

    if (step === 'select-child') {
      return (
        <YStack gap="$4" flex={1}>
          {isLoadingChildren ? (
            <YStack flex={1} items="center" justify="center" gap="$3">
              <Spinner size="large" />
              <Text color="$color11">Loading skills...</Text>
            </YStack>
          ) : (
            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
              <YStack gap="$2">
                {children.length === 0 && (
                  <YStack p="$4" items="center" gap="$2">
                    <Text color="$color11">No sub-skills found</Text>
                  </YStack>
                )}

                {children.map((child) => {
                  const isExisting = existingSkillIds.includes(child.id)
                  return (
                    <Card
                      key={child.id}
                      size="$4"
                      bordered
                      borderColor={isExisting ? '$blue9' : undefined}
                      borderWidth={isExisting ? 2 : 1}
                      pressStyle={{ scale: 0.98, backgroundColor: '$color5' }}
                      animation="quick"
                      onPress={() => handleChildSelect(child)}
                    >
                      <Card.Header>
                        <YStack gap="$1">
                          <XStack justify="space-between" items="center">
                            <Text fontSize="$3" fontWeight="600">
                              {child.name}
                            </Text>
                            {isExisting && (
                              <Text fontSize="$2" color="$blue9" fontWeight="600">
                                Added
                              </Text>
                            )}
                          </XStack>
                          {child.code && (
                            <Text fontSize="$2" color="$color10">
                              {child.code}
                            </Text>
                          )}
                        </YStack>
                      </Card.Header>
                    </Card>
                  )
                })}
              </YStack>
            </ScrollView>
          )}
        </YStack>
      )
    }

    if (step === 'set-proficiency' && selectedChild) {
      const isExisting = existingSkillIds.includes(selectedChild.id)
      return (
        <YStack gap="$4" flex={1}>
          {/* Selected Skill Details */}
          <Card bordered>
            <Card.Header>
              <XStack justify="space-between" items="center">
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600">
                    {selectedChild.name}
                  </Text>
                  {selectedChild.code && (
                    <Text fontSize="$2" color="$color10">
                      {selectedChild.code}
                    </Text>
                  )}
                </YStack>
                {isExisting && (
                  <Text fontSize="$2" color="$blue9" fontWeight="600">
                    Updating
                  </Text>
                )}
              </XStack>
            </Card.Header>
          </Card>

          <Separator />

          {/* Proficiency Selector */}
          <YStack gap="$3" pb="$4">
            <Text fontWeight="600" fontSize="$4">
              Proficiency Level
            </Text>

            <Slider
              value={[proficiency]}
              onValueChange={(value) => setProficiency(value[0])}
              min={1}
              max={5}
              step={1}
              size="$3"
            >
              <Slider.Track bg="$color4" height={6}>
                <Slider.TrackActive bg={getProficiencyColor(proficiency)} />
              </Slider.Track>
              <Slider.Thumb index={0} circular size="$1" />
            </Slider>

            {/* Current Level Display */}
            <Card bordered bg="$color3">
              <Card.Header>
                <XStack justify="space-between" items="center">
                  <YStack>
                    <Text fontWeight="600" fontSize="$5" color="$green9">
                      {currentLevel?.label}
                    </Text>
                    <Text fontSize="$2" color="$color11">
                      {currentLevel?.description}
                    </Text>
                  </YStack>
                  <Text fontSize="$8" fontWeight="bold" color="$green9">
                    {proficiency}
                  </Text>
                </XStack>
              </Card.Header>
            </Card>

            {/* Level Guide */}
            <YStack gap="$2">
              {PROFICIENCY_LEVELS.map((level) => (
                <XStack
                  key={level.value}
                  gap="$2"
                  items="center"
                  opacity={proficiency === level.value ? 1 : 0.5}
                >
                  <Text fontWeight="600" minW={30}>
                    {level.value}
                  </Text>
                  <Text flex={1} fontSize="$2">
                    {level.label} - {level.description}
                  </Text>
                </XStack>
              ))}
            </YStack>
          </YStack>

          {/* Actions */}
          <XStack gap="$3" pt="$4">
            <Button flex={1} variant="outlined" onPress={handleBack}>
              Back
            </Button>
            <Button flex={1} themeInverse onPress={handleConfirm}>
              {isExisting ? 'Update Skill' : 'Add Skill'}
            </Button>
          </XStack>
        </YStack>
      )
    }

    return null
  }

  // Mobile: Use Action Sheet
  if (isMobile) {
    return (
      <Sheet
        modal
        open={open}
        onOpenChange={(isOpen: boolean) => !isOpen && handleClose()}
        snapPoints={[85]}
        dismissOnSnapToBottom
        zIndex={100000}
        animation="medium"
      >
        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Sheet.Frame p="$4" gap="$4" bg="$background">
          <Sheet.Handle />

          {/* Header */}
          <XStack justify="space-between" items="center">
            <XStack gap="$2" items="center">
              {step !== 'search-parent' && (
                <Button size="$3" circular chromeless icon={ArrowLeft} onPress={handleBack} />
              )}
              <Text fontWeight="600" fontSize="$4">
                {getStepTitle()}
              </Text>
            </XStack>
            <Button size="$3" circular chromeless icon={X} onPress={handleClose} />
          </XStack>

          {/* Content */}
          {renderContent()}
        </Sheet.Frame>
      </Sheet>
    )
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" />
        <Dialog.Content key="content" minW={500} maxW={600} minH={500} maxH="80vh">
          {/* Header */}
          <Dialog.Title>
            <XStack justify="space-between" items="center">
              <XStack gap="$2" items="center">
                {step !== 'search-parent' && (
                  <Button size="$3" circular chromeless icon={ArrowLeft} onPress={handleBack} />
                )}
                <Text fontWeight="600" fontSize="$4">
                  {getStepTitle()}
                </Text>
              </XStack>
              <Dialog.Close asChild>
                <Button size="$3" circular chromeless icon={X} onPress={handleClose} />
              </Dialog.Close>
            </XStack>
          </Dialog.Title>

          {/* Content */}
          {renderContent()}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
