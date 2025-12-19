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
} from 'lucide-react';
import { YStack, XStack, Text, H1, H2, H3, Button as TamaguiButton, Card, Spinner } from '@unicornlove/ui';
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
        return { color: '$green11', backgroundColor: '$green2' };
      case 'adequate':
        return { color: '$blue11', backgroundColor: '$blue2' };
      case 'below-recommended':
        return { color: '$gray11', backgroundColor: '$gray2' };
      default:
        return { color: '$color11', backgroundColor: '$backgroundHover' };
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
    <YStack gap="$6">
      {/* Header */}
      <YStack>
        <H1 fontSize="$8" fontWeight="700" color="$color12">
          Contractor Onboarding
        </H1>
        <Text color="$color11">
          Upload your insurance documents and get a comprehensive coverage
          assessment
        </Text>
      </YStack>

      {/* Progress Steps */}
      <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6">
        <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$4">
          {steps.map((step, index) => (
            <XStack key={step.id} alignItems="center" flex={1} minWidth={200}>
              <XStack alignItems="center">
                <YStack
                  width={40}
                  height={40}
                  borderRadius={9999}
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor={currentStep >= step.id ? "$blue10" : "$backgroundHover"}
                >
                  {currentStep > step.id ? (
                    <CheckCircle size={20} color="white" />
                  ) : (
                    <Text
                      fontWeight="500"
                      color={currentStep >= step.id ? "white" : "$color11"}
                    >
                      {step.id}
                    </Text>
                  )}
                </YStack>
                <YStack marginLeft="$3">
                  <Text
                    fontWeight="500"
                    color={currentStep >= step.id ? "$color12" : "$color11"}
                  >
                    {step.title}
                  </Text>
                  <Text fontSize="$3" color="$color11">
                    {step.description}
                  </Text>
                </YStack>
              </XStack>
              {index < steps.length - 1 && (
                <ArrowRight size={20} color="$gray8" marginHorizontal="$6" />
              )}
            </XStack>
          ))}
        </XStack>
      </Card>

      {/* Step 1: Document Upload */}
      {currentStep === 1 && (
        <YStack gap="$6">
          <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6">
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
              <H2 fontSize="$6" fontWeight="600" color="$color12">
                Upload Your Insurance Documents
              </H2>
              <TamaguiButton
                onPress={() => setShowUploadModal(true)}
                backgroundColor="$blue10"
                color="white"
                paddingHorizontal="$4"
                paddingVertical="$2"
                borderRadius="$4"
                hoverStyle={{ backgroundColor: '$blue11' }}
              >
                <XStack alignItems="center" gap="$2">
                <Upload size={16} />
                  <Text>Upload Documents</Text>
                </XStack>
              </TamaguiButton>
            </XStack>

            {/* Document Types Guide */}
            <XStack flexWrap="wrap" gap="$4" marginBottom="$6">
              <Card padding="$4" borderWidth={1} borderColor="$borderColor" borderRadius="$4" flex={1} minWidth="45%" $gtMd={{ minWidth: '22%' }}>
                <FileText size={24} color="$blue10" marginBottom="$2" />
                <H3 fontWeight="500" color="$color12" marginBottom="$1">
                  Certificate of Insurance
                </H3>
                <Text fontSize="$3" color="$color11">
                  COI documents showing current coverage
                </Text>
              </Card>
              <Card padding="$4" borderWidth={1} borderColor="$borderColor" borderRadius="$4" flex={1} minWidth="45%" $gtMd={{ minWidth: '22%' }}>
                <Shield size={24} color="$green10" marginBottom="$2" />
                <H3 fontWeight="500" color="$color12" marginBottom="$1">
                  Insurance Policies
                </H3>
                <Text fontSize="$3" color="$color11">
                  Full policy documents with terms
                </Text>
              </Card>
              <Card padding="$4" borderWidth={1} borderColor="$borderColor" borderRadius="$4" flex={1} minWidth="45%" $gtMd={{ minWidth: '22%' }}>
                <Award size={24} color="$gray10" marginBottom="$2" />
                <H3 fontWeight="500" color="$color12" marginBottom="$1">Licenses</H3>
                <Text fontSize="$3" color="$color11">
                  Professional and trade licenses
                </Text>
              </Card>
              <Card padding="$4" borderWidth={1} borderColor="$borderColor" borderRadius="$4" flex={1} minWidth="45%" $gtMd={{ minWidth: '22%' }}>
                <DollarSign size={24} color="$gray11" marginBottom="$2" />
                <H3 fontWeight="500" color="$color12" marginBottom="$1">Bonds</H3>
                <Text fontSize="$3" color="$color11">
                  Surety bonds and guarantees
                </Text>
              </Card>
            </XStack>

            {/* Uploaded Documents */}
            <YStack gap="$3">
              <H3 fontWeight="500" color="$color12">
                Uploaded Documents ({uploadedDocs.length})
              </H3>
              {uploadedDocs.map((doc) => (
                <XStack
                  key={doc.id}
                  alignItems="center"
                  justifyContent="space-between"
                  padding="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                >
                  <XStack alignItems="center" gap="$3">
                    <FileText size={20} color="$color10" />
                    <YStack>
                      <Text fontWeight="500" color="$color12">
                        {doc.name}
                      </Text>
                      <XStack alignItems="center" gap="$2">
                        <Text fontSize="$3" color="$color11" textTransform="capitalize">
                          {doc.type}
                        </Text>
                        {doc.provider && (
                          <>
                            <Text fontSize="$3" color="$color11">•</Text>
                            <Text fontSize="$3" color="$color11">{doc.provider}</Text>
                          </>
                        )}
                        {doc.expiryDate && (
                          <>
                            <Text fontSize="$3" color="$color11">•</Text>
                            <Text fontSize="$3" color="$color11">
                              Expires: {doc.expiryDate.toLocaleDateString()}
                            </Text>
                          </>
                        )}
                      </XStack>
                    </YStack>
                  </XStack>
                  <XStack alignItems="center" gap="$3">
                    <StatusBadge status={doc.status} size="sm" />
                    <TamaguiButton unstyled padding="$1" color="$color10" hoverStyle={{ color: '$color11' }}>
                      <Eye size={16} />
                    </TamaguiButton>
                    <TamaguiButton unstyled padding="$1" color="$color10" hoverStyle={{ color: '$color11' }}>
                      <Download size={16} />
                    </TamaguiButton>
                  </XStack>
                </XStack>
              ))}
            </YStack>

            <XStack marginTop="$6" justifyContent="flex-end">
              <TamaguiButton
                onPress={() => setCurrentStep(2)}
                backgroundColor="$blue10"
                color="white"
                paddingHorizontal="$6"
                paddingVertical="$2"
                borderRadius="$4"
                hoverStyle={{ backgroundColor: '$blue11' }}
              >
                Continue to Review
              </TamaguiButton>
            </XStack>
          </Card>
        </YStack>
      )}

      {/* Step 2: Document Review */}
      {currentStep === 2 && (
        <YStack gap="$6">
          <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6">
            <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$6">
              Document Verification Status
            </H2>

            <YStack gap="$4">
              {uploadedDocs.map((doc) => (
                <Card
                  key={doc.id}
                  padding="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                >
                  <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
                    <H3 fontWeight="500" color="$color12">
                      {doc.name}
                    </H3>
                    <StatusBadge status={doc.status} />
                  </XStack>

                  {doc.status === 'verified' && (
                    <Card backgroundColor="$green2" padding="$3" borderRadius="$4">
                      <XStack alignItems="center" gap="$2" marginBottom="$2">
                        <CheckCircle size={16} color="$green11" />
                        <Text fontSize="$3" fontWeight="500" color="$green12">
                          Verification Complete
                        </Text>
                      </XStack>
                      <XStack flexWrap="wrap" gap="$4">
                        {doc.coverage && (
                          <YStack>
                            <Text fontSize="$3" color="$color11">
                              Coverage:
                            </Text>
                            <Text fontSize="$3" fontWeight="500">
                              ${doc.coverage.toLocaleString()}
                            </Text>
                          </YStack>
                        )}
                        {doc.premium && (
                          <YStack>
                            <Text fontSize="$3" color="$color11">
                              Annual Premium:
                            </Text>
                            <Text fontSize="$3" fontWeight="500">
                              ${doc.premium.toLocaleString()}
                            </Text>
                          </YStack>
                        )}
                        {doc.policyNumber && (
                          <YStack>
                            <Text fontSize="$3" color="$color11">
                              Policy Number:
                            </Text>
                            <Text fontSize="$3" fontWeight="500">{doc.policyNumber}</Text>
                          </YStack>
                        )}
                        {doc.expiryDate && (
                          <YStack>
                            <Text fontSize="$3" color="$color11">
                              Expires:
                            </Text>
                            <Text fontSize="$3" fontWeight="500">
                              {doc.expiryDate.toLocaleDateString()}
                            </Text>
                          </YStack>
                        )}
                      </XStack>
                    </Card>
                  )}

                  {doc.status === 'processing' && (
                    <Card backgroundColor="$blue2" padding="$3" borderRadius="$4">
                      <XStack alignItems="center" gap="$2">
                        <Spinner size="small" color="$blue10" />
                        <Text fontSize="$3" color="$blue12">
                          Processing document with AI verification...
                        </Text>
                      </XStack>
                    </Card>
                  )}
                </Card>
              ))}
            </YStack>

            <XStack marginTop="$6" justifyContent="space-between">
              <TamaguiButton
                onPress={() => setCurrentStep(1)}
                paddingHorizontal="$6"
                paddingVertical="$2"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                backgroundColor="transparent"
                hoverStyle={{ backgroundColor: '$backgroundHover' }}
              >
                Back
              </TamaguiButton>
              <TamaguiButton
                onPress={() => setCurrentStep(3)}
                backgroundColor="$blue10"
                color="white"
                paddingHorizontal="$6"
                paddingVertical="$2"
                borderRadius="$4"
                hoverStyle={{ backgroundColor: '$blue11' }}
              >
                View Coverage Assessment
              </TamaguiButton>
            </XStack>
          </Card>
        </YStack>
      )}

      {/* Step 3: Coverage Assessment */}
      {currentStep === 3 && (
        <YStack gap="$6">
          {/* Overall Score */}
          <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6">
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
              <YStack>
                <H2 fontSize="$6" fontWeight="600" color="$color12">
                  Coverage Assessment
                </H2>
                <Text color="$color11">
                  How your insurance coverage compares to industry standards
                </Text>
              </YStack>
              <YStack alignItems="center">
                <XStack
                  width={80}
                  height={80}
                  backgroundColor="$blue2"
                  borderRadius={9999}
                  alignItems="center"
                  justifyContent="center"
                  marginBottom="$2"
                >
                  <Text fontSize="$8" fontWeight="700" color="$blue11">
                    {getCompletionPercentage()}%
                  </Text>
                </XStack>
                <Text fontSize="$3" color="$color11">Coverage Score</Text>
              </YStack>
            </XStack>

            <XStack flexWrap="wrap" gap="$6">
              <Card alignItems="center" padding="$4" backgroundColor="$green2" borderRadius="$4" flex={1} minWidth="30%">
                <TrendingUp size={24} color="$green11" marginBottom="$2" />
                <Text fontWeight="500" color="$green12">Above Average</Text>
                <Text fontSize="$3" color="$green11">1 coverage type</Text>
              </Card>
              <Card alignItems="center" padding="$4" backgroundColor="$orange2" borderRadius="$4" flex={1} minWidth="30%">
                <AlertTriangle size={24} color="$orange11" marginBottom="$2" />
                <Text fontWeight="500" color="$orange12">Needs Improvement</Text>
                <Text fontSize="$3" color="$orange11">3 coverage types</Text>
              </Card>
              <Card alignItems="center" padding="$4" backgroundColor="$blue2" borderRadius="$4" flex={1} minWidth="30%">
                <Shield size={24} color="$blue11" marginBottom="$2" />
                <Text fontWeight="500" color="$blue12">Total Coverage</Text>
                <Text fontSize="$3" color="$blue11">$3M current</Text>
              </Card>
            </XStack>
          </Card>

          {/* Detailed Assessment */}
          <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor">
            <YStack padding="$6" borderBottomWidth={1} borderColor="$borderColor">
              <H3 fontSize="$6" fontWeight="600" color="$color12">
                Coverage Breakdown
              </H3>
            </YStack>
            <YStack padding="$6">
              <YStack gap="$6">
                {coverageAssessments.map((assessment, index) => (
                  <Card
                    key={index}
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$4"
                    padding="$4"
                  >
                    <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
                      <H3 fontWeight="500" color="$color12">
                        {assessment.type}
                      </H3>
                      <XStack
                        paddingHorizontal="$3"
                        paddingVertical="$1"
                        borderRadius={9999}
                        fontSize="$3"
                        fontWeight="500"
                        {...getStatusColor(assessment.status)}
                      >
                        <Text>
                        {assessment.status
                          .replace('-', ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Text>
                      </XStack>
                    </XStack>

                    <XStack gap="$4" marginBottom="$4">
                      <YStack alignItems="center" flex={1}>
                        <Text fontSize="$3" color="$color11">
                          Your Coverage
                        </Text>
                        <Text fontSize="$6" fontWeight="700" color="$color12">
                          {assessment.current > 0
                            ? `$${(assessment.current / 1000000).toFixed(1)}M`
                            : 'None'}
                        </Text>
                      </YStack>
                      <YStack alignItems="center" flex={1}>
                        <Text fontSize="$3" color="$color11">
                          Recommended
                        </Text>
                        <Text fontSize="$6" fontWeight="700" color="$blue11">
                          ${(assessment.recommended / 1000000).toFixed(1)}M
                        </Text>
                      </YStack>
                      <YStack alignItems="center" flex={1}>
                        <Text fontSize="$3" color="$color11">
                          Industry Average
                        </Text>
                        <Text fontSize="$6" fontWeight="700" color="$color11">
                          ${(assessment.industryAverage / 1000000).toFixed(1)}M
                        </Text>
                      </YStack>
                    </XStack>

                    <Card backgroundColor="$backgroundHover" padding="$3" borderRadius="$4">
                      <XStack alignItems="flex-start" gap="$2">
                        <Info size={16} color="$blue11" marginTop="$0.5" />
                        <Text fontSize="$3" color="$color12">
                          {assessment.reasoning}
                        </Text>
                      </XStack>
                    </Card>
                  </Card>
                ))}
              </YStack>
            </YStack>
          </Card>

          <XStack justifyContent="space-between">
            <TamaguiButton
              onPress={() => setCurrentStep(2)}
              paddingHorizontal="$6"
              paddingVertical="$2"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              backgroundColor="transparent"
              hoverStyle={{ backgroundColor: '$backgroundHover' }}
            >
              Back
            </TamaguiButton>
            <TamaguiButton
              onPress={() => setCurrentStep(4)}
              backgroundColor="$blue10"
              color="white"
              paddingHorizontal="$6"
              paddingVertical="$2"
              borderRadius="$4"
              hoverStyle={{ backgroundColor: '$blue11' }}
            >
              Get Recommendations
            </TamaguiButton>
          </XStack>
        </YStack>
      )}

      {/* Step 4: Recommendations */}
      {currentStep === 4 && (
        <YStack gap="$6">
          <Card backgroundColor="$background" borderRadius="$4" elevation={1} borderWidth={1} borderColor="$borderColor" padding="$6">
            <H2 fontSize="$6" fontWeight="600" color="$color12" marginBottom="$6">
              Personalized Coverage Recommendations
            </H2>

            <YStack gap="$6">
              {/* Priority Recommendations */}
              <Card backgroundColor="$orange2" borderWidth={1} borderColor="$orange6" borderRadius="$4" padding="$4">
                <XStack alignItems="center" gap="$2" marginBottom="$3">
                  <AlertTriangle size={20} color="$orange11" />
                  <H3 fontWeight="500" color="$orange12">
                    Priority Actions
                  </H3>
                </XStack>
                <YStack gap="$3">
                  <XStack alignItems="center" justifyContent="space-between" padding="$3" backgroundColor="$background" borderRadius="$4">
                    <YStack>
                      <Text fontWeight="500" color="$color12">
                        Increase Workers Compensation
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        From $1M to $1.5M coverage
                      </Text>
                    </YStack>
                    <TamaguiButton backgroundColor="$orange10" color="white" paddingHorizontal="$4" paddingVertical="$2" borderRadius="$4" hoverStyle={{ backgroundColor: '$orange11' }}>
                      Get Quote
                    </TamaguiButton>
                  </XStack>
                  <XStack alignItems="center" justifyContent="space-between" padding="$3" backgroundColor="$background" borderRadius="$4">
                    <YStack>
                      <Text fontWeight="500" color="$color12">
                        Add Professional Liability
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        $1M coverage recommended
                      </Text>
                    </YStack>
                    <TamaguiButton backgroundColor="$orange10" color="white" paddingHorizontal="$4" paddingVertical="$2" borderRadius="$4" hoverStyle={{ backgroundColor: '$orange11' }}>
                      Get Quote
                    </TamaguiButton>
                  </XStack>
                </YStack>
              </Card>

              {/* Additional Recommendations */}
              <Card backgroundColor="$blue2" borderWidth={1} borderColor="$blue6" borderRadius="$4" padding="$4">
                <XStack alignItems="center" gap="$2" marginBottom="$3">
                  <Info size={20} color="$blue11" />
                  <H3 fontWeight="500" color="$blue12">
                    Additional Recommendations
                  </H3>
                </XStack>
                <YStack gap="$3">
                  <XStack alignItems="center" justifyContent="space-between" padding="$3" backgroundColor="$background" borderRadius="$4">
                    <YStack>
                      <Text fontWeight="500" color="$color12">
                        Commercial Auto Insurance
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        $1M coverage for business vehicles
                      </Text>
                    </YStack>
                    <TamaguiButton backgroundColor="$blue10" color="white" paddingHorizontal="$4" paddingVertical="$2" borderRadius="$4" hoverStyle={{ backgroundColor: '$blue11' }}>
                      Get Quote
                    </TamaguiButton>
                  </XStack>
                  <XStack alignItems="center" justifyContent="space-between" padding="$3" backgroundColor="$background" borderRadius="$4">
                    <YStack>
                      <Text fontWeight="500" color="$color12">
                        Umbrella Policy
                      </Text>
                      <Text fontSize="$3" color="$color11">
                        $5M additional liability protection
                      </Text>
                    </YStack>
                    <TamaguiButton backgroundColor="$blue10" color="white" paddingHorizontal="$4" paddingVertical="$2" borderRadius="$4" hoverStyle={{ backgroundColor: '$blue11' }}>
                      Get Quote
                    </TamaguiButton>
                  </XStack>
                </YStack>
              </Card>

              {/* Cost Estimate */}
              <Card backgroundColor="$green2" borderWidth={1} borderColor="$green6" borderRadius="$4" padding="$4">
                <H3 fontWeight="500" color="$green12" marginBottom="$3">
                  Estimated Annual Cost
                </H3>
                <XStack gap="$4">
                  <YStack flex={1}>
                    <Text fontSize="$3" color="$color11">
                      Current Annual Premium
                    </Text>
                    <Text fontSize="$8" fontWeight="700" color="$color12">
                      $5,600
                    </Text>
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize="$3" color="$color11">
                      With Recommendations
                    </Text>
                    <Text fontSize="$8" fontWeight="700" color="$green11">
                      $8,400
                    </Text>
                  </YStack>
                </XStack>
                <Text fontSize="$3" color="$green12" marginTop="$2">
                  Additional $2,800/year for comprehensive coverage that meets
                  industry standards
                </Text>
              </Card>
            </YStack>

            <XStack marginTop="$6" justifyContent="space-between">
              <TamaguiButton
                onPress={() => setCurrentStep(3)}
                paddingHorizontal="$6"
                paddingVertical="$2"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                backgroundColor="transparent"
                hoverStyle={{ backgroundColor: '$backgroundHover' }}
              >
                Back
              </TamaguiButton>
              <XStack gap="$3">
                <TamaguiButton backgroundColor="$green10" color="white" paddingHorizontal="$6" paddingVertical="$2" borderRadius="$4" hoverStyle={{ backgroundColor: '$green11' }}>
                  Shop Insurance
                </TamaguiButton>
                <TamaguiButton backgroundColor="$blue10" color="white" paddingHorizontal="$6" paddingVertical="$2" borderRadius="$4" hoverStyle={{ backgroundColor: '$blue11' }}>
                  Complete Onboarding
                </TamaguiButton>
              </XStack>
            </XStack>
          </Card>
        </YStack>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
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
          <Card backgroundColor="$background" borderRadius="$4" padding="$6" width="100%" maxWidth={600}>
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
              <H3 fontSize="$6" fontWeight="600" color="$color12">
                Upload Documents
              </H3>
              <TamaguiButton unstyled onPress={() => setShowUploadModal(false)} color="$color10" hoverStyle={{ color: '$color11' }}>
                <X size={20} />
              </TamaguiButton>
            </XStack>

            <YStack
              borderWidth={2}
              borderStyle="dashed"
              borderRadius="$4"
              padding="$8"
              alignItems="center"
              borderColor={dragActive ? '$blue10' : '$borderColor'}
              backgroundColor={dragActive ? '$blue2' : 'transparent'}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload size={48} color="$color10" marginBottom="$4" />
              <Text fontSize="$6" fontWeight="500" color="$color12" marginBottom="$2">
                Drop files here or click to upload
              </Text>
              <Text fontSize="$3" color="$color11" marginBottom="$4">
                Supported formats: PDF, JPG, PNG (max 10MB)
              </Text>
              <TamaguiButton backgroundColor="$blue10" color="white" paddingHorizontal="$4" paddingVertical="$2" borderRadius="$4" hoverStyle={{ backgroundColor: '$blue11' }}>
                Choose Files
              </TamaguiButton>
            </YStack>

            <YStack marginTop="$4">
              <Text fontSize="$2" color="$color11">• Certificates of Insurance (COI)</Text>
              <Text fontSize="$2" color="$color11">• Full insurance policies</Text>
              <Text fontSize="$2" color="$color11">• Professional licenses</Text>
              <Text fontSize="$2" color="$color11">• Surety bonds</Text>
            </YStack>
          </Card>
        </YStack>
      )}
    </YStack>
  );
}
