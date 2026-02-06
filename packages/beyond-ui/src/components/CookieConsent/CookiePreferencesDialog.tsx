import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { Stack } from '../Layout'
import { Row } from '../Layout'
import { Button } from '../Button'
import { Toggle } from '../Toggle'
import { Paragraph } from '../Typography'
import { Modal, ModalHeader, ModalContent } from '../Modal'
import { useCookieConsent } from './CookieConsentProvider'
import type { CookieConsentCategory, CookieConsentSelections } from './CookieConsent.types'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'

function CategoryRow({
  category,
  value,
  onChange,
}: {
  category: CookieConsentCategory
  value: boolean
  onChange: (next: boolean) => void
}) {
  const disabled = category.required
  return (
    <View
      style={{
        padding: spacing[3],
        backgroundColor: colors.gray[50],
        borderRadius: 16,
        gap: spacing[2],
      }}
    >
      <Row justify="space-between" align="center">
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.light.primary }}>
          {category.label}
        </Text>
        <Toggle
          checked={value}
          onChange={onChange}
          disabled={disabled}
          size="md"
          color="primary"
        />
      </Row>
      <Paragraph
        style={{
          fontSize: 14,
          color: colors.text.light.secondary,
          lineHeight: 20,
        }}
      >
        {category.description}
      </Paragraph>
    </View>
  )
}

export function CookiePreferencesDialog() {
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
    <Modal
      visible={isPreferencesOpen}
      onClose={closePreferences}
      width={520}
    >
      <ModalHeader
        title="Manage Cookies"
        onClose={closePreferences}
        showCloseButton
      />
      <ModalContent>
        <Paragraph
          style={{
            fontSize: 16,
            color: colors.text.light.secondary,
            marginBottom: spacing[4],
          }}
        >
          Choose which categories of cookies to allow. Required cookies stay active because they
          keep critical features running safely.
        </Paragraph>
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          <Stack gap={spacing[3]}>
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                value={Boolean(draft[category.id])}
                onChange={(next) => handleToggle(category.id, next)}
              />
            ))}
          </Stack>
        </ScrollView>
        <View style={{ marginTop: spacing[4], paddingTop: spacing[4], borderTopWidth: 1, borderTopColor: colors.border.light.default }}>
          <Row gap={spacing[3]} justify="flex-end" align="center" style={{ flexWrap: 'wrap' }}>
            <Button color="primary" onPress={handleSave} disabled={isSubmitting}>
              Save
            </Button>
            <Button variant="outline" color="gray" onPress={() => setDraft(initialDraft)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="outline" color="gray" onPress={handleRejectAll} disabled={isSubmitting}>
              Reject All
            </Button>
          </Row>
        </View>
      </ModalContent>
    </Modal>
  )
}
