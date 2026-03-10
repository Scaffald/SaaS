import {
  useSlugHistory,
  useUpdateSlugMutation,
  useCheckSlugAvailability,
} from '@scf/core/utils/profile-general-sdk-hooks'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { copyToClipboard } from '@scf/core/utils/clipboard'
import { isReservedSlug, isSlugValid } from '@scf/core/utils/slugify'
import { Button, DashboardWidget, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { AlertCircle, Check, Clock, Copy } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { H4, Input, Spinner, Text, Row, Stack } from '@scaffald/ui'

type UpdateSlugResult = {
  success: boolean
  slug: string
  nextChangeAllowed: string
}

type VanityMutationError = { message?: string }

/**
 * Vanity URL Section Component
 * Allows users to view and update their profile slug for vanity URLs
 */
export function VanityUrlSection() {
  const toast = useToast()
  const { theme } = useThemeContext()
  const [slugInput, setSlugInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [debouncedSlug, setDebouncedSlug] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const queryClient = useQueryClient()

  // Get current user's profile data
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = useGeneralInfoWidget()

  // Get slug history
  const { data: slugHistory, refetch: refetchHistory } = useSlugHistory()

  // Update slug
  const updateSlugMutation = useUpdateSlugMutation({
    onSuccess: (data: UpdateSlugResult) => {
      toast.show({
        title: 'Vanity URL Updated',
        message: `Your profile URL has been updated to /u/${data.slug}`,
      })
      setIsEditing(false)
      setSlugInput('')
      setDebouncedSlug('')
      // Refetch profile data to get new slug
      refetchProfile()
      refetchHistory()
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
    onError: (error: VanityMutationError) => {
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to update vanity URL. Please try again.',
        variant: 'error',
      })
      setIsUpdating(false)
    },
  })

  // Initialize with current slug
  useEffect(() => {
    if (profileData?.slug && !isEditing) {
      setSlugInput(profileData.slug)
    }
  }, [profileData?.slug, isEditing])

  // Debounce slug input
  useEffect(() => {
    if (!isEditing || !slugInput) {
      setDebouncedSlug('')
      return
    }

    const normalized = slugInput.toLowerCase().trim()

    // Skip debounce if invalid format or current slug
    if (!isSlugValid(normalized) || normalized === profileData?.slug?.toLowerCase()) {
      setDebouncedSlug('')
      return
    }

    const timeoutId = setTimeout(() => {
      setDebouncedSlug(normalized)
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [slugInput, isEditing, profileData?.slug])

  // Check slug availability
  const {
    data: availabilityData,
    isLoading: isCheckingAvailability,
    error: availabilityError,
  } = useCheckSlugAvailability(debouncedSlug, {
    enabled: !!debouncedSlug && isEditing,
  })

  // Compute availability status
  const availabilityStatus = (() => {
    if (!isEditing || !slugInput) {
      return {}
    }

    const normalized = slugInput.toLowerCase().trim()

    // Format validation
    if (!isSlugValid(normalized)) {
      if (normalized.length > 0) {
        return { available: false, checking: false }
      }
      return {}
    }

    // Current slug
    if (normalized === profileData?.slug?.toLowerCase()) {
      return { available: true, checking: false }
    }

    // Checking availability
    if (isCheckingAvailability) {
      return { checking: true }
    }

    // Availability result
    if (availabilityData) {
      return {
        available: availabilityData.available,
        checking: false,
        suggestions: availabilityData.suggestions || [],
      }
    }

    // Error state
    if (availabilityError) {
      return { available: false, checking: false }
    }

    return {}
  })()

  const handleCopyUrl = async () => {
    if (!profileData?.slug) return

    const vanityUrl = `https://scaffald.com/u/${profileData.slug}`
    const success = await copyToClipboard(vanityUrl)

    if (success) {
      toast.show({
        title: 'Copied!',
        message: 'Profile URL copied to clipboard',
      })
    } else {
      toast.show({
        title: 'Error',
        message: 'Failed to copy URL to clipboard',
        variant: 'error',
      })
    }
  }

  const handleSave = async () => {
    const normalized = slugInput.toLowerCase().trim()

    if (!isSlugValid(normalized)) {
      toast.show({
        title: 'Invalid Vanity URL',
        message: 'Please enter a valid vanity URL (3-50 characters, alphanumeric and dashes only)',
        variant: 'error',
      })
      return
    }

    if (isReservedSlug(normalized)) {
      toast.show({
        title: 'Reserved Vanity URL',
        message: 'This vanity URL is reserved and cannot be used',
      })
      return
    }

    if (normalized === profileData?.slug?.toLowerCase()) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    try {
      await updateSlugMutation.mutateAsync(normalized)
    } catch (_error) {
      // Error handling is done in mutation onError
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setSlugInput(profileData?.slug || '')
    setIsEditing(false)
    setDebouncedSlug('')
  }

  const currentSlug = profileData?.slug
  const nextChangeAllowed = slugHistory?.nextChangeAllowed
  const daysRemaining = slugHistory?.daysRemaining

  if (isLoadingProfile) {
    return (
      <DashboardWidget>
        <Stack align="center" padding="md">
          <Spinner size="sm" />
        </Stack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <Stack gap={16}>
        <Stack gap={8}>
          <H4>Vanity URL</H4>
          <Text style={{ color: '#414e62' }}>Customize your public profile URL to make it easier to share</Text>
        </Stack>

        {/* Current URL Display */}
        {currentSlug && !isEditing && (
          <Stack gap={8}>
            <Text>Your Profile URL</Text>
            <Input
              value={`scaffald.com/u/${currentSlug}`}
              editable={false}
              iconEnd={Copy}
              iconEndOnPress={handleCopyUrl}
              iconEndAccessibilityLabel="Copy profile URL"
            />
          </Stack>
        )}

        {/* Vanity URL Input */}
        <Stack gap={8}>
          <Row align="center" justify="space-between">
            <Text>Profile Vanity URL</Text>
            {!isEditing && (
              <Pressable
                onPress={() => setIsEditing(true)}
                disabled={!!daysRemaining && daysRemaining > 0}
              >
                <Text
                  style={{
                    color: colors.primary[600],
                    textDecorationLine: 'underline',
                    opacity: (!!daysRemaining && daysRemaining > 0) ? 0.4 : 1,
                  }}
                >
                  {daysRemaining && daysRemaining > 0 ? 'Change unavailable' : 'Edit'}
                </Text>
              </Pressable>
            )}
          </Row>

          {isEditing ? (
            <Stack gap={8}>
              <Row gap={8} align="center">
                <Text style={{ color: '#414e62' }}>/u/</Text>
                <Input
                  style={{ flex: 1 }}
                  value={slugInput}
                  onChangeText={setSlugInput}
                  placeholder="your-username"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isCheckingAvailability && <Spinner size="sm" />}
              </Row>

              {/* Availability Status */}
              {slugInput && (
                <Stack gap={4}>
                  {availabilityStatus.checking ? (
                    <Text style={{ color: '#414e62' }}>Checking availability...</Text>
                  ) : availabilityStatus.available === true ? (
                    <Row gap={8} align="center">
                      <Check size={16} color="#16a34a" />
                      <Text style={{ color: '#16a34a' }}>Available</Text>
                    </Row>
                  ) : availabilityStatus.available === false ? (
                    <Stack gap={4}>
                      <Row gap={8} align="center">
                        <AlertCircle size={16} color="#ef4444" />
                        <Text style={{ color: '#ef4444' }}>Not available</Text>
                      </Row>
                      {availabilityStatus.suggestions &&
                        availabilityStatus.suggestions.length > 0 && (
                          <Stack gap={4} style={{ marginLeft: 16 }}>
                            <Text style={{ color: '#414e62' }}>Suggestions:</Text>
                            {availabilityStatus.suggestions.map((suggestion) => (
                              <Button
                                key={suggestion}
                                size="sm"
                                variant="outline"
                                onPress={() => {
                                  setSlugInput(suggestion)
                                }}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </Stack>
                        )}
                    </Stack>
                  ) : !isSlugValid(slugInput.toLowerCase().trim()) ? (
                    <Text style={{ color: '#ef4444' }}>
                      Invalid format. Use 3-50 characters, alphanumeric and dashes only.
                    </Text>
                  ) : isReservedSlug(slugInput.toLowerCase().trim()) ? (
                    <Text style={{ color: '#ef4444' }}>This vanity URL is reserved and cannot be used.</Text>
                  ) : null}
                </Stack>
              )}

              {/* Action Buttons */}
              <Row gap={8} justify="flex-end">
                <Button size="sm" variant="outline" onPress={handleCancel} disabled={isUpdating}>
                  Cancel
                </Button>
                <Button
                  variant="filled" color="primary"
                  size="sm"
                  onPress={handleSave}
                  disabled={
                    isUpdating ||
                    !slugInput ||
                    !isSlugValid(slugInput.toLowerCase().trim()) ||
                    availabilityStatus.available !== true
                  }
                >
                  {isUpdating ? <Spinner size="sm" /> : 'Save'}
                </Button>
              </Row>
            </Stack>
          ) : (
            <Input
              value={currentSlug || ''}
              editable={false}
              externalAddon="scaffald.com/u/"
              placeholder="No vanity URL set"
            />
          )}
        </Stack>

        {/* Cooldown Information */}
        {daysRemaining && daysRemaining > 0 && nextChangeAllowed && (
          <Row
            gap={8}
            align="center"
            padding={8}
            style={{ backgroundColor: '#fefce8', borderRadius: 8, borderWidth: 1, borderColor: '#fde047' }}
          >
            <Clock size={16} color="#f97316" />
            <Stack style={{ flex: 1 }} gap={4}>
              <Text>Vanity URL Change Cooldown</Text>
              <Text style={{ color: '#414e62' }}>
                You can change your vanity URL again in {daysRemaining} day
                {daysRemaining !== 1 ? 's' : ''} ({new Date(nextChangeAllowed).toLocaleDateString()}
                )
              </Text>
            </Stack>
          </Row>
        )}

        {/* Slug History */}
        {slugHistory?.history && slugHistory.history.length > 0 && (
          <Stack gap={8}>
            <Text>Change History</Text>
            <Stack gap={4}>
              {(
                slugHistory.history as Array<{
                  changed_at: string
                  new_slug: string
                  old_slug: string | null
                }>
              )
                .slice(0, 5)
                .map((entry) => (
                  <Row
                    key={`${entry.changed_at}-${entry.new_slug}`}
                    gap={8}
                    padding={4}
                    backgroundColor={colors.bg[theme].subtle}
                    borderRadius={8}
                  >
                    <Text style={{ color: '#414e62', flex: 1 }}>
                      {entry.old_slug || '(initial)'} → {entry.new_slug}
                    </Text>
                    <Text style={{ color: '#414e62' }}>{new Date(entry.changed_at).toLocaleDateString()}</Text>
                  </Row>
                ))}
            </Stack>
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  )
}
