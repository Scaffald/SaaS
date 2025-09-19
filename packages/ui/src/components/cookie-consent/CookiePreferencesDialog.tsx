import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { X } from '@tamagui/lucide-icons'
import {
  Button,
  Dialog,
  Paragraph,
  ScrollView,
  Separator,
  SizableText,
  Switch,
  Unspaced,
  XStack,
  YStack,
} from 'tamagui'

import { useCookieConsent } from './CookieConsentProvider'
import { CookieConsentCategory, CookieConsentSelections } from './types'

export interface CookiePreferencesDialogProps {
  title?: string
  description?: ReactNode
  cancelLabel?: string
  saveLabel?: string
  rejectAllLabel?: string
  showRejectAll?: boolean
  alwaysOnLabel?: string
}

const defaultDescription = (
  <Paragraph size="$4" color="$color11">
    Choose which categories of cookies to allow. Required cookies stay active because they keep critical
    features running safely.
  </Paragraph>
)

const CategoryRow = ({
  category,
  value,
  onChange,
  alwaysOnLabel,
}: {
  category: CookieConsentCategory
  value: boolean
  onChange: (next: boolean) => void
  alwaysOnLabel?: string
}) => {
  const disabled = category.required
  return (
    <YStack gap="$2" p="$3" br="$4" bg="$color2">
      <XStack ai="center" jc="space-between" gap="$3">
        <SizableText size="$5" fontWeight="600">
          {category.label}
        </SizableText>
        <Switch
          native
          checked={value}
          disabled={disabled}
          onCheckedChange={(checked) => onChange(Boolean(checked))}
        >
          <Switch.Thumb animation="100ms" />
        </Switch>
      </XStack>
      <Paragraph size="$3" color="$color10">
        {category.description}
      </Paragraph>
      {disabled && (
        <Paragraph size="$2" color="$color9">
          {alwaysOnLabel || 'Always on'}
        </Paragraph>
      )}
    </YStack>
  )
}

export const CookiePreferencesDialog = ({
  title = 'Manage cookies',
  description = defaultDescription,
  cancelLabel = 'Cancel',
  saveLabel = 'Save and close',
  rejectAllLabel = 'Reject all',
  showRejectAll = true,
  alwaysOnLabel = 'Always on',
}: CookiePreferencesDialogProps) => {
  const {
    categories,
    selections,
    isPreferencesOpen,
    closePreferences,
    saveSelections,
    rejectAll,
  } = useCookieConsent()

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
    <Dialog modal open={isPreferencesOpen} onOpenChange={(open) => (!open ? closePreferences() : undefined)}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="slow"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          key="content"
          bordered
          elevate
          size="$5"
          gap="$4"
          w="100%"
          maxWidth={520}
          maxHeight={600}
        >
          <Dialog.Title>{title}</Dialog.Title>
          {description}
          <ScrollView maxHeight={360} showsVerticalScrollIndicator={false}>
            <YStack gap="$3">
              {categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  value={Boolean(draft[category.id])}
                  onChange={(next) => handleToggle(category.id, next)}
                  alwaysOnLabel={alwaysOnLabel}
                />
              ))}
            </YStack>
          </ScrollView>
          <Separator />
          <XStack gap="$3" jc="flex-end" ai="center" flexWrap="wrap">
            <Unspaced>
              <Dialog.Close asChild>
                <Button
                  size="$3"
                  variant="outlined"
                  disabled={isSubmitting}
                  onPress={() => {
                    setDraft(initialDraft)
                  }}
                >
                  {cancelLabel}
                </Button>
              </Dialog.Close>
            </Unspaced>
            {showRejectAll && (
              <Button size="$3" theme="alt2" disabled={isSubmitting} onPress={handleRejectAll}>
                {rejectAllLabel}
              </Button>
            )}
            <Button size="$3" disabled={isSubmitting} onPress={handleSave}>
              {saveLabel}
            </Button>
          </XStack>

          <Unspaced>
            <Dialog.Close asChild>
              <Button position="absolute" top="$3" right="$3" size="$2" circular icon={X} />
            </Dialog.Close>
          </Unspaced>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
