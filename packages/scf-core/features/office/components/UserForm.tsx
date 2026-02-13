import { api } from '@scf/core/utils/api'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Input, ScrollView, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Card } from '@unicornlove/beyond-ui'

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
  const queryClient = useQueryClient()

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
      queryClient.invalidateQueries({
        queryKey: [['office', 'getUser'], { input: { id: userId } }],
      })
      queryClient.invalidateQueries({ queryKey: [['office', 'listUsers']] })
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
    <ScrollView flex={1} backgroundColor="$background">
      <Stack padding={16} gap={16}>
        <Row align="center" justify="space-between">
          <Text>Edit User</Text>
          <Row gap={8}>
            <Button data-testid="cancel-button" onPress={() => router.back()} variant="outline">
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
          </Row>
        </Row>

        {/* Profile Information */}
        <Card padding={16}>
          <Stack gap={12}>
            <Text marginBottom={8}>Profile Information</Text>

            <Stack gap={8}>
              <Text>First Name</Text>
              <Input
                data-testid="user-first-name-input"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
              />
            </Stack>

            <Stack gap={8}>
              <Text>Last Name</Text>
              <Input
                data-testid="user-last-name-input"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
              />
            </Stack>

            <Stack gap={8}>
              <Text>Display Name</Text>
              <Input
                data-testid="user-display-name-input"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Display name"
              />
            </Stack>

            <Stack gap={8}>
              <Text>Bio</Text>
              <Input
                data-testid="user-bio-input"
                value={bio}
                onChangeText={setBio}
                placeholder="Bio"
                multiline
                numberOfLines={4}
              />
            </Stack>
          </Stack>
        </Card>

        {/* Private Information */}
        <Card padding={16}>
          <Stack gap={12}>
            <Text marginBottom={8}>Private Information</Text>

            <Stack gap={8}>
              <Text>Email</Text>
              <Input
                data-testid="user-email-input"
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Stack>

            <Stack gap={8}>
              <Text>Phone</Text>
              <Input
                data-testid="user-phone-input"
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            </Stack>

            <Stack gap={8}>
              <Text>Birth Date</Text>
              <Input
                data-testid="user-birth-date-input"
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="YYYY-MM-DD"
              />
            </Stack>

            <Stack gap={8}>
              <Text>Location</Text>
              <Input
                data-testid="user-location-input"
                value={location}
                onChangeText={setLocation}
                placeholder="City, State"
              />
            </Stack>
          </Stack>
        </Card>

        {/* Employment Information */}
        <Card padding={16}>
          <Stack gap={12}>
            <Text marginBottom={8}>Employment Information</Text>

            <Stack gap={8}>
              <Text>Employment Status</Text>
              <Input
                data-testid="user-employment-status-input"
                value={employmentStatus}
                onChangeText={setEmploymentStatus}
                placeholder="e.g., employed, unemployed"
              />
            </Stack>

            <Stack gap={8}>
              <Text>Job Search Status</Text>
              <Input
                data-testid="user-job-search-status-input"
                value={jobSearchStatus}
                onChangeText={setJobSearchStatus}
                placeholder="e.g., actively looking, open"
              />
            </Stack>

            <Stack gap={8}>
              <Text>Years of Experience</Text>
              <Input
                data-testid="user-years-experience-input"
                value={yearsOfExperience}
                onChangeText={setYearsOfExperience}
                placeholder="Years"
                keyboardType="numeric"
              />
            </Stack>

            <Stack gap={8}>
              <Text>Current Title</Text>
              <Input
                data-testid="user-current-title-input"
                value={currentTitle}
                onChangeText={setCurrentTitle}
                placeholder="Job title"
              />
            </Stack>

            <Stack gap={8}>
              <Text>Current Employer</Text>
              <Input
                data-testid="user-current-employer-input"
                value={currentEmployer}
                onChangeText={setCurrentEmployer}
                placeholder="Company name"
              />
            </Stack>
          </Stack>
        </Card>

        {/* Submit Button (mobile-friendly placement) */}
        <Row gap={8} paddingBottom={16}>
          <Button
            data-testid="cancel-button"
            flex={1}
            onPress={() => router.back()}
            variant="outline"
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
        </Row>
      </Stack>
    </ScrollView>
  )
}
