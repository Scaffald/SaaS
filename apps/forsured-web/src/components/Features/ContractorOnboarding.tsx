import { useState } from 'react';
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
  Loader2,
} from 'lucide-react';
import { Stack, Row, Text, H1, H2, H3, Button, Card } from '@unicornlove/beyond-ui';
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

function getStatusColor(status: string): React.CSSProperties {
  switch (status) {
    case 'excellent':
      return { color: 'var(--color-green-11)', backgroundColor: 'var(--color-green-2)' };
    case 'adequate':
      return { color: 'var(--color-blue-11)', backgroundColor: 'var(--color-blue-2)' };
    case 'below-recommended':
      return { color: 'var(--color-gray-11)', backgroundColor: 'var(--color-gray-2)' };
    default:
      return { color: 'var(--color-11)', backgroundColor: 'var(--color-background-hover)' };
  }
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

  const getCompletionPercentage = () => {
    const totalCoverageTypes = 4;
    const adequateCoverage = coverageAssessments.filter(
      (c) => c.status === 'adequate' || c.status === 'excellent'
    ).length;
    return Math.round((adequateCoverage / totalCoverageTypes) * 100);
  };

  return (
    <Stack style={{ gap: '24px' }}>
      {/* Header */}
      <Stack>
        <H1 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-12)' }}>
          Contractor Onboarding
        </H1>
        <Text style={{ color: 'var(--color-11)' }}>
          Upload your insurance documents and get a comprehensive coverage
          assessment
        </Text>
      </Stack>

      {/* Progress Steps */}
      <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '24px' }}>
        <Row style={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {steps.map((step, index) => (
            <Row key={step.id} style={{ alignItems: 'center', flex: 1, minWidth: 200 }}>
              <Row style={{ alignItems: 'center' }}>
                <Stack
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    display: 'flex',
                    backgroundColor: currentStep >= step.id ? 'var(--color-blue-10)' : 'var(--color-background-hover)',
                  }}
                >
                  {currentStep > step.id ? (
                    <CheckCircle size={20} color="white" />
                  ) : (
                    <Text
                      style={{
                        fontWeight: 500,
                        color: currentStep >= step.id ? 'white' : 'var(--color-11)',
                      }}
                    >
                      {step.id}
                    </Text>
                  )}
                </Stack>
                <Stack style={{ marginLeft: '12px' }}>
                  <Text
                    style={{
                      fontWeight: 500,
                      color: currentStep >= step.id ? 'var(--color-12)' : 'var(--color-11)',
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
                <ArrowRight size={20} color="var(--color-gray-8)" style={{ marginLeft: '24px', marginRight: '24px' }} />
              )}
            </Row>
          ))}
        </Row>
      </Card>

      {/* Step 1: Document Upload */}
      {currentStep === 1 && (
        <Stack style={{ gap: '24px' }}>
          <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '24px' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <H2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)' }}>
                Upload Your Insurance Documents
              </H2>
              <Button
                onPress={() => setShowUploadModal(true)}
                style={{
                  backgroundColor: 'var(--color-blue-10)',
                  color: 'white',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  borderRadius: '8px',
                }}
              >
                <Row style={{ alignItems: 'center', gap: '8px' }}>
                  <Upload size={16} />
                  <Text>Upload Documents</Text>
                </Row>
              </Button>
            </Row>

            {/* Document Types Guide */}
            <Row style={{ flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <Card style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', flex: 1, minWidth: '45%' }}>
                <FileText size={24} color="var(--color-blue-10)" style={{ marginBottom: '8px' }} />
                <H3 style={{ fontWeight: 500, color: 'var(--color-12)', marginBottom: '4px' }}>
                  Certificate of Insurance
                </H3>
                <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                  COI documents showing current coverage
                </Text>
              </Card>
              <Card style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', flex: 1, minWidth: '45%' }}>
                <Shield size={24} color="var(--color-green-10)" style={{ marginBottom: '8px' }} />
                <H3 style={{ fontWeight: 500, color: 'var(--color-12)', marginBottom: '4px' }}>
                  Insurance Policies
                </H3>
                <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                  Full policy documents with terms
                </Text>
              </Card>
              <Card style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', flex: 1, minWidth: '45%' }}>
                <Award size={24} color="var(--color-gray-10)" style={{ marginBottom: '8px' }} />
                <H3 style={{ fontWeight: 500, color: 'var(--color-12)', marginBottom: '4px' }}>Licenses</H3>
                <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                  Professional and trade licenses
                </Text>
              </Card>
              <Card style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '8px', flex: 1, minWidth: '45%' }}>
                <DollarSign size={24} color="var(--color-gray-11)" style={{ marginBottom: '8px' }} />
                <H3 style={{ fontWeight: 500, color: 'var(--color-12)', marginBottom: '4px' }}>Bonds</H3>
                <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                  Surety bonds and guarantees
                </Text>
              </Card>
            </Row>

            {/* Uploaded Documents */}
            <Stack style={{ gap: '12px' }}>
              <H3 style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                Uploaded Documents ({uploadedDocs.length})
              </H3>
              {uploadedDocs.map((doc) => (
                <Row
                  key={doc.id}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                >
                  <Row style={{ alignItems: 'center', gap: '12px' }}>
                    <FileText size={20} color="var(--color-10)" />
                    <Stack>
                      <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                        {doc.name}
                      </Text>
                      <Row style={{ alignItems: 'center', gap: '8px' }}>
                        <Text style={{ fontSize: '14px', color: 'var(--color-11)', textTransform: 'capitalize' }}>
                          {doc.type}
                        </Text>
                        {doc.provider && (
                          <>
                            <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>•</Text>
                            <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>{doc.provider}</Text>
                          </>
                        )}
                        {doc.expiryDate && (
                          <>
                            <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>•</Text>
                            <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                              Expires: {doc.expiryDate.toLocaleDateString()}
                            </Text>
                          </>
                        )}
                      </Row>
                    </Stack>
                  </Row>
                  <Row style={{ alignItems: 'center', gap: '12px' }}>
                    <StatusBadge status={doc.status} size="sm" />
                    <Button style={{ padding: '4px', color: 'var(--color-10)', background: 'none', border: 'none' }}>
                      <Eye size={16} />
                    </Button>
                    <Button style={{ padding: '4px', color: 'var(--color-10)', background: 'none', border: 'none' }}>
                      <Download size={16} />
                    </Button>
                  </Row>
                </Row>
              ))}
            </Stack>

            <Row style={{ marginTop: '24px', justifyContent: 'flex-end' }}>
              <Button
                onPress={() => setCurrentStep(2)}
                style={{
                  backgroundColor: 'var(--color-blue-10)',
                  color: 'white',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  borderRadius: '8px',
                }}
              >
                Continue to Review
              </Button>
            </Row>
          </Card>
        </Stack>
      )}

      {/* Step 2: Document Review */}
      {currentStep === 2 && (
        <Stack style={{ gap: '24px' }}>
          <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '24px' }}>
            <H2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)', marginBottom: '24px' }}>
              Document Verification Status
            </H2>

            <Stack style={{ gap: '16px' }}>
              {uploadedDocs.map((doc) => (
                <Card
                  key={doc.id}
                  style={{
                    padding: '16px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                >
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <H3 style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                      {doc.name}
                    </H3>
                    <StatusBadge status={doc.status} />
                  </Row>

                  {doc.status === 'verified' && (
                    <Card style={{ backgroundColor: 'var(--color-green-2)', padding: '12px', borderRadius: '8px' }}>
                      <Row style={{ alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <CheckCircle size={16} color="var(--color-green-11)" />
                        <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-green-12)' }}>
                          Verification Complete
                        </Text>
                      </Row>
                      <Row style={{ flexWrap: 'wrap', gap: '16px' }}>
                        {doc.coverage && (
                          <Stack>
                            <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                              Coverage:
                            </Text>
                            <Text style={{ fontSize: '14px', fontWeight: 500 }}>
                              ${doc.coverage.toLocaleString()}
                            </Text>
                          </Stack>
                        )}
                        {doc.premium && (
                          <Stack>
                            <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                              Annual Premium:
                            </Text>
                            <Text style={{ fontSize: '14px', fontWeight: 500 }}>
                              ${doc.premium.toLocaleString()}
                            </Text>
                          </Stack>
                        )}
                        {doc.policyNumber && (
                          <Stack>
                            <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                              Policy Number:
                            </Text>
                            <Text style={{ fontSize: '14px', fontWeight: 500 }}>{doc.policyNumber}</Text>
                          </Stack>
                        )}
                        {doc.expiryDate && (
                          <Stack>
                            <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                              Expires:
                            </Text>
                            <Text style={{ fontSize: '14px', fontWeight: 500 }}>
                              {doc.expiryDate.toLocaleDateString()}
                            </Text>
                          </Stack>
                        )}
                      </Row>
                    </Card>
                  )}

                  {doc.status === 'processing' && (
                    <Card style={{ backgroundColor: 'var(--color-blue-2)', padding: '12px', borderRadius: '8px' }}>
                      <Row style={{ alignItems: 'center', gap: '8px' }}>
                        <Loader2 size={16} color="var(--color-blue-10)" className="animate-spin" />
                        <Text style={{ fontSize: '14px', color: 'var(--color-blue-12)' }}>
                          Processing document with AI verification...
                        </Text>
                      </Row>
                    </Card>
                  )}
                </Card>
              ))}
            </Stack>

            <Row style={{ marginTop: '24px', justifyContent: 'space-between' }}>
              <Button
                onPress={() => setCurrentStep(1)}
                style={{
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                }}
              >
                Back
              </Button>
              <Button
                onPress={() => setCurrentStep(3)}
                style={{
                  backgroundColor: 'var(--color-blue-10)',
                  color: 'white',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  borderRadius: '8px',
                }}
              >
                View Coverage Assessment
              </Button>
            </Row>
          </Card>
        </Stack>
      )}

      {/* Step 3: Coverage Assessment */}
      {currentStep === 3 && (
        <Stack style={{ gap: '24px' }}>
          {/* Overall Score */}
          <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '24px' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <Stack>
                <H2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)' }}>
                  Coverage Assessment
                </H2>
                <Text style={{ color: 'var(--color-11)' }}>
                  How your insurance coverage compares to industry standards
                </Text>
              </Stack>
              <Stack style={{ alignItems: 'center' }}>
                <Row
                  style={{
                    width: 80,
                    height: 80,
                    backgroundColor: 'var(--color-blue-2)',
                    borderRadius: '50%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    display: 'flex',
                    marginBottom: '8px',
                  }}
                >
                  <Text style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-blue-11)' }}>
                    {getCompletionPercentage()}%
                  </Text>
                </Row>
                <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>Coverage Score</Text>
              </Stack>
            </Row>

            <Row style={{ flexWrap: 'wrap', gap: '24px' }}>
              <Card style={{ alignItems: 'center', padding: '16px', backgroundColor: 'var(--color-green-2)', borderRadius: '8px', flex: 1, minWidth: '30%', display: 'flex', flexDirection: 'column' }}>
                <TrendingUp size={24} color="var(--color-green-11)" style={{ marginBottom: '8px' }} />
                <Text style={{ fontWeight: 500, color: 'var(--color-green-12)' }}>Above Average</Text>
                <Text style={{ fontSize: '14px', color: 'var(--color-green-11)' }}>1 coverage type</Text>
              </Card>
              <Card style={{ alignItems: 'center', padding: '16px', backgroundColor: 'var(--color-orange-2)', borderRadius: '8px', flex: 1, minWidth: '30%', display: 'flex', flexDirection: 'column' }}>
                <AlertTriangle size={24} color="var(--color-orange-11)" style={{ marginBottom: '8px' }} />
                <Text style={{ fontWeight: 500, color: 'var(--color-orange-12)' }}>Needs Improvement</Text>
                <Text style={{ fontSize: '14px', color: 'var(--color-orange-11)' }}>3 coverage types</Text>
              </Card>
              <Card style={{ alignItems: 'center', padding: '16px', backgroundColor: 'var(--color-blue-2)', borderRadius: '8px', flex: 1, minWidth: '30%', display: 'flex', flexDirection: 'column' }}>
                <Shield size={24} color="var(--color-blue-11)" style={{ marginBottom: '8px' }} />
                <Text style={{ fontWeight: 500, color: 'var(--color-blue-12)' }}>Total Coverage</Text>
                <Text style={{ fontSize: '14px', color: 'var(--color-blue-11)' }}>$3M current</Text>
              </Card>
            </Row>
          </Card>

          {/* Detailed Assessment */}
          <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <Stack style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
              <H3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)' }}>
                Coverage Breakdown
              </H3>
            </Stack>
            <Stack style={{ padding: '24px' }}>
              <Stack style={{ gap: '24px' }}>
                {coverageAssessments.map((assessment, index) => (
                  <Card
                    key={index}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '16px',
                    }}
                  >
                    <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <H3 style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                        {assessment.type}
                      </H3>
                      <Row
                        style={{
                          paddingLeft: '12px',
                          paddingRight: '12px',
                          paddingTop: '4px',
                          paddingBottom: '4px',
                          borderRadius: '9999px',
                          fontSize: '14px',
                          fontWeight: 500,
                          ...getStatusColor(assessment.status),
                        }}
                      >
                        <Text>
                          {assessment.status
                            .replace('-', ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Text>
                      </Row>
                    </Row>

                    <Row style={{ gap: '16px', marginBottom: '16px' }}>
                      <Stack style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                          Your Coverage
                        </Text>
                        <Text style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-12)' }}>
                          {assessment.current > 0
                            ? `$${(assessment.current / 1000000).toFixed(1)}M`
                            : 'None'}
                        </Text>
                      </Stack>
                      <Stack style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                          Recommended
                        </Text>
                        <Text style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-blue-11)' }}>
                          ${(assessment.recommended / 1000000).toFixed(1)}M
                        </Text>
                      </Stack>
                      <Stack style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                          Industry Average
                        </Text>
                        <Text style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-11)' }}>
                          ${(assessment.industryAverage / 1000000).toFixed(1)}M
                        </Text>
                      </Stack>
                    </Row>

                    <Card style={{ backgroundColor: 'var(--color-background-hover)', padding: '12px', borderRadius: '8px' }}>
                      <Row style={{ alignItems: 'flex-start', gap: '8px' }}>
                        <Info size={16} color="var(--color-blue-11)" style={{ marginTop: '2px' }} />
                        <Text style={{ fontSize: '14px', color: 'var(--color-12)' }}>
                          {assessment.reasoning}
                        </Text>
                      </Row>
                    </Card>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Card>

          <Row style={{ justifyContent: 'space-between' }}>
            <Button
              onPress={() => setCurrentStep(2)}
              style={{
                paddingLeft: '24px',
                paddingRight: '24px',
                paddingTop: '8px',
                paddingBottom: '8px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                backgroundColor: 'transparent',
              }}
            >
              Back
            </Button>
            <Button
              onPress={() => setCurrentStep(4)}
              style={{
                backgroundColor: 'var(--color-blue-10)',
                color: 'white',
                paddingLeft: '24px',
                paddingRight: '24px',
                paddingTop: '8px',
                paddingBottom: '8px',
                borderRadius: '8px',
              }}
            >
              Get Recommendations
            </Button>
          </Row>
        </Stack>
      )}

      {/* Step 4: Recommendations */}
      {currentStep === 4 && (
        <Stack style={{ gap: '24px' }}>
          <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '24px' }}>
            <H2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)', marginBottom: '24px' }}>
              Personalized Coverage Recommendations
            </H2>

            <Stack style={{ gap: '24px' }}>
              {/* Priority Recommendations */}
              <Card style={{ backgroundColor: 'var(--color-orange-2)', border: '1px solid var(--color-orange-6)', borderRadius: '8px', padding: '16px' }}>
                <Row style={{ alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <AlertTriangle size={20} color="var(--color-orange-11)" />
                  <H3 style={{ fontWeight: 500, color: 'var(--color-orange-12)' }}>
                    Priority Actions
                  </H3>
                </Row>
                <Stack style={{ gap: '12px' }}>
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
                    <Stack>
                      <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                        Increase Workers Compensation
                      </Text>
                      <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                        From $1M to $1.5M coverage
                      </Text>
                    </Stack>
                    <Button style={{ backgroundColor: 'var(--color-orange-10)', color: 'white', paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px' }}>
                      Get Quote
                    </Button>
                  </Row>
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
                    <Stack>
                      <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                        Add Professional Liability
                      </Text>
                      <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                        $1M coverage recommended
                      </Text>
                    </Stack>
                    <Button style={{ backgroundColor: 'var(--color-orange-10)', color: 'white', paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px' }}>
                      Get Quote
                    </Button>
                  </Row>
                </Stack>
              </Card>

              {/* Additional Recommendations */}
              <Card style={{ backgroundColor: 'var(--color-blue-2)', border: '1px solid var(--color-blue-6)', borderRadius: '8px', padding: '16px' }}>
                <Row style={{ alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Info size={20} color="var(--color-blue-11)" />
                  <H3 style={{ fontWeight: 500, color: 'var(--color-blue-12)' }}>
                    Additional Recommendations
                  </H3>
                </Row>
                <Stack style={{ gap: '12px' }}>
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
                    <Stack>
                      <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                        Commercial Auto Insurance
                      </Text>
                      <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                        $1M coverage for business vehicles
                      </Text>
                    </Stack>
                    <Button style={{ backgroundColor: 'var(--color-blue-10)', color: 'white', paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px' }}>
                      Get Quote
                    </Button>
                  </Row>
                  <Row style={{ alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
                    <Stack>
                      <Text style={{ fontWeight: 500, color: 'var(--color-12)' }}>
                        Umbrella Policy
                      </Text>
                      <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                        $5M additional liability protection
                      </Text>
                    </Stack>
                    <Button style={{ backgroundColor: 'var(--color-blue-10)', color: 'white', paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px' }}>
                      Get Quote
                    </Button>
                  </Row>
                </Stack>
              </Card>

              {/* Cost Estimate */}
              <Card style={{ backgroundColor: 'var(--color-green-2)', border: '1px solid var(--color-green-6)', borderRadius: '8px', padding: '16px' }}>
                <H3 style={{ fontWeight: 500, color: 'var(--color-green-12)', marginBottom: '12px' }}>
                  Estimated Annual Cost
                </H3>
                <Row style={{ gap: '16px' }}>
                  <Stack style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                      Current Annual Premium
                    </Text>
                    <Text style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-12)' }}>
                      $5,600
                    </Text>
                  </Stack>
                  <Stack style={{ flex: 1 }}>
                    <Text style={{ fontSize: '14px', color: 'var(--color-11)' }}>
                      With Recommendations
                    </Text>
                    <Text style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-green-11)' }}>
                      $8,400
                    </Text>
                  </Stack>
                </Row>
                <Text style={{ fontSize: '14px', color: 'var(--color-green-12)', marginTop: '8px' }}>
                  Additional $2,800/year for comprehensive coverage that meets
                  industry standards
                </Text>
              </Card>
            </Stack>

            <Row style={{ marginTop: '24px', justifyContent: 'space-between' }}>
              <Button
                onPress={() => setCurrentStep(3)}
                style={{
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                }}
              >
                Back
              </Button>
              <Row style={{ gap: '12px' }}>
                <Button style={{ backgroundColor: 'var(--color-green-10)', color: 'white', paddingLeft: '24px', paddingRight: '24px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px' }}>
                  Shop Insurance
                </Button>
                <Button style={{ backgroundColor: 'var(--color-blue-10)', color: 'white', paddingLeft: '24px', paddingRight: '24px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px' }}>
                  Complete Onboarding
                </Button>
              </Row>
            </Row>
          </Card>
        </Stack>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
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
          <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: 600 }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <H3 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-12)' }}>
                Upload Documents
              </H3>
              <Button onPress={() => setShowUploadModal(false)} style={{ color: 'var(--color-10)', background: 'none', border: 'none' }}>
                <X size={20} />
              </Button>
            </Row>

            <Stack
              style={{
                border: '2px dashed',
                borderRadius: '8px',
                padding: '32px',
                alignItems: 'center',
                display: 'flex',
                borderColor: dragActive ? 'var(--color-blue-10)' : 'var(--color-border)',
                backgroundColor: dragActive ? 'var(--color-blue-2)' : 'transparent',
              }}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload size={48} color="var(--color-10)" style={{ marginBottom: '16px' }} />
              <Text style={{ fontSize: '24px', fontWeight: 500, color: 'var(--color-12)', marginBottom: '8px' }}>
                Drop files here or click to upload
              </Text>
              <Text style={{ fontSize: '14px', color: 'var(--color-11)', marginBottom: '16px' }}>
                Supported formats: PDF, JPG, PNG (max 10MB)
              </Text>
              <Button style={{ backgroundColor: 'var(--color-blue-10)', color: 'white', paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', borderRadius: '8px' }}>
                Choose Files
              </Button>
            </Stack>

            <Stack style={{ marginTop: '16px' }}>
              <Text style={{ fontSize: '12px', color: 'var(--color-11)' }}>• Certificates of Insurance (COI)</Text>
              <Text style={{ fontSize: '12px', color: 'var(--color-11)' }}>• Full insurance policies</Text>
              <Text style={{ fontSize: '12px', color: 'var(--color-11)' }}>• Professional licenses</Text>
              <Text style={{ fontSize: '12px', color: 'var(--color-11)' }}>• Surety bonds</Text>
            </Stack>
          </Card>
        </Stack>
      )}
    </Stack>
  );
}
