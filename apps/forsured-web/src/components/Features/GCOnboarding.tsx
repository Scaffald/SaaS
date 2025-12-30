import { useState } from 'react';
import {
  Building,
  Users,
  DollarSign,
  Shield,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Settings,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { YStack, XStack, Text, H1, H2, H3, Card, Button as TamaguiButton, Input, Label } from '@unicornlove/ui';

interface CompanyInfo {
  companyName: string;
  companySize: string;
  annualRevenue: string;
  industry: string;
  location: string;
}

interface ComplianceSettings {
  generalLiability: {
    required: boolean;
    minimumCoverage: number;
    preferredProviders: string[];
  };
  workersCompensation: {
    required: boolean;
    minimumCoverage: number;
    experienceModRequired: boolean;
  };
  professionalLiability: {
    required: boolean;
    minimumCoverage: number;
  };
  commercialAuto: {
    required: boolean;
    minimumCoverage: number;
  };
  umbrella: {
    required: boolean;
    minimumCoverage: number;
  };
}

export default function GCOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [projectSpecificOverrides, setProjectSpecificOverrides] =
    useState(true);

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    companySize: '',
    annualRevenue: '',
    industry: 'commercial-construction',
    location: '',
  });

  const [complianceSettings, setComplianceSettings] =
    useState<ComplianceSettings>({
      generalLiability: {
        required: true,
        minimumCoverage: 2000000,
        preferredProviders: ['State Farm', 'Liberty Mutual', 'Travelers'],
      },
      workersCompensation: {
        required: true,
        minimumCoverage: 1000000,
        experienceModRequired: true,
      },
      professionalLiability: {
        required: false,
        minimumCoverage: 1000000,
      },
      commercialAuto: {
        required: true,
        minimumCoverage: 1000000,
      },
      umbrella: {
        required: false,
        minimumCoverage: 5000000,
      },
    });

  const steps = [
    {
      id: 1,
      title: 'Company Information',
      description: 'Tell us about your construction company',
      icon: Building,
    },
    {
      id: 2,
      title: 'Compliance Settings',
      description: 'Review default insurance requirements',
      icon: Shield,
    },
    {
      id: 3,
      title: 'Confirmation',
      description: 'Confirm settings and complete setup',
      icon: CheckCircle,
    },
  ];

  const companySizeOptions = [
    {
      value: 'startup',
      label: '1-10 employees',
      description: 'Small contractor or startup',
    },
    {
      value: 'small',
      label: '11-50 employees',
      description: 'Small to medium contractor',
    },
    {
      value: 'medium',
      label: '51-200 employees',
      description: 'Medium-sized construction company',
    },
    {
      value: 'large',
      label: '201-1000 employees',
      description: 'Large construction company',
    },
    {
      value: 'enterprise',
      label: '1000+ employees',
      description: 'Enterprise-level contractor',
    },
  ];

  const industryOptions = [
    { value: 'commercial-construction', label: 'Commercial Construction' },
    { value: 'residential-construction', label: 'Residential Construction' },
    { value: 'infrastructure', label: 'Infrastructure & Civil' },
    { value: 'industrial', label: 'Industrial Construction' },
    { value: 'specialty', label: 'Specialty Contracting' },
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    setShowConfirmationModal(true);
  };

  const handleConfirmFinish = () => {
    // Mock completion logic
    console.log('Onboarding completed:', {
      companyInfo,
      complianceSettings,
      projectSpecificOverrides,
    });
    setShowConfirmationModal(false);
    // Redirect to dashboard or show success message
  };

  const updateComplianceSetting = (
    type: keyof ComplianceSettings,
    field: string,
    value: unknown
  ) => {
    setComplianceSettings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const getRecommendedSettings = () => {
    const size = companyInfo.companySize;
    const revenue = parseInt(companyInfo.annualRevenue) || 0;

    // Adjust recommendations based on company size and revenue
    if (size === 'enterprise' || revenue > 50000000) {
      return {
        generalLiability: { minimumCoverage: 5000000 },
        workersCompensation: { minimumCoverage: 2000000 },
        professionalLiability: { required: true, minimumCoverage: 2000000 },
        umbrella: { required: true, minimumCoverage: 10000000 },
      };
    } else if (size === 'large' || revenue > 10000000) {
      return {
        generalLiability: { minimumCoverage: 3000000 },
        workersCompensation: { minimumCoverage: 1500000 },
        professionalLiability: { required: true, minimumCoverage: 1000000 },
        umbrella: { required: true, minimumCoverage: 5000000 },
      };
    }
    return null; // Use defaults for smaller companies
  };

  const applyRecommendedSettings = () => {
    const recommended = getRecommendedSettings();
    if (recommended) {
      setComplianceSettings((prev) => ({
        ...prev,
        generalLiability: {
          ...prev.generalLiability,
          ...recommended.generalLiability,
        },
        workersCompensation: {
          ...prev.workersCompensation,
          ...recommended.workersCompensation,
        },
        professionalLiability: {
          ...prev.professionalLiability,
          ...recommended.professionalLiability,
        },
        umbrella: { ...prev.umbrella, ...recommended.umbrella },
      }));
    }
  };

  return (
    <YStack minHeight="100vh" backgroundColor="$backgroundHover" paddingVertical="$8">
      <YStack maxWidth={896} marginHorizontal="auto" paddingHorizontal="$4" $gtSm={{ paddingHorizontal: '$6' }} $gtLg={{ paddingHorizontal: '$8' }}>
        {/* Header */}
        <YStack alignItems="center" mb="$8">
          <H1 fontSize="$9" fontWeight="700" color="$color12" mb="$2">
            Welcome to Simple Insurance
          </H1>
          <Text fontSize="$6" color="$color11">
            Let's set up your construction compliance management
          </Text>
        </YStack>

        {/* Progress Indicator */}
        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" mb="$8">
          <XStack alignItems="center" justifyContent="space-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <XStack key={step.id} alignItems="center">
                  <XStack alignItems="center">
                    <XStack
                      width={48}
                      height={48}
                      borderRadius={9999}
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="500"
                      backgroundColor={
                        isCompleted
                          ? '$green10'
                          : isActive
                            ? '$blue10'
                            : '$backgroundHover'
                      }
                      color={
                        isCompleted || isActive
                          ? 'white'
                          : '$color11'
                      }
                    >
                      {isCompleted ? (
                        <CheckCircle size={20} color="white" />
                      ) : (
                        <Icon size={20} color={isActive ? 'white' : '$color11'} />
                      )}
                    </XStack>
                    <YStack ml="$4">
                      <Text
                        fontWeight="500"
                        color={isActive ? '$color12' : '$color11'}
                      >
                        {step.title}
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        {step.description}
                      </Text>
                    </YStack>
                  </XStack>
                  {index < steps.length - 1 && (
                    <ArrowRight size={20} color="$gray8" marginHorizontal="$8" />
                  )}
                </XStack>
              );
            })}
          </XStack>
        </Card>

        {/* Step Content */}
        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <YStack padding="$8">
              <YStack mb="$6">
                <H2 fontSize="$8" fontWeight="700" color="$color12" mb="$2">
                  Company Information
                </H2>
                <Text color="$color11">
                  Help us understand your construction business
                </Text>
              </YStack>

              <YStack gap="$6">
                {/* Company Name */}
                <YStack>
                  <Label fontSize="$3" fontWeight="500" color="$color12" mb="$2">
                    Company Name <Text color="$red10">*</Text>
                  </Label>
                  <Input
                    type="text"
                    required
                    width="100%"
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$4"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    placeholder="Enter your company name"
                    value={companyInfo.companyName}
                    onChangeText={(value) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        companyName: value,
                      }))
                    }
                  />
                </YStack>

                {/* Company Size */}
                <YStack>
                  <Label fontSize="$3" fontWeight="500" color="$color12" mb="$2">
                    Company Size <Text color="$red10">*</Text>
                  </Label>
                  <select
                    required
                    value={companyInfo.companySize}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        companySize: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid var(--borderColor)',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select company size</option>
                    {companySizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </YStack>

                {/* Industry */}
                <YStack>
                  <Label fontSize="$3" fontWeight="500" color="$color12" mb="$2">
                    Primary Industry <Text color="$red10">*</Text>
                  </Label>
                  <select
                    required
                    value={companyInfo.industry}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        industry: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid var(--borderColor)',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    {industryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </YStack>

                {/* Annual Revenue */}
                <YStack>
                  <Label fontSize="$3" fontWeight="500" color="$color12" mb="$2">
                    Annual Revenue (USD) <Text color="$red10">*</Text>
                  </Label>
                  <XStack position="relative" width="100%">
                    <DollarSign
                      position="absolute"
                      left={12}
                      top="50%"
                      style={{ transform: 'translateY(-50%)' }}
                      size={20}
                      color="$color10"
                      zIndex={1}
                    />
                    <Input
                      type="number"
                      required
                      width="100%"
                      paddingLeft="$10"
                      paddingRight="$4"
                      paddingVertical="$3"
                      borderWidth={1}
                      borderColor="$borderColor"
                      borderRadius="$4"
                      placeholder="Enter annual revenue"
                      value={companyInfo.annualRevenue}
                      onChangeText={(value) =>
                        setCompanyInfo((prev) => ({
                          ...prev,
                          annualRevenue: value,
                        }))
                      }
                    />
                  </XStack>
                  <Text fontSize="$3" color="$color11" mt="$1">
                    This helps us recommend appropriate coverage levels
                  </Text>
                </YStack>

                {/* Location */}
                <YStack>
                  <Label fontSize="$3" fontWeight="500" color="$color12" mb="$2">
                    Primary Location <Text color="$red10">*</Text>
                  </Label>
                  <Input
                    type="text"
                    required
                    width="100%"
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$4"
                    paddingHorizontal="$4"
                    paddingVertical="$3"
                    placeholder="City, State"
                    value={companyInfo.location}
                    onChangeText={(value) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        location: value,
                      }))
                    }
                  />
                </YStack>
              </YStack>
            </YStack>
          )}

          {/* Step 2: Compliance Settings */}
          {currentStep === 2 && (
            <YStack padding="$8">
              <YStack mb="$6">
                <XStack alignItems="center" justifyContent="space-between">
                  <YStack>
                    <H2 fontSize="$8" fontWeight="700" color="$color12" mb="$2">
                      Default Compliance Settings
                    </H2>
                    <Text color="$color11">
                      Review and customize your default insurance requirements
                      for contractors
                    </Text>
                  </YStack>
                  {getRecommendedSettings() && (
                    <TamaguiButton
                      onPress={applyRecommendedSettings}
                      backgroundColor="$blue10"
                      color="white"
                      paddingHorizontal="$4"
                      paddingVertical="$2"
                      borderRadius="$4"
                      hoverStyle={{ backgroundColor: '$blue11' }}
                    >
                      <XStack alignItems="center" gap="$2">
                        <Settings size={16} />
                        <Text>Apply Recommended</Text>
                      </XStack>
                    </TamaguiButton>
                  )}
                </XStack>
              </YStack>

              <YStack gap="$6">
                {/* General Liability */}
                <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$6">
                  <XStack alignItems="center" justifyContent="space-between" mb="$4">
                    <XStack alignItems="center" gap="$3">
                      <Shield size={24} color="$blue11" />
                      <YStack>
                        <H3 fontSize="$6" fontWeight="600" color="$color12">
                          General Liability
                        </H3>
                        <Text fontSize="$3" color="$color11">
                          Bodily injury and property damage coverage
                        </Text>
                      </YStack>
                    </XStack>
                    <XStack alignItems="center" gap="$2">
                      <input
                        type="checkbox"
                        checked={complianceSettings.generalLiability.required}
                        onChange={(e) =>
                          updateComplianceSetting(
                            'generalLiability',
                            'required',
                            e.target.checked
                          )
                        }
                        style={{ borderRadius: '4px' }}
                      />
                      <Text fontSize="$3" color="$color12" ml="$2">
                        Required
                      </Text>
                    </XStack>
                  </XStack>
                  {complianceSettings.generalLiability.required && (
                    <XStack flexWrap="wrap" gap="$4">
                      <YStack flex={1} minWidth="45%">
                        <Label fontSize="$3" fontWeight="500" color="$color12" mb="$2">
                          Minimum Coverage
                        </Label>
                        <select
                          value={
                            complianceSettings.generalLiability.minimumCoverage
                          }
                          onChange={(e) =>
                            updateComplianceSetting(
                              'generalLiability',
                              'minimumCoverage',
                              parseInt(e.target.value)
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid var(--borderColor)',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                        >
                          <option value={1000000}>$1,000,000</option>
                          <option value={2000000}>$2,000,000</option>
                          <option value={3000000}>$3,000,000</option>
                          <option value={5000000}>$5,000,000</option>
                        </select>
                      </YStack>
                    </XStack>
                  )}
                </Card>

                {/* Workers Compensation */}
                <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$6">
                  <XStack alignItems="center" justifyContent="space-between" mb="$4">
                    <XStack alignItems="center" gap="$3">
                      <Users size={24} color="$green11" />
                      <YStack>
                        <H3 fontSize="$6" fontWeight="600" color="$color12">
                          Workers Compensation
                        </H3>
                        <Text fontSize="$3" color="$color11">
                          Employee injury and illness coverage
                        </Text>
                      </YStack>
                    </XStack>
                    <XStack alignItems="center" gap="$2">
                      <input
                        type="checkbox"
                        checked={
                          complianceSettings.workersCompensation.required
                        }
                        onChange={(e) =>
                          updateComplianceSetting(
                            'workersCompensation',
                            'required',
                            e.target.checked
                          )
                        }
                        style={{ borderRadius: '4px' }}
                      />
                      <Text fontSize="$3" color="$color12" ml="$2">
                        Required
                      </Text>
                    </XStack>
                  </XStack>
                  {complianceSettings.workersCompensation.required && (
                    <XStack flexWrap="wrap" gap="$4">
                      <YStack flex={1} minWidth="45%">
                        <Label fontSize="$3" fontWeight="500" color="$color12" mb="$2">
                          Minimum Coverage
                        </Label>
                        <select
                          value={
                            complianceSettings.workersCompensation
                              .minimumCoverage
                          }
                          onChange={(e) =>
                            updateComplianceSetting(
                              'workersCompensation',
                              'minimumCoverage',
                              parseInt(e.target.value)
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid var(--borderColor)',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                        >
                          <option value={500000}>$500,000</option>
                          <option value={1000000}>$1,000,000</option>
                          <option value={1500000}>$1,500,000</option>
                          <option value={2000000}>$2,000,000</option>
                        </select>
                      </YStack>
                      <XStack alignItems="center" flex={1} minWidth="45%">
                        <XStack alignItems="center" gap="$2">
                          <input
                            type="checkbox"
                            checked={
                              complianceSettings.workersCompensation
                                .experienceModRequired
                            }
                            onChange={(e) =>
                              updateComplianceSetting(
                                'workersCompensation',
                                'experienceModRequired',
                                e.target.checked
                              )
                            }
                            style={{ borderRadius: '4px' }}
                          />
                          <Text fontSize="$3" color="$color12" ml="$2">
                            Require Experience Mod
                          </Text>
                        </XStack>
                      </XStack>
                    </XStack>
                  )}
                </Card>

                {/* Professional Liability */}
                <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$6">
                  <XStack alignItems="center" justifyContent="space-between" mb="$4">
                    <XStack alignItems="center" gap="$3">
                      <FileText size={24} color="$gray10" />
                      <YStack>
                        <H3 fontSize="$6" fontWeight="600" color="$color12">
                          Professional Liability
                        </H3>
                        <Text fontSize="$3" color="$color11">
                          Errors and omissions coverage
                        </Text>
                      </YStack>
                    </XStack>
                    <XStack alignItems="center" gap="$2">
                      <input
                        type="checkbox"
                        checked={
                          complianceSettings.professionalLiability.required
                        }
                        onChange={(e) =>
                          updateComplianceSetting(
                            'professionalLiability',
                            'required',
                            e.target.checked
                          )
                        }
                        style={{ borderRadius: '4px' }}
                      />
                      <Text fontSize="$3" color="$color12" ml="$2">
                        Required
                      </Text>
                    </XStack>
                  </XStack>
                  {complianceSettings.professionalLiability.required && (
                    <XStack flexWrap="wrap" gap="$4">
                      <YStack flex={1} minWidth="45%">
                        <Label fontSize="$3" fontWeight="500" color="$color12" mb="$2">
                          Minimum Coverage
                        </Label>
                        <select
                          value={
                            complianceSettings.professionalLiability
                              .minimumCoverage
                          }
                          onChange={(e) =>
                            updateComplianceSetting(
                              'professionalLiability',
                              'minimumCoverage',
                              parseInt(e.target.value)
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid var(--borderColor)',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                        >
                          <option value={500000}>$500,000</option>
                          <option value={1000000}>$1,000,000</option>
                          <option value={2000000}>$2,000,000</option>
                          <option value={5000000}>$5,000,000</option>
                        </select>
                      </YStack>
                    </XStack>
                  )}
                </Card>

                {/* Commercial Auto */}
                <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$6">
                  <XStack alignItems="center" justifyContent="space-between" mb="$4">
                    <XStack alignItems="center" gap="$3">
                      <DollarSign size={24} color="$gray11" />
                      <YStack>
                        <H3 fontSize="$6" fontWeight="600" color="$color12">
                          Commercial Auto
                        </H3>
                        <Text fontSize="$3" color="$color11">
                          Business vehicle coverage
                        </Text>
                      </YStack>
                    </XStack>
                    <XStack alignItems="center" gap="$2">
                      <input
                        type="checkbox"
                        checked={complianceSettings.commercialAuto.required}
                        onChange={(e) =>
                          updateComplianceSetting(
                            'commercialAuto',
                            'required',
                            e.target.checked
                          )
                        }
                        style={{ borderRadius: '4px' }}
                      />
                      <Text fontSize="$3" color="$color12" ml="$2">
                        Required
                      </Text>
                    </XStack>
                  </XStack>
                  {complianceSettings.commercialAuto.required && (
                    <XStack flexWrap="wrap" gap="$4">
                      <YStack flex={1} minWidth="45%">
                        <Label fontSize="$3" fontWeight="500" color="$color12" mb="$2">
                          Minimum Coverage
                        </Label>
                        <select
                          value={
                            complianceSettings.commercialAuto.minimumCoverage
                          }
                          onChange={(e) =>
                            updateComplianceSetting(
                              'commercialAuto',
                              'minimumCoverage',
                              parseInt(e.target.value)
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid var(--borderColor)',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                        >
                          <option value={500000}>$500,000</option>
                          <option value={1000000}>$1,000,000</option>
                          <option value={1500000}>$1,500,000</option>
                          <option value={2000000}>$2,000,000</option>
                        </select>
                      </YStack>
                    </XStack>
                  )}
                </Card>

                {/* Umbrella Policy */}
                <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$6">
                  <XStack alignItems="center" justifyContent="space-between" mb="$4">
                    <XStack alignItems="center" gap="$3">
                      <AlertTriangle size={24} color="$red11" />
                      <YStack>
                        <H3 fontSize="$6" fontWeight="600" color="$color12">
                          Umbrella Policy
                        </H3>
                        <Text fontSize="$3" color="$color11">
                          Additional liability protection
                        </Text>
                      </YStack>
                    </XStack>
                    <XStack alignItems="center" gap="$2">
                      <input
                        type="checkbox"
                        checked={complianceSettings.umbrella.required}
                        onChange={(e) =>
                          updateComplianceSetting(
                            'umbrella',
                            'required',
                            e.target.checked
                          )
                        }
                        style={{ borderRadius: '4px' }}
                      />
                      <Text fontSize="$3" color="$color12" ml="$2">
                        Required
                      </Text>
                    </XStack>
                  </XStack>
                  {complianceSettings.umbrella.required && (
                    <XStack flexWrap="wrap" gap="$4">
                      <YStack flex={1} minWidth="45%">
                        <Label fontSize="$3" fontWeight="500" color="$color12" mb="$2">
                          Minimum Coverage
                        </Label>
                        <select
                          value={complianceSettings.umbrella.minimumCoverage}
                          onChange={(e) =>
                            updateComplianceSetting(
                              'umbrella',
                              'minimumCoverage',
                              parseInt(e.target.value)
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid var(--borderColor)',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                        >
                          <option value={1000000}>$1,000,000</option>
                          <option value={5000000}>$5,000,000</option>
                          <option value={10000000}>$10,000,000</option>
                          <option value={25000000}>$25,000,000</option>
                        </select>
                      </YStack>
                    </XStack>
                  )}
                </Card>
              </YStack>

              <Card mt="$6" padding="$4" backgroundColor="$blue2" borderWidth={1} borderColor="$blue6" borderRadius="$4">
                <XStack alignItems="flex-start" gap="$2">
                  <Info size={16} color="$blue11" mt="$0.5" />
                  <YStack>
                    <Text fontSize="$3" color="$blue12" fontWeight="500">
                      Default Settings
                    </Text>
                    <Text fontSize="$3" color="$blue11">
                      These settings will apply to all new contractors by
                      default. You can override them for specific projects or
                      contractors later.
                    </Text>
                  </YStack>
                </XStack>
              </Card>
            </YStack>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <YStack padding="$8">
              <YStack mb="$6">
                <H2 fontSize="$8" fontWeight="700" color="$color12" mb="$2">
                  Confirmation & Setup Complete
                </H2>
                <Text color="$color11">
                  Review your settings and complete the onboarding process
                </Text>
              </YStack>

              <YStack gap="$6">
                {/* Company Summary */}
                <Card backgroundColor="$backgroundHover" borderRadius="$4" padding="$6">
                  <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$4">
                    Company Information
                  </H3>
                  <XStack flexWrap="wrap" gap="$4">
                    <YStack flex={1} minWidth="45%">
                      <Text fontSize="$3" color="$color11">Company Name:</Text>
                      <Text fontSize="$3" fontWeight="500">{companyInfo.companyName}</Text>
                    </YStack>
                    <YStack flex={1} minWidth="45%">
                      <Text fontSize="$3" color="$color11">Company Size:</Text>
                      <Text fontSize="$3" fontWeight="500">
                        {
                          companySizeOptions.find(
                            (opt) => opt.value === companyInfo.companySize
                          )?.label
                        }
                      </Text>
                    </YStack>
                    <YStack flex={1} minWidth="45%">
                      <Text fontSize="$3" color="$color11">Industry:</Text>
                      <Text fontSize="$3" fontWeight="500">
                        {
                          industryOptions.find(
                            (opt) => opt.value === companyInfo.industry
                          )?.label
                        }
                      </Text>
                    </YStack>
                    <YStack flex={1} minWidth="45%">
                      <Text fontSize="$3" color="$color11">
                        Annual Revenue:
                      </Text>
                      <Text fontSize="$3" fontWeight="500">
                        ${parseInt(companyInfo.annualRevenue).toLocaleString()}
                      </Text>
                    </YStack>
                  </XStack>
                </Card>

                {/* Compliance Summary */}
                <Card backgroundColor="$backgroundHover" borderRadius="$4" padding="$6">
                  <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$4">
                    Default Compliance Requirements
                  </H3>
                  <YStack gap="$3">
                    {Object.entries(complianceSettings).map(
                      ([key, setting]) => {
                        if (!setting.required) return null;
                        const titles = {
                          generalLiability: 'General Liability',
                          workersCompensation: 'Workers Compensation',
                          professionalLiability: 'Professional Liability',
                          commercialAuto: 'Commercial Auto',
                          umbrella: 'Umbrella Policy',
                        };
                        return (
                          <XStack
                            key={key}
                            alignItems="center"
                            justifyContent="space-between"
                            padding="$3"
                            backgroundColor="$background"
                            borderRadius="$4"
                          >
                            <Text fontWeight="500">
                              {titles[key as keyof typeof titles]}
                            </Text>
                            <Text color="$green11" fontWeight="500">
                              ${setting.minimumCoverage.toLocaleString()}{' '}
                              minimum
                            </Text>
                          </XStack>
                        );
                      }
                    )}
                  </YStack>
                </Card>

                {/* Project-Specific Overrides */}
                <Card backgroundColor="$blue2" borderWidth={1} borderColor="$blue6" borderRadius="$4" padding="$6">
                  <XStack alignItems="center" justifyContent="space-between">
                    <YStack>
                      <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$2">
                        Project-Specific Overrides
                      </H3>
                      <Text fontSize="$3" color="$color11">
                        Allow different insurance requirements for specific
                        projects when needed
                      </Text>
                    </YStack>
                    <XStack alignItems="center" gap="$2">
                      <input
                        type="checkbox"
                        checked={projectSpecificOverrides}
                        onChange={(e) =>
                          setProjectSpecificOverrides(e.target.checked)
                        }
                        style={{ borderRadius: '4px' }}
                      />
                      <Text fontSize="$3" fontWeight="500" color="$color12" ml="$2">
                        Enable
                      </Text>
                    </XStack>
                  </XStack>
                </Card>
              </YStack>
            </YStack>
          )}

          {/* Navigation */}
          <XStack paddingHorizontal="$8" paddingVertical="$6" backgroundColor="$backgroundHover" borderTopWidth={1} borderColor="$borderColor" alignItems="center" justifyContent="space-between">
            <TamaguiButton
              onPress={handlePrevious}
              disabled={currentStep === 1}
              opacity={currentStep === 1 ? 0.5 : 1}
              cursor={currentStep === 1 ? 'not-allowed' : 'pointer'}
              paddingHorizontal="$6"
              paddingVertical="$2"
              borderRadius="$4"
              backgroundColor="transparent"
              hoverStyle={currentStep === 1 ? undefined : { backgroundColor: '$background' }}
            >
              <XStack alignItems="center" gap="$2">
                <ArrowLeft size={16} />
                <Text>Previous</Text>
              </XStack>
            </TamaguiButton>

            <XStack alignItems="center" gap="$2">
              {steps.map((step) => (
                <YStack
                  key={step.id}
                  width={8}
                  height={8}
                  borderRadius={9999}
                  backgroundColor={currentStep >= step.id ? '$blue10' : '$gray8'}
                />
              ))}
            </XStack>

            {currentStep < 3 ? (
              <TamaguiButton
                onPress={handleNext}
                disabled={
                  currentStep === 1 &&
                  (!companyInfo.companyName ||
                    !companyInfo.companySize ||
                    !companyInfo.annualRevenue ||
                    !companyInfo.location)
                }
                paddingHorizontal="$6"
                paddingVertical="$2"
                backgroundColor="$blue10"
                color="white"
                borderRadius="$4"
                hoverStyle={{ backgroundColor: '$blue11' }}
                opacity={
                  currentStep === 1 &&
                  (!companyInfo.companyName ||
                    !companyInfo.companySize ||
                    !companyInfo.annualRevenue ||
                    !companyInfo.location)
                    ? 0.5
                    : 1
                }
                cursor={
                  currentStep === 1 &&
                  (!companyInfo.companyName ||
                    !companyInfo.companySize ||
                    !companyInfo.annualRevenue ||
                    !companyInfo.location)
                    ? 'not-allowed'
                    : 'pointer'
                }
              >
                <XStack alignItems="center" gap="$2">
                  <Text>Next</Text>
                  <ArrowRight size={16} />
                </XStack>
              </TamaguiButton>
            ) : (
              <TamaguiButton
                onPress={handleFinish}
                paddingHorizontal="$6"
                paddingVertical="$2"
                backgroundColor="$green10"
                color="white"
                borderRadius="$4"
                hoverStyle={{ backgroundColor: '$green11' }}
              >
                <XStack alignItems="center" gap="$2">
                  <CheckCircle size={16} />
                  <Text>Complete Setup</Text>
                </XStack>
              </TamaguiButton>
            )}
          </XStack>
        </Card>

        {/* Confirmation Modal */}
        {showConfirmationModal && (
          <YStack
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundColor="rgba(0,0,0,0.5)"
            alignItems="center"
            justifyContent="center"
            zIndex={50}
          >
            <Card backgroundColor="$background" borderRadius="$4" padding="$6" width="100%" maxWidth={448}>
              <YStack alignItems="center">
                <CheckCircle size={48} color="$green11" mb="$4" />
                <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$2">
                  Confirm Setup
                </H3>
                <Text color="$color11" mb="$6">
                  I confirm these settings will apply by default to all
                  contractors and projects. I can modify them later as needed.
                </Text>
                <XStack gap="$3" width="100%">
                  <TamaguiButton
                    onPress={() => setShowConfirmationModal(false)}
                    flex={1}
                    paddingHorizontal="$4"
                    paddingVertical="$2"
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$4"
                    backgroundColor="transparent"
                    hoverStyle={{ backgroundColor: '$backgroundHover' }}
                  >
                    Cancel
                  </TamaguiButton>
                  <TamaguiButton
                    onPress={handleConfirmFinish}
                    flex={1}
                    paddingHorizontal="$4"
                    paddingVertical="$2"
                    backgroundColor="$green10"
                    color="white"
                    borderRadius="$4"
                    hoverStyle={{ backgroundColor: '$green11' }}
                  >
                    Confirm & Finish
                  </TamaguiButton>
                </XStack>
              </YStack>
            </Card>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
