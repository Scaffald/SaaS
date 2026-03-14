import { useState, useCallback } from 'react'
import { Text, Stack, Row, Input, Button, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useSkillSearch } from '@scf/core/utils/communities-sdk-hooks'
import type { CommunitySkill } from '@scaffald/sdk/resources/community-skills'

interface Props {
  communityId: string | undefined
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

export function SkillTagPicker({ communityId, selectedTags, onTagsChange }: Props) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [query, setQuery] = useState('')

  const { data: searchResults } = useSkillSearch(
    query.length >= 2 ? { q: query, community_id: communityId, limit: 10 } : undefined,
    { enabled: query.length >= 2 }
  )

  const results = searchResults?.data ?? []

  const handleSelect = useCallback(
    (skill: CommunitySkill) => {
      if (!selectedTags.includes(skill.id)) {
        onTagsChange([...selectedTags, skill.id])
      }
      setQuery('')
    },
    [selectedTags, onTagsChange]
  )

  const handleRemove = useCallback(
    (id: string) => {
      onTagsChange(selectedTags.filter((t) => t !== id))
    },
    [selectedTags, onTagsChange]
  )

  return (
    <Stack gap={8}>
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <Row gap={4} style={{ flexWrap: 'wrap' }}>
          {selectedTags.map((tagId) => (
            <Stack
              key={tagId}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                backgroundColor: '#dbeafe',
              }}
            >
              <Row align="center" gap={4}>
                <Text style={{ fontSize: 12 }}>{tagId.slice(0, 8)}...</Text>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => handleRemove(tagId)}
                  style={{ padding: 0, minWidth: 20, minHeight: 20 }}
                >
                  x
                </Button>
              </Row>
            </Stack>
          ))}
        </Row>
      )}

      {/* Search Input */}
      <Input placeholder="Search skills to tag..." value={query} onChangeText={setQuery} />

      {/* Search Results */}
      {results.length > 0 && (
        <Stack
          style={{
            borderWidth: 1,
            borderColor: '#e5e5e5',
            borderRadius: 8,
            maxHeight: 200,
            overflow: 'hidden',
          }}
        >
          {results.map((skill: CommunitySkill) => (
            <Button
              key={skill.id}
              variant="outline"
              size="sm"
              onPress={() => handleSelect(skill)}
              style={{
                borderRadius: 0,
                borderBottomWidth: 1,
                borderBottomColor: '#f0f0f0',
                justifyContent: 'flex-start',
              }}
            >
              <Row gap={8}>
                <Text style={{ fontSize: 13 }}>{skill.name}</Text>
                <Text style={{ fontSize: 11, color: colors.text[t].secondary }}>
                  Tier {skill.tier}
                </Text>
              </Row>
            </Button>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
