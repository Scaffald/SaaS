/**
 * InsuranceRequirementsModal - Insurance requirements modal using Beyond UI

 */
import { Shield, FileText, Users, AlertCircle } from 'lucide-react'
import { Stack, Row, Text, Card } from '@scaffald/ui'
import Modal from '../Common/Modal'
import { Project, Task } from '../../types'
import { useProjects } from '../../hooks/useProjects'

interface InsuranceRequirementsModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
}

export default function InsuranceRequirementsModal({
  isOpen,
  onClose,
  task,
}: InsuranceRequirementsModalProps) {
  const { projects } = useProjects()

  const project = task?.project_id ? projects.find((p) => p.id === task.project_id) : null

  if (!task || !project) {
    return null
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'Not Required'
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    return `$${(amount / 1000).toFixed(0)}K`
  }

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
  ].filter((req) => req.limit)

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
            description: "Waives insurer's right to subrogate against additional insured",
          },
        ]
      : []),
    ...(project.primary_non_contributory_required
      ? [
          {
            form: 'CG 20 01',
            name: 'Primary and Non-Contributory',
            description: 'Policy responds first and does not share coverage with other policies',
          },
        ]
      : []),
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Insurance Requirements" size="large">
      <Stack gap={24}>
        {/* Project Header */}
        <Card
          variant="filled"
          style={{
            backgroundColor: 'var(--color-blue-3)',
            borderRadius: 8,
            padding: 16,
            border: '1px solid var(--color-blue-6)',
          }}
        >
          <Text weight="semibold" style={{ marginBottom: 4 }}>
            {project.name}
          </Text>
          <Text size="sm" color="secondary">
            {task.gc_company_name || 'General Contractor'}
          </Text>
          {project.location && (
            <Text size="xs" color="secondary" style={{ marginTop: 4 }}>
              {project.location}
            </Text>
          )}
        </Card>

        {/* Coverage Requirements */}
        <Stack>
          <Row align="center" gap={8} style={{ marginBottom: 16 }}>
            <Shield color="var(--color-blue-10)" size={20} />
            <Text size="lg" weight="semibold">
              Required Coverage Limits
            </Text>
          </Row>
          <Stack gap={12}>
            {coverageRequirements.map((req, index) => (
              <Card
                key={index}
                variant="filled"
                style={{
                  backgroundColor: 'var(--color-gray-3)',
                  borderRadius: 8,
                  padding: 12,
                  border: '1px solid var(--color-border)',
                }}
              >
                <Row align="flex-start" justify="space-between">
                  <Stack flex={1}>
                    <Text weight="medium">{req.label}</Text>
                    <Text size="sm" color="secondary">
                      {req.description}
                    </Text>
                  </Stack>
                  <Stack align="flex-end">
                    <Text weight="semibold" style={{ color: 'var(--color-blue-10)' }}>
                      {formatCurrency(req.limit)}
                    </Text>
                  </Stack>
                </Row>
              </Card>
            ))}
          </Stack>
        </Stack>

        {/* Required Endorsements */}
        <Stack>
          <Row align="center" gap={8} style={{ marginBottom: 16 }}>
            <FileText color="var(--color-blue-10)" size={20} />
            <Text size="lg" weight="semibold">
              Required Endorsements
            </Text>
          </Row>
          <Stack gap={12}>
            {requiredEndorsements.map((endorsement, index) => (
              <Card
                key={index}
                variant="filled"
                style={{
                  padding: 12,
                  backgroundColor: 'var(--color-gray-3)',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                }}
              >
                <Text weight="medium" style={{ marginBottom: 4 }}>
                  {endorsement.form} - {endorsement.name}
                </Text>
                <Text size="sm" color="secondary">
                  {endorsement.description}
                </Text>
              </Card>
            ))}
            {requiredEndorsements.length === 0 && (
              <Card
                variant="filled"
                style={{
                  padding: 12,
                  backgroundColor: 'var(--color-gray-3)',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                }}
              >
                <Text size="sm" color="secondary">
                  No specific endorsements required beyond standard Additional Insured coverage.
                </Text>
              </Card>
            )}
          </Stack>
        </Stack>

        {/* Additional Insureds */}
        {project.additional_insureds && project.additional_insureds.length > 0 && (
          <Stack>
            <Row align="center" gap={8} style={{ marginBottom: 16 }}>
              <Users color="var(--color-blue-10)" size={20} />
              <Text size="lg" weight="semibold">
                Additional Insureds
              </Text>
            </Row>
            <Stack gap={8}>
              {project.additional_insureds.map((insured, index) => (
                <Card
                  key={index}
                  variant="filled"
                  style={{
                    padding: 12,
                    backgroundColor: 'var(--color-gray-3)',
                    borderRadius: 8,
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <Text>{insured}</Text>
                </Card>
              ))}
            </Stack>
          </Stack>
        )}

        {/* Certificate Holder */}
        {project.certificate_holder && (
          <Stack>
            <Row align="center" gap={8} style={{ marginBottom: 16 }}>
              <FileText color="var(--color-blue-10)" size={20} />
              <Text size="lg" weight="semibold">
                Certificate Holder
              </Text>
            </Row>
            <Card
              variant="filled"
              style={{
                padding: 12,
                backgroundColor: 'var(--color-gray-3)',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
              }}
            >
              <Text>{project.certificate_holder}</Text>
            </Card>
          </Stack>
        )}

        {/* Special Provisions */}
        {project.special_provisions && (
          <Stack>
            <Row align="center" gap={8} style={{ marginBottom: 16 }}>
              <AlertCircle color="var(--color-orange-10)" size={20} />
              <Text size="lg" weight="semibold">
                Special Provisions
              </Text>
            </Row>
            <Card
              variant="filled"
              style={{
                padding: 16,
                backgroundColor: 'var(--color-orange-3)',
                borderRadius: 8,
                border: '1px solid var(--color-orange-6)',
              }}
            >
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                {project.special_provisions}
              </Text>
            </Card>
          </Stack>
        )}

        {/* Additional Requirements */}
        <Stack style={{ paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          <Stack gap={8}>
            {project.waiver_of_subrogation_required && (
              <Row align="center" gap={8}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: 'var(--color-blue-9)',
                    borderRadius: '50%',
                  }}
                />
                <Text size="sm" color="secondary">
                  Waiver of Subrogation required
                </Text>
              </Row>
            )}
            {project.primary_non_contributory_required && (
              <Row align="center" gap={8}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: 'var(--color-blue-9)',
                    borderRadius: '50%',
                  }}
                />
                <Text size="sm" color="secondary">
                  Primary and Non-Contributory endorsement required
                </Text>
              </Row>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Modal>
  )
}
