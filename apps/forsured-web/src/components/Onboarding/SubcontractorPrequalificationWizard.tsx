import { useState, useRef, useEffect } from 'react';
import {
  Building,
  FileText,
  Shield,
  AlertTriangle,
  DollarSign,
  Briefcase,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Upload,
  Info,
  Search,
} from 'lucide-react';
import { YStack, XStack, Text, H1, H2, H3, Button, Card, Input, TextArea, Select, Checkbox, Spinner } from '@unicornlove/ui';
import ForsuredLogo from '../Common/ForsuredLogo';

interface PrequalificationWizardProps {
  invitationData?: {
    gcName: string;
    gcLogo?: string;
    customMessage?: string;
    customRequirements?: Record<string, unknown>;
    invitationId: string;
  };
  onComplete: (data: PrequalificationData) => void;
  onSkip?: () => void;
}

export interface PrequalificationData {
  companyInfo: CompanyInfo;
  licensingInfo: LicensingInfo;
  insuranceInfo: InsuranceInfo;
  safetyInfo: SafetyInfo;
  financialInfo: FinancialInfo;
  tradeCapabilities: TradeCapabilities;
  acknowledgments: Acknowledgments;
}

interface CompanyInfo {
  companyName: string;
  dba?: string;
  federalTaxId: string;
  primaryAddress: string;
  mailingAddress?: string;
  websiteUrl?: string;
  businessType: string;
  yearsInBusiness: number;
  primaryContactName: string;
  primaryContactTitle: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}

interface LicensingInfo {
  licenseNumber: string;
  licenseClassification: string;
  issuingState: string;
  licenseExpiration: string;
  businessLicenseFile?: string;
  certifications: string[];
}

interface InsuranceInfo {
  w9File?: string;
  coiFile?: string;
  endorsementFiles?: string[];
  workersCompFile?: string;
  generalLiabilityCoverage: number;
  autoLiabilityCoverage: number;
  umbrellaCoverage?: number;
  insuranceCarrier: string;
  policyExpiration: string;
  sdsFiles?: string[];
  iippFile?: string;
  oshaRecordables?: string;
  emrRating?: number;
}

interface SafetyInfo {
  safetyManagerName: string;
  safetyManagerEmail: string;
  hasWrittenSafetyProgram: boolean;
  hasJobsiteOrientation: boolean;
  hasDrugFreePolicy: boolean;
  oshaViolations?: string;
}

interface FinancialInfo {
  annualRevenueRange?: string;
  bondingCapacity?: string;
  bondingCompany?: string;
  bankReference?: string;
  tradeReferences?: Array<{
    gcName: string;
    contactName: string;
    contactEmail: string;
    projectValue: number;
  }>;
  currentBacklog?: number;
  fullTimeEmployees?: number;
}

interface TradeCapabilities {
  primaryTrades: string[];
  geographicCoverage: string[];
  typicalProjectSize?: string;
  laborClassification?: string;
  prevailingWageExperience: boolean;
  specialEquipment?: string;
  recentProjects?: Array<{
    gcName: string;
    projectName: string;
    contractValue: number;
    completionDate: string;
  }>;
}

interface Acknowledgments {
  accuracyAffirmation: boolean;
  complianceAgreement: boolean;
  digitalSignature: string;
  signatureDate: string;
}

const STEPS = [
  {
    id: 1,
    title: 'Company Info',
    icon: Building,
    description: 'Basic company information',
  },
  {
    id: 2,
    title: 'Licensing',
    icon: FileText,
    description: 'Licenses and registrations',
  },
  {
    id: 3,
    title: 'Insurance',
    icon: Shield,
    description: 'Insurance coverage details',
  },
  {
    id: 4,
    title: 'Safety',
    icon: AlertTriangle,
    description: 'Safety programs and records',
  },
  {
    id: 5,
    title: 'Financial',
    icon: DollarSign,
    description: 'Financial capacity (optional)',
  },
  {
    id: 6,
    title: 'Capabilities',
    icon: Briefcase,
    description: 'Trade capabilities and experience',
  },
  {
    id: 7,
    title: 'Review',
    icon: CheckCircle,
    description: 'Review and submit',
  },
];

export default function SubcontractorPrequalificationWizard({
  invitationData,
  onComplete,
  onSkip,
}: PrequalificationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PrequalificationData>({
    companyInfo: {
      companyName: '',
      federalTaxId: '',
      primaryAddress: '',
      businessType: '',
      yearsInBusiness: 0,
      primaryContactName: '',
      primaryContactTitle: '',
      primaryContactEmail: '',
      primaryContactPhone: '',
    },
    licensingInfo: {
      licenseNumber: '',
      licenseClassification: '',
      issuingState: '',
      licenseExpiration: '',
      certifications: [],
    },
    insuranceInfo: {
      generalLiabilityCoverage: 0,
      autoLiabilityCoverage: 0,
      insuranceCarrier: '',
      policyExpiration: '',
    },
    safetyInfo: {
      safetyManagerName: '',
      safetyManagerEmail: '',
      hasWrittenSafetyProgram: false,
      hasJobsiteOrientation: false,
      hasDrugFreePolicy: false,
    },
    financialInfo: {},
    tradeCapabilities: {
      primaryTrades: [],
      geographicCoverage: [],
      prevailingWageExperience: false,
    },
    acknowledgments: {
      accuracyAffirmation: false,
      complianceAgreement: false,
      digitalSignature: '',
      signatureDate: new Date().toISOString(),
    },
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onComplete(formData);
  };

  const isStepValid = (step: number): boolean => {
    return true;
  };

  return (
    <YStack minHeight="100vh" backgroundColor="$background" paddingVertical="$8">
      <YStack maxWidth={1280} width="100%" marginHorizontal="auto" paddingHorizontal="$4" $gtSm={{ paddingHorizontal: '$6' }} $gtLg={{ paddingHorizontal: '$8' }}>
        {onSkip && (
          <Button
            position="absolute"
            top="$6"
            right="$6"
            variant="ghost"
            onPress={onSkip}
            color="$color11"
            hoverStyle={{ color: '$color12' }}
          >
            <XStack gap="$2" alignItems="center">
              <Text>Skip for now</Text>
            <X size={18} />
            </XStack>
          </Button>
        )}

        <YStack alignItems="center" marginBottom="$8">
          <XStack justifyContent="center" marginBottom="$6">
            <ForsuredLogo className="h-8" />
          </XStack>
          {invitationData ? (
            <YStack alignItems="center">
              <H1 fontSize="$9" fontWeight="700" color="$color12" marginBottom="$2">
                Subcontractor Prequalification
              </H1>
              <Text fontSize="$6" color="$color11" marginBottom="$4">
                Complete your prequalification for {invitationData.gcName}
              </Text>
              {invitationData.customMessage && (
                <Card backgroundColor="$blue2" borderWidth={1} borderColor="$blue6" borderRadius="$4" padding="$4" maxWidth={672} width="100%" marginHorizontal="auto">
                  <Text fontSize="$3" color="$blue11">
                    {invitationData.customMessage}
                  </Text>
                </Card>
              )}
            </YStack>
          ) : (
            <YStack alignItems="center">
              <H1 fontSize="$9" fontWeight="700" color="$color12" marginBottom="$2">
                Complete Your Profile
              </H1>
              <Text fontSize="$6" color="$color11">
                Provide your company information to get prequalified
              </Text>
            </YStack>
          )}
        </YStack>

        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6" marginBottom="$8">
          <XStack alignItems="center" justifyContent="space-between" overflowX="auto">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isValid = isStepValid(step.id);

              return (
                <XStack key={step.id} alignItems="center" minWidth={0}>
                  <YStack alignItems="center">
                    <YStack
                      width={48}
                      height={48}
                      borderRadius={9999}
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor={
                        isCompleted
                          ? '$green10'
                          : isActive
                            ? '$blue10'
                            : '$backgroundHover'
                      }
                      color={isCompleted || isActive ? 'white' : '$color11'}
                    >
                      {isCompleted ? (
                        <CheckCircle size={20} />
                      ) : (
                        <Icon size={20} />
                      )}
                    </YStack>
                    <YStack marginTop="$2" alignItems="center" minWidth={0}>
                      <Text
                        fontSize="$1"
                        fontWeight="500"
                        numberOfLines={1}
                        color={isActive ? '$color12' : '$color11'}
                      >
                        {step.title}
                      </Text>
                    </YStack>
                  </YStack>
                  {index < STEPS.length - 1 && (
                    <YStack width={32} height={2} backgroundColor="$borderColor" marginHorizontal="$2" flexShrink={0} />
                  )}
                </XStack>
              );
            })}
          </XStack>
        </Card>

        <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor">
          <YStack padding="$8">
            {currentStep === 1 && (
              <CompanyInfoStep
                data={formData.companyInfo}
                onChange={(data) =>
                  setFormData({ ...formData, companyInfo: data })
                }
              />
            )}
            {currentStep === 2 && (
              <LicensingInfoStep
                data={formData.licensingInfo}
                onChange={(data) =>
                  setFormData({ ...formData, licensingInfo: data })
                }
              />
            )}
            {currentStep === 3 && (
              <InsuranceInfoStep
                data={formData.insuranceInfo}
                onChange={(data) =>
                  setFormData({ ...formData, insuranceInfo: data })
                }
                requirements={invitationData?.customRequirements}
              />
            )}
            {currentStep === 4 && (
              <SafetyInfoStep
                data={formData.safetyInfo}
                onChange={(data) =>
                  setFormData({ ...formData, safetyInfo: data })
                }
              />
            )}
            {currentStep === 5 && (
              <FinancialInfoStep
                data={formData.financialInfo}
                onChange={(data) =>
                  setFormData({ ...formData, financialInfo: data })
                }
              />
            )}
            {currentStep === 6 && (
              <TradeCapabilitiesStep
                data={formData.tradeCapabilities}
                onChange={(data) =>
                  setFormData({ ...formData, tradeCapabilities: data })
                }
              />
            )}
            {currentStep === 7 && (
              <ReviewStep
                data={formData}
                onChange={(acknowledgments) =>
                  setFormData({ ...formData, acknowledgments })
                }
              />
            )}
          </YStack>

          <XStack paddingHorizontal="$8" paddingVertical="$6" backgroundColor="$backgroundHover" borderTopWidth={1} borderColor="$borderColor" alignItems="center" justifyContent="space-between">
            <Button
              onPress={handlePrevious}
              disabled={currentStep === 1}
              variant="ghost"
              color={currentStep === 1 ? '$color10' : '$color12'}
              disabledStyle={{ color: '$color10', cursor: 'not-allowed' }}
              hoverStyle={currentStep === 1 ? undefined : { backgroundColor: '$backgroundHover' }}
            >
              <XStack gap="$2" alignItems="center">
              <ArrowLeft size={16} />
                <Text>Previous</Text>
              </XStack>
            </Button>

            <XStack gap="$2" alignItems="center">
              {STEPS.map((step) => (
                <YStack
                  key={step.id}
                  width={8}
                  height={8}
                  borderRadius={9999}
                  backgroundColor={currentStep >= step.id ? '$blue10' : '$gray8'}
                />
              ))}
            </XStack>

            {currentStep < STEPS.length ? (
              <Button
                onPress={handleNext}
                disabled={!isStepValid(currentStep)}
                backgroundColor="$blue10"
                color="white"
                hoverStyle={{ backgroundColor: '$blue11' }}
                disabledStyle={{ backgroundColor: '$gray8', cursor: 'not-allowed' }}
              >
                <XStack gap="$2" alignItems="center">
                  <Text>Next</Text>
                <ArrowRight size={16} />
                </XStack>
              </Button>
            ) : (
              <Button
                onPress={handleSubmit}
                disabled={!isStepValid(currentStep)}
                backgroundColor="$green10"
                color="white"
                hoverStyle={{ backgroundColor: '$green11' }}
                disabledStyle={{ backgroundColor: '$gray8', cursor: 'not-allowed' }}
              >
                <XStack gap="$2" alignItems="center">
                <CheckCircle size={16} />
                  <Text>Submit</Text>
                </XStack>
              </Button>
            )}
          </XStack>
        </Card>
      </YStack>
    </YStack>
  );
}

function CertificationSearchSelect({
  selectedCertifications,
  onChange,
}: {
  selectedCertifications: string[];
  onChange: (certifications: string[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableCertifications = [
    'OSHA 10',
    'OSHA 30',
    'OSHA 40',
    'LEED AP',
    'LEED Green Associate',
    'First Aid/CPR',
    'AED Certification',
    'Confined Space Entry',
    'Forklift Operator',
    'Crane Operator',
    'Scaffold Competent Person',
    'Fall Protection Competent Person',
    'Rigging',
    'Welding Certification (AWS)',
    'Electrical License',
    'Plumbing License',
    'HVAC License',
    'Asbestos Awareness',
    'Lead-Safe Certified',
    'Hazmat Transportation',
    'DOT Medical Card',
    'Boom Lift/Scissor Lift',
    'Safety Director',
    'PMP (Project Management Professional)',
    'Six Sigma',
    'Lean Construction',
    'BIM (Building Information Modeling)',
    'AutoCAD Certified',
    'CPR/AED Instructor',
    'Fire Watch',
    'Hot Work Permit',
  ];

  const filteredCertifications = availableCertifications.filter(
    (cert) =>
      cert.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedCertifications.includes(cert)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddCertification = (cert: string) => {
    onChange([...selectedCertifications, cert]);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleRemoveCertification = (cert: string) => {
    onChange(selectedCertifications.filter((c) => c !== cert));
  };

  return (
    <YStack position="relative" ref={dropdownRef}>
      <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$3" minHeight={100}>
        <XStack flexWrap="wrap" gap="$2" marginBottom="$2">
          {selectedCertifications.map((cert) => (
            <XStack
              key={cert}
              alignItems="center"
              gap="$1"
              backgroundColor="$blue2"
              color="$blue11"
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius={9999}
            >
              <Text fontSize="$3">{cert}</Text>
              <Button
                type="button"
                onPress={() => handleRemoveCertification(cert)}
                variant="ghost"
                size="$1"
                hoverStyle={{ color: '$blue12' }}
              >
                <X size={14} />
              </Button>
            </XStack>
          ))}
        </XStack>

        <YStack position="relative">
          <XStack alignItems="center" gap="$2" borderWidth={1} borderColor="$borderColor" borderRadius="$4" paddingHorizontal="$3" paddingVertical="$2" backgroundColor="$background">
            <Search size={16} color="$color11" />
            <Input
              type="text"
              placeholder="Search certifications..."
              flex={1}
              fontSize="$3"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
          </XStack>

          {isOpen && filteredCertifications.length > 0 && (
            <Card
              position="absolute"
              zIndex={10}
              width="100%"
              marginTop="$1"
              backgroundColor="$background"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              elevation={4}
              maxHeight={240}
              overflow="hidden"
            >
              <YStack maxHeight={240} overflowY="auto">
              {filteredCertifications.map((cert) => (
                  <Button
                  key={cert}
                  type="button"
                    onPress={() => handleAddCertification(cert)}
                    variant="ghost"
                    width="100%"
                    alignItems="flex-start"
                    paddingHorizontal="$4"
                    paddingVertical="$2"
                    hoverStyle={{ backgroundColor: '$backgroundHover' }}
                  >
                    <Text fontSize="$3" color="$color12">
                  {cert}
                    </Text>
                  </Button>
                ))}
              </YStack>
            </Card>
          )}
        </YStack>
      </Card>
      <Text fontSize="$1" color="$color11" marginTop="$1">
        Search and select your certifications. Click the X to remove.
      </Text>
    </YStack>
  );
}

function CompanyInfoStep({
  data,
  onChange,
}: {
  data: CompanyInfo;
  onChange: (data: CompanyInfo) => void;
}) {
  return (
    <YStack gap="$6">
      <YStack>
        <H2 fontSize="$8" fontWeight="700" color="$color12" marginBottom="$2">
          Company Information
        </H2>
        <Text color="$color11">
          Tell us about your construction business
        </Text>
      </YStack>

      <XStack flexWrap="wrap" gap="$6">
        <YStack width="100%" $gtMd={{ width: '100%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Company Name <Text color="$red10">*</Text>
          </Text>
          <Input
            type="text"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Legal company name"
            value={data.companyName}
            onChange={(e) => onChange({ ...data, companyName: e.target.value as string })}
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            DBA (if applicable)
          </Text>
          <Input
            type="text"
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Doing business as"
            value={data.dba || ''}
            onChange={(e) => onChange({ ...data, dba: e.target.value })}
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Federal Tax ID / EIN <Text color="$red10">*</Text>
          </Text>
          <Input
            type="text"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="XX-XXXXXXX"
            value={data.federalTaxId}
            onChange={(e) =>
              onChange({ ...data, federalTaxId: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '100%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Primary Address <Text color="$red10">*</Text>
          </Text>
          <Input
            type="text"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Street address, city, state, zip"
            value={data.primaryAddress}
            onChange={(e) =>
              onChange({ ...data, primaryAddress: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '100%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Mailing Address (if different)
          </Text>
          <Input
            type="text"
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Street address, city, state, zip"
            value={data.mailingAddress || ''}
            onChange={(e) =>
              onChange({ ...data, mailingAddress: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Website URL
          </Text>
          <Input
            type="url"
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="https://example.com"
            value={data.websiteUrl || ''}
            onChange={(e) => onChange({ ...data, websiteUrl: e.target.value })}
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Select
            required
            label="Business Type"
            value={data.businessType}
            onValueChange={(value) =>
              onChange({ ...data, businessType: value })
            }
            options={[
              { value: '', label: 'Select type' },
              { value: 'corporation', label: 'Corporation' },
              { value: 'llc', label: 'LLC' },
              { value: 'sole_proprietor', label: 'Sole Proprietor' },
              { value: 'partnership', label: 'Partnership' },
            ]}
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Years in Business <Text color="$red10">*</Text>
          </Text>
          <Input
            type="number"
            required
            min={0}
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="0"
            value={data.yearsInBusiness?.toString() || ''}
            onChange={(e) =>
              onChange({
                ...data,
                yearsInBusiness: parseInt(e.target.value) || 0,
              })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Primary Contact Name <Text color="$red10">*</Text>
          </Text>
          <Input
            type="text"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Full name"
            value={data.primaryContactName}
            onChange={(e) =>
              onChange({ ...data, primaryContactName: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Primary Contact Title <Text color="$red10">*</Text>
          </Text>
          <Input
            type="text"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Job title"
            value={data.primaryContactTitle}
            onChange={(e) =>
              onChange({ ...data, primaryContactTitle: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Primary Contact Email <Text color="$red10">*</Text>
          </Text>
          <Input
            type="email"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="email@example.com"
            value={data.primaryContactEmail}
            onChange={(e) =>
              onChange({ ...data, primaryContactEmail: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Primary Contact Phone <Text color="$red10">*</Text>
          </Text>
          <Input
            type="tel"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="(555) 123-4567"
            value={data.primaryContactPhone}
            onChange={(e) =>
              onChange({ ...data, primaryContactPhone: e.target.value })
            }
          />
        </YStack>
      </XStack>
    </YStack>
  );
}

function LicensingInfoStep({
  data,
  onChange,
}: {
  data: LicensingInfo;
  onChange: (data: LicensingInfo) => void;
}) {
  return (
    <YStack gap="$6">
      <YStack>
        <H2 fontSize="$8" fontWeight="700" color="$color12" marginBottom="$2">
          Licensing and Registration
        </H2>
        <Text color="$color11">
          Provide your license and certification details
        </Text>
      </YStack>

      <XStack flexWrap="wrap" gap="$6">
        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            State Contractor License Number{' '}
            <Text color="$red10">*</Text>
          </Text>
          <Input
            type="text"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="License number"
            value={data.licenseNumber}
            onChange={(e) =>
              onChange({ ...data, licenseNumber: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            License Classification / Trade{' '}
            <Text color="$red10">*</Text>
          </Text>
          <Input
            type="text"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="e.g., C-10 Electrical"
            value={data.licenseClassification}
            onChange={(e) =>
              onChange({ ...data, licenseClassification: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Select
            required
            label="Issuing State"
            value={data.issuingState}
            onValueChange={(value) =>
              onChange({ ...data, issuingState: value })
            }
            options={[
              { value: '', label: 'Select state' },
              { value: 'CA', label: 'California' },
              { value: 'TX', label: 'Texas' },
              { value: 'FL', label: 'Florida' },
              { value: 'NY', label: 'New York' },
            ]}
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            License Expiration Date <Text color="$red10">*</Text>
          </Text>
          <Input
            type="date"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            value={data.licenseExpiration}
            onChange={(e) =>
              onChange({ ...data, licenseExpiration: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '100%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Business License File
          </Text>
          <Card borderWidth={2} borderStyle="dashed" borderColor="$borderColor" borderRadius="$4" padding="$6" alignItems="center">
            <Upload color="$color11" marginBottom="$2" size={32} />
            <Text fontSize="$3" color="$color11" marginBottom="$2">
              Drag and drop or click to upload
            </Text>
            <Button variant="outline" size="sm">
              Choose File
            </Button>
          </Card>
        </YStack>

        <YStack width="100%" $gtMd={{ width: '100%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Professional / Trade Certifications
          </Text>
          <CertificationSearchSelect
            selectedCertifications={data.certifications}
            onChange={(certs) => onChange({ ...data, certifications: certs })}
          />
        </YStack>
      </XStack>
    </YStack>
  );
}

function InsuranceInfoStep({
  data,
  onChange,
  requirements,
}: {
  data: InsuranceInfo;
  onChange: (data: InsuranceInfo) => void;
  requirements?: Record<string, unknown>;
}) {
  return (
    <YStack gap="$6">
      <YStack>
        <H2 fontSize="$8" fontWeight="700" color="$color12" marginBottom="$2">
          Insurance and Compliance
        </H2>
        <Text color="$color11">
          Upload insurance documents and coverage details
        </Text>
      </YStack>

      {requirements && (
        <Card backgroundColor="$blue2" borderWidth={1} borderColor="$blue6" borderRadius="$4" padding="$4">
          <XStack alignItems="flex-start" gap="$2">
            <Info color="$blue10" marginTop={2} flexShrink={0} size={16} />
            <YStack>
              <Text fontSize="$3" fontWeight="500" color="$blue11">
                Required Coverage
              </Text>
              <Text fontSize="$3" color="$blue11">
                Your GC requires minimum coverage amounts. Make sure your
                policies meet these requirements.
              </Text>
            </YStack>
          </XStack>
        </Card>
      )}

      <XStack flexWrap="wrap" gap="$6">
        <YStack width="100%" $gtMd={{ width: '100%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            W-9 Form <Text color="$red10">*</Text>
          </Text>
          <Card borderWidth={2} borderStyle="dashed" borderColor="$borderColor" borderRadius="$4" padding="$6" alignItems="center">
            <Upload color="$color11" marginBottom="$2" size={32} />
            <Text fontSize="$3" color="$color11" marginBottom="$2">
              Upload current W-9 form
            </Text>
            <Button variant="outline" size="sm">
              Choose File
            </Button>
          </Card>
        </YStack>

        <YStack width="100%" $gtMd={{ width: '100%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Certificate of Insurance (COI){' '}
            <Text color="$red10">*</Text>
          </Text>
          <Card borderWidth={2} borderStyle="dashed" borderColor="$borderColor" borderRadius="$4" padding="$6" alignItems="center">
            <Upload color="$color11" marginBottom="$2" size={32} />
            <Text fontSize="$3" color="$color11" marginBottom="$2">
              Upload current COI
            </Text>
            <Button variant="outline" size="sm">
              Choose File
            </Button>
          </Card>
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }} position="relative">
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            General Liability Coverage <Text color="$red10">*</Text>
          </Text>
          <XStack position="relative" width="100%">
            <Text position="absolute" left="$3" top="50%" transform="translateY(-50%)" color="$color10" zIndex={1}>
              $
            </Text>
            <Input
              type="number"
              required
              min={0}
              width="100%"
              paddingLeft="$8"
              paddingRight="$4"
              paddingVertical="$3"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              placeholder="0"
              value={data.generalLiabilityCoverage?.toString() || ''}
              onChange={(e) =>
                onChange({
                  ...data,
                  generalLiabilityCoverage: parseInt(e.target.value) || 0,
                })
              }
            />
          </XStack>
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }} position="relative">
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Auto Liability Coverage <Text color="$red10">*</Text>
          </Text>
          <XStack position="relative" width="100%">
            <Text position="absolute" left="$3" top="50%" transform="translateY(-50%)" color="$color10" zIndex={1}>
              $
            </Text>
            <Input
              type="number"
              required
              min={0}
              width="100%"
              paddingLeft="$8"
              paddingRight="$4"
              paddingVertical="$3"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              placeholder="0"
              value={data.autoLiabilityCoverage?.toString() || ''}
              onChange={(e) =>
                onChange({
                  ...data,
                  autoLiabilityCoverage: parseInt(e.target.value) || 0,
                })
              }
            />
          </XStack>
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Insurance Carrier <Text color="$red10">*</Text>
          </Text>
          <Input
            type="text"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Carrier name"
            value={data.insuranceCarrier}
            onChange={(e) =>
              onChange({ ...data, insuranceCarrier: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Policy Expiration Date <Text color="$red10">*</Text>
          </Text>
          <Input
            type="date"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            value={data.policyExpiration}
            onChange={(e) =>
              onChange({ ...data, policyExpiration: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            EMR Rating (Experience Modification Rate)
          </Text>
          <Input
            type="number"
            step={0.01}
            min={0}
            max={2}
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="1.00"
            value={data.emrRating?.toString() || ''}
            onChange={(e) =>
              onChange({
                ...data,
                emrRating: parseFloat(e.target.value) || undefined,
              })
            }
          />
        </YStack>
      </XStack>
    </YStack>
  );
}

function SafetyInfoStep({
  data,
  onChange,
}: {
  data: SafetyInfo;
  onChange: (data: SafetyInfo) => void;
}) {
  return (
    <YStack gap="$6">
      <YStack>
        <H2 fontSize="$8" fontWeight="700" color="$color12" marginBottom="$2">
          Safety and Risk Management
        </H2>
        <Text color="$color11">
          Provide safety program and contact information
        </Text>
      </YStack>

      <XStack flexWrap="wrap" gap="$6">
        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Safety Manager Name <Text color="$red10">*</Text>
          </Text>
          <Input
            type="text"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Full name"
            value={data.safetyManagerName}
            onChange={(e) =>
              onChange({ ...data, safetyManagerName: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Safety Manager Email <Text color="$red10">*</Text>
          </Text>
          <Input
            type="email"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="email@example.com"
            value={data.safetyManagerEmail}
            onChange={(e) =>
              onChange({ ...data, safetyManagerEmail: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '100%' }}>
          <YStack gap="$3">
            <XStack alignItems="center" gap="$3">
              <Checkbox
                checked={data.hasWrittenSafetyProgram}
                onCheckedChange={(checked) =>
                  onChange({
                    ...data,
                    hasWrittenSafetyProgram: checked === true,
                  })
                }
              />
              <Text fontSize="$3" color="$color12">
                We have a written safety program
              </Text>
            </XStack>

            <XStack alignItems="center" gap="$3">
              <Checkbox
                checked={data.hasJobsiteOrientation}
                onCheckedChange={(checked) =>
                  onChange({ ...data, hasJobsiteOrientation: checked === true })
                }
              />
              <Text fontSize="$3" color="$color12">
                We conduct jobsite orientation programs
              </Text>
            </XStack>

            <XStack alignItems="center" gap="$3">
              <Checkbox
                checked={data.hasDrugFreePolicy}
                onCheckedChange={(checked) =>
                  onChange({ ...data, hasDrugFreePolicy: checked === true })
                }
              />
              <Text fontSize="$3" color="$color12">
                We maintain a drug-free workplace policy
              </Text>
            </XStack>
          </YStack>
        </YStack>

        <YStack width="100%" $gtMd={{ width: '100%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            OSHA Violations (if any)
          </Text>
          <TextArea
            rows={4}
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Describe any OSHA violations in the last 3 years"
            value={data.oshaViolations || ''}
            onChange={(e) =>
              onChange({ ...data, oshaViolations: e.target.value })
            }
          />
        </YStack>
      </XStack>
    </YStack>
  );
}

function FinancialInfoStep({
  data,
  onChange,
}: {
  data: FinancialInfo;
  onChange: (data: FinancialInfo) => void;
}) {
  return (
    <YStack gap="$6">
      <YStack>
        <H2 fontSize="$8" fontWeight="700" color="$color12" marginBottom="$2">
          Financial and Capacity Information
        </H2>
        <Text color="$color11">
          Optional financial details (helps with prequalification)
        </Text>
      </YStack>

      <Card backgroundColor="$yellow2" borderWidth={1} borderColor="$yellow6" borderRadius="$4" padding="$4">
        <Text fontSize="$3" color="$yellow11">
          All fields on this page are optional but providing this information
          can improve your prequalification score.
        </Text>
      </Card>

      <XStack flexWrap="wrap" gap="$6">
        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Select
            label="Annual Revenue Range"
            value={data.annualRevenueRange || ''}
            onValueChange={(value) =>
              onChange({ ...data, annualRevenueRange: value })
            }
            options={[
              { value: '', label: 'Select range' },
              { value: '<500k', label: 'Under $500k' },
              { value: '500k-1m', label: '$500k - $1M' },
              { value: '1m-5m', label: '$1M - $5M' },
              { value: '5m-10m', label: '$5M - $10M' },
              { value: '10m+', label: '$10M+' },
            ]}
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Number of Full-Time Employees
          </Text>
          <Input
            type="number"
            min={0}
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="0"
            value={data.fullTimeEmployees?.toString() || ''}
            onChange={(e) =>
              onChange({
                ...data,
                fullTimeEmployees: parseInt(e.target.value) || undefined,
              })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Bonding Capacity
          </Text>
          <Input
            type="text"
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Single project and aggregate limits"
            value={data.bondingCapacity || ''}
            onChange={(e) =>
              onChange({ ...data, bondingCapacity: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '50%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Bonding Company
          </Text>
          <Input
            type="text"
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Surety company name"
            value={data.bondingCompany || ''}
            onChange={(e) =>
              onChange({ ...data, bondingCompany: e.target.value })
            }
          />
        </YStack>

        <YStack width="100%" $gtMd={{ width: '100%' }}>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Bank Reference
          </Text>
          <Input
            type="text"
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Institution name and contact"
            value={data.bankReference || ''}
            onChange={(e) =>
              onChange({ ...data, bankReference: e.target.value })
            }
          />
        </YStack>
      </XStack>
    </YStack>
  );
}

function TradeCapabilitiesStep({
  data,
  onChange,
}: {
  data: TradeCapabilities;
  onChange: (data: TradeCapabilities) => void;
}) {
  const trades = [
    'Electrical',
    'Plumbing',
    'HVAC',
    'Framing',
    'Concrete',
    'Roofing',
    'Painting',
    'Drywall',
    'Flooring',
    'Landscaping',
  ];

  return (
    <YStack gap="$6">
      <YStack>
        <H2 fontSize="$8" fontWeight="700" color="$color12" marginBottom="$2">
          Trade Capabilities and Experience
        </H2>
        <Text color="$color11">
          Describe your trades and project experience
        </Text>
      </YStack>

      <YStack gap="$6">
        <YStack>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Primary Trades / Scopes <Text color="$red10">*</Text>
          </Text>
          <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$4">
            <XStack flexWrap="wrap" gap="$3" $gtMd={{ flexDirection: 'row' }}>
              {trades.map((trade) => (
                <XStack key={trade} alignItems="center" gap="$2" width="100%" $gtMd={{ width: '33%' }}>
                  <Checkbox
                    checked={data.primaryTrades.includes(trade)}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        onChange({
                          ...data,
                          primaryTrades: [...data.primaryTrades, trade],
                        });
                      } else {
                        onChange({
                          ...data,
                          primaryTrades: data.primaryTrades.filter(
                            (t) => t !== trade
                          ),
                        });
                      }
                    }}
                  />
                  <Text fontSize="$3" color="$color12">{trade}</Text>
                </XStack>
              ))}
            </XStack>
          </Card>
        </YStack>

        <YStack>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Geographic Coverage Area
          </Text>
          <Input
            type="text"
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Counties or states (e.g., Los Angeles County, Orange County)"
            value={data.geographicCoverage.join(', ')}
            onChange={(e) =>
              onChange({
                ...data,
                geographicCoverage: e.target.value
                  .split(',')
                  .map((s) => s.trim()),
              })
            }
          />
        </YStack>

        <XStack flexWrap="wrap" gap="$6">
          <YStack width="100%" $gtMd={{ width: '50%' }}>
            <Select
              label="Typical Project Size"
              value={data.typicalProjectSize || ''}
              onValueChange={(value) =>
                onChange({ ...data, typicalProjectSize: value })
              }
              options={[
                { value: '', label: 'Select size' },
                { value: '<50k', label: 'Under $50k' },
                { value: '50k-250k', label: '$50k - $250k' },
                { value: '250k-1m', label: '$250k - $1M' },
                { value: '1m+', label: '$1M+' },
              ]}
            />
          </YStack>

          <YStack width="100%" $gtMd={{ width: '50%' }}>
            <Select
              label="Labor Classification"
              value={data.laborClassification || ''}
              onValueChange={(value) =>
                onChange({ ...data, laborClassification: value })
              }
              options={[
                { value: '', label: 'Select classification' },
                { value: 'union', label: 'Union' },
                { value: 'non-union', label: 'Non-Union' },
              ]}
            />
          </YStack>
        </XStack>

        <YStack>
          <XStack alignItems="center" gap="$3">
            <Checkbox
              checked={data.prevailingWageExperience}
              onCheckedChange={(checked) =>
                onChange({
                  ...data,
                  prevailingWageExperience: checked === true,
                })
              }
            />
            <Text fontSize="$3" color="$color12">
              We have prevailing wage experience
            </Text>
          </XStack>
        </YStack>

        <YStack>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Special Equipment or Certifications
          </Text>
          <TextArea
            rows={3}
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Describe any special equipment, cranes, welding certifications, etc."
            value={data.specialEquipment || ''}
            onChange={(e) =>
              onChange({ ...data, specialEquipment: e.target.value })
            }
          />
        </YStack>
      </YStack>
    </YStack>
  );
}

function ReviewStep({
  data,
  onChange,
}: {
  data: PrequalificationData;
  onChange: (acknowledgments: Acknowledgments) => void;
}) {
  return (
    <YStack gap="$6">
      <YStack>
        <H2 fontSize="$8" fontWeight="700" color="$color12" marginBottom="$2">
          Review and Submit
        </H2>
        <Text color="$color11">
          Review your information and acknowledge compliance
        </Text>
      </YStack>

      <Card backgroundColor="$backgroundHover" borderRadius="$4" padding="$6" gap="$4">
        <H3 fontSize="$6" fontWeight="600" color="$color12">
          Application Summary
        </H3>

        <XStack flexWrap="wrap" gap="$4">
          <YStack width="100%" $gtMd={{ width: '50%' }}>
            <Text fontSize="$3" color="$color11">Company Name</Text>
            <Text fontWeight="500" color="$color12">
              {data.companyInfo.companyName}
            </Text>
          </YStack>
          <YStack width="100%" $gtMd={{ width: '50%' }}>
            <Text fontSize="$3" color="$color11">Primary Trade</Text>
            <Text fontWeight="500" color="$color12">
              {data.tradeCapabilities.primaryTrades.join(', ') ||
                'None selected'}
            </Text>
          </YStack>
          <YStack width="100%" $gtMd={{ width: '50%' }}>
            <Text fontSize="$3" color="$color11">License Number</Text>
            <Text fontWeight="500" color="$color12">
              {data.licensingInfo.licenseNumber}
            </Text>
          </YStack>
          <YStack width="100%" $gtMd={{ width: '50%' }}>
            <Text fontSize="$3" color="$color11">Years in Business</Text>
            <Text fontWeight="500" color="$color12">
              {data.companyInfo.yearsInBusiness} years
            </Text>
          </YStack>
        </XStack>
      </Card>

      <YStack gap="$4">
        <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$4">
          <XStack alignItems="flex-start" gap="$3">
            <Checkbox
              checked={data.acknowledgments.accuracyAffirmation}
              onCheckedChange={(checked) =>
                onChange({
                  ...data.acknowledgments,
                  accuracyAffirmation: checked === true,
                })
              }
              marginTop="$1"
            />
            <YStack>
              <Text fontSize="$3" fontWeight="500" color="$color12">
                Affirmation of Accuracy{' '}
                <Text color="$red10">*</Text>
              </Text>
              <Text fontSize="$1" color="$color11" marginTop="$1">
                I certify that all information provided in this application is
                true and accurate to the best of my knowledge.
              </Text>
            </YStack>
          </XStack>
        </Card>

        <Card borderWidth={1} borderColor="$borderColor" borderRadius="$4" padding="$4">
          <XStack alignItems="flex-start" gap="$3">
            <Checkbox
              checked={data.acknowledgments.complianceAgreement}
              onCheckedChange={(checked) =>
                onChange({
                  ...data.acknowledgments,
                  complianceAgreement: checked === true,
                })
              }
              marginTop="$1"
            />
            <YStack>
              <Text fontSize="$3" fontWeight="500" color="$color12">
                Agreement to Compliance Requirements{' '}
                <Text color="$red10">*</Text>
              </Text>
              <Text fontSize="$1" color="$color11" marginTop="$1">
                I agree to comply with all insurance, safety, and policy
                requirements established by the General Contractor.
              </Text>
            </YStack>
          </XStack>
        </Card>

        <YStack>
          <Text fontSize="$3" fontWeight="500" color="$color12" marginBottom="$2" display="block">
            Digital Signature <Text color="$red10">*</Text>
          </Text>
          <Input
            type="text"
            required
            width="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingVertical="$3"
            placeholder="Type your full name to sign"
            value={data.acknowledgments.digitalSignature}
            onChange={(e) =>
              onChange({
                ...data.acknowledgments,
                digitalSignature: e.target.value,
              })
            }
          />
          <Text fontSize="$1" color="$color11" marginTop="$1">
            By typing your name, you are providing a legal digital signature
          </Text>
        </YStack>
      </YStack>
    </YStack>
  );
}
