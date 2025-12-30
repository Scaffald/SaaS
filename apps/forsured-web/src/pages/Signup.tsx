/**
 * Signup Page - User type selection and profile creation using Tamagui
 * REQ-126: User Signup & Type Selection
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { YStack, Text, Spinner } from '@unicornlove/ui'
import { useAuth } from '../contexts/AuthContext'
import { createProfile } from '../services/userProfileService'
import { markInvitationUsed, type Invitation } from '../lib/invitations'
import { scaffaldClient } from '../lib/scaffald/client'
import { trpc } from '../lib/trpc'
import {
  IndustrySelection,
  UserTypeSelection,
  BrokerInvitationInput,
  ScaffaldCompanyCard,
  type UserSetType,
  type UserType,
  type ScaffaldCompany,
} from '../components/auth'

type SignupStep = 'industry' | 'role'

function SignupPage() {
  const { user, login, profile } = useAuth()
  const navigate = useNavigate()

  // REQ-4: Step-based signup flow
  const [currentStep, setCurrentStep] = useState<SignupStep>('industry')
  const [selectedUserSetType, setSelectedUserSetType] = useState<UserSetType | null>(null)
  const [selectedType, setSelectedType] = useState<UserType | null>(null)
  const [connectCompany, setConnectCompany] = useState(true)
  const [scaffaldCompany, setScaffaldCompany] = useState<ScaffaldCompany | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCompany, setIsLoadingCompany] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // REQ-4: Fetch available user set types
  const {
    data: userSetTypes,
    isLoading: isLoadingUserSetTypes,
    error: userSetTypesError,
  } = trpc.userSetTypes.listActive.useQuery()

  // If user already has a completed profile, redirect to their dashboard
  useEffect(() => {
    if (profile && profile.onboarding_completed) {
      const dashboardPath = `/${profile.user_type}/dashboard`
      console.log('[Signup] User has completed profile, redirecting to:', dashboardPath)
      navigate(dashboardPath, { replace: true })
    }
  }, [profile, navigate])

  // Load Scaffald company if user has one
  useEffect(() => {
    async function loadScaffaldCompany() {
      if (!user) {
        setIsLoadingCompany(false)
        return
      }

      setIsLoadingCompany(true)
      try {
        const companies = await scaffaldClient.companies.list()
        if (companies && companies.length > 0) {
          const company = await scaffaldClient.companies.get(companies[0].id)
          setScaffaldCompany(company)
          console.log('[Signup] Loaded Scaffald company:', company.name)
        }
      } catch (err) {
        console.error('[Signup] Error loading Scaffald company:', err)
      } finally {
        setIsLoadingCompany(false)
      }
    }

    loadScaffaldCompany()
  }, [user])

  // REQ-4: Handle industry (user set type) selection
  function handleIndustrySelect(userSetType: UserSetType) {
    setSelectedUserSetType(userSetType)
    setCurrentStep('role')
    setError(null)
  }

  // REQ-4: Go back to industry selection
  function handleBackToIndustry() {
    setCurrentStep('industry')
    setSelectedUserSetType(null)
    setSelectedType(null)
    setError(null)
  }

  // Handle GC (manager) or Contractor (subcontractor) selection
  async function handleTypeSelect(type: UserType) {
    if (!user) {
      setError('No authenticated user. Please log in again.')
      return
    }

    if (!selectedUserSetType) {
      setError('Please select an industry first.')
      setCurrentStep('industry')
      return
    }

    setSelectedType(type)
    setIsLoading(true)
    setError(null)

    try {
      const newProfile = await createProfile({
        scaffald_user_id: user.id,
        user_type: type,
        user_set_type_id: selectedUserSetType.id,
        onboarding_completed: false,
        company_connected: connectCompany && scaffaldCompany !== null,
        onboarding_step: 0,
      })

      console.log(
        '[Signup] Profile created:',
        newProfile.id,
        'with user set type:',
        selectedUserSetType.slug
      )
      login({ profile: newProfile })
      // Map 'subcontractor' type to 'contractor' route
      const routeType = type === 'subcontractor' ? 'contractor' : type
      navigate(`/${routeType}/onboarding`)
    } catch (err) {
      console.error('[Signup] Error creating profile:', err)
      setError('Failed to create account. Please try again.')
      setSelectedType(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle broker invitation validation success
  async function handleBrokerInvitationSuccess(invitation: Invitation) {
    if (!user) {
      setError('No authenticated user. Please log in again.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const newProfile = await createProfile({
        scaffald_user_id: user.id,
        user_type: 'broker',
        onboarding_completed: false,
        company_connected: false,
        onboarding_step: 0,
      })

      console.log('[Signup] Broker profile created:', newProfile.id)
      await markInvitationUsed(invitation.id, newProfile.id)
      login({ profile: newProfile })
      navigate('/broker/onboarding')
    } catch (err) {
      console.error('[Signup] Error processing broker invitation:', err)
      setError('Failed to process invitation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking for existing profile
  if (!user) {
    return (
      <YStack
        minHeight="100vh"
        alignItems="center"
        justifyContent="center"
        backgroundColor="$gray2"
      >
        <YStack alignItems="center" gap="$4">
          <Spinner size="large" />
          <Text color="$color11">Loading...</Text>
        </YStack>
      </YStack>
    )
  }

  return (
    <YStack minHeight="100vh" backgroundColor="$gray2" paddingVertical="$12" paddingHorizontal="$4">
      <YStack maxWidth={672} width="100%" alignSelf="center" gap="$8">
        {/* Header */}
        <YStack alignItems="center" gap="$2">
          <Text fontSize="$9" fontWeight="700" color="$color12">
            Welcome to ForSured, {user.name || user.email}!
          </Text>
          <Text fontSize="$4" color="$color11" marginTop="$2">
            {currentStep === 'industry'
              ? "Let's get you set up. First, select your industry."
              : `Great! Now choose your role in ${selectedUserSetType?.name}.`}
          </Text>
        </YStack>

        {/* Company Connection Card - shown in both steps */}
        <ScaffaldCompanyCard
          company={scaffaldCompany}
          isLoading={isLoadingCompany}
          connectCompany={connectCompany}
          onToggleConnect={setConnectCompany}
        />

        {/* Error Message */}
        {error && (
          <YStack
            data-testid="signup-error"
            backgroundColor="$red2"
            borderWidth={1}
            borderColor="$red6"
            borderRadius="$3"
            padding="$4"
            gap="$2"
          >
            <Text fontSize="$2" color="$red11">
              {error}
            </Text>
          </YStack>
        )}

        {/* REQ-4: Step 1 - Industry Selection */}
        {currentStep === 'industry' && (
          <IndustrySelection
            userSetTypes={userSetTypes}
            isLoading={isLoadingUserSetTypes}
            error={userSetTypesError}
            selectedId={selectedUserSetType?.id}
            onSelect={handleIndustrySelect}
            disabled={isLoading}
          />
        )}

        {/* REQ-4: Step 2 - Role Selection with Lexicon Labels */}
        {currentStep === 'role' && selectedUserSetType && (
          <UserTypeSelection
            userSetType={selectedUserSetType}
            selectedType={selectedType}
            onSelect={handleTypeSelect}
            onBack={handleBackToIndustry}
            isLoading={isLoading}
          />
        )}

        {/* Broker Section - shown in both steps */}
        <BrokerInvitationInput
          userEmail={user.email ?? undefined}
          onValidCode={handleBrokerInvitationSuccess}
          onError={setError}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </YStack>
    </YStack>
  )
}

export default SignupPage
