import { X } from '@tamagui/lucide-icons'
import { Paragraph, SizableText } from 'tamagui'
import { ScrollView } from '@tamagui/scroll-view'
import { Separator } from '@tamagui/separator'
import { Switch } from '@tamagui/switch'
import { XStack, YStack } from '@tamagui/stacks'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Pressable } from 'react-native'

import { useCookieConsent } from './CookieConsentProvider'
import type { CookieConsentCategory, CookieConsentSelections } from './types'
import { Button } from '../buttons/Button'

const CategoryRow = ({
  category,
  value,
  onChange,
}: {
  category: CookieConsentCategory
  value: boolean
  onChange: (next: boolean) => void
}) => {
  const disabled = category.required
  return (
    <YStack gap="$2" p="$3" bg="$color2" style={{ borderRadius: 16 }}>
      <XStack style={{ alignItems: 'center', justifyContent: 'space-between' }} gap="$3">
        <SizableText size="$5" fontWeight="600">
          {category.label}
        </SizableText>
        <Switch
          size="$2"
          native
          theme="success"
          checked={value}
          disabled={disabled}
          onCheckedChange={(checked) => onChange(Boolean(checked))}
        >
          <Switch.Thumb animation="100ms" />
        </Switch>
      </XStack>
      <Paragraph size="$3" color="$color11">
        {category.description}
      </Paragraph>
    </YStack>
  )
}

export const CookiePreferencesDialog = () => {
  const { categories, selections, isPreferencesOpen, closePreferences, saveSelections, rejectAll } =
    useCookieConsent()

  const initialDraft = useMemo(() => selections, [selections])
  const [draft, setDraft] = useState<CookieConsentSelections>(initialDraft)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    const justOpened = isPreferencesOpen && !wasOpenRef.current
    wasOpenRef.current = isPreferencesOpen
    if (justOpened) {
      setDraft(initialDraft)
      setIsSubmitting(false)
    }
  }, [initialDraft, isPreferencesOpen])

  const handleToggle = (categoryId: string, isEnabled: boolean) => {
    setDraft((prev) => ({ ...prev, [categoryId]: isEnabled }))
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await saveSelections(draft)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectAll = async () => {
    setIsSubmitting(true)
    try {
      await rejectAll()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isPreferencesOpen) return null

  return (
    <Modal
      visible={isPreferencesOpen}
      transparent
      animationType="fade"
      onRequestClose={closePreferences}
      statusBarTranslucent
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
        onPress={closePreferences}
      >
        <Pressable
          style={{ maxWidth: 520, width: '100%', maxHeight: '90%' }}
          onPress={(e) => e.stopPropagation()}
        >
          <YStack
            bg="$background"
            p="$5"
            gap="$4"
            borderRadius="$4"
            maxHeight={600}
            elevate
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
            }}
          >
            <XStack
              style={{
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <SizableText size="$6" fontWeight="700">
                Manage Cookies
              </SizableText>
              <Button size="$2" circular chromeless icon={X} onPress={closePreferences} />
            </XStack>

            <Paragraph size="$4" marginBottom="$4">
              Choose which categories of cookies to allow. Required cookies stay active because they
              keep critical features running safely.
            </Paragraph>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <YStack gap="$3">
                {categories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    value={Boolean(draft[category.id])}
                    onChange={(next) => handleToggle(category.id, next)}
                  />
                ))}
              </YStack>
            </ScrollView>
            <Separator marginVertical="$4" />
            <XStack
              gap="$3"
              style={{ justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}
            >
              <Button size="$3" disabled={isSubmitting} onPress={handleSave}>
                Save
              </Button>
              <Button
                size="$3"
                variant="outlined"
                disabled={isSubmitting}
                onPress={() => {
                  setDraft(initialDraft)
                  closePreferences()
                }}
              >
                Cancel
              </Button>
              <Button size="$3" disabled={isSubmitting} onPress={handleRejectAll}>
                Reject All
              </Button>
            </XStack>
          </YStack>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
