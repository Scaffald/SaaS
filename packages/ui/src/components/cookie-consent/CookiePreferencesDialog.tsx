import { X } from '@tamagui/lucide-icons'
import { Dialog } from '@tamagui/dialog'
import { Paragraph, SizableText } from 'tamagui'
import { ScrollView } from '@tamagui/scroll-view'
import { Separator } from '@tamagui/separator'
import { Switch } from '@tamagui/switch'
import { XStack, YStack } from '@tamagui/stacks'
import { useEffect, useMemo, useState } from 'react'

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
    <YStack gap="$2" p="$3" background="$color2" style={{ borderRadius: 16 }}>
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

  useEffect(() => {
    if (isPreferencesOpen) {
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

  return (
    <Dialog
      modal
      open={isPreferencesOpen}
      onOpenChange={(open) => (!open ? closePreferences() : undefined)}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="slow"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          style={{ zIndex: 1001 }}
        />
        <Dialog.Content
          key="content"
          bordered
          elevate
          size="$5"
          gap="$4"
          width="100%"
          style={{ maxWidth: 520, maxHeight: 600, zIndex: 1002 }}
        >
          <Dialog.Title>Manage Cookies</Dialog.Title>

          <Paragraph size="$4">
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
          <Separator />
          <XStack
            gap="$3"
            style={{ justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Button size="$3" disabled={isSubmitting} onPress={handleSave}>
              Save
            </Button>

            <Dialog.Close asChild>
              <Button
                size="$3"
                variant="outlined"
                disabled={isSubmitting}
                onPress={() => {
                  setDraft(initialDraft)
                }}
              >
                Cancel
              </Button>
            </Dialog.Close>

            <Button size="$3" disabled={isSubmitting} onPress={handleRejectAll}>
              Reject All
            </Button>
          </XStack>

          <Dialog.Close asChild>
            <Button
              style={{ position: 'absolute', top: 12, right: 12 }}
              size="$2"
              circular
              icon={X}
            />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
