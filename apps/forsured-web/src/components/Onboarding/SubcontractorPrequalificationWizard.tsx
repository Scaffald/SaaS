import React, { useState, useRef, useEffect } from 'react';
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
import ForsuredLogo from '../Common/ForsuredLogo';
import Button from '../Common/Button';

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
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {onSkip && (
          <button
            onClick={onSkip}
            className="absolute top-6 right-6 text-text-secondary hover:text-text-primary transition-colors flex items-center space-x-2"
          >
            <span>Skip for now</span>
            <X size={18} />
          </button>
        )}

        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <ForsuredLogo className="h-8" />
          </div>
          {invitationData ? (
            <>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Subcontractor Prequalification
              </h1>
              <p className="text-lg text-text-secondary mb-4">
                Complete your prequalification for {invitationData.gcName}
              </p>
              {invitationData.customMessage && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 max-w-2xl mx-auto">
                  <p className="text-sm text-primary-900">
                    {invitationData.customMessage}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Complete Your Profile
              </h1>
              <p className="text-lg text-text-secondary">
                Provide your company information to get prequalified
              </p>
            </>
          )}
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border p-6 mb-8">
          <div className="flex items-center justify-between overflow-x-auto">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isValid = isStepValid(step.id);

              return (
                <div key={step.id} className="flex items-center min-w-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-success-600 text-white'
                          : isActive
                            ? 'bg-primary-600 text-white'
                            : 'bg-bg-tertiary text-text-secondary'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={20} />
                      ) : (
                        <Icon size={20} />
                      )}
                    </div>
                    <div className="mt-2 text-center min-w-0">
                      <p
                        className={`text-xs font-medium truncate ${
                          isActive ? 'text-text-primary' : 'text-text-secondary'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="w-8 h-0.5 bg-border mx-2 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border">
          <div className="p-8">
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
          </div>

          <div className="px-8 py-6 bg-bg-secondary border-t border-border flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
                currentStep === 1
                  ? 'text-text-tertiary cursor-not-allowed'
                  : 'text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <ArrowLeft size={16} />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-2">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full ${
                    currentStep >= step.id ? 'bg-primary-600' : 'bg-neutral-300'
                  }`}
                />
              ))}
            </div>

            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
                className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStepValid(currentStep)}
                className="flex items-center space-x-2 px-6 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
              >
                <CheckCircle size={16} />
                <span>Submit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
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
    <div className="relative" ref={dropdownRef}>
      <div className="border border-border rounded-lg p-3 min-h-[100px]">
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCertifications.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center space-x-1 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm"
            >
              <span>{cert}</span>
              <button
                type="button"
                onClick={() => handleRemoveCertification(cert)}
                className="hover:text-primary-900 transition-colors"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>

        <div className="relative">
          <div className="flex items-center space-x-2 border border-border rounded-lg px-3 py-2 bg-white">
            <Search size={16} className="text-text-secondary" />
            <input
              type="text"
              placeholder="Search certifications..."
              className="flex-1 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
            />
          </div>

          {isOpen && filteredCertifications.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredCertifications.map((cert) => (
                <button
                  key={cert}
                  type="button"
                  onClick={() => handleAddCertification(cert)}
                  className="w-full text-left px-4 py-2 hover:bg-bg-secondary transition-colors text-sm text-text-primary"
                >
                  {cert}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-text-secondary mt-1">
        Search and select your certifications. Click the X to remove.
      </p>
    </div>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Company Information
        </h2>
        <p className="text-text-secondary">
          Tell us about your construction business
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Company Name <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Legal company name"
            value={data.companyName}
            onChange={(e) => onChange({ ...data, companyName: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            DBA (if applicable)
          </label>
          <input
            type="text"
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Doing business as"
            value={data.dba || ''}
            onChange={(e) => onChange({ ...data, dba: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Federal Tax ID / EIN <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="XX-XXXXXXX"
            value={data.federalTaxId}
            onChange={(e) =>
              onChange({ ...data, federalTaxId: e.target.value })
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Primary Address <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Street address, city, state, zip"
            value={data.primaryAddress}
            onChange={(e) =>
              onChange({ ...data, primaryAddress: e.target.value })
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Mailing Address (if different)
          </label>
          <input
            type="text"
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Street address, city, state, zip"
            value={data.mailingAddress || ''}
            onChange={(e) =>
              onChange({ ...data, mailingAddress: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Website URL
          </label>
          <input
            type="url"
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="https://example.com"
            value={data.websiteUrl || ''}
            onChange={(e) => onChange({ ...data, websiteUrl: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Business Type <span className="text-error-500">*</span>
          </label>
          <select
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={data.businessType}
            onChange={(e) =>
              onChange({ ...data, businessType: e.target.value })
            }
          >
            <option value="">Select type</option>
            <option value="corporation">Corporation</option>
            <option value="llc">LLC</option>
            <option value="sole_proprietor">Sole Proprietor</option>
            <option value="partnership">Partnership</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Years in Business <span className="text-error-500">*</span>
          </label>
          <input
            type="number"
            required
            min="0"
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0"
            value={data.yearsInBusiness || ''}
            onChange={(e) =>
              onChange({
                ...data,
                yearsInBusiness: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Primary Contact Name <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Full name"
            value={data.primaryContactName}
            onChange={(e) =>
              onChange({ ...data, primaryContactName: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Primary Contact Title <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Job title"
            value={data.primaryContactTitle}
            onChange={(e) =>
              onChange({ ...data, primaryContactTitle: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Primary Contact Email <span className="text-error-500">*</span>
          </label>
          <input
            type="email"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="email@example.com"
            value={data.primaryContactEmail}
            onChange={(e) =>
              onChange({ ...data, primaryContactEmail: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Primary Contact Phone <span className="text-error-500">*</span>
          </label>
          <input
            type="tel"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="(555) 123-4567"
            value={data.primaryContactPhone}
            onChange={(e) =>
              onChange({ ...data, primaryContactPhone: e.target.value })
            }
          />
        </div>
      </div>
    </div>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Licensing and Registration
        </h2>
        <p className="text-text-secondary">
          Provide your license and certification details
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            State Contractor License Number{' '}
            <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="License number"
            value={data.licenseNumber}
            onChange={(e) =>
              onChange({ ...data, licenseNumber: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            License Classification / Trade{' '}
            <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., C-10 Electrical"
            value={data.licenseClassification}
            onChange={(e) =>
              onChange({ ...data, licenseClassification: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Issuing State <span className="text-error-500">*</span>
          </label>
          <select
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={data.issuingState}
            onChange={(e) =>
              onChange({ ...data, issuingState: e.target.value })
            }
          >
            <option value="">Select state</option>
            <option value="CA">California</option>
            <option value="TX">Texas</option>
            <option value="FL">Florida</option>
            <option value="NY">New York</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            License Expiration Date <span className="text-error-500">*</span>
          </label>
          <input
            type="date"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={data.licenseExpiration}
            onChange={(e) =>
              onChange({ ...data, licenseExpiration: e.target.value })
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Business License File
          </label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="mx-auto text-text-secondary mb-2" size={32} />
            <p className="text-sm text-text-secondary mb-2">
              Drag and drop or click to upload
            </p>
            <Button variant="outline" size="sm">
              Choose File
            </Button>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Professional / Trade Certifications
          </label>
          <CertificationSearchSelect
            selectedCertifications={data.certifications}
            onChange={(certs) => onChange({ ...data, certifications: certs })}
          />
        </div>
      </div>
    </div>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Insurance and Compliance
        </h2>
        <p className="text-text-secondary">
          Upload insurance documents and coverage details
        </p>
      </div>

      {requirements && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <Info className="text-primary-600 mt-0.5 flex-shrink-0" size={16} />
            <div>
              <p className="text-sm font-medium text-primary-900">
                Required Coverage
              </p>
              <p className="text-sm text-primary-700">
                Your GC requires minimum coverage amounts. Make sure your
                policies meet these requirements.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">
            W-9 Form <span className="text-error-500">*</span>
          </label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="mx-auto text-text-secondary mb-2" size={32} />
            <p className="text-sm text-text-secondary mb-2">
              Upload current W-9 form
            </p>
            <Button variant="outline" size="sm">
              Choose File
            </Button>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Certificate of Insurance (COI){' '}
            <span className="text-error-500">*</span>
          </label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="mx-auto text-text-secondary mb-2" size={32} />
            <p className="text-sm text-text-secondary mb-2">
              Upload current COI
            </p>
            <Button variant="outline" size="sm">
              Choose File
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            General Liability Coverage <span className="text-error-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary">
              $
            </span>
            <input
              type="number"
              required
              min="0"
              className="w-full pl-8 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
              value={data.generalLiabilityCoverage || ''}
              onChange={(e) =>
                onChange({
                  ...data,
                  generalLiabilityCoverage: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Auto Liability Coverage <span className="text-error-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary">
              $
            </span>
            <input
              type="number"
              required
              min="0"
              className="w-full pl-8 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
              value={data.autoLiabilityCoverage || ''}
              onChange={(e) =>
                onChange({
                  ...data,
                  autoLiabilityCoverage: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Insurance Carrier <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Carrier name"
            value={data.insuranceCarrier}
            onChange={(e) =>
              onChange({ ...data, insuranceCarrier: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Policy Expiration Date <span className="text-error-500">*</span>
          </label>
          <input
            type="date"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={data.policyExpiration}
            onChange={(e) =>
              onChange({ ...data, policyExpiration: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            EMR Rating (Experience Modification Rate)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="2"
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="1.00"
            value={data.emrRating || ''}
            onChange={(e) =>
              onChange({
                ...data,
                emrRating: parseFloat(e.target.value) || undefined,
              })
            }
          />
        </div>
      </div>
    </div>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Safety and Risk Management
        </h2>
        <p className="text-text-secondary">
          Provide safety program and contact information
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Safety Manager Name <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Full name"
            value={data.safetyManagerName}
            onChange={(e) =>
              onChange({ ...data, safetyManagerName: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Safety Manager Email <span className="text-error-500">*</span>
          </label>
          <input
            type="email"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="email@example.com"
            value={data.safetyManagerEmail}
            onChange={(e) =>
              onChange({ ...data, safetyManagerEmail: e.target.value })
            }
          />
        </div>

        <div className="md:col-span-2">
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={data.hasWrittenSafetyProgram}
                onChange={(e) =>
                  onChange({
                    ...data,
                    hasWrittenSafetyProgram: e.target.checked,
                  })
                }
                className="rounded border-border text-primary-600"
              />
              <span className="text-sm text-text-primary">
                We have a written safety program
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={data.hasJobsiteOrientation}
                onChange={(e) =>
                  onChange({ ...data, hasJobsiteOrientation: e.target.checked })
                }
                className="rounded border-border text-primary-600"
              />
              <span className="text-sm text-text-primary">
                We conduct jobsite orientation programs
              </span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={data.hasDrugFreePolicy}
                onChange={(e) =>
                  onChange({ ...data, hasDrugFreePolicy: e.target.checked })
                }
                className="rounded border-border text-primary-600"
              />
              <span className="text-sm text-text-primary">
                We maintain a drug-free workplace policy
              </span>
            </label>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">
            OSHA Violations (if any)
          </label>
          <textarea
            rows={4}
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Describe any OSHA violations in the last 3 years"
            value={data.oshaViolations || ''}
            onChange={(e) =>
              onChange({ ...data, oshaViolations: e.target.value })
            }
          />
        </div>
      </div>
    </div>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Financial and Capacity Information
        </h2>
        <p className="text-text-secondary">
          Optional financial details (helps with prequalification)
        </p>
      </div>

      <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
        <p className="text-sm text-warning-900">
          All fields on this page are optional but providing this information
          can improve your prequalification score.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Annual Revenue Range
          </label>
          <select
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={data.annualRevenueRange || ''}
            onChange={(e) =>
              onChange({ ...data, annualRevenueRange: e.target.value })
            }
          >
            <option value="">Select range</option>
            <option value="<500k">Under $500k</option>
            <option value="500k-1m">$500k - $1M</option>
            <option value="1m-5m">$1M - $5M</option>
            <option value="5m-10m">$5M - $10M</option>
            <option value="10m+">$10M+</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Number of Full-Time Employees
          </label>
          <input
            type="number"
            min="0"
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0"
            value={data.fullTimeEmployees || ''}
            onChange={(e) =>
              onChange({
                ...data,
                fullTimeEmployees: parseInt(e.target.value) || undefined,
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Bonding Capacity
          </label>
          <input
            type="text"
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Single project and aggregate limits"
            value={data.bondingCapacity || ''}
            onChange={(e) =>
              onChange({ ...data, bondingCapacity: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Bonding Company
          </label>
          <input
            type="text"
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Surety company name"
            value={data.bondingCompany || ''}
            onChange={(e) =>
              onChange({ ...data, bondingCompany: e.target.value })
            }
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Bank Reference
          </label>
          <input
            type="text"
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Institution name and contact"
            value={data.bankReference || ''}
            onChange={(e) =>
              onChange({ ...data, bankReference: e.target.value })
            }
          />
        </div>
      </div>
    </div>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Trade Capabilities and Experience
        </h2>
        <p className="text-text-secondary">
          Describe your trades and project experience
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Primary Trades / Scopes <span className="text-error-500">*</span>
          </label>
          <div className="border border-border rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {trades.map((trade) => (
                <label key={trade} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={data.primaryTrades.includes(trade)}
                    onChange={(e) => {
                      if (e.target.checked) {
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
                    className="rounded border-border text-primary-600"
                  />
                  <span className="text-sm text-text-primary">{trade}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Geographic Coverage Area
          </label>
          <input
            type="text"
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Typical Project Size
            </label>
            <select
              className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={data.typicalProjectSize || ''}
              onChange={(e) =>
                onChange({ ...data, typicalProjectSize: e.target.value })
              }
            >
              <option value="">Select size</option>
              <option value="<50k">Under $50k</option>
              <option value="50k-250k">$50k - $250k</option>
              <option value="250k-1m">$250k - $1M</option>
              <option value="1m+">$1M+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Labor Classification
            </label>
            <select
              className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={data.laborClassification || ''}
              onChange={(e) =>
                onChange({ ...data, laborClassification: e.target.value })
              }
            >
              <option value="">Select classification</option>
              <option value="union">Union</option>
              <option value="non-union">Non-Union</option>
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={data.prevailingWageExperience}
              onChange={(e) =>
                onChange({
                  ...data,
                  prevailingWageExperience: e.target.checked,
                })
              }
              className="rounded border-border text-primary-600"
            />
            <span className="text-sm text-text-primary">
              We have prevailing wage experience
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Special Equipment or Certifications
          </label>
          <textarea
            rows={3}
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Describe any special equipment, cranes, welding certifications, etc."
            value={data.specialEquipment || ''}
            onChange={(e) =>
              onChange({ ...data, specialEquipment: e.target.value })
            }
          />
        </div>
      </div>
    </div>
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Review and Submit
        </h2>
        <p className="text-text-secondary">
          Review your information and acknowledge compliance
        </p>
      </div>

      <div className="bg-bg-secondary rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Application Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-text-secondary">Company Name</p>
            <p className="font-medium text-text-primary">
              {data.companyInfo.companyName}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Primary Trade</p>
            <p className="font-medium text-text-primary">
              {data.tradeCapabilities.primaryTrades.join(', ') ||
                'None selected'}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">License Number</p>
            <p className="font-medium text-text-primary">
              {data.licensingInfo.licenseNumber}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Years in Business</p>
            <p className="font-medium text-text-primary">
              {data.companyInfo.yearsInBusiness} years
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-border rounded-lg p-4">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={data.acknowledgments.accuracyAffirmation}
              onChange={(e) =>
                onChange({
                  ...data.acknowledgments,
                  accuracyAffirmation: e.target.checked,
                })
              }
              className="mt-1 rounded border-border text-primary-600"
            />
            <div>
              <span className="text-sm font-medium text-text-primary">
                Affirmation of Accuracy{' '}
                <span className="text-error-500">*</span>
              </span>
              <p className="text-xs text-text-secondary mt-1">
                I certify that all information provided in this application is
                true and accurate to the best of my knowledge.
              </p>
            </div>
          </label>
        </div>

        <div className="border border-border rounded-lg p-4">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={data.acknowledgments.complianceAgreement}
              onChange={(e) =>
                onChange({
                  ...data.acknowledgments,
                  complianceAgreement: e.target.checked,
                })
              }
              className="mt-1 rounded border-border text-primary-600"
            />
            <div>
              <span className="text-sm font-medium text-text-primary">
                Agreement to Compliance Requirements{' '}
                <span className="text-error-500">*</span>
              </span>
              <p className="text-xs text-text-secondary mt-1">
                I agree to comply with all insurance, safety, and policy
                requirements established by the General Contractor.
              </p>
            </div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Digital Signature <span className="text-error-500">*</span>
          </label>
          <input
            type="text"
            required
            className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Type your full name to sign"
            value={data.acknowledgments.digitalSignature}
            onChange={(e) =>
              onChange({
                ...data.acknowledgments,
                digitalSignature: e.target.value,
              })
            }
          />
          <p className="text-xs text-text-secondary mt-1">
            By typing your name, you are providing a legal digital signature
          </p>
        </div>
      </div>
    </div>
  );
}
