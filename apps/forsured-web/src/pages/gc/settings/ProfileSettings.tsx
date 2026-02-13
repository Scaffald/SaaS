// src/pages/gc/settings/ProfileSettings.tsx
// Multi-industry user set type system with configurable lexicon
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Stack,
  Text,
  Button,
  H2,
  SettingsFormField,
  SettingsSectionHeader,
} from '@scaffald/ui'
import { User } from 'lucide-react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { useSettings } from '../../../hooks/useSettings'
import { useLexicon } from '../../../contexts/LexiconContext'
import { toast } from 'sonner'

function GCProfileSettings() {
  const { user, profile, isLoading: authLoading } = useAuth()
  const { userSettings, updateUserSettings, isLoading: settingsLoading, isSaving } = useSettings()
  const { getManagerLabel, getContractorLabel } = useLexicon()

  const [phone, setPhone] = useState('')
  const [originalPhone, setOriginalPhone] = useState('')

  // Initialize phone from userSettings.ui_preferences
  useEffect(() => {
    if (userSettings?.ui_preferences) {
      const storedPhone =
        ((userSettings.ui_preferences as Record<string, unknown>).phone as string) || ''
      setPhone(storedPhone)
      setOriginalPhone(storedPhone)
    }
  }, [userSettings])

  // Check if form is dirty
  const isDirty = useMemo(() => phone !== originalPhone, [phone, originalPhone])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      try {
        await updateUserSettings({
          ui_preferences: {
            ...userSettings?.ui_preferences,
            phone,
          },
        })
        setOriginalPhone(phone)
        toast.success('Profile settings saved successfully')
      } catch (err) {
        console.error('Failed to save profile settings:', err)
        toast.error('Failed to save profile settings')
      }
    },
    [phone, userSettings, updateUserSettings]
  )

  const isLoading = authLoading || settingsLoading

  if (isLoading) {
    return (
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Profile Settings</H2>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <Stack
            style={{
              height: 40,
              backgroundColor: 'var(--color-3)',
              borderRadius: 'var(--radius-4)',
            }}
          />
          <Stack
            style={{
              height: 40,
              backgroundColor: 'var(--color-3)',
              borderRadius: 'var(--radius-4)',
            }}
          />
          <Stack
            style={{
              height: 40,
              backgroundColor: 'var(--color-3)',
              borderRadius: 'var(--radius-4)',
            }}
          />
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack style={{ gap: 'var(--space-6)' }}>
      <SettingsSectionHeader
        icon={User}
        title="Basic Info"
        description="Basic workspace info details"
      />
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <SettingsFormField
            label="Name"
            type="text"
            value={user?.name || ''}
            disabled
            helperText="Name is managed in Scaffald"
          />
          <SettingsFormField
            label="Email"
            type="email"
            value={user?.email || ''}
            disabled
            helperText="Email is managed in Scaffald"
          />
          <SettingsFormField
            label="Phone"
            type="tel"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
          />
          <SettingsFormField
            label="User Type"
            type="text"
            value={
              profile?.user_type === 'manager'
                ? getManagerLabel()
                : profile?.user_type === 'subcontractor'
                  ? getContractorLabel()
                  : profile?.user_type || ''
            }
            disabled
          />
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            variant="primary"
            style={{ marginTop: 'var(--space-6)' }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </form>
    </Stack>
  )
}

export default GCProfileSettings
