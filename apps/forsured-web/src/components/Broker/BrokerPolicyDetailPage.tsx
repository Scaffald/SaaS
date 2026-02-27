import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Building,
  Calendar,
  DollarSign,
  Shield,
  AlertTriangle,
  CheckCircle,
  User,
  Clock,
  Paperclip,
  Edit,
} from 'lucide-react'
import { Stack, Row, Text, H1, H2, H3, Card, Grid } from '@scaffald/ui'
import { usePolicies } from '../../hooks/usePolicies'
import { useClients } from '../../hooks/useClients'
import Button from '../Common/Button'
import { DashboardSkeleton } from '../Common/SkeletonLoader'

export default function BrokerPolicyDetailPage() {
  const { policyId } = useParams<{ policyId: string }>()
  const navigate = useNavigate()
  const { policies, loading: policiesLoading } = usePolicies()
  const { clients, loading: clientsLoading } = useClients()

  const policy = policies.find((p) => p.id === policyId)
  const client = clients.find((c) => c.id === policy?.client_id)

  const isLoading = policiesLoading || clientsLoading

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!policy) {
    return (
      <Stack gap={24}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
          }}
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <Card
          style={{
            padding: '48px 24px',
            backgroundColor: 'var(--color-background)',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <Stack alignItems="center">
            <AlertTriangle color="var(--color-red-10)" size={64} style={{ marginBottom: 16 }} />
            <H3 style={{ fontWeight: 600, marginBottom: 8 }}>Policy Not Found</H3>
            <Text muted>The policy you're looking for doesn't exist or has been deleted.</Text>
          </Stack>
        </Card>
      </Stack>
    )
  }

  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'active':
        return {
          backgroundColor: 'var(--color-green-2)',
          color: 'var(--color-green-11)',
          borderColor: 'var(--color-green-6)',
        }
      case 'expiring':
        return {
          backgroundColor: 'var(--color-yellow-2)',
          color: 'var(--color-yellow-11)',
          borderColor: 'var(--color-yellow-6)',
        }
      case 'expired':
        return {
          backgroundColor: 'var(--color-red-2)',
          color: 'var(--color-red-11)',
          borderColor: 'var(--color-red-6)',
        }
      default:
        return {
          backgroundColor: 'var(--color-gray-2)',
          color: 'var(--color-gray-11)',
          borderColor: 'var(--color-gray-6)',
        }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle color="var(--color-green-10)" size={20} />
      case 'expiring':
        return <Clock color="var(--color-yellow-10)" size={20} />
      case 'expired':
        return <AlertTriangle color="var(--color-red-10)" size={20} />
      default:
        return <Shield color="var(--color-gray-10)" size={20} />
    }
  }

  const daysUntilExpiry = Math.ceil(
    (new Date(policy.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const statusStyle = getStatusStyle(policy.status)

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-background)',
    borderRadius: 12,
    border: '1px solid var(--color-border)',
    padding: 24,
  }

  const endorsementStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'var(--color-green-2)',
    border: '1px solid var(--color-green-6)',
    borderRadius: 8,
  }

  return (
    <Stack gap={24}>
      <Row alignItems="center" justifyContent="space-between">
        <Row alignItems="center" gap={16}>
          <Button
            variant="ghost"
            onPress={() => navigate('/broker/insurance?tab=policies')}
            size="sm"
          >
            <Row alignItems="center" gap={8}>
              <ArrowLeft size={16} />
              <span>Back to Policies</span>
            </Row>
          </Button>
          <Stack>
            <Row alignItems="center" gap={12}>
              <H1 style={{ fontSize: 24, fontWeight: 'bold' }}>{policy.policy_type}</H1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 4,
                  paddingBottom: 4,
                  borderRadius: 9999,
                  border: `1px solid ${statusStyle.borderColor}`,
                  backgroundColor: statusStyle.backgroundColor,
                  color: statusStyle.color,
                  gap: 8,
                }}
              >
                {getStatusIcon(policy.status)}
                <Text size="sm" weight="medium" style={{ color: statusStyle.color }}>
                  {policy.status}
                </Text>
              </span>
            </Row>
            <Text muted style={{ marginTop: 4 }}>
              {policy.policy_number} - {policy.carrier}
            </Text>
          </Stack>
        </Row>
        <Row alignItems="center" gap={12}>
          <Button variant="outlined" size="sm">
            <Row alignItems="center" gap={8}>
              <Paperclip size={16} />
              <span>Documents</span>
            </Row>
          </Button>
          <Button variant="primary" size="sm">
            <Row alignItems="center" gap={8}>
              <Edit size={16} />
              <span>Edit Policy</span>
            </Row>
          </Button>
        </Row>
      </Row>

      {policy.status === 'expiring' && (
        <Row
          alignItems="center"
          gap={12}
          style={{
            backgroundColor: 'var(--color-yellow-2)',
            border: '1px solid var(--color-yellow-6)',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <AlertTriangle color="var(--color-yellow-10)" size={24} />
          <Stack style={{ flex: 1 }}>
            <Text weight="medium" style={{ color: 'var(--color-yellow-12)' }}>
              Policy expires in {daysUntilExpiry} days
            </Text>
            <Text size="sm" style={{ color: 'var(--color-yellow-11)' }}>
              Consider initiating renewal process soon.
            </Text>
          </Stack>
          <Button variant="primary" size="sm">
            Start Renewal
          </Button>
        </Row>
      )}

      <Row gap={24} style={{ flexWrap: 'wrap' }}>
        <Stack style={{ flex: 2, minWidth: '60%' }} gap={24}>
          <Card style={cardStyle}>
            <H2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Policy Details</H2>
            <Grid columns={{ base: 1, sm: 2 }} gap={24}>
              <Stack>
                <Row alignItems="center" gap={8} style={{ marginBottom: 4 }}>
                  <FileText color="var(--color-text-muted)" size={16} />
                  <Text size="sm" muted>
                    Policy Number
                  </Text>
                </Row>
                <Text weight="medium">{policy.policy_number}</Text>
              </Stack>
              <Stack>
                <Row alignItems="center" gap={8} style={{ marginBottom: 4 }}>
                  <Building color="var(--color-text-muted)" size={16} />
                  <Text size="sm" muted>
                    Carrier
                  </Text>
                </Row>
                <Text weight="medium">{policy.carrier}</Text>
              </Stack>
              <Stack>
                <Row alignItems="center" gap={8} style={{ marginBottom: 4 }}>
                  <Shield color="var(--color-text-muted)" size={16} />
                  <Text size="sm" muted>
                    Policy Type
                  </Text>
                </Row>
                <Text weight="medium">{policy.policy_type}</Text>
              </Stack>
              <Stack>
                <Row alignItems="center" gap={8} style={{ marginBottom: 4 }}>
                  <DollarSign color="var(--color-text-muted)" size={16} />
                  <Text size="sm" muted>
                    Coverage Limit
                  </Text>
                </Row>
                <Text weight="medium">${(policy.coverage_limit / 1000000).toFixed(1)}M</Text>
              </Stack>
              <Stack>
                <Row alignItems="center" gap={8} style={{ marginBottom: 4 }}>
                  <Calendar color="var(--color-text-muted)" size={16} />
                  <Text size="sm" muted>
                    Effective Date
                  </Text>
                </Row>
                <Text weight="medium">{new Date(policy.start_date).toLocaleDateString()}</Text>
              </Stack>
              <Stack>
                <Row alignItems="center" gap={8} style={{ marginBottom: 4 }}>
                  <Calendar color="var(--color-text-muted)" size={16} />
                  <Text size="sm" muted>
                    Expiration Date
                  </Text>
                </Row>
                <Text weight="medium">{new Date(policy.end_date).toLocaleDateString()}</Text>
              </Stack>
            </Grid>
          </Card>

          <Card style={cardStyle}>
            <H2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              Coverage & Provisions
            </H2>
            <Stack gap={16}>
              <div style={{ padding: 16, backgroundColor: 'var(--color-gray-2)', borderRadius: 8 }}>
                <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 8 }}>
                  <Text weight="medium">Per Occurrence Limit</Text>
                  <Text weight="semibold">${(policy.coverage_limit / 1000000).toFixed(1)}M</Text>
                </Row>
                <div
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--color-gray-6)',
                    borderRadius: 9999,
                    height: 8,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: 'var(--color-blue-9)',
                      height: 8,
                      borderRadius: 9999,
                      width: '100%',
                    }}
                  />
                </div>
              </div>
              <div style={{ padding: 16, backgroundColor: 'var(--color-gray-2)', borderRadius: 8 }}>
                <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 8 }}>
                  <Text weight="medium">Aggregate Limit</Text>
                  <Text weight="semibold">
                    ${((policy.coverage_limit * 2) / 1000000).toFixed(1)}M
                  </Text>
                </Row>
                <div
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--color-gray-6)',
                    borderRadius: 9999,
                    height: 8,
                  }}
                >
                  <div
                    style={{
                      backgroundColor: 'var(--color-blue-9)',
                      height: 8,
                      borderRadius: 9999,
                      width: '100%',
                    }}
                  />
                </div>
              </div>
              {policy.premium && (
                <div
                  style={{ padding: 16, backgroundColor: 'var(--color-gray-2)', borderRadius: 8 }}
                >
                  <Row alignItems="center" justifyContent="space-between">
                    <Text weight="medium">Annual Premium</Text>
                    <Text weight="semibold">${policy.premium.toLocaleString()}</Text>
                  </Row>
                </div>
              )}
            </Stack>
          </Card>

          <Card style={cardStyle}>
            <H2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              Endorsements & Conditions
            </H2>
            <Stack gap={12}>
              <div style={endorsementStyle}>
                <CheckCircle color="var(--color-green-10)" size={20} />
                <Text style={{ color: 'var(--color-green-12)' }}>
                  Additional Insured Endorsement
                </Text>
              </div>
              <div style={endorsementStyle}>
                <CheckCircle color="var(--color-green-10)" size={20} />
                <Text style={{ color: 'var(--color-green-12)' }}>Waiver of Subrogation</Text>
              </div>
              <div style={endorsementStyle}>
                <CheckCircle color="var(--color-green-10)" size={20} />
                <Text style={{ color: 'var(--color-green-12)' }}>Primary & Non-Contributory</Text>
              </div>
            </Stack>
          </Card>
        </Stack>

        <Stack gap={24} style={{ flex: 1, minWidth: '30%' }}>
          <Card style={cardStyle}>
            <H2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Policyholder</H2>
            {client ? (
              <div
                onClick={() => navigate(`/broker/clients/${client.id}`)}
                style={{ cursor: 'pointer', padding: 12, margin: -12, borderRadius: 8 }}
              >
                <Row alignItems="center" gap={12} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: 'var(--color-blue-3)',
                      borderRadius: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text size="lg" weight="semibold" style={{ color: 'var(--color-blue-10)' }}>
                      {client.company_name.substring(0, 2).toUpperCase()}
                    </Text>
                  </div>
                  <Stack>
                    <Text weight="medium">{client.company_name}</Text>
                    <Text size="sm" muted>
                      {client.client_type === 'subcontractor'
                        ? 'Subcontractor'
                        : 'General Contractor'}
                    </Text>
                  </Stack>
                </Row>
                {client.primary_contact && (
                  <Row alignItems="center" gap={8}>
                    <User size={14} color="var(--color-text-muted)" />
                    <Text size="sm" muted>
                      {client.primary_contact}
                    </Text>
                  </Row>
                )}
              </div>
            ) : (
              <Text muted>Client information not available</Text>
            )}
          </Card>

          <Card style={cardStyle}>
            <H2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Policy Timeline</H2>
            <Stack gap={16}>
              <Row alignItems="flex-start" gap={12}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: 'var(--color-green-3)',
                    borderRadius: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle color="var(--color-green-10)" size={16} />
                </div>
                <Stack>
                  <Text weight="medium">Policy Issued</Text>
                  <Text size="sm" muted>
                    {new Date(policy.start_date).toLocaleDateString()}
                  </Text>
                </Stack>
              </Row>
              {policy.status === 'expiring' && (
                <Row alignItems="flex-start" gap={12}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: 'var(--color-yellow-3)',
                      borderRadius: 9999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Clock color="var(--color-yellow-10)" size={16} />
                  </div>
                  <Stack>
                    <Text weight="medium">Renewal Due</Text>
                    <Text size="sm" muted>
                      {new Date(policy.end_date).toLocaleDateString()}
                    </Text>
                  </Stack>
                </Row>
              )}
              <Row alignItems="flex-start" gap={12}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor:
                      policy.status === 'expired' ? 'var(--color-red-3)' : 'var(--color-gray-3)',
                    borderRadius: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Calendar
                    color={
                      policy.status === 'expired' ? 'var(--color-red-10)' : 'var(--color-gray-10)'
                    }
                    size={16}
                  />
                </div>
                <Stack>
                  <Text weight="medium">Expiration</Text>
                  <Text size="sm" muted>
                    {new Date(policy.end_date).toLocaleDateString()}
                  </Text>
                </Stack>
              </Row>
            </Stack>
          </Card>

          <Card style={cardStyle}>
            <H2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Quick Actions</H2>
            <Stack gap={8}>
              <Button variant="outlined" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Row alignItems="center" gap={8}>
                  <FileText size={16} />
                  <span>View Certificate</span>
                </Row>
              </Button>
              <Button variant="outlined" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Row alignItems="center" gap={8}>
                  <Paperclip size={16} />
                  <span>Download Policy</span>
                </Row>
              </Button>
              <Button variant="outlined" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <Row alignItems="center" gap={8}>
                  <Clock size={16} />
                  <span>Request Endorsement</span>
                </Row>
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Row>
    </Stack>
  )
}
