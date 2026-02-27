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
import { Stack, Row, Text, H1, H2, H3, Card, Button, Input } from '@scaffald/ui';

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
    <Stack style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-hover)', paddingTop: '32px', paddingBottom: '32px' }}>
      <Stack style={{ maxWidth: 896, marginLeft: 'auto', marginRight: 'auto', paddingLeft: '16px', paddingRight: '16px' }}>
        {/* Header */}
        <Stack style={{ alignItems: 'center', marginBottom: '32px' }}>
          <H1 style={{ fontSize: '36px', fontWeight: 700, color: 'var(--color-12)', marginBottom: '8px' }}>
            Welcome to Simple Insurance
          </H1>
          <Text style={{ fontSize: '24px', color: 'var(--color-11)' }}>
            Let's set up your construction compliance management
          </Text>
        </Stack>

        {/* Progress Indicator */}
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '24px', marginBottom: '32px' }}>
          <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <Row key={step.id} style={{ alignItems: 'center' }}>
                  <Row style={{ alignItems: 'center' }}>
                    <Row
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 500,
                        backgroundColor: isCompleted
                          ? 'var(--color-green-10)'
                          : isActive
                            ? 'var(--color-blue-10)'
                            : 'var(--color-background-hover)',
                        color: isCompleted || isActive ? 'white' : 'var(--color-11)',
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle size={20} color="white" />
                      ) : (
                        <Icon size={20} color={isActive ? 'white' : 'var(--color-11)'} />
                      )}
                    </Row>
                    <Stack style={{ marginLeft: '16px' }}>
                      <Text
                        style={{
                          fontWeight: 500,
                          color: isActive ? 'var(--color-12)' : 'var(--color-11)',
                        }}
                      >
                        {step.title}
                      </Text>
                      <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                        {step.description}
                      </Text>
                    </Stack>
                  </Row>
                  {index < steps.length - 1 && (
                    <ArrowRight size={20} color="var(--color-gray-8)" style={{ marginLeft: '32px', marginRight: '32px' }} />
                  )}
                </Row>
              );
            })}
          </Row>
        </Card>

        {/* Step Content */}
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <Stack style={{ padding: '32px' }}>
              <Stack style={{ marginBottom: '24px' }}>
                <H2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-12)', marginBottom: '8px' }}>
                  Company Information
                </H2>
                <Text style={{ color: 'var(--color-11)' }}>
                  Help us understand your construction business
                </Text>
              </Stack>

              <Stack style={{ gap: '24px' }}>
                {/* Company Name */}
                <Stack>
                  <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px', display: 'block' }}>
                    Company Name <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
                  </Text>
                  <Input
                    type="text"
                    required
                    placeholder="Enter your company name"
                    value={companyInfo.companyName}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                    }}
                  />
                </Stack>

                {/* Company Size */}
                <Stack>
                  <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px', display: 'block' }}>
                    Company Size <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
                  </Text>
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
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-12)',
                    }}
                  >
                    <option value="">Select company size</option>
                    {companySizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </Stack>

                {/* Industry */}
                <Stack>
                  <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px', display: 'block' }}>
                    Primary Industry <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
                  </Text>
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
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-12)',
                    }}
                  >
                    {industryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Stack>

                {/* Annual Revenue */}
                <Stack>
                  <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px', display: 'block' }}>
                    Annual Revenue (USD) <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
                  </Text>
                  <Row style={{ position: 'relative', width: '100%' }}>
                    <DollarSign
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1,
                      }}
                      size={20}
                      color="var(--color-10)"
                    />
                    <Input
                      type="number"
                      required
                      placeholder="Enter annual revenue"
                      value={companyInfo.annualRevenue}
                      onChange={(e) =>
                        setCompanyInfo((prev) => ({
                          ...prev,
                          annualRevenue: e.target.value,
                        }))
                      }
                      style={{
                        width: '100%',
                        paddingLeft: '40px',
                        paddingRight: '16px',
                        paddingTop: '12px',
                        paddingBottom: '12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                      }}
                    />
                  </Row>
                  <Text style={{ fontSize: '14px', color: 'var(--color-11)', marginTop: '4px' }}>
                    This helps us recommend appropriate coverage levels
                  </Text>
                </Stack>

                {/* Location */}
                <Stack>
                  <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px', display: 'block' }}>
                    Primary Location <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
                  </Text>
                  <Input
                    type="text"
                    required
                    placeholder="City, State"
                    value={companyInfo.location}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                    }}
                  />
                </Stack>
              </Stack>
            </Stack>
          )}

          {/* Step 2: Compliance Settings */}
          {currentStep === 2 && (
            <Stack style={{ padding: '32px' }}>
              <Stack style={{ marginBottom: '24px' }}>
                <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stack>
                    <H2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-12)', marginBottom: '8px' }}>
                      Default Compliance Settings
                    </H2>
                    <Text style={{ color: 'var(--color-11)' }}>
                      Review and customize your default insurance requirements
                      for contractors
                    </Text>
                  </Stack>
                  {getRecommendedSettings() && (
                    <Button
                      onPress={applyRecommendedSettings}
                      style={{
                        backgroundColor: 'var(--color-blue-10)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                      }}
                    >
                      <Row style={{ alignItems: 'center', gap: '8px' }}>
                        <Settings size={16} />
                        <Text>Apply Recommended</Text>
                      </Row>
                    </Button>
                  )}
                </Row>
              </Stack>

              <Stack style={{ gap: '24px' }}>
                {/* General Liability */}
                <Card style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Row style={{ alignItems: 'center', gap: '12px' }}>
                      <Shield size={24} color="var(--color-blue-11)" />
                      <Stack>
                        <H3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)' }}>
                          General Liability
                        </H3>
                        <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                          Bodily injury and property damage coverage
                        </Text>
                      </Stack>
                    </Row>
                    <Row style={{ alignItems: 'center', gap: '8px' }}>
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
                      <Text style={{ fontSize: '14px', color: 'var(--color-12)', marginLeft: '8px' }}>
                        Required
                      </Text>
                    </Row>
                  </Row>
                  {complianceSettings.generalLiability.required && (
                    <Row style={{ flexWrap: 'wrap', gap: '16px' }}>
                      <Stack style={{ flex: 1, minWidth: '45%' }}>
                        <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px', display: 'block' }}>
                          Minimum Coverage
                        </Text>
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
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'var(--color-background)',
                            color: 'var(--color-12)',
                          }}
                        >
                          <option value={1000000}>$1,000,000</option>
                          <option value={2000000}>$2,000,000</option>
                          <option value={3000000}>$3,000,000</option>
                          <option value={5000000}>$5,000,000</option>
                        </select>
                      </Stack>
                    </Row>
                  )}
                </Card>

                {/* Workers Compensation */}
                <Card style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Row style={{ alignItems: 'center', gap: '12px' }}>
                      <Users size={24} color="var(--color-green-11)" />
                      <Stack>
                        <H3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)' }}>
                          Workers Compensation
                        </H3>
                        <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                          Employee injury and illness coverage
                        </Text>
                      </Stack>
                    </Row>
                    <Row style={{ alignItems: 'center', gap: '8px' }}>
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
                      <Text style={{ fontSize: '14px', color: 'var(--color-12)', marginLeft: '8px' }}>
                        Required
                      </Text>
                    </Row>
                  </Row>
                  {complianceSettings.workersCompensation.required && (
                    <Row style={{ flexWrap: 'wrap', gap: '16px' }}>
                      <Stack style={{ flex: 1, minWidth: '45%' }}>
                        <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px', display: 'block' }}>
                          Minimum Coverage
                        </Text>
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
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'var(--color-background)',
                            color: 'var(--color-12)',
                          }}
                        >
                          <option value={500000}>$500,000</option>
                          <option value={1000000}>$1,000,000</option>
                          <option value={1500000}>$1,500,000</option>
                          <option value={2000000}>$2,000,000</option>
                        </select>
                      </Stack>
                      <Row style={{ alignItems: 'center', flex: 1, minWidth: '45%' }}>
                        <Row style={{ alignItems: 'center', gap: '8px' }}>
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
                          <Text style={{ fontSize: '14px', color: 'var(--color-12)', marginLeft: '8px' }}>
                            Require Experience Mod
                          </Text>
                        </Row>
                      </Row>
                    </Row>
                  )}
                </Card>

                {/* Professional Liability */}
                <Card style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Row style={{ alignItems: 'center', gap: '12px' }}>
                      <FileText size={24} color="var(--color-gray-10)" />
                      <Stack>
                        <H3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)' }}>
                          Professional Liability
                        </H3>
                        <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                          Errors and omissions coverage
                        </Text>
                      </Stack>
                    </Row>
                    <Row style={{ alignItems: 'center', gap: '8px' }}>
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
                      <Text style={{ fontSize: '14px', color: 'var(--color-12)', marginLeft: '8px' }}>
                        Required
                      </Text>
                    </Row>
                  </Row>
                  {complianceSettings.professionalLiability.required && (
                    <Row style={{ flexWrap: 'wrap', gap: '16px' }}>
                      <Stack style={{ flex: 1, minWidth: '45%' }}>
                        <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px', display: 'block' }}>
                          Minimum Coverage
                        </Text>
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
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'var(--color-background)',
                            color: 'var(--color-12)',
                          }}
                        >
                          <option value={500000}>$500,000</option>
                          <option value={1000000}>$1,000,000</option>
                          <option value={2000000}>$2,000,000</option>
                          <option value={5000000}>$5,000,000</option>
                        </select>
                      </Stack>
                    </Row>
                  )}
                </Card>

                {/* Commercial Auto */}
                <Card style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Row style={{ alignItems: 'center', gap: '12px' }}>
                      <DollarSign size={24} color="var(--color-gray-11)" />
                      <Stack>
                        <H3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)' }}>
                          Commercial Auto
                        </H3>
                        <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                          Business vehicle coverage
                        </Text>
                      </Stack>
                    </Row>
                    <Row style={{ alignItems: 'center', gap: '8px' }}>
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
                      <Text style={{ fontSize: '14px', color: 'var(--color-12)', marginLeft: '8px' }}>
                        Required
                      </Text>
                    </Row>
                  </Row>
                  {complianceSettings.commercialAuto.required && (
                    <Row style={{ flexWrap: 'wrap', gap: '16px' }}>
                      <Stack style={{ flex: 1, minWidth: '45%' }}>
                        <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px', display: 'block' }}>
                          Minimum Coverage
                        </Text>
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
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'var(--color-background)',
                            color: 'var(--color-12)',
                          }}
                        >
                          <option value={500000}>$500,000</option>
                          <option value={1000000}>$1,000,000</option>
                          <option value={1500000}>$1,500,000</option>
                          <option value={2000000}>$2,000,000</option>
                        </select>
                      </Stack>
                    </Row>
                  )}
                </Card>

                {/* Umbrella Policy */}
                <Card style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <Row style={{ alignItems: 'center', gap: '12px' }}>
                      <AlertTriangle size={24} color="var(--color-red-11)" />
                      <Stack>
                        <H3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)' }}>
                          Umbrella Policy
                        </H3>
                        <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                          Additional liability protection
                        </Text>
                      </Stack>
                    </Row>
                    <Row style={{ alignItems: 'center', gap: '8px' }}>
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
                      <Text style={{ fontSize: '14px', color: 'var(--color-12)', marginLeft: '8px' }}>
                        Required
                      </Text>
                    </Row>
                  </Row>
                  {complianceSettings.umbrella.required && (
                    <Row style={{ flexWrap: 'wrap', gap: '16px' }}>
                      <Stack style={{ flex: 1, minWidth: '45%' }}>
                        <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px', display: 'block' }}>
                          Minimum Coverage
                        </Text>
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
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'var(--color-background)',
                            color: 'var(--color-12)',
                          }}
                        >
                          <option value={1000000}>$1,000,000</option>
                          <option value={5000000}>$5,000,000</option>
                          <option value={10000000}>$10,000,000</option>
                          <option value={25000000}>$25,000,000</option>
                        </select>
                      </Stack>
                    </Row>
                  )}
                </Card>
              </Stack>

              <Card style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--color-blue-2)', border: '1px solid var(--color-blue-6)', borderRadius: '8px' }}>
                <Row style={{ alignItems: 'flex-start', gap: '8px' }}>
                  <Info size={16} color="var(--color-blue-11)" style={{ marginTop: '2px' }} />
                  <Stack>
                    <Text style={{ fontSize: '14px', color: 'var(--color-blue-12)', fontWeight: 500 }}>
                      Default Settings
                    </Text>
                    <Text style={{ fontSize: '14px', color: 'var(--color-blue-11)' }}>
                      These settings will apply to all new contractors by
                      default. You can override them for specific projects or
                      contractors later.
                    </Text>
                  </Stack>
                </Row>
              </Card>
            </Stack>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <Stack style={{ padding: '32px' }}>
              <Stack style={{ marginBottom: '24px' }}>
                <H2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-12)', marginBottom: '8px' }}>
                  Confirmation & Setup Complete
                </H2>
                <Text style={{ color: 'var(--color-11)' }}>
                  Review your settings and complete the onboarding process
                </Text>
              </Stack>

              <Stack style={{ gap: '24px' }}>
                {/* Company Summary */}
                <Card style={{ backgroundColor: 'var(--color-background-hover)', borderRadius: '8px', padding: '24px' }}>
                  <H3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)', marginBottom: '16px' }}>
                    Company Information
                  </H3>
                  <Row style={{ flexWrap: 'wrap', gap: '16px' }}>
                    <Stack style={{ flex: 1, minWidth: '45%' }}>
                      <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>Company Name:</Text>
                      <Text style={{ fontSize: '14px', fontWeight: 500 }}>{companyInfo.companyName}</Text>
                    </Stack>
                    <Stack style={{ flex: 1, minWidth: '45%' }}>
                      <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>Company Size:</Text>
                      <Text style={{ fontSize: '14px', fontWeight: 500 }}>
                        {
                          companySizeOptions.find(
                            (opt) => opt.value === companyInfo.companySize
                          )?.label
                        }
                      </Text>
                    </Stack>
                    <Stack style={{ flex: 1, minWidth: '45%' }}>
                      <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>Industry:</Text>
                      <Text style={{ fontSize: '14px', fontWeight: 500 }}>
                        {
                          industryOptions.find(
                            (opt) => opt.value === companyInfo.industry
                          )?.label
                        }
                      </Text>
                    </Stack>
                    <Stack style={{ flex: 1, minWidth: '45%' }}>
                      <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                        Annual Revenue:
                      </Text>
                      <Text style={{ fontSize: '14px', fontWeight: 500 }}>
                        ${parseInt(companyInfo.annualRevenue).toLocaleString()}
                      </Text>
                    </Stack>
                  </Row>
                </Card>

                {/* Compliance Summary */}
                <Card style={{ backgroundColor: 'var(--color-background-hover)', borderRadius: '8px', padding: '24px' }}>
                  <H3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)', marginBottom: '16px' }}>
                    Default Compliance Requirements
                  </H3>
                  <Stack style={{ gap: '12px' }}>
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
                          <Row
                            key={key}
                            style={{
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px',
                              backgroundColor: 'var(--color-background)',
                              borderRadius: '8px',
                            }}
                          >
                            <Text style={{ fontWeight: 500 }}>
                              {titles[key as keyof typeof titles]}
                            </Text>
                            <Text style={{ color: 'var(--color-green-11)', fontWeight: 500 }}>
                              ${setting.minimumCoverage.toLocaleString()}{' '}
                              minimum
                            </Text>
                          </Row>
                        );
                      }
                    )}
                  </Stack>
                </Card>

                {/* Project-Specific Overrides */}
                <Card style={{ backgroundColor: 'var(--color-blue-2)', border: '1px solid var(--color-blue-6)', borderRadius: '8px', padding: '24px' }}>
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack>
                      <H3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)', marginBottom: '8px' }}>
                        Project-Specific Overrides
                      </H3>
                      <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                        Allow different insurance requirements for specific
                        projects when needed
                      </Text>
                    </Stack>
                    <Row style={{ alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={projectSpecificOverrides}
                        onChange={(e) =>
                          setProjectSpecificOverrides(e.target.checked)
                        }
                        style={{ borderRadius: '4px' }}
                      />
                      <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)', marginLeft: '8px' }}>
                        Enable
                      </Text>
                    </Row>
                  </Row>
                </Card>
              </Stack>
            </Stack>
          )}

          {/* Navigation */}
          <Row style={{ padding: '24px 32px', backgroundColor: 'var(--color-background-hover)', borderTop: '1px solid var(--color-border)', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              onPress={handlePrevious}
              disabled={currentStep === 1}
              style={{
                opacity: currentStep === 1 ? 0.5 : 1,
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                padding: '8px 24px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
              }}
            >
              <Row style={{ alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={16} />
                <Text>Previous</Text>
              </Row>
            </Button>

            <Row style={{ alignItems: 'center', gap: '8px' }}>
              {steps.map((step) => (
                <Stack
                  key={step.id}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: currentStep >= step.id ? 'var(--color-blue-10)' : 'var(--color-gray-8)',
                  }}
                />
              ))}
            </Row>

            {currentStep < 3 ? (
              <Button
                onPress={handleNext}
                disabled={
                  currentStep === 1 &&
                  (!companyInfo.companyName ||
                    !companyInfo.companySize ||
                    !companyInfo.annualRevenue ||
                    !companyInfo.location)
                }
                style={{
                  padding: '8px 24px',
                  backgroundColor: 'var(--color-blue-10)',
                  color: 'white',
                  borderRadius: '8px',
                  opacity:
                    currentStep === 1 &&
                    (!companyInfo.companyName ||
                      !companyInfo.companySize ||
                      !companyInfo.annualRevenue ||
                      !companyInfo.location)
                      ? 0.5
                      : 1,
                  cursor:
                    currentStep === 1 &&
                    (!companyInfo.companyName ||
                      !companyInfo.companySize ||
                      !companyInfo.annualRevenue ||
                      !companyInfo.location)
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                <Row style={{ alignItems: 'center', gap: '8px' }}>
                  <Text>Next</Text>
                  <ArrowRight size={16} />
                </Row>
              </Button>
            ) : (
              <Button
                onPress={handleFinish}
                style={{
                  padding: '8px 24px',
                  backgroundColor: 'var(--color-green-10)',
                  color: 'white',
                  borderRadius: '8px',
                }}
              >
                <Row style={{ alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} />
                  <Text>Complete Setup</Text>
                </Row>
              </Button>
            )}
          </Row>
        </Card>

        {/* Confirmation Modal */}
        {showConfirmationModal && (
          <Stack
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              alignItems: 'center',
              justifyContent: 'center',
              display: 'flex',
              zIndex: 50,
            }}
          >
            <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: 448 }}>
              <Stack style={{ alignItems: 'center' }}>
                <CheckCircle size={48} color="var(--color-green-11)" style={{ marginBottom: '16px' }} />
                <H3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)', marginBottom: '8px' }}>
                  Confirm Setup
                </H3>
                <Text style={{ color: 'var(--color-11)', marginBottom: '24px', textAlign: 'center' }}>
                  I confirm these settings will apply by default to all
                  contractors and projects. I can modify them later as needed.
                </Text>
                <Row style={{ gap: '12px', width: '100%' }}>
                  <Button
                    onPress={() => setShowConfirmationModal(false)}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={handleConfirmFinish}
                    style={{
                      flex: 1,
                      padding: '8px 16px',
                      backgroundColor: 'var(--color-green-10)',
                      color: 'white',
                      borderRadius: '8px',
                    }}
                  >
                    Confirm & Finish
                  </Button>
                </Row>
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
