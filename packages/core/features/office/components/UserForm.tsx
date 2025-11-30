import { api } from '@app/core/utils/api'
import { Button, Input, ScrollView, Text, XStack, YStack } from '@scaffald/tamagui-ui'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Card } from 'tamagui'

interface UserFormProps {
  userId: string
  initialProfile: {
    first_name: string | null
    last_name: string | null
    display_name: string | null
    bio: string | null
  }
  initialPrivateData: {
    email: string | null
    phone_number: string | null
    birth_date: string | null
    location: string | null
    employment_status: string | null
    job_search_status: string | null
    years_of_experience: number | null
    current_title: string | null
    current_employer: string | null
  } | null
}

export function UserForm({ userId, initialProfile, initialPrivateData }: UserFormProps) {
  const router = useRouter()
  const utils = api.useUtils()

  // Profile state
  const [firstName, setFirstName] = useState(initialProfile.first_name || '')
  const [lastName, setLastName] = useState(initialProfile.last_name || '')
  const [displayName, setDisplayName] = useState(initialProfile.display_name || '')
  const [bio, setBio] = useState(initialProfile.bio || '')

  // Private data state
  const [email, setEmail] = useState(initialPrivateData?.email || '')
  const [phone, setPhone] = useState(initialPrivateData?.phone_number || '')
  const [birthDate, setBirthDate] = useState(initialPrivateData?.birth_date || '')
  const [location, setLocation] = useState(initialPrivateData?.location || '')
  const [employmentStatus, setEmploymentStatus] = useState(
    initialPrivateData?.employment_status || ''
  )
  const [jobSearchStatus, setJobSearchStatus] = useState(
    initialPrivateData?.job_search_status || ''
  )
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initialPrivateData?.years_of_experience?.toString() || ''
  )
  const [currentTitle, setCurrentTitle] = useState(initialPrivateData?.current_title || '')
  const [currentEmployer, setCurrentEmployer] = useState(initialPrivateData?.current_employer || '')

  const updateUserMutation = api.office.updateUser.useMutation({
    onSuccess: () => {
      utils.office.getUser.invalidate({ id: userId })
      utils.office.listUsers.invalidate()
      router.back()
    },
  })

  const handleSubmit = () => {
    const profileData: Record<string, string> = {}
    const privateData: Record<string, string | number> = {}

    // Only include changed profile fields
    if (firstName !== initialProfile.first_name) profileData.first_name = firstName
    if (lastName !== initialProfile.last_name) profileData.last_name = lastName
    if (displayName !== initialProfile.display_name) profileData.display_name = displayName
    if (bio !== initialProfile.bio) profileData.bio = bio

    // Only include changed private data fields
    if (email !== initialPrivateData?.email) privateData.email = email
    if (phone !== initialPrivateData?.phone_number) privateData.phone_number = phone
    if (birthDate !== initialPrivateData?.birth_date) privateData.birth_date = birthDate
    if (location !== initialPrivateData?.location) privateData.location = location
    if (employmentStatus !== initialPrivateData?.employment_status)
      privateData.employment_status = employmentStatus
    if (jobSearchStatus !== initialPrivateData?.job_search_status)
      privateData.job_search_status = jobSearchStatus
    if (yearsOfExperience !== initialPrivateData?.years_of_experience?.toString()) {
      privateData.years_of_experience = Number.parseInt(yearsOfExperience, 10) || 0
    }
    if (currentTitle !== initialPrivateData?.current_title) privateData.current_title = currentTitle
    if (currentEmployer !== initialPrivateData?.current_employer)
      privateData.current_employer = currentEmployer

    updateUserMutation.mutate({
      id: userId,
      profile: Object.keys(profileData).length > 0 ? profileData : undefined,
      privateData: Object.keys(privateData).length > 0 ? privateData : undefined,
    })
  }

  return (
    <ScrollView flex={1} bg="$background">
      <YStack p="$4" gap="$4">
        <XStack items="center" justify="space-between">
          <Text fontSize="$8" fontWeight="bold">
            Edit User
          </Text>
          <XStack gap="$2">
            <Button data-testid="cancel-button" onPress={() => router.back()} variant="outlined">
              Cancel
            </Button>
            <Button
              data-testid="save-button"
              onPress={handleSubmit}
              disabled={updateUserMutation.isPending}
              themeInverse
            >
              {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </XStack>
        </XStack>

        {/* Profile Information */}
        <Card p="$4">
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="600" mb="$2">
              Profile Information
            </Text>

            <YStack gap="$2">
              <Text fontWeight="600">First Name</Text>
              <Input
                data-testid="user-first-name-input"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
              />
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Last Name</Text>
              <Input
                data-testid="user-last-name-input"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
              />
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Display Name</Text>
              <Input
                data-testid="user-display-name-input"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display name"
              />
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Bio</Text>
              <Input
                data-testid="user-bio-input"
                value={bio}
                onChangeText={setBio}
                placeholder="Bio"
                multiline
                numberOfLines={4}
              />
            </YStack>
          </YStack>
        </Card>

        {/* Private Information */}
        <Card p="$4">
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="600" mb="$2">
              Private Information
            </Text>

            <YStack gap="$2">
              <Text fontWeight="600">Email</Text>
              <Input
                data-testid="user-email-input"
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Phone</Text>
              <Input
                data-testid="user-phone-input"
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Birth Date</Text>
              <Input
                data-testid="user-birth-date-input"
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="YYYY-MM-DD"
              />
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Location</Text>
              <Input
                data-testid="user-location-input"
                value={location}
                onChangeText={setLocation}
                placeholder="City, State"
              />
            </YStack>
          </YStack>
        </Card>

        {/* Employment Information */}
        <Card p="$4">
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="600" mb="$2">
              Employment Information
            </Text>

            <YStack gap="$2">
              <Text fontWeight="600">Employment Status</Text>
              <Input
                data-testid="user-employment-status-input"
                value={employmentStatus}
                onChangeText={setEmploymentStatus}
                placeholder="e.g., employed, unemployed"
              />
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Job Search Status</Text>
              <Input
                data-testid="user-job-search-status-input"
                value={jobSearchStatus}
                onChangeText={setJobSearchStatus}
                placeholder="e.g., actively looking, open"
              />
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Years of Experience</Text>
              <Input
                data-testid="user-years-experience-input"
                value={yearsOfExperience}
                onChangeText={setYearsOfExperience}
                placeholder="Years"
                keyboardType="numeric"
              />
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Current Title</Text>
              <Input
                data-testid="user-current-title-input"
                value={currentTitle}
                onChangeText={setCurrentTitle}
                placeholder="Job title"
              />
            </YStack>

            <YStack gap="$2">
              <Text fontWeight="600">Current Employer</Text>
              <Input
                data-testid="user-current-employer-input"
                value={currentEmployer}
                onChangeText={setCurrentEmployer}
                placeholder="Company name"
              />
            </YStack>
          </YStack>
        </Card>

        {/* Submit Button (mobile-friendly placement) */}
        <XStack gap="$2" pb="$4">
          <Button
            data-testid="cancel-button"
            flex={1}
            onPress={() => router.back()}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            data-testid="save-button"
            flex={1}
            onPress={handleSubmit}
            disabled={updateUserMutation.isPending}
            themeInverse
          >
            {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </XStack>
      </YStack>
    </ScrollView>
  )
}
