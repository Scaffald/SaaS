/**
 * Skill Suggestions Modal — Auto-populate skills from O*NET occupation data.
 *
 * Shows skills, abilities, and knowledge from a selected occupation and allows
 * batch-adding them to the user's profile.
 *
 * @see Issue #105
 */

import { useState, useMemo, useCallback } from 'react'
import { ScrollView, Pressable } from 'react-native'
import {
  Button,
  Card,
  Modal,
  ModalActions,
  ModalContent,
  ModalHeader,
  Row,
  Spinner,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { Check, ChevronDown, ChevronUp, Sparkles, Zap } from 'lucide-react-native'
import { useOccupation, useOccupationStatus } from '@scf/core/utils/onet-sdk-hooks'

interface SkillItem {
  name: string
  level: number
  category: 'skill' | 'ability' | 'knowledge'
}

interface SkillSuggestionsModalProps {
  visible: boolean
  onClose: () => void
  onAddSkills: (skills: Array<{ name: string; onetCode: string; proficiency: number; taxonomy: string }>) => void
  existingSkillNames: string[]
  isAdding?: boolean
}

/** Map O*NET importance (0–100) to proficiency (1–5) */
function importanceToProficiency(level: number): number {
  if (level >= 80) return 5
  if (level >= 60) return 4
  if (level >= 40) return 3
  if (level >= 20) return 2
  return 1
}

const PROFICIENCY_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Novice',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
}

export function SkillSuggestionsModal({
  visible,
  onClose,
  onAddSkills,
  existingSkillNames,
  isAdding = false,
}: SkillSuggestionsModalProps) {
  const { theme } = useThemeContext()
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['skill', 'ability', 'knowledge'])
  )
  const [selectedOccupationIdx, setSelectedOccupationIdx] = useState(0)

  // Get user's saved occupations
  const { data: occupationStatus } = useOccupationStatus()
  const occupations = occupationStatus?.occupations ?? []

  const currentOccupation = occupations[selectedOccupationIdx]
  const onetCode = currentOccupation?.onet_code ?? ''

  // Fetch occupation details
  const { data: occupationResponse, isLoading } = useOccupation(
    { onetCode },
    { enabled: !!onetCode && visible }
  )
  const occupationData = occupationResponse?.data

  // Build skill list from occupation data
  const allSkills: SkillItem[] = useMemo(() => {
    if (!occupationData) return []
    const items: SkillItem[] = []

    for (const s of occupationData.skills ?? []) {
      items.push({ name: s.name, level: s.level, category: 'skill' })
    }
    for (const a of occupationData.abilities ?? []) {
      items.push({ name: a.name, level: a.level, category: 'ability' })
    }
    for (const k of occupationData.knowledge ?? []) {
      items.push({ name: k.name, level: k.level, category: 'knowledge' })
    }
    return items
  }, [occupationData])

  // Filter out skills the user already has
  const existingNamesLower = useMemo(
    () => new Set(existingSkillNames.map((n) => n.toLowerCase())),
    [existingSkillNames]
  )

  const newSkills = useMemo(
    () => allSkills.filter((s) => !existingNamesLower.has(s.name.toLowerCase())),
    [allSkills, existingNamesLower]
  )

  const alreadyAddedSkills = useMemo(
    () => allSkills.filter((s) => existingNamesLower.has(s.name.toLowerCase())),
    [allSkills, existingNamesLower]
  )

  const toggleSkill = useCallback((name: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedSkills(new Set(newSkills.map((s) => s.name)))
  }, [newSkills])

  const deselectAll = useCallback(() => {
    setSelectedSkills(new Set())
  }, [])

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  const handleAdd = useCallback(() => {
    const toAdd = newSkills
      .filter((s) => selectedSkills.has(s.name))
      .map((s) => ({
        name: s.name,
        onetCode,
        proficiency: importanceToProficiency(s.level),
        taxonomy: 'onet',
      }))
    onAddSkills(toAdd)
  }, [newSkills, selectedSkills, onAddSkills, onetCode])

  const renderCategory = (category: 'skill' | 'ability' | 'knowledge', label: string) => {
    const items = newSkills.filter((s) => s.category === category)
    if (items.length === 0) return null
    const isExpanded = expandedCategories.has(category)
    const selectedCount = items.filter((s) => selectedSkills.has(s.name)).length

    return (
      <Stack key={category} gap={8}>
        <Pressable onPress={() => toggleCategory(category)}>
          <Row justify="space-between" align="center">
            <Row gap={8} align="center">
              <Text style={{ fontWeight: '600', color: colors.text[theme].primary, fontSize: 15 }}>
                {label}
              </Text>
              <Stack
                style={{
                  backgroundColor: colors.bg[theme].subtle,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.text[theme].secondary }}>
                  {selectedCount}/{items.length}
                </Text>
              </Stack>
            </Row>
            {isExpanded ? (
              <ChevronUp size={16} color={colors.icon[theme].default} />
            ) : (
              <ChevronDown size={16} color={colors.icon[theme].default} />
            )}
          </Row>
        </Pressable>

        {isExpanded && (
          <Stack gap={4}>
            {items.map((skill) => {
              const isSelected = selectedSkills.has(skill.name)
              const proficiency = importanceToProficiency(skill.level)

              return (
                <Pressable key={skill.name} onPress={() => toggleSkill(skill.name)}>
                  <Row
                    gap={12}
                    align="center"
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: isSelected
                        ? colors.bg[theme].selected
                        : colors.bg[theme].default,
                    }}
                  >
                    <Stack
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        borderWidth: 1.5,
                        borderColor: isSelected
                          ? colors.fg[theme].active
                          : colors.border[theme].default,
                        backgroundColor: isSelected
                          ? colors.fg[theme].active
                          : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && <Check size={14} color="#fff" />}
                    </Stack>
                    <Stack flex={1}>
                      <Text
                        style={{
                          color: colors.text[theme].primary,
                          fontSize: 14,
                        }}
                      >
                        {skill.name}
                      </Text>
                    </Stack>
                    <Stack
                      style={{
                        backgroundColor: colors.bg[theme].subtle,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: colors.text[theme].secondary }}>
                        {PROFICIENCY_LABELS[proficiency]}
                      </Text>
                    </Stack>
                  </Row>
                </Pressable>
              )
            })}
          </Stack>
        )}
      </Stack>
    )
  }

  return (
    <Modal visible={visible} onClose={onClose} width={560}>
      <ModalHeader
        title="Quick Add Skills from O*NET"
        onClose={onClose}
      />
      <ModalContent>
        <Stack gap={16}>
          {/* Occupation selector */}
          {occupations.length > 1 && (
            <Row gap={8} style={{ flexWrap: 'wrap' }}>
              {occupations.map((occ, idx) => (
                <Pressable key={occ.onet_code} onPress={() => setSelectedOccupationIdx(idx)}>
                  <Stack
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor:
                        idx === selectedOccupationIdx
                          ? colors.fg[theme].active
                          : colors.bg[theme].subtle,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color:
                          idx === selectedOccupationIdx
                            ? '#fff'
                            : colors.text[theme].secondary,
                      }}
                    >
                      {occ.title}
                    </Text>
                  </Stack>
                </Pressable>
              ))}
            </Row>
          )}

          {/* No occupations */}
          {occupations.length === 0 && (
            <Card variant="glass" padding="md">
              <Row gap={12} align="center">
                <Sparkles size={20} color={colors.icon[theme].default} />
                <Stack flex={1}>
                  <Text style={{ color: colors.text[theme].primary, fontWeight: '500' }}>
                    Complete Career Assessment
                  </Text>
                  <Text style={{ color: colors.text[theme].secondary, fontSize: 13 }}>
                    Take the RIASEC assessment and select target occupations to get personalized
                    skill suggestions.
                  </Text>
                </Stack>
              </Row>
            </Card>
          )}

          {/* Loading */}
          {isLoading && onetCode && (
            <Stack align="center" justify="center" style={{ paddingVertical: 40 }}>
              <Spinner variant="ios" size="lg" />
              <Text style={{ color: colors.text[theme].secondary, marginTop: 8 }}>
                Loading occupation skills...
              </Text>
            </Stack>
          )}

          {/* Skills list */}
          {!isLoading && occupationData && (
            <>
              <Row justify="space-between" align="center">
                <Row gap={8} align="center">
                  <Zap size={16} color={colors.fg[theme].active} />
                  <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
                    {newSkills.length} new skills available
                  </Text>
                </Row>
                <Row gap={8}>
                  <Button size="sm" variant="outline" onPress={selectAll}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onPress={deselectAll}>
                    Clear
                  </Button>
                </Row>
              </Row>

              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                <Stack gap={16}>
                  {renderCategory('skill', 'Skills')}
                  {renderCategory('ability', 'Abilities')}
                  {renderCategory('knowledge', 'Knowledge')}
                </Stack>
              </ScrollView>

              {/* Already added */}
              {alreadyAddedSkills.length > 0 && (
                <Stack gap={4}>
                  <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
                    {alreadyAddedSkills.length} skills already on your profile
                  </Text>
                </Stack>
              )}
            </>
          )}
        </Stack>
      </ModalContent>
      <ModalActions
        orientation="right"
        primaryAction={{
          label: isAdding
            ? 'Adding...'
            : `Add ${selectedSkills.size} Skill${selectedSkills.size === 1 ? '' : 's'}`,
          onPress: handleAdd,
          disabled: selectedSkills.size === 0 || isAdding,
        }}
        secondaryAction={{
          label: 'Cancel',
          onPress: onClose,
          disabled: isAdding,
        }}
      />
    </Modal>
  )
}
