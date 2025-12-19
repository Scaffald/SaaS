/**
 * Signup Page - User type selection and profile creation using Tamagui
 * REQ-126: User Signup & Type Selection
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { YStack, XStack, Text, styled, Spinner } from '@unicornlove/ui';
import { Button as CoreButton } from '@unicornlove/ui';
import { Input as TextInput } from '@unicornlove/ui';
import { Checkbox } from '@unicornlove/ui';
import { useAuth } from '../contexts/AuthContext';
import { createProfile } from '../services/userProfileService';
import { validateInvitation, markInvitationUsed } from '../lib/invitations';
import { scaffaldClient } from '../lib/scaffald/client';
import { trpc } from '../lib/trpc';
import { Building2, HardHat, Shield, Factory, Home, Briefcase, ChevronLeft } from 'lucide-react';

type UserType = 'manager' | 'subcontractor' | 'broker';

/** REQ-4: User set type data from API */
interface UserSetType {
  id: string;
  name: string;
  slug: string;
  managerLabelSingular: string;
  managerLabelPlural: string;
  contractorLabelSingular: string;
  contractorLabelPlural: string;
  description: string | null;
}

type SignupStep = 'industry' | 'role';

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface ScaffaldCompany {
  id: string;
  name: string;
  address?: Address;
}

const UserTypeCard = styled(YStack, {
  name: 'UserTypeCard',
  position: 'relative',
  backgroundColor: '$background',
  borderRadius: '$md',
  shadowColor: '$shadowColor',
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
  padding: '$6',
  textAlign: 'left',
  borderWidth: 2,
  borderColor: 'transparent',
  cursor: 'pointer',
  
  hoverStyle: {
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderColor: '$blue9',
  },
  
  variants: {
    selected: {
      true: {
        borderColor: '$blue9',
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
  } as const,
});

function SignupPage() {
  const { user, login, profile } = useAuth();
  const navigate = useNavigate();

  // REQ-4: Step-based signup flow
  const [currentStep, setCurrentStep] = useState<SignupStep>('industry');
  const [selectedUserSetType, setSelectedUserSetType] = useState<UserSetType | null>(null);
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [showInvitation, setShowInvitation] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [connectCompany, setConnectCompany] = useState(true);
  const [scaffaldCompany, setScaffaldCompany] = useState<ScaffaldCompany | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // REQ-4: Fetch available user set types
  const { data: userSetTypes, isLoading: isLoadingUserSetTypes } = trpc.userSetTypes.listActive.useQuery();

  // If user already has a completed profile, redirect to their dashboard
  useEffect(() => {
    if (profile && profile.onboarding_completed) {
      const dashboardPath = `/${profile.user_type}/dashboard`;
      console.log('[Signup] User has completed profile, redirecting to:', dashboardPath);
      navigate(dashboardPath, { replace: true });
    }
  }, [profile, navigate]);

  // Load Scaffald company if user has one
  useEffect(() => {
    async function loadScaffaldCompany() {
      if (!user) {
        setIsLoadingCompany(false);
        return;
      }

      setIsLoadingCompany(true);
      try {
        const companies = await scaffaldClient.companies.list();
        if (companies && companies.length > 0) {
          const company = await scaffaldClient.companies.get(companies[0].id);
          setScaffaldCompany(company);
          console.log('[Signup] Loaded Scaffald company:', company.name);
        }
      } catch (err) {
        console.error('[Signup] Error loading Scaffald company:', err);
      } finally {
        setIsLoadingCompany(false);
      }
    }

    loadScaffaldCompany();
  }, [user]);

  // REQ-4: Handle industry (user set type) selection
  function handleIndustrySelect(userSetType: UserSetType) {
    setSelectedUserSetType(userSetType);
    setCurrentStep('role');
    setError(null);
  }

  // REQ-4: Go back to industry selection
  function handleBackToIndustry() {
    setCurrentStep('industry');
    setSelectedUserSetType(null);
    setSelectedType(null);
    setError(null);
  }

  // Handle GC (manager) or Contractor (subcontractor) selection
  async function handleTypeSelect(type: 'manager' | 'subcontractor') {
    if (!user) {
      setError('No authenticated user. Please log in again.');
      return;
    }

    if (!selectedUserSetType) {
      setError('Please select an industry first.');
      setCurrentStep('industry');
      return;
    }

    setSelectedType(type);
    setIsLoading(true);
    setError(null);

    try {
      const newProfile = await createProfile({
        scaffald_user_id: user.id,
        user_type: type,
        user_set_type_id: selectedUserSetType.id,
        onboarding_completed: false,
        company_connected: connectCompany && scaffaldCompany !== null,
        onboarding_step: 0,
      });

      console.log('[Signup] Profile created:', newProfile.id, 'with user set type:', selectedUserSetType.slug);
      login({ profile: newProfile });
      // Map 'subcontractor' type to 'contractor' route
      const routeType = type === 'subcontractor' ? 'contractor' : type;
      navigate(`/${routeType}/onboarding`);
    } catch (err) {
      console.error('[Signup] Error creating profile:', err);
      setError('Failed to create account. Please try again.');
      setSelectedType(null);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle broker invitation
  async function handleBrokerInvitation() {
    if (!user) {
      setError('No authenticated user. Please log in again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const invitation = await validateInvitation(invitationCode);

      if (!invitation) {
        setError('Invalid or expired invitation code.');
        setIsLoading(false);
        return;
      }

      if (invitation.email && invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
        setError('This invitation is for a different email address.');
        setIsLoading(false);
        return;
      }

      const newProfile = await createProfile({
        scaffald_user_id: user.id,
        user_type: 'broker',
        onboarding_completed: false,
        company_connected: false,
        onboarding_step: 0,
      });

      console.log('[Signup] Broker profile created:', newProfile.id);
      await markInvitationUsed(invitation.id, newProfile.id);
      login({ profile: newProfile });
      navigate('/broker/onboarding');
    } catch (err) {
      console.error('[Signup] Error processing broker invitation:', err);
      setError('Failed to process invitation. Please try again.');
    } finally {
      setIsLoading(false);
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
    );
  }

  // REQ-4: Helper to get icon for user set type
  function getIndustryIcon(slug: string) {
    switch (slug) {
      case 'construction':
        return <Factory size={24} color="currentColor" />;
      case 'property-management':
        return <Home size={24} color="currentColor" />;
      default:
        return <Briefcase size={24} color="currentColor" />;
    }
  }

  // REQ-4: Helper to get icon background color
  function getIndustryColor(slug: string) {
    switch (slug) {
      case 'construction':
        return '$orange3';
      case 'property-management':
        return '$green3';
      default:
        return '$blue3';
    }
  }

  return (
    <YStack
      minHeight="100vh"
      backgroundColor="$gray2"
      paddingVertical="$12"
      paddingHorizontal="$4"
    >
      <YStack maxWidth={672} width="100%" alignSelf="center" gap="$8">
        {/* Header */}
        <YStack alignItems="center" gap="$2">
          <Text fontSize="$9" fontWeight="700" color="$color12">
            Welcome to ForSured, {user.name || user.email}!
          </Text>
          <Text fontSize="$4" color="$color11" marginTop="$2">
            {currentStep === 'industry'
              ? "Let's get you set up. First, select your industry."
              : `Great! Now choose your role in ${selectedUserSetType?.name}.`
            }
          </Text>
        </YStack>

        {/* Company Connection Card - shown in both steps */}
        {isLoadingCompany ? (
          <YStack
            backgroundColor="$background"
            borderRadius="$md"
            shadowColor="$shadowColor"
            shadowRadius={4}
            shadowOffset={{ width: 0, height: 2 }}
            padding="$6"
            gap="$3"
          >
            <XStack alignItems="center" gap="$3">
              <Spinner size="small" />
              <Text color="$color10">Checking for existing company...</Text>
            </XStack>
          </YStack>
        ) : scaffaldCompany ? (
          <YStack
            backgroundColor="$background"
            borderRadius="$md"
            shadowColor="$shadowColor"
            shadowRadius={4}
            shadowOffset={{ width: 0, height: 2 }}
            padding="$6"
            gap="$4"
          >
            <XStack alignItems="flex-start" gap="$4">
              <Building2 size={32} color="currentColor" />
              <YStack flex={1} gap="$1">
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  {scaffaldCompany.name}
                </Text>
                {scaffaldCompany.address && (
                  <Text fontSize="$2" color="$color10" marginTop="$1">
                    {scaffaldCompany.address.street}, {scaffaldCompany.address.city},{' '}
                    {scaffaldCompany.address.state} {scaffaldCompany.address.zip}
                  </Text>
                )}
                <XStack alignItems="center" marginTop="$4" gap="$2">
                  <Checkbox
                    checked={connectCompany}
                    onCheckedChange={(checked) => setConnectCompany(!!checked)}
                  />
                  <Text fontSize="$2" color="$color11">
                    Connect this company to ForSured
                  </Text>
                </XStack>
              </YStack>
            </XStack>
          </YStack>
        ) : null}

        {/* Error Message */}
        {error && (
          <YStack
            data-testid="signup-error"
            backgroundColor="$red2"
            borderWidth={1}
            borderColor="$red6"
            borderRadius="$md"
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
          <>
            <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
              What industry are you in?
            </Text>

            {isLoadingUserSetTypes ? (
              <YStack alignItems="center" padding="$8">
                <Spinner size="large" />
                <Text color="$color10" marginTop="$4">Loading industries...</Text>
              </YStack>
            ) : (
              <XStack
                flexDirection="row"
                flexWrap="wrap"
                gap="$4"
                marginBottom="$8"
              >
                {userSetTypes?.map((ust) => (
                  <UserTypeCard
                    key={ust.id}
                    as="button"
                    onClick={() => handleIndustrySelect(ust)}
                    disabled={isLoading}
                    selected={selectedUserSetType?.id === ust.id}
                    data-testid={`industry-${ust.slug}`}
                    flex={1}
                    minWidth={280}
                  >
                    <XStack alignItems="flex-start" gap="$4">
                      <XStack
                        width={48}
                        height={48}
                        backgroundColor={getIndustryColor(ust.slug)}
                        borderRadius="$md"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        {getIndustryIcon(ust.slug)}
                      </XStack>
                      <YStack gap="$1">
                        <Text fontSize="$5" fontWeight="600" color="$color12">
                          {ust.name}
                        </Text>
                        {ust.description && (
                          <Text fontSize="$2" color="$color10" marginTop="$1">
                            {ust.description}
                          </Text>
                        )}
                      </YStack>
                    </XStack>
                  </UserTypeCard>
                ))}
              </XStack>
            )}
          </>
        )}

        {/* REQ-4: Step 2 - Role Selection with Lexicon Labels */}
        {currentStep === 'role' && selectedUserSetType && (
          <>
            {/* Back button */}
            <CoreButton
              onClick={handleBackToIndustry}
              variant="ghost"
              data-testid="back-to-industry"
            >
              <XStack alignItems="center" gap="$2">
                <ChevronLeft size={16} />
                <Text>Back to industry selection</Text>
              </XStack>
            </CoreButton>

            <Text fontSize="$6" fontWeight="600" color="$color12" marginBottom="$4">
              How will you use ForSured?
            </Text>

            <XStack
              flexDirection="row"
              flexWrap="wrap"
              gap="$4"
              marginBottom="$8"
            >
              {/* Manager Card - uses lexicon labels */}
              <UserTypeCard
                as="button"
                onClick={() => handleTypeSelect('manager')}
                disabled={isLoading}
                selected={selectedType === 'manager'}
                data-testid="user-type-manager"
                flex={1}
                minWidth={280}
              >
                <XStack alignItems="flex-start" gap="$4">
                  <XStack
                    width={48}
                    height={48}
                    backgroundColor="$blue3"
                    borderRadius="$md"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <Building2 size={24} color="currentColor" />
                  </XStack>
                  <YStack gap="$1">
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      {selectedUserSetType.managerLabelSingular}
                    </Text>
                    <Text fontSize="$2" color="$color10" marginTop="$1">
                      I hire {selectedUserSetType.contractorLabelPlural.toLowerCase()} and manage projects
                    </Text>
                  </YStack>
                </XStack>
                {isLoading && selectedType === 'manager' && (
                  <YStack
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    backgroundColor="rgba(255, 255, 255, 0.8)"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="$md"
                  >
                    <Spinner />
                  </YStack>
                )}
              </UserTypeCard>

              {/* Contractor Card - uses lexicon labels */}
              <UserTypeCard
                as="button"
                onClick={() => handleTypeSelect('subcontractor')}
                disabled={isLoading}
                selected={selectedType === 'subcontractor'}
                data-testid="user-type-contractor"
                flex={1}
                minWidth={280}
              >
                <XStack alignItems="flex-start" gap="$4">
                  <XStack
                    width={48}
                    height={48}
                    backgroundColor="$yellow3"
                    borderRadius="$md"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <HardHat size={24} color="currentColor" />
                  </XStack>
                  <YStack gap="$1">
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      {selectedUserSetType.contractorLabelSingular}
                    </Text>
                    <Text fontSize="$2" color="$color10" marginTop="$1">
                      I work on projects for {selectedUserSetType.managerLabelPlural.toLowerCase()}
                    </Text>
                  </YStack>
                </XStack>
                {isLoading && selectedType === 'subcontractor' && (
                  <YStack
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    backgroundColor="rgba(255, 255, 255, 0.8)"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="$md"
                  >
                    <Spinner />
                  </YStack>
                )}
              </UserTypeCard>
            </XStack>
          </>
        )}

        {/* Broker Section - shown in both steps */}
        <YStack
          borderTopWidth={1}
          borderTopColor="$borderColor"
          paddingTop="$6"
        >
          {!showInvitation ? (
            <YStack alignItems="center" gap="$2">
              <Text color="$color10">Are you an insurance broker?</Text>
              <CoreButton
                onClick={() => setShowInvitation(true)}
                data-testid="broker-invitation-link"
                variant="ghost"
              >
                Enter Invitation Code
              </CoreButton>
            </YStack>
          ) : (
            <YStack
              backgroundColor="$background"
              borderRadius="$md"
              shadowColor="$shadowColor"
              shadowRadius={4}
              shadowOffset={{ width: 0, height: 2 }}
              padding="$6"
              gap="$4"
            >
              <XStack alignItems="center" gap="$2" marginBottom="$4">
                <Shield size={24} color="currentColor" />
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  Broker Invitation
                </Text>
              </XStack>
              <Text fontSize="$2" color="$color10" marginBottom="$4">
                Enter your invitation code to join as an insurance broker.
              </Text>
              <YStack gap="$4">
                <TextInput
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  placeholder="Enter code (e.g., ABCD1234)"
                  maxLength={20}
                  data-testid="invitation-code-input"
                />
                <XStack gap="$3">
                  <CoreButton
                    onClick={handleBrokerInvitation}
                    disabled={isLoading || invitationCode.length < 4}
                    data-testid="verify-invitation-button"
                    variant="primary"
                    flex={1}
                  >
                    {isLoading ? (
                      <XStack gap="$2" alignItems="center">
                        <Spinner size="small" color="$color1" />
                        <Text>Verifying...</Text>
                      </XStack>
                    ) : (
                      'Verify & Continue'
                    )}
                  </CoreButton>
                  <CoreButton
                    onClick={() => {
                      setShowInvitation(false);
                      setInvitationCode('');
                      setError(null);
                    }}
                    data-testid="cancel-invitation-button"
                    variant="ghost"
                  >
                    Cancel
                  </CoreButton>
                </XStack>
              </YStack>
            </YStack>
          )}
        </YStack>
      </YStack>
    </YStack>
  );
}

export default SignupPage;
