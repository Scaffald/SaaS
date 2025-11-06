import { useState, useEffect } from 'react'
import {
  YStack,
  XStack,
  Text,
  Input,
  Button,
  Spinner,
  H4,
} from 'tamagui'
import { Copy, Check, AlertCircle, Clock } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { api } from '@app/core/utils/api'
import { isSlugValid, isReservedSlug } from '@app/core/utils/slugify'
import { copyToClipboard } from '@app/core/utils/clipboard'
import { DashboardWidget } from '@app/ui'

/**
 * Vanity URL Section Component
 * Allows users to view and update their profile slug for vanity URLs
 */
export function VanityUrlSection() {
  const toast = useToastController()
  const [slugInput, setSlugInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available?: boolean
    checking?: boolean
    suggestions?: string[]
  }>({})

  const utils = api.useUtils()

  // Get current user's profile data
  const { data: profileData, isLoading: isLoadingProfile, refetch: refetchProfile } =
    api.profile.widgets.getGeneralInfo.useQuery()

  // Get slug history
  const { data: slugHistory, refetch: refetchHistory } = api.profile.vanity.getSlugHistory.useQuery()

  // Check slug availability
  const checkSlugMutation = api.profile.vanity.checkSlug.useMutation()

  // Update slug
  const updateSlugMutation = api.profile.vanity.updateSlug.useMutation({
    onSuccess: (data) => {
      toast.show('Slug Updated', {
        message: `Your profile URL has been updated to /u/${data.slug}`,
      })
      setIsEditing(false)
      setSlugInput('')
      setAvailabilityStatus({})
      // Refetch profile data to get new slug
      refetchProfile()
      refetchHistory()
      // Invalidate related queries
      utils.profile.widgets.getGeneralInfo.invalidate()
      utils.profile.vanity.getSlugHistory.invalidate()
    },
    onError: (error) => {
      toast.show('Error', {
        message: error.message || 'Failed to update slug. Please try again.',
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

  // Debounced slug availability check
  useEffect(() => {
    if (!isEditing || !slugInput) {
      setAvailabilityStatus({})
      return
    }

    const normalized = slugInput.toLowerCase().trim()

    // Validate format first
    if (!isSlugValid(normalized)) {
      if (normalized.length > 0) {
        setAvailabilityStatus({
          available: false,
          checking: false,
        })
      }
      return
    }

    // Check if it's the current slug
    if (normalized === profileData?.slug?.toLowerCase()) {
      setAvailabilityStatus({
        available: true,
        checking: false,
      })
      return
    }

    // Check availability
    setIsChecking(true)
    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkSlugMutation.mutateAsync({ slug: normalized })
        setAvailabilityStatus({
          available: result.available,
          checking: false,
          suggestions: result.suggestions || [],
        })
      } catch (_error) {
        setAvailabilityStatus({
          available: false,
          checking: false,
        })
      } finally {
        setIsChecking(false)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [slugInput, isEditing, profileData?.slug])

  const handleCopyUrl = async () => {
    if (!profileData?.slug) return

    // Get base URL - works for both web and React Native
    let baseUrl = ''
    if (typeof window !== 'undefined' && window.location) {
      baseUrl = window.location.origin
    } else {
      // For React Native, you might want to use a config or env variable
      // For now, just use the relative path
      baseUrl = ''
    }
    const vanityUrl = baseUrl ? `${baseUrl}/u/${profileData.slug}` : `/u/${profileData.slug}`
    const success = await copyToClipboard(vanityUrl)

    if (success) {
      toast.show('Copied!', {
        message: 'Profile URL copied to clipboard',
      })
    } else {
      toast.show('Error', {
        message: 'Failed to copy URL to clipboard',
      })
    }
  }

  const handleSave = async () => {
    const normalized = slugInput.toLowerCase().trim()

    if (!isSlugValid(normalized)) {
      toast.show('Invalid Slug', {
        message: 'Please enter a valid slug (3-50 characters, alphanumeric and dashes only)',
      })
      return
    }

    if (isReservedSlug(normalized)) {
      toast.show('Reserved Slug', {
        message: 'This slug is reserved and cannot be used',
      })
      return
    }

    if (normalized === profileData?.slug?.toLowerCase()) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    try {
      await updateSlugMutation.mutateAsync({ slug: normalized })
    } catch (_error) {
      // Error handling is done in mutation onError
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setSlugInput(profileData?.slug || '')
    setIsEditing(false)
    setAvailabilityStatus({})
  }

  const currentSlug = profileData?.slug
  const vanityUrl = currentSlug ? `/u/${currentSlug}` : null
  const nextChangeAllowed = slugHistory?.nextChangeAllowed
  const daysRemaining = slugHistory?.daysRemaining

  if (isLoadingProfile) {
    return (
      <DashboardWidget>
        <YStack alignItems="center" padding="$4">
          <Spinner size="small" />
        </YStack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <YStack gap="$4">
        <YStack gap="$2">
          <H4>Vanity URL</H4>
          <Text color="$color10" fontSize="$3">
            Customize your public profile URL to make it easier to share
          </Text>
        </YStack>

        {/* Current URL Display */}
        {vanityUrl && !isEditing && (
          <YStack gap="$2">
            <Text fontWeight="600" fontSize="$3">
              Your Profile URL
            </Text>
            <XStack
              gap="$2"
              alignItems="center"
              padding="$3"
              backgroundColor="$color3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$color6"
            >
              <Text
                flex={1}
                fontFamily="monospace"
                fontSize="$3"
                color="$color11"
                numberOfLines={1}
              >
                {typeof window !== 'undefined' && window.location
                  ? `${window.location.origin}${vanityUrl}`
                  : vanityUrl}
              </Text>
              <Button
                size="$3"
                icon={Copy}
                onPress={handleCopyUrl}
                variant="outlined"
              >
                Copy
              </Button>
            </XStack>
          </YStack>
        )}

        {/* Slug Input */}
        <YStack gap="$2">
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontWeight="600" fontSize="$3">
              Profile Slug
            </Text>
            {!isEditing && (
              <Button
                size="$3"
                onPress={() => setIsEditing(true)}
                disabled={!!daysRemaining && daysRemaining > 0}
              >
                {daysRemaining && daysRemaining > 0 ? 'Change Unavailable' : 'Edit'}
              </Button>
            )}
          </XStack>

          {isEditing ? (
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <Text fontSize="$2" color="$color10">
                  /u/
                </Text>
                <Input
                  flex={1}
                  value={slugInput}
                  onChangeText={setSlugInput}
                  placeholder="your-slug"
                  autoCapitalize="none"
                  autoCorrect={false}
                  borderColor={
                    availabilityStatus.available === false
                      ? '$red8'
                      : availabilityStatus.available === true
                        ? '$green8'
                        : '$borderColor'
                  }
                />
                {isChecking && <Spinner size="small" />}
              </XStack>

              {/* Availability Status */}
              {slugInput && (
                <YStack gap="$1">
                  {availabilityStatus.checking ? (
                    <Text fontSize="$2" color="$color10">
                      Checking availability...
                    </Text>
                  ) : availabilityStatus.available === true ? (
                    <XStack gap="$2" alignItems="center">
                      <Check size={16} color="$green10" />
                      <Text fontSize="$2" color="$green10">
                        Available
                      </Text>
                    </XStack>
                  ) : availabilityStatus.available === false ? (
                    <YStack gap="$1">
                      <XStack gap="$2" alignItems="center">
                        <AlertCircle size={16} color="$red10" />
                        <Text fontSize="$2" color="$red10">
                          Not available
                        </Text>
                      </XStack>
                      {availabilityStatus.suggestions &&
                        availabilityStatus.suggestions.length > 0 && (
                          <YStack gap="$1" marginLeft="$4">
                            <Text fontSize="$2" color="$color10">
                              Suggestions:
                            </Text>
                            {availabilityStatus.suggestions.map((suggestion) => (
                              <Button
                                key={suggestion}
                                size="$2"
                                variant="outlined"
                                onPress={() => {
                                  setSlugInput(suggestion)
                                }}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </YStack>
                        )}
                    </YStack>
                  ) : !isSlugValid(slugInput.toLowerCase().trim()) ? (
                    <Text fontSize="$2" color="$red10">
                      Invalid format. Use 3-50 characters, alphanumeric and dashes only.
                    </Text>
                  ) : isReservedSlug(slugInput.toLowerCase().trim()) ? (
                    <Text fontSize="$2" color="$red10">
                      This slug is reserved and cannot be used.
                    </Text>
                  ) : null}
                </YStack>
              )}

              {/* Action Buttons */}
              <XStack gap="$2" justifyContent="flex-end">
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={handleCancel}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  size="$3"
                  onPress={handleSave}
                  disabled={
                    isUpdating ||
                    !slugInput ||
                    !isSlugValid(slugInput.toLowerCase().trim()) ||
                    availabilityStatus.available !== true
                  }
                >
                  {isUpdating ? <Spinner size="small" /> : 'Save'}
                </Button>
              </XStack>
            </YStack>
          ) : (
            <XStack
              gap="$2"
              alignItems="center"
              padding="$3"
              backgroundColor="$color3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$color6"
            >
              <Text flex={1} fontFamily="monospace" fontSize="$3" color="$color11">
                {currentSlug || 'No slug set'}
              </Text>
            </XStack>
          )}
        </YStack>

        {/* Cooldown Information */}
        {daysRemaining && daysRemaining > 0 && nextChangeAllowed && (
          <XStack
            gap="$2"
            alignItems="center"
            padding="$3"
            backgroundColor="$yellow3"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$yellow7"
          >
            <Clock size={16} color="$orange10" />
            <YStack flex={1} gap="$1">
              <Text fontSize="$2" fontWeight="600" color="$yellow11">
                Slug Change Cooldown
              </Text>
              <Text fontSize="$2" color="$yellow10">
                You can change your slug again in {daysRemaining} day
                {daysRemaining !== 1 ? 's' : ''} ({new Date(nextChangeAllowed).toLocaleDateString()})
              </Text>
            </YStack>
          </XStack>
        )}

        {/* Slug History */}
        {slugHistory?.history && slugHistory.history.length > 0 && (
          <YStack gap="$2">
            <Text fontWeight="600" fontSize="$3">
              Change History
            </Text>
            <YStack gap="$1">
              {slugHistory.history.slice(0, 5).map((entry) => (
                <XStack
                  key={`${entry.changed_at}-${entry.new_slug}`}
                  gap="$2"
                  padding="$2"
                  backgroundColor="$color3"
                  borderRadius="$2"
                >
                  <Text fontSize="$2" color="$color10" flex={1}>
                    {entry.old_slug || '(initial)'} → {entry.new_slug}
                  </Text>
                  <Text fontSize="$2" color="$color8">
                    {new Date(entry.changed_at).toLocaleDateString()}
                  </Text>
                </XStack>
              ))}
            </YStack>
          </YStack>
        )}
      </YStack>
    </DashboardWidget>
  )
}

