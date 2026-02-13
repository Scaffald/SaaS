import { Input, Text, ToggleSwitch, Row, Stack } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Label } from '@unicornlove/beyond-ui'

interface DistributionVisibilitySectionProps {
  isFeatured?: boolean
  featuredUntil?: string
  seoKeywords?: string[]
  externalApplicationUrl?: string
  onUpdate: (data: {
    is_featured?: boolean
    featured_until?: string
    seo_keywords?: string[]
    external_application_url?: string
  }) => void
}

export function DistributionVisibilitySection({
  isFeatured,
  featuredUntil,
  seoKeywords,
  externalApplicationUrl,
  onUpdate,
}: DistributionVisibilitySectionProps) {
  const [localState, setLocalState] = useState({
    is_featured: isFeatured,
    featured_until: featuredUntil,
    seo_keywords: seoKeywords,
    external_application_url: externalApplicationUrl,
  })

  const handleChange = (
    key: keyof typeof localState,
    value: string | boolean | string[] | undefined
  ) => {
    const newState = { ...localState, [key]: value }
    setLocalState(newState)
    onUpdate(newState)
  }

  return (
    <Stack
      gap={16}
      padding={16}
      backgroundColor="$background"
      borderRadius={16}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Text>
        Distribution & Visibility
      </Text>
      <Text color="gray">
        Control job posting visibility and distribution
      </Text>

      {/* Is Featured */}
      <Row gap={12} align="center" justify="space-between">
        <Stack gap={4} flex={1}>
          <Label>Featured job</Label>
          <Text color="gray">
            Highlight this job in listings
          </Text>
        </Stack>
        <ToggleSwitch
          checked={localState.is_featured || false}
          onCheckedChange={(checked) => handleChange('is_featured', checked)}
          aria-label="Featured job"
        />
      </Row>

      {localState.is_featured && (
        <Stack gap={8}>
          <Label>Featured until</Label>
          <Input
            placeholder="YYYY-MM-DD"
            value={localState.featured_until || ''}
            onChangeText={(text) => handleChange('featured_until', text || undefined)}
          />
          <Text color="gray">
            Date when featured status expires
          </Text>
        </Stack>
      )}

      {/* SEO Keywords */}
      <Stack gap={8}>
        <Label>SEO keywords</Label>
        <Input
          placeholder="e.g. construction, foreman, supervisor"
          value={localState.seo_keywords?.join(', ') || ''}
          onChangeText={(text) => {
            const keywords = text
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean)
            handleChange('seo_keywords', keywords.length > 0 ? keywords : undefined)
          }}
        />
        <Text color="gray">
          Comma-separated keywords for search optimization
        </Text>
      </Stack>

      {/* External Application URL */}
      <Stack gap={8}>
        <Label>External application URL</Label>
        <Input
          placeholder="https://example.com/apply"
          value={localState.external_application_url || ''}
          onChangeText={(text) => handleChange('external_application_url', text || undefined)}
        />
        <Text color="gray">
          Redirect to external ATS for applications
        </Text>
      </Stack>
    </Stack>
  )
}
