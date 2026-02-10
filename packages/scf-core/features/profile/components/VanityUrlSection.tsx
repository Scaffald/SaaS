import { api } from '@scf/core/utils/api'
import { copyToClipboard } from '@scf/core/utils/clipboard'
import { isReservedSlug, isSlugValid } from '@scf/core/utils/slugify'
import { Button, DashboardWidget } from '@unicornlove/beyond-ui'
import { AlertCircle, Check, Clock, Copy } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useEffect, useState } from 'react'
import { H4, Input, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    refetch: refetchProfile,
  } = api.profile.widgets.getGeneralInfo.useQuery()

  // Get slug history
  const { data: slugHistory, refetch: refetchHistory } =
    api.profile.vanity.getSlugHistory.useQuery()

  // Update slug
  const updateSlugMutation = api.profile.vanity.updateSlug.useMutation({
    onSuccess: (data: UpdateSlugResult) => {
      toast.show('Vanity URL Updated', {
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
        // Use fetchQuery to call the query imperatively
        const result = await utils.profile.vanity.checkSlug.fetch({ slug: normalized })
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
  }, [slugInput, isEditing, profileData?.slug, utils.profile.vanity.checkSlug.fetch, utils.profile.vanity.checkSlug])

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
        <Stack alignItems="center" padding="$4">
          <Spinner size="small" />
        </Stack>
      </DashboardWidget>
    )
  }

  return (
    <DashboardWidget>
      <Stack gap="$4">
        <Stack gap="$2">
          <H4>Vanity URL</H4>
          <Text color="$color10" fontSize="$3">
            Customize your public profile URL to make it easier to share
          </Text>
        </Stack>

        {/* Current URL Display */}
        {vanityUrl && !isEditing && (
          <Stack gap="$2">
            <Text fontWeight="600" fontSize="$3">
              Your Profile URL
            </Text>
            <Row
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
                style={{ fontFamily: 'monospace' }}
                fontSize="$3"
                color="$color11"
                numberOfLines={1}
              >
                {typeof window !== 'undefined' && window.location
                  ? `${window.location.origin}${vanityUrl}`
                  : vanityUrl}
              </Text>
              <Button size="$3" icon={Copy} onPress={handleCopyUrl} variant="outlined">
                Copy
              </Button>
            </Row>
          </Stack>
        )}

        {/* Vanity URL Input */}
        <Stack gap="$2">
          <Row alignItems="center" justifyContent="space-between">
            <Text fontWeight="600" fontSize="$3">
              Profile Vanity URL
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
          </Row>

          {isEditing ? (
            <Stack gap="$2">
              <Row gap="$2" alignItems="center">
                <Text fontSize="$2" color="$color10">
                  /u/
                </Text>
                <Input
                  flex={1}
                  value={slugInput}
                  onChangeText={setSlugInput}
                  placeholder="your-username"
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
              </Row>

              {/* Availability Status */}
              {slugInput && (
                <Stack gap="$1">
                  {availabilityStatus.checking ? (
                    <Text fontSize="$2" color="$color10">
                      Checking availability...
                    </Text>
                  ) : availabilityStatus.available === true ? (
                    <Row gap="$2" alignItems="center">
                      <Check size={16} color="$green10" />
                      <Text fontSize="$2" color="$green10">
                        Available
                      </Text>
                    </Row>
                  ) : availabilityStatus.available === false ? (
                    <Stack gap="$1">
                      <Row gap="$2" alignItems="center">
                        <AlertCircle size={16} color="$red10" />
                        <Text fontSize="$2" color="$red10">
                          Not available
                        </Text>
                      </Row>
                      {availabilityStatus.suggestions &&
                        availabilityStatus.suggestions.length > 0 && (
                          <Stack gap="$1" marginLeft="$4">
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
                          </Stack>
                        )}
                    </Stack>
                  ) : !isSlugValid(slugInput.toLowerCase().trim()) ? (
                    <Text fontSize="$2" color="$red10">
                      Invalid format. Use 3-50 characters, alphanumeric and dashes only.
                    </Text>
                  ) : isReservedSlug(slugInput.toLowerCase().trim()) ? (
                    <Text fontSize="$2" color="$red10">
                      This vanity URL is reserved and cannot be used.
                    </Text>
                  ) : null}
                </Stack>
              )}

              {/* Action Buttons */}
              <Row gap="$2" justifyContent="flex-end">
                <Button size="$3" variant="outlined" onPress={handleCancel} disabled={isUpdating}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
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
              </Row>
            </Stack>
          ) : (
            <Row
              gap="$2"
              alignItems="center"
              padding="$3"
              backgroundColor="$color3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$color6"
            >
              <Text flex={1} style={{ fontFamily: 'monospace' }} fontSize="$3" color="$color11">
                {currentSlug || 'No vanity URL set'}
              </Text>
            </Row>
          )}
        </Stack>

        {/* Cooldown Information */}
        {daysRemaining && daysRemaining > 0 && nextChangeAllowed && (
          <Row
            gap="$2"
            alignItems="center"
            padding="$3"
            backgroundColor="$yellow3"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$yellow7"
          >
            <Clock size={16} color="$orange10" />
            <Stack flex={1} gap="$1">
              <Text fontSize="$2" fontWeight="600" color="$yellow11">
                Vanity URL Change Cooldown
              </Text>
              <Text fontSize="$2" color="$yellow10">
                You can change your vanity URL again in {daysRemaining} day
                {daysRemaining !== 1 ? 's' : ''} ({new Date(nextChangeAllowed).toLocaleDateString()}
                )
              </Text>
            </Stack>
          </Row>
        )}

        {/* Slug History */}
        {slugHistory?.history && slugHistory.history.length > 0 && (
          <Stack gap="$2">
            <Text fontWeight="600" fontSize="$3">
              Change History
            </Text>
            <Stack gap="$1">
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
                  </Row>
                ))}
            </Stack>
          </Stack>
        )}
      </Stack>
    </DashboardWidget>
  )
}
