import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  Shield,
  DollarSign,
  Calendar,
  Award,
  ArrowRight,
  X,
  Eye,
  Download,
} from 'lucide-react';
import StatusBadge from '../Common/StatusBadge';

interface UploadedDocument {
  id: string;
  name: string;
  type: 'coi' | 'policy' | 'license' | 'bond';
  status: 'processing' | 'verified' | 'needs-review' | 'rejected';
  uploadDate: Date;
  expiryDate?: Date;
  coverage?: number;
  premium?: number;
  provider?: string;
  policyNumber?: string;
}

interface CoverageAssessment {
  type: string;
  current: number;
  recommended: number;
  industryAverage: number;
  status: 'adequate' | 'below-recommended' | 'excellent';
  reasoning: string;
}

export default function ContractorOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([
    {
      id: '1',
      name: 'General Liability COI.pdf',
      type: 'coi',
      status: 'verified',
      uploadDate: new Date('2024-01-10'),
      expiryDate: new Date('2024-12-31'),
      coverage: 2000000,
      premium: 2400,
      provider: 'State Farm',
      policyNumber: 'GL-12345678',
    },
    {
      id: '2',
      name: 'Workers Comp Policy.pdf',
      type: 'policy',
      status: 'processing',
      uploadDate: new Date('2024-01-15'),
      expiryDate: new Date('2024-11-30'),
      coverage: 1000000,
      premium: 3200,
      provider: 'Travelers',
    },
  ]);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const coverageAssessments: CoverageAssessment[] = [
    {
      type: 'General Liability',
      current: 2000000,
      recommended: 2000000,
      industryAverage: 1500000,
      status: 'excellent',
      reasoning:
        'Your coverage meets industry best practices and exceeds the average. This provides strong protection for most construction projects.',
    },
    {
      type: 'Workers Compensation',
      current: 1000000,
      recommended: 1500000,
      industryAverage: 1200000,
      status: 'below-recommended',
      reasoning:
        'Consider increasing coverage to $1.5M to align with industry best practices and qualify for larger projects.',
    },
    {
      type: 'Professional Liability',
      current: 0,
      recommended: 1000000,
      industryAverage: 800000,
      status: 'below-recommended',
      reasoning:
        'Professional liability coverage is recommended for contractors providing design services or specialized expertise.',
    },
    {
      type: 'Commercial Auto',
      current: 0,
      recommended: 1000000,
      industryAverage: 750000,
      status: 'below-recommended',
      reasoning:
        'Commercial auto insurance is essential if you use vehicles for business purposes or transport equipment.',
    },
  ];

  const steps = [
    {
      id: 1,
      title: 'Upload Documents',
      description: 'Upload your COIs, policies, and licenses',
    },
    {
      id: 2,
      title: 'Document Review',
      description: 'We verify and process your documents',
    },
    {
      id: 3,
      title: 'Coverage Assessment',
      description: 'Review your coverage against industry standards',
    },
    {
      id: 4,
      title: 'Recommendations',
      description: 'Get personalized coverage recommendations',
    },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle file upload logic here
      console.log('Files dropped:', e.dataTransfer.files);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-success-600 bg-success-100';
      case 'adequate':
        return 'text-primary-600 bg-primary-100';
      case 'below-recommended':
        return 'text-secondary-600 bg-secondary-100';
      default:
        return 'text-text-secondary bg-bg-secondary';
    }
  };

  const getCompletionPercentage = () => {
    const totalCoverageTypes = 4;
    const adequateCoverage = coverageAssessments.filter(
      (c) => c.status === 'adequate' || c.status === 'excellent'
    ).length;
    return Math.round((adequateCoverage / totalCoverageTypes) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Contractor Onboarding
        </h1>
        <p className="text-text-secondary">
          Upload your insurance documents and get a comprehensive coverage
          assessment
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-bg-tertiary text-text-secondary'
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle size={20} /> : step.id}
                </div>
                <div className="ml-3">
                  <p
                    className={`font-medium ${currentStep >= step.id ? 'text-text-primary' : 'text-text-secondary'}`}
                  >
                    {step.title}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="mx-6 text-gray-300" size={20} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Document Upload */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-text-primary">
                Upload Your Insurance Documents
              </h2>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Upload size={16} />
                <span>Upload Documents</span>
              </button>
            </div>

            {/* Document Types Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 border border-border rounded-lg">
                <FileText className="text-primary-600 mb-2" size={24} />
                <h3 className="font-medium text-text-primary mb-1">
                  Certificate of Insurance
                </h3>
                <p className="text-sm text-text-secondary">
                  COI documents showing current coverage
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <Shield className="text-success-600 mb-2" size={24} />
                <h3 className="font-medium text-text-primary mb-1">
                  Insurance Policies
                </h3>
                <p className="text-sm text-text-secondary">
                  Full policy documents with terms
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <Award className="text-secondary-500 mb-2" size={24} />
                <h3 className="font-medium text-text-primary mb-1">Licenses</h3>
                <p className="text-sm text-text-secondary">
                  Professional and trade licenses
                </p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <DollarSign className="text-secondary-600 mb-2" size={24} />
                <h3 className="font-medium text-text-primary mb-1">Bonds</h3>
                <p className="text-sm text-text-secondary">
                  Surety bonds and guarantees
                </p>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="space-y-3">
              <h3 className="font-medium text-text-primary">
                Uploaded Documents ({uploadedDocs.length})
              </h3>
              {uploadedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="text-text-tertiary" size={20} />
                    <div>
                      <p className="font-medium text-text-primary">
                        {doc.name}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <span className="capitalize">{doc.type}</span>
                        {doc.provider && (
                          <>
                            <span>•</span>
                            <span>{doc.provider}</span>
                          </>
                        )}
                        {doc.expiryDate && (
                          <>
                            <span>•</span>
                            <span>
                              Expires: {doc.expiryDate.toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={doc.status} size="sm" />
                    <button className="p-1 text-text-tertiary hover:text-text-secondary">
                      <Eye size={16} />
                    </button>
                    <button className="p-1 text-text-tertiary hover:text-text-secondary">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue to Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Document Review */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              Document Verification Status
            </h2>

            <div className="space-y-4">
              {uploadedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-text-primary">
                      {doc.name}
                    </h3>
                    <StatusBadge status={doc.status} />
                  </div>

                  {doc.status === 'verified' && (
                    <div className="bg-success-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="text-success-600" size={16} />
                        <span className="text-sm font-medium text-green-900">
                          Verification Complete
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {doc.coverage && (
                          <div>
                            <span className="text-text-secondary">
                              Coverage:
                            </span>
                            <p className="font-medium">
                              ${doc.coverage.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {doc.premium && (
                          <div>
                            <span className="text-text-secondary">
                              Annual Premium:
                            </span>
                            <p className="font-medium">
                              ${doc.premium.toLocaleString()}
                            </p>
                          </div>
                        )}
                        {doc.policyNumber && (
                          <div>
                            <span className="text-text-secondary">
                              Policy Number:
                            </span>
                            <p className="font-medium">{doc.policyNumber}</p>
                          </div>
                        )}
                        {doc.expiryDate && (
                          <div>
                            <span className="text-text-secondary">
                              Expires:
                            </span>
                            <p className="font-medium">
                              {doc.expiryDate.toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {doc.status === 'processing' && (
                    <div className="bg-primary-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-blue-900">
                          Processing document with AI verification...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 border border-border rounded-lg hover:bg-bg-secondary transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Coverage Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Coverage Assessment */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Coverage Assessment
                </h2>
                <p className="text-text-secondary">
                  How your insurance coverage compares to industry standards
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-primary-600">
                    {getCompletionPercentage()}%
                  </span>
                </div>
                <p className="text-sm text-text-secondary">Coverage Score</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-success-50 rounded-lg">
                <TrendingUp
                  className="text-success-600 mx-auto mb-2"
                  size={24}
                />
                <p className="font-medium text-green-900">Above Average</p>
                <p className="text-sm text-success-600">1 coverage type</p>
              </div>
              <div className="text-center p-4 bg-accent-400/10 rounded-lg">
                <AlertTriangle
                  className="text-secondary-600 mx-auto mb-2"
                  size={24}
                />
                <p className="font-medium text-orange-900">Needs Improvement</p>
                <p className="text-sm text-secondary-600">3 coverage types</p>
              </div>
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <Shield className="text-primary-600 mx-auto mb-2" size={24} />
                <p className="font-medium text-blue-900">Total Coverage</p>
                <p className="text-sm text-primary-600">$3M current</p>
              </div>
            </div>
          </div>

          {/* Detailed Assessment */}
          <div className="bg-surface rounded-lg shadow-sm border border-border">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">
                Coverage Breakdown
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {coverageAssessments.map((assessment, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-text-primary">
                        {assessment.type}
                      </h4>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assessment.status)}`}
                      >
                        {assessment.status
                          .replace('-', ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-sm text-text-secondary">
                          Your Coverage
                        </p>
                        <p className="text-lg font-bold text-text-primary">
                          {assessment.current > 0
                            ? `$${(assessment.current / 1000000).toFixed(1)}M`
                            : 'None'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-text-secondary">
                          Recommended
                        </p>
                        <p className="text-lg font-bold text-primary-600">
                          ${(assessment.recommended / 1000000).toFixed(1)}M
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-text-secondary">
                          Industry Average
                        </p>
                        <p className="text-lg font-bold text-text-secondary">
                          ${(assessment.industryAverage / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>

                    <div className="bg-bg-secondary p-3 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="text-primary-600 mt-0.5" size={16} />
                        <p className="text-sm text-text-primary">
                          {assessment.reasoning}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2 border border-border rounded-lg hover:bg-bg-secondary transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Recommendations
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Recommendations */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-surface rounded-lg shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              Personalized Coverage Recommendations
            </h2>

            <div className="space-y-6">
              {/* Priority Recommendations */}
              <div className="bg-accent-400/10 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="text-secondary-600" size={20} />
                  <h3 className="font-medium text-orange-900">
                    Priority Actions
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">
                        Increase Workers Compensation
                      </p>
                      <p className="text-sm text-text-secondary">
                        From $1M to $1.5M coverage
                      </p>
                    </div>
                    <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                      Get Quote
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">
                        Add Professional Liability
                      </p>
                      <p className="text-sm text-text-secondary">
                        $1M coverage recommended
                      </p>
                    </div>
                    <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
                      Get Quote
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Recommendations */}
              <div className="bg-primary-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Info className="text-primary-600" size={20} />
                  <h3 className="font-medium text-blue-900">
                    Additional Recommendations
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">
                        Commercial Auto Insurance
                      </p>
                      <p className="text-sm text-text-secondary">
                        $1M coverage for business vehicles
                      </p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Get Quote
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">
                        Umbrella Policy
                      </p>
                      <p className="text-sm text-text-secondary">
                        $5M additional liability protection
                      </p>
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Get Quote
                    </button>
                  </div>
                </div>
              </div>

              {/* Cost Estimate */}
              <div className="bg-success-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-3">
                  Estimated Annual Cost
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-text-secondary">
                      Current Annual Premium
                    </p>
                    <p className="text-2xl font-bold text-text-primary">
                      $5,600
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">
                      With Recommendations
                    </p>
                    <p className="text-2xl font-bold text-success-600">
                      $8,400
                    </p>
                  </div>
                </div>
                <p className="text-sm text-success-700 mt-2">
                  Additional $2,800/year for comprehensive coverage that meets
                  industry standards
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2 border border-border rounded-lg hover:bg-bg-secondary transition-colors"
              >
                Back
              </button>
              <div className="space-x-3">
                <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Shop Insurance
                </button>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Complete Onboarding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Upload Documents
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-text-tertiary hover:text-text-secondary"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-primary-50' : 'border-border'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto mb-4 text-text-tertiary" size={48} />
              <p className="text-lg font-medium text-text-primary mb-2">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-text-secondary mb-4">
                Supported formats: PDF, JPG, PNG (max 10MB)
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Choose Files
              </button>
            </div>

            <div className="mt-4 text-xs text-text-secondary">
              <p>• Certificates of Insurance (COI)</p>
              <p>• Full insurance policies</p>
              <p>• Professional licenses</p>
              <p>• Surety bonds</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
