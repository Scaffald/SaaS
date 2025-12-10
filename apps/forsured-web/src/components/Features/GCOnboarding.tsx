import React, { useState } from 'react';
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
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Welcome to Simple Insurance
          </h1>
          <p className="text-lg text-text-secondary">
            Let's set up your construction compliance management
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-surface rounded-lg shadow-sm border border-border p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-medium transition-colors ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-bg-tertiary text-text-secondary'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={20} />
                      ) : (
                        <Icon size={20} />
                      )}
                    </div>
                    <div className="ml-4">
                      <p
                        className={`font-medium ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}
                      >
                        {step.title}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="mx-8 text-gray-300" size={20} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-surface rounded-lg shadow-sm border border-border">
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Company Information
                </h2>
                <p className="text-text-secondary">
                  Help us understand your construction business
                </p>
              </div>

              <div className="space-y-6">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your company name"
                    value={companyInfo.companyName}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Company Size */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Company Size <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={companyInfo.companySize}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        companySize: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select company size</option>
                    {companySizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Primary Industry <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={companyInfo.industry}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        industry: e.target.value,
                      }))
                    }
                  >
                    {industryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Annual Revenue */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Annual Revenue (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"
                      size={20}
                    />
                    <input
                      type="number"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter annual revenue"
                      value={companyInfo.annualRevenue}
                      onChange={(e) =>
                        setCompanyInfo((prev) => ({
                          ...prev,
                          annualRevenue: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <p className="text-sm text-text-secondary mt-1">
                    This helps us recommend appropriate coverage levels
                  </p>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Primary Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City, State"
                    value={companyInfo.location}
                    onChange={(e) =>
                      setCompanyInfo((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Compliance Settings */}
          {currentStep === 2 && (
            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">
                      Default Compliance Settings
                    </h2>
                    <p className="text-text-secondary">
                      Review and customize your default insurance requirements
                      for contractors
                    </p>
                  </div>
                  {getRecommendedSettings() && (
                    <button
                      onClick={applyRecommendedSettings}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Settings size={16} />
                      <span>Apply Recommended</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {/* General Liability */}
                <div className="border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Shield className="text-primary-600" size={24} />
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                          General Liability
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Bodily injury and property damage coverage
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center">
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
                        className="rounded border-border text-primary-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-primary">
                        Required
                      </span>
                    </label>
                  </div>
                  {complianceSettings.generalLiability.required && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Minimum Coverage
                        </label>
                        <select
                          className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        >
                          <option value={1000000}>$1,000,000</option>
                          <option value={2000000}>$2,000,000</option>
                          <option value={3000000}>$3,000,000</option>
                          <option value={5000000}>$5,000,000</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Workers Compensation */}
                <div className="border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Users className="text-success-600" size={24} />
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                          Workers Compensation
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Employee injury and illness coverage
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center">
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
                        className="rounded border-border text-primary-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-primary">
                        Required
                      </span>
                    </label>
                  </div>
                  {complianceSettings.workersCompensation.required && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Minimum Coverage
                        </label>
                        <select
                          className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        >
                          <option value={500000}>$500,000</option>
                          <option value={1000000}>$1,000,000</option>
                          <option value={1500000}>$1,500,000</option>
                          <option value={2000000}>$2,000,000</option>
                        </select>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center">
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
                            className="rounded border-border text-primary-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-text-primary">
                            Require Experience Mod
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Professional Liability */}
                <div className="border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="text-secondary-500" size={24} />
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                          Professional Liability
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Errors and omissions coverage
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center">
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
                        className="rounded border-border text-primary-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-primary">
                        Required
                      </span>
                    </label>
                  </div>
                  {complianceSettings.professionalLiability.required && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Minimum Coverage
                        </label>
                        <select
                          className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        >
                          <option value={500000}>$500,000</option>
                          <option value={1000000}>$1,000,000</option>
                          <option value={2000000}>$2,000,000</option>
                          <option value={5000000}>$5,000,000</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Commercial Auto */}
                <div className="border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="text-secondary-600" size={24} />
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                          Commercial Auto
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Business vehicle coverage
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center">
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
                        className="rounded border-border text-primary-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-primary">
                        Required
                      </span>
                    </label>
                  </div>
                  {complianceSettings.commercialAuto.required && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Minimum Coverage
                        </label>
                        <select
                          className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        >
                          <option value={500000}>$500,000</option>
                          <option value={1000000}>$1,000,000</option>
                          <option value={1500000}>$1,500,000</option>
                          <option value={2000000}>$2,000,000</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Umbrella Policy */}
                <div className="border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="text-error-600" size={24} />
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                          Umbrella Policy
                        </h3>
                        <p className="text-sm text-text-secondary">
                          Additional liability protection
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center">
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
                        className="rounded border-border text-primary-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-text-primary">
                        Required
                      </span>
                    </label>
                  </div>
                  {complianceSettings.umbrella.required && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Minimum Coverage
                        </label>
                        <select
                          className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={complianceSettings.umbrella.minimumCoverage}
                          onChange={(e) =>
                            updateComplianceSetting(
                              'umbrella',
                              'minimumCoverage',
                              parseInt(e.target.value)
                            )
                          }
                        >
                          <option value={1000000}>$1,000,000</option>
                          <option value={5000000}>$5,000,000</option>
                          <option value={10000000}>$10,000,000</option>
                          <option value={25000000}>$25,000,000</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 bg-primary-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="text-primary-600 mt-0.5" size={16} />
                  <div>
                    <p className="text-sm text-blue-900 font-medium">
                      Default Settings
                    </p>
                    <p className="text-sm text-blue-700">
                      These settings will apply to all new contractors by
                      default. You can override them for specific projects or
                      contractors later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  Confirmation & Setup Complete
                </h2>
                <p className="text-text-secondary">
                  Review your settings and complete the onboarding process
                </p>
              </div>

              <div className="space-y-6">
                {/* Company Summary */}
                <div className="bg-bg-secondary rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Company Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary">Company Name:</span>
                      <p className="font-medium">{companyInfo.companyName}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Company Size:</span>
                      <p className="font-medium">
                        {
                          companySizeOptions.find(
                            (opt) => opt.value === companyInfo.companySize
                          )?.label
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Industry:</span>
                      <p className="font-medium">
                        {
                          industryOptions.find(
                            (opt) => opt.value === companyInfo.industry
                          )?.label
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-text-secondary">
                        Annual Revenue:
                      </span>
                      <p className="font-medium">
                        ${parseInt(companyInfo.annualRevenue).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compliance Summary */}
                <div className="bg-bg-secondary rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Default Compliance Requirements
                  </h3>
                  <div className="space-y-3">
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
                          <div
                            key={key}
                            className="flex items-center justify-between p-3 bg-surface rounded-lg"
                          >
                            <span className="font-medium">
                              {titles[key as keyof typeof titles]}
                            </span>
                            <span className="text-success-600 font-medium">
                              ${setting.minimumCoverage.toLocaleString()}{' '}
                              minimum
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Project-Specific Overrides */}
                <div className="bg-primary-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        Project-Specific Overrides
                      </h3>
                      <p className="text-sm text-text-secondary">
                        Allow different insurance requirements for specific
                        projects when needed
                      </p>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={projectSpecificOverrides}
                        onChange={(e) =>
                          setProjectSpecificOverrides(e.target.checked)
                        }
                        className="rounded border-border text-primary-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-text-primary">
                        Enable
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
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
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full ${
                    currentStep >= step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={
                  currentStep === 1 &&
                  (!companyInfo.companyName ||
                    !companyInfo.companySize ||
                    !companyInfo.annualRevenue ||
                    !companyInfo.location)
                }
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle size={16} />
                <span>Complete Setup</span>
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg p-6 w-full max-w-md">
              <div className="text-center">
                <CheckCircle
                  className="mx-auto mb-4 text-success-600"
                  size={48}
                />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Confirm Setup
                </h3>
                <p className="text-text-secondary mb-6">
                  I confirm these settings will apply by default to all
                  contractors and projects. I can modify them later as needed.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmationModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmFinish}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Confirm & Finish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
