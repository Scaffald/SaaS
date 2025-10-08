import { useState } from 'react'
import { YStack, XStack, Text, Input } from '@app/ui'
import { Label, Switch } from 'tamagui'

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
    <YStack
      gap="$4"
      p="$4"
      bg="$background"
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Text fontSize="$6" fontWeight="600">
        Distribution & Visibility
      </Text>
      <Text fontSize="$2" color="$color10">
        Control job posting visibility and distribution
      </Text>

      {/* Is Featured */}
      <XStack gap="$3" items="center" justify="space-between">
        <YStack gap="$1" flex={1}>
          <Label htmlFor="featured">Featured job</Label>
          <Text fontSize="$2" color="$color10">
            Highlight this job in listings
          </Text>
        </YStack>
        <Switch
          id="featured"
          checked={localState.is_featured || false}
          onCheckedChange={(checked) => handleChange('is_featured', checked)}
        >
          <Switch.Thumb animation="quick" />
        </Switch>
      </XStack>

      {localState.is_featured && (
        <YStack gap="$2">
          <Label>Featured until</Label>
          <Input
            placeholder="YYYY-MM-DD"
            value={localState.featured_until || ''}
            onChangeText={(text) => handleChange('featured_until', text || undefined)}
          />
          <Text fontSize="$2" color="$color10">
            Date when featured status expires
          </Text>
        </YStack>
      )}

      {/* SEO Keywords */}
      <YStack gap="$2">
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
        <Text fontSize="$2" color="$color10">
          Comma-separated keywords for search optimization
        </Text>
      </YStack>

      {/* External Application URL */}
      <YStack gap="$2">
        <Label>External application URL</Label>
        <Input
          placeholder="https://example.com/apply"
          value={localState.external_application_url || ''}
          onChangeText={(text) => handleChange('external_application_url', text || undefined)}
        />
        <Text fontSize="$2" color="$color10">
          Redirect to external ATS for applications
        </Text>
      </YStack>
    </YStack>
  )
}
