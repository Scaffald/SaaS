import { Shield, FileText, Users, AlertCircle } from 'lucide-react';
import { YStack, XStack, Text, Card } from '@unicornlove/ui';
import Modal from '../Common/Modal';
import { Project, Task } from '../../types';
import { useProjects } from '../../hooks/useProjects';

interface InsuranceRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export default function InsuranceRequirementsModal({
  isOpen,
  onClose,
  task,
}: InsuranceRequirementsModalProps) {
  const { projects } = useProjects();

  const project = task?.project_id
    ? projects.find((p) => p.id === task.project_id)
    : null;

  if (!task || !project) {
    return null;
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'Not Required';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const coverageRequirements = [
    {
      label: 'General Liability',
      limit: project.general_liability_required,
      description: 'Per occurrence and aggregate limits',
    },
    {
      label: "Workers' Compensation",
      limit: project.workers_comp_required,
      description: 'Statutory limits plus Employers Liability',
    },
    {
      label: 'Auto Liability',
      limit: project.auto_liability_required,
      description: 'Combined single limit or split limits',
    },
    {
      label: 'Umbrella/Excess Liability',
      limit: project.umbrella_required,
      description: 'Excess over GL, Auto, and Employers Liability',
    },
    {
      label: 'Professional Liability',
      limit: project.professional_liability_required,
      description: 'Errors and omissions coverage',
    },
    {
      label: 'Pollution Liability',
      limit: project.pollution_liability_required,
      description: 'Environmental and pollution coverage',
    },
    {
      label: 'Builders Risk',
      limit: project.builders_risk_required,
      description: 'Property coverage during construction',
    },
  ].filter((req) => req.limit);

  const requiredEndorsements = [
    {
      form: 'CG 2010 (11/85)',
      name: 'Additional Insured - Ongoing Operations',
      description: 'Covers ongoing operations while work is being performed',
    },
    {
      form: 'CG 2037 (04/13)',
      name: 'Additional Insured - Completed Operations',
      description: 'Covers completed operations after work is finished',
    },
    ...(project.waiver_of_subrogation_required
      ? [
          {
            form: 'CG 24 04',
            name: 'Waiver of Subrogation',
            description:
              "Waives insurer's right to subrogate against additional insured",
          },
        ]
      : []),
    ...(project.primary_non_contributory_required
      ? [
          {
            form: 'CG 20 01',
            name: 'Primary and Non-Contributory',
            description:
              'Policy responds first and does not share coverage with other policies',
          },
        ]
      : []),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Insurance Requirements"
      size="large"
    >
      <YStack gap="$6">
        {/* Project Header */}
        <Card backgroundColor="$blue3" borderRadius="$4" padding="$4" borderWidth={1} borderColor="$blue6">
          <Text fontWeight="600" color="$color12" marginBottom="$1">
            {project.name}
          </Text>
          <Text fontSize="$2" color="$color11">
            {task.gc_company_name || 'General Contractor'}
          </Text>
          {project.location && (
            <Text fontSize="$1" color="$color11" marginTop="$1">
              {project.location}
            </Text>
          )}
        </Card>

        {/* Coverage Requirements */}
        <YStack>
          <XStack alignItems="center" gap="$2" marginBottom="$4">
            <Shield color="$blue10" size={20} />
            <Text fontSize="$6" fontWeight="600" color="$color12">
              Required Coverage Limits
            </Text>
          </XStack>
          <YStack gap="$3">
            {coverageRequirements.map((req, index) => (
              <Card
                key={index}
                backgroundColor="$gray3"
                borderRadius="$4"
                padding="$3"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <XStack alignItems="flex-start" justifyContent="space-between">
                  <YStack flex={1}>
                    <Text fontWeight="500" color="$color12">
                      {req.label}
                    </Text>
                    <Text fontSize="$2" color="$color11">
                      {req.description}
                    </Text>
                  </YStack>
                  <YStack alignItems="flex-end">
                    <Text fontWeight="600" color="$blue10">
                      {formatCurrency(req.limit)}
                    </Text>
                  </YStack>
                </XStack>
              </Card>
            ))}
          </YStack>
        </YStack>

        {/* Required Endorsements */}
        <YStack>
          <XStack alignItems="center" gap="$2" marginBottom="$4">
            <FileText color="$blue10" size={20} />
            <Text fontSize="$6" fontWeight="600" color="$color12">
              Required Endorsements
            </Text>
          </XStack>
          <YStack gap="$3">
            {requiredEndorsements.map((endorsement, index) => (
              <Card
                key={index}
                padding="$3"
                backgroundColor="$gray3"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Text fontWeight="500" color="$color12" marginBottom="$1">
                  {endorsement.form} - {endorsement.name}
                </Text>
                <Text fontSize="$2" color="$color11">
                  {endorsement.description}
                </Text>
              </Card>
            ))}
            {requiredEndorsements.length === 0 && (
              <Card
                padding="$3"
                backgroundColor="$gray3"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Text fontSize="$2" color="$color11">
                  No specific endorsements required beyond standard Additional
                  Insured coverage.
                </Text>
              </Card>
            )}
          </YStack>
        </YStack>

        {/* Additional Insureds */}
        {project.additional_insureds &&
          project.additional_insureds.length > 0 && (
            <YStack>
              <XStack alignItems="center" gap="$2" marginBottom="$4">
                <Users color="$blue10" size={20} />
                <Text fontSize="$6" fontWeight="600" color="$color12">
                  Additional Insureds
                </Text>
              </XStack>
              <YStack gap="$2">
                {project.additional_insureds.map((insured, index) => (
                  <Card
                    key={index}
                    padding="$3"
                    backgroundColor="$gray3"
                    borderRadius="$4"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Text color="$color12">{insured}</Text>
                  </Card>
                ))}
              </YStack>
            </YStack>
          )}

        {/* Certificate Holder */}
        {project.certificate_holder && (
          <YStack>
            <XStack alignItems="center" gap="$2" marginBottom="$4">
              <FileText color="$blue10" size={20} />
              <Text fontSize="$6" fontWeight="600" color="$color12">
                Certificate Holder
              </Text>
            </XStack>
            <Card
              padding="$3"
              backgroundColor="$gray3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <Text color="$color12">
                {project.certificate_holder}
              </Text>
            </Card>
          </YStack>
        )}

        {/* Special Provisions */}
        {project.special_provisions && (
          <YStack>
            <XStack alignItems="center" gap="$2" marginBottom="$4">
              <AlertCircle color="$orange10" size={20} />
              <Text fontSize="$6" fontWeight="600" color="$color12">
                Special Provisions
              </Text>
            </XStack>
            <Card
              padding="$4"
              backgroundColor="$orange3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$orange6"
            >
              <Text fontSize="$2" color="$color12" whiteSpace="pre-wrap">
                {project.special_provisions}
              </Text>
            </Card>
          </YStack>
        )}

        {/* Additional Requirements */}
        <YStack paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
          <YStack gap="$2">
            {project.waiver_of_subrogation_required && (
              <XStack alignItems="center" gap="$2">
                <YStack width={8} height={8} backgroundColor="$blue9" borderRadius={9999} />
                <Text fontSize="$2" color="$color11">
                  Waiver of Subrogation required
                </Text>
              </XStack>
            )}
            {project.primary_non_contributory_required && (
              <XStack alignItems="center" gap="$2">
                <YStack width={8} height={8} backgroundColor="$blue9" borderRadius={9999} />
                <Text fontSize="$2" color="$color11">
                  Primary and Non-Contributory endorsement required
                </Text>
              </XStack>
            )}
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
