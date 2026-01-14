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
import { Loader2 } from 'lucide-react';
import { Stack, Row, Text, H1, H2, H3, Button, Card, Input, Checkbox } from '@unicornlove/beyond-ui';
import Select from '../Common/Select';
import Textarea from '../Common/Textarea';
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
    <Stack style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)', paddingTop: 32, paddingBottom: 32 }}>
      <Stack style={{ maxWidth: 1280, width: '100%', marginLeft: 'auto', marginRight: 'auto', paddingLeft: 16, paddingRight: 16 }}>
        {onSkip && (
          <Button
            onPress={onSkip}
            variant="ghost"
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
            }}
          >
            <Row style={{ gap: 8, alignItems: 'center' }}>
              <Text>Skip for now</Text>
              <X size={18} />
            </Row>
          </Button>
        )}

        <Stack style={{ alignItems: 'center', marginBottom: 32 }}>
          <Stack style={{ justifyContent: 'center', marginBottom: 24 }}>
            <ForsuredLogo />
          </Stack>
          {invitationData ? (
            <Stack style={{ alignItems: 'center' }}>
              <H1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
                Subcontractor Prequalification
              </H1>
              <Text style={{ fontSize: 20, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Complete your prequalification for {invitationData.gcName}
              </Text>
              {invitationData.customMessage && (
                <Card style={{ backgroundColor: 'var(--color-blue-2)', border: '1px solid var(--color-blue-6)', borderRadius: 16, padding: 16, maxWidth: 672, width: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                  <Text style={{ fontSize: 14, color: 'var(--color-blue-11)' }}>
                    {invitationData.customMessage}
                  </Text>
                </Card>
              )}
            </Stack>
          ) : (
            <Stack style={{ alignItems: 'center' }}>
              <H1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
                Complete Your Profile
              </H1>
              <Text style={{ fontSize: 20, color: 'var(--color-text-secondary)' }}>
                Provide your company information to get prequalified
              </Text>
            </Stack>
          )}
        </Stack>

        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--color-border)', padding: 24, marginBottom: 32 }}>
          <Row style={{ alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto' }}>
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <Row key={step.id} style={{ alignItems: 'center', minWidth: 0 }}>
                  <Stack style={{ alignItems: 'center' }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isCompleted
                          ? 'var(--color-green-10)'
                          : isActive
                            ? 'var(--color-blue-10)'
                            : 'var(--color-background-hover)',
                        color: isCompleted || isActive ? 'white' : 'var(--color-text-secondary)',
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle size={20} />
                      ) : (
                        <Icon size={20} />
                      )}
                    </div>
                    <Stack style={{ marginTop: 8, alignItems: 'center', minWidth: 0 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
                        }}
                      >
                        {step.title}
                      </Text>
                    </Stack>
                  </Stack>
                  {index < STEPS.length - 1 && (
                    <div style={{ width: 32, height: 2, backgroundColor: 'var(--color-border)', marginLeft: 8, marginRight: 8, flexShrink: 0 }} />
                  )}
                </Row>
              );
            })}
          </Row>
        </Card>

        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--color-border)' }}>
          <Stack style={{ padding: 32 }}>
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
          </Stack>

          <Row style={{ paddingLeft: 32, paddingRight: 32, paddingTop: 24, paddingBottom: 24, backgroundColor: 'var(--color-background-hover)', borderTop: '1px solid var(--color-border)', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              onPress={handlePrevious}
              disabled={currentStep === 1}
              variant="ghost"
              style={{
                color: currentStep === 1 ? 'var(--color-text-tertiary)' : 'var(--color-text)',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              <Row style={{ gap: 8, alignItems: 'center' }}>
                <ArrowLeft size={16} />
                <Text>Previous</Text>
              </Row>
            </Button>

            <Row style={{ gap: 8, alignItems: 'center' }}>
              {STEPS.map((step) => (
                <div
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

            {currentStep < STEPS.length ? (
              <Button
                onPress={handleNext}
                disabled={!isStepValid(currentStep)}
                variant="primary"
                style={{
                  backgroundColor: 'var(--color-blue-10)',
                  color: 'white',
                }}
              >
                <Row style={{ gap: 8, alignItems: 'center' }}>
                  <Text>Next</Text>
                  <ArrowRight size={16} />
                </Row>
              </Button>
            ) : (
              <Button
                onPress={handleSubmit}
                disabled={!isStepValid(currentStep)}
                variant="primary"
                style={{
                  backgroundColor: 'var(--color-green-10)',
                  color: 'white',
                }}
              >
                <Row style={{ gap: 8, alignItems: 'center' }}>
                  <CheckCircle size={16} />
                  <Text>Submit</Text>
                </Row>
              </Button>
            )}
          </Row>
        </Card>
      </Stack>
    </Stack>
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
    <Stack style={{ position: 'relative' }} ref={dropdownRef}>
      <Card style={{ border: '1px solid var(--color-border)', borderRadius: 16, padding: 12, minHeight: 100 }}>
        <Row style={{ flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {selectedCertifications.map((cert) => (
            <Row
              key={cert}
              style={{
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'var(--color-blue-2)',
                color: 'var(--color-blue-11)',
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                borderRadius: 9999,
              }}
            >
              <Text style={{ fontSize: 14 }}>{cert}</Text>
              <Button
                type="button"
                onPress={() => handleRemoveCertification(cert)}
                variant="ghost"
                style={{ padding: 2 }}
              >
                <X size={14} />
              </Button>
            </Row>
          ))}
        </Row>

        <Stack style={{ position: 'relative' }}>
          <Row style={{ alignItems: 'center', gap: 8, border: '1px solid var(--color-border)', borderRadius: 16, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: 'var(--color-background)' }}>
            <Search size={16} color="var(--color-text-secondary)" />
            <input
              type="text"
              placeholder="Search certifications..."
              style={{
                flex: 1,
                fontSize: 14,
                border: 'none',
                outline: 'none',
                background: 'transparent',
              }}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
          </Row>

          {isOpen && filteredCertifications.length > 0 && (
            <Card
              style={{
                position: 'absolute',
                zIndex: 10,
                width: '100%',
                marginTop: 4,
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 16,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                maxHeight: 240,
                overflow: 'hidden',
              }}
            >
              <Stack style={{ maxHeight: 240, overflowY: 'auto' }}>
                {filteredCertifications.map((cert) => (
                  <Button
                    key={cert}
                    type="button"
                    onPress={() => handleAddCertification(cert)}
                    variant="ghost"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      paddingLeft: 16,
                      paddingRight: 16,
                      paddingTop: 8,
                      paddingBottom: 8,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: 'var(--color-text)' }}>
                      {cert}
                    </Text>
                  </Button>
                ))}
              </Stack>
            </Card>
          )}
        </Stack>
      </Card>
      <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
        Search and select your certifications. Click the X to remove.
      </Text>
    </Stack>
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
    <Stack style={{ gap: 24 }}>
      <Stack>
        <H2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Company Information
        </H2>
        <Text style={{ color: 'var(--color-text-secondary)' }}>
          Tell us about your construction business
        </Text>
      </Stack>

      <Row style={{ flexWrap: 'wrap', gap: 24 }}>
        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Company Name <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="text"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Legal company name"
            value={data.companyName}
            onChange={(e) => onChange({ ...data, companyName: e.target.value })}
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            DBA (if applicable)
          </Text>
          <Input
            type="text"
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Doing business as"
            value={data.dba || ''}
            onChange={(e) => onChange({ ...data, dba: e.target.value })}
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Federal Tax ID / EIN <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="text"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="XX-XXXXXXX"
            value={data.federalTaxId}
            onChange={(e) =>
              onChange({ ...data, federalTaxId: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Primary Address <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="text"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Street address, city, state, zip"
            value={data.primaryAddress}
            onChange={(e) =>
              onChange({ ...data, primaryAddress: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Mailing Address (if different)
          </Text>
          <Input
            type="text"
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Street address, city, state, zip"
            value={data.mailingAddress || ''}
            onChange={(e) =>
              onChange({ ...data, mailingAddress: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Website URL
          </Text>
          <Input
            type="url"
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="https://example.com"
            value={data.websiteUrl || ''}
            onChange={(e) => onChange({ ...data, websiteUrl: e.target.value })}
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
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
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Years in Business <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="number"
            required
            min={0}
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="0"
            value={data.yearsInBusiness?.toString() || ''}
            onChange={(e) =>
              onChange({
                ...data,
                yearsInBusiness: parseInt(e.target.value) || 0,
              })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Primary Contact Name <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="text"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Full name"
            value={data.primaryContactName}
            onChange={(e) =>
              onChange({ ...data, primaryContactName: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Primary Contact Title <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="text"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Job title"
            value={data.primaryContactTitle}
            onChange={(e) =>
              onChange({ ...data, primaryContactTitle: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Primary Contact Email <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="email"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="email@example.com"
            value={data.primaryContactEmail}
            onChange={(e) =>
              onChange({ ...data, primaryContactEmail: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Primary Contact Phone <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="tel"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="(555) 123-4567"
            value={data.primaryContactPhone}
            onChange={(e) =>
              onChange({ ...data, primaryContactPhone: e.target.value })
            }
          />
        </Stack>
      </Row>
    </Stack>
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
    <Stack style={{ gap: 24 }}>
      <Stack>
        <H2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Licensing and Registration
        </H2>
        <Text style={{ color: 'var(--color-text-secondary)' }}>
          Provide your license and certification details
        </Text>
      </Stack>

      <Row style={{ flexWrap: 'wrap', gap: 24 }}>
        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            State Contractor License Number{' '}
            <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="text"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="License number"
            value={data.licenseNumber}
            onChange={(e) =>
              onChange({ ...data, licenseNumber: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            License Classification / Trade{' '}
            <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="text"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="e.g., C-10 Electrical"
            value={data.licenseClassification}
            onChange={(e) =>
              onChange({ ...data, licenseClassification: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
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
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            License Expiration Date <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="date"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            value={data.licenseExpiration}
            onChange={(e) =>
              onChange({ ...data, licenseExpiration: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Business License File
          </Text>
          <Card style={{ border: '2px dashed var(--color-border)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <Upload color="var(--color-text-secondary)" size={32} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Drag and drop or click to upload
            </Text>
            <Button variant="outlined">
              Choose File
            </Button>
          </Card>
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Professional / Trade Certifications
          </Text>
          <CertificationSearchSelect
            selectedCertifications={data.certifications}
            onChange={(certs) => onChange({ ...data, certifications: certs })}
          />
        </Stack>
      </Row>
    </Stack>
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
    <Stack style={{ gap: 24 }}>
      <Stack>
        <H2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Insurance and Compliance
        </H2>
        <Text style={{ color: 'var(--color-text-secondary)' }}>
          Upload insurance documents and coverage details
        </Text>
      </Stack>

      {requirements && (
        <Card style={{ backgroundColor: 'var(--color-blue-2)', border: '1px solid var(--color-blue-6)', borderRadius: 16, padding: 16 }}>
          <Row style={{ alignItems: 'flex-start', gap: 8 }}>
            <Info color="var(--color-blue-10)" size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <Stack>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-blue-11)' }}>
                Required Coverage
              </Text>
              <Text style={{ fontSize: 14, color: 'var(--color-blue-11)' }}>
                Your GC requires minimum coverage amounts. Make sure your
                policies meet these requirements.
              </Text>
            </Stack>
          </Row>
        </Card>
      )}

      <Row style={{ flexWrap: 'wrap', gap: 24 }}>
        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            W-9 Form <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Card style={{ border: '2px dashed var(--color-border)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <Upload color="var(--color-text-secondary)" size={32} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Upload current W-9 form
            </Text>
            <Button variant="outlined">
              Choose File
            </Button>
          </Card>
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Certificate of Insurance (COI){' '}
            <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Card style={{ border: '2px dashed var(--color-border)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <Upload color="var(--color-text-secondary)" size={32} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Upload current COI
            </Text>
            <Button variant="outlined">
              Choose File
            </Button>
          </Card>
        </Stack>

        <Stack style={{ width: '100%', position: 'relative' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            General Liability Coverage <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Row style={{ position: 'relative', width: '100%' }}>
            <Text style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', zIndex: 1 }}>
              $
            </Text>
            <Input
              type="number"
              required
              min={0}
              style={{
                width: '100%',
                paddingLeft: 32,
                paddingRight: 16,
                paddingTop: 12,
                paddingBottom: 12,
                border: '1px solid var(--color-border)',
                borderRadius: 16,
              }}
              placeholder="0"
              value={data.generalLiabilityCoverage?.toString() || ''}
              onChange={(e) =>
                onChange({
                  ...data,
                  generalLiabilityCoverage: parseInt(e.target.value) || 0,
                })
              }
            />
          </Row>
        </Stack>

        <Stack style={{ width: '100%', position: 'relative' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Auto Liability Coverage <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Row style={{ position: 'relative', width: '100%' }}>
            <Text style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', zIndex: 1 }}>
              $
            </Text>
            <Input
              type="number"
              required
              min={0}
              style={{
                width: '100%',
                paddingLeft: 32,
                paddingRight: 16,
                paddingTop: 12,
                paddingBottom: 12,
                border: '1px solid var(--color-border)',
                borderRadius: 16,
              }}
              placeholder="0"
              value={data.autoLiabilityCoverage?.toString() || ''}
              onChange={(e) =>
                onChange({
                  ...data,
                  autoLiabilityCoverage: parseInt(e.target.value) || 0,
                })
              }
            />
          </Row>
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Insurance Carrier <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="text"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Carrier name"
            value={data.insuranceCarrier}
            onChange={(e) =>
              onChange({ ...data, insuranceCarrier: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Policy Expiration Date <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="date"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            value={data.policyExpiration}
            onChange={(e) =>
              onChange({ ...data, policyExpiration: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            EMR Rating (Experience Modification Rate)
          </Text>
          <Input
            type="number"
            step={0.01}
            min={0}
            max={2}
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="1.00"
            value={data.emrRating?.toString() || ''}
            onChange={(e) =>
              onChange({
                ...data,
                emrRating: parseFloat(e.target.value) || undefined,
              })
            }
          />
        </Stack>
      </Row>
    </Stack>
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
    <Stack style={{ gap: 24 }}>
      <Stack>
        <H2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Safety and Risk Management
        </H2>
        <Text style={{ color: 'var(--color-text-secondary)' }}>
          Provide safety program and contact information
        </Text>
      </Stack>

      <Row style={{ flexWrap: 'wrap', gap: 24 }}>
        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Safety Manager Name <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="text"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Full name"
            value={data.safetyManagerName}
            onChange={(e) =>
              onChange({ ...data, safetyManagerName: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Safety Manager Email <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="email"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="email@example.com"
            value={data.safetyManagerEmail}
            onChange={(e) =>
              onChange({ ...data, safetyManagerEmail: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Stack style={{ gap: 12 }}>
            <Row style={{ alignItems: 'center', gap: 12 }}>
              <Checkbox
                checked={data.hasWrittenSafetyProgram}
                onCheckedChange={(checked) =>
                  onChange({
                    ...data,
                    hasWrittenSafetyProgram: checked === true,
                  })
                }
              />
              <Text style={{ fontSize: 14, color: 'var(--color-text)' }}>
                We have a written safety program
              </Text>
            </Row>

            <Row style={{ alignItems: 'center', gap: 12 }}>
              <Checkbox
                checked={data.hasJobsiteOrientation}
                onCheckedChange={(checked) =>
                  onChange({ ...data, hasJobsiteOrientation: checked === true })
                }
              />
              <Text style={{ fontSize: 14, color: 'var(--color-text)' }}>
                We conduct jobsite orientation programs
              </Text>
            </Row>

            <Row style={{ alignItems: 'center', gap: 12 }}>
              <Checkbox
                checked={data.hasDrugFreePolicy}
                onCheckedChange={(checked) =>
                  onChange({ ...data, hasDrugFreePolicy: checked === true })
                }
              />
              <Text style={{ fontSize: 14, color: 'var(--color-text)' }}>
                We maintain a drug-free workplace policy
              </Text>
            </Row>
          </Stack>
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            OSHA Violations (if any)
          </Text>
          <Textarea
            rows={4}
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Describe any OSHA violations in the last 3 years"
            value={data.oshaViolations || ''}
            onChange={(e) =>
              onChange({ ...data, oshaViolations: e.target.value })
            }
          />
        </Stack>
      </Row>
    </Stack>
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
    <Stack style={{ gap: 24 }}>
      <Stack>
        <H2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Financial and Capacity Information
        </H2>
        <Text style={{ color: 'var(--color-text-secondary)' }}>
          Optional financial details (helps with prequalification)
        </Text>
      </Stack>

      <Card style={{ backgroundColor: 'var(--color-yellow-2)', border: '1px solid var(--color-yellow-6)', borderRadius: 16, padding: 16 }}>
        <Text style={{ fontSize: 14, color: 'var(--color-yellow-11)' }}>
          All fields on this page are optional but providing this information
          can improve your prequalification score.
        </Text>
      </Card>

      <Row style={{ flexWrap: 'wrap', gap: 24 }}>
        <Stack style={{ width: '100%' }}>
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
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Number of Full-Time Employees
          </Text>
          <Input
            type="number"
            min={0}
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="0"
            value={data.fullTimeEmployees?.toString() || ''}
            onChange={(e) =>
              onChange({
                ...data,
                fullTimeEmployees: parseInt(e.target.value) || undefined,
              })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Bonding Capacity
          </Text>
          <Input
            type="text"
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Single project and aggregate limits"
            value={data.bondingCapacity || ''}
            onChange={(e) =>
              onChange({ ...data, bondingCapacity: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Bonding Company
          </Text>
          <Input
            type="text"
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Surety company name"
            value={data.bondingCompany || ''}
            onChange={(e) =>
              onChange({ ...data, bondingCompany: e.target.value })
            }
          />
        </Stack>

        <Stack style={{ width: '100%' }}>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Bank Reference
          </Text>
          <Input
            type="text"
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Institution name and contact"
            value={data.bankReference || ''}
            onChange={(e) =>
              onChange({ ...data, bankReference: e.target.value })
            }
          />
        </Stack>
      </Row>
    </Stack>
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
    <Stack style={{ gap: 24 }}>
      <Stack>
        <H2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Trade Capabilities and Experience
        </H2>
        <Text style={{ color: 'var(--color-text-secondary)' }}>
          Describe your trades and project experience
        </Text>
      </Stack>

      <Stack style={{ gap: 24 }}>
        <Stack>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Primary Trades / Scopes <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Card style={{ border: '1px solid var(--color-border)', borderRadius: 16, padding: 16 }}>
            <Row style={{ flexWrap: 'wrap', gap: 12 }}>
              {trades.map((trade) => (
                <Row key={trade} style={{ alignItems: 'center', gap: 8, width: '30%', minWidth: 120 }}>
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
                  <Text style={{ fontSize: 14, color: 'var(--color-text)' }}>{trade}</Text>
                </Row>
              ))}
            </Row>
          </Card>
        </Stack>

        <Stack>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Geographic Coverage Area
          </Text>
          <Input
            type="text"
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
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
        </Stack>

        <Row style={{ flexWrap: 'wrap', gap: 24 }}>
          <Stack style={{ width: '100%' }}>
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
          </Stack>

          <Stack style={{ width: '100%' }}>
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
          </Stack>
        </Row>

        <Stack>
          <Row style={{ alignItems: 'center', gap: 12 }}>
            <Checkbox
              checked={data.prevailingWageExperience}
              onCheckedChange={(checked) =>
                onChange({
                  ...data,
                  prevailingWageExperience: checked === true,
                })
              }
            />
            <Text style={{ fontSize: 14, color: 'var(--color-text)' }}>
              We have prevailing wage experience
            </Text>
          </Row>
        </Stack>

        <Stack>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Special Equipment or Certifications
          </Text>
          <Textarea
            rows={3}
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Describe any special equipment, cranes, welding certifications, etc."
            value={data.specialEquipment || ''}
            onChange={(e) =>
              onChange({ ...data, specialEquipment: e.target.value })
            }
          />
        </Stack>
      </Stack>
    </Stack>
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
    <Stack style={{ gap: 24 }}>
      <Stack>
        <H2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Review and Submit
        </H2>
        <Text style={{ color: 'var(--color-text-secondary)' }}>
          Review your information and acknowledge compliance
        </Text>
      </Stack>

      <Card style={{ backgroundColor: 'var(--color-background-hover)', borderRadius: 16, padding: 24, gap: 16 }}>
        <H3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
          Application Summary
        </H3>

        <Row style={{ flexWrap: 'wrap', gap: 16 }}>
          <Stack style={{ width: '48%' }}>
            <Text style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Company Name</Text>
            <Text style={{ fontWeight: 500, color: 'var(--color-text)' }}>
              {data.companyInfo.companyName}
            </Text>
          </Stack>
          <Stack style={{ width: '48%' }}>
            <Text style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Primary Trade</Text>
            <Text style={{ fontWeight: 500, color: 'var(--color-text)' }}>
              {data.tradeCapabilities.primaryTrades.join(', ') ||
                'None selected'}
            </Text>
          </Stack>
          <Stack style={{ width: '48%' }}>
            <Text style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>License Number</Text>
            <Text style={{ fontWeight: 500, color: 'var(--color-text)' }}>
              {data.licensingInfo.licenseNumber}
            </Text>
          </Stack>
          <Stack style={{ width: '48%' }}>
            <Text style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Years in Business</Text>
            <Text style={{ fontWeight: 500, color: 'var(--color-text)' }}>
              {data.companyInfo.yearsInBusiness} years
            </Text>
          </Stack>
        </Row>
      </Card>

      <Stack style={{ gap: 16 }}>
        <Card style={{ border: '1px solid var(--color-border)', borderRadius: 16, padding: 16 }}>
          <Row style={{ alignItems: 'flex-start', gap: 12 }}>
            <Checkbox
              checked={data.acknowledgments.accuracyAffirmation}
              onCheckedChange={(checked) =>
                onChange({
                  ...data.acknowledgments,
                  accuracyAffirmation: checked === true,
                })
              }
              style={{ marginTop: 4 }}
            />
            <Stack>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                Affirmation of Accuracy{' '}
                <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
              </Text>
              <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                I certify that all information provided in this application is
                true and accurate to the best of my knowledge.
              </Text>
            </Stack>
          </Row>
        </Card>

        <Card style={{ border: '1px solid var(--color-border)', borderRadius: 16, padding: 16 }}>
          <Row style={{ alignItems: 'flex-start', gap: 12 }}>
            <Checkbox
              checked={data.acknowledgments.complianceAgreement}
              onCheckedChange={(checked) =>
                onChange({
                  ...data.acknowledgments,
                  complianceAgreement: checked === true,
                })
              }
              style={{ marginTop: 4 }}
            />
            <Stack>
              <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>
                Agreement to Compliance Requirements{' '}
                <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
              </Text>
              <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                I agree to comply with all insurance, safety, and policy
                requirements established by the General Contractor.
              </Text>
            </Stack>
          </Row>
        </Card>

        <Stack>
          <Text style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 8, display: 'block' }}>
            Digital Signature <Text style={{ color: 'var(--color-red-10)' }}>*</Text>
          </Text>
          <Input
            type="text"
            required
            style={{
              width: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
            placeholder="Type your full name to sign"
            value={data.acknowledgments.digitalSignature}
            onChange={(e) =>
              onChange({
                ...data.acknowledgments,
                digitalSignature: e.target.value,
              })
            }
          />
          <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            By typing your name, you are providing a legal digital signature
          </Text>
        </Stack>
      </Stack>
    </Stack>
  );
}
