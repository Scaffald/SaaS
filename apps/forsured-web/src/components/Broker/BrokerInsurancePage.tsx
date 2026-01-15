import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { Stack, Row, Text, H1, H3, Card, Grid } from '@unicornlove/beyond-ui'
import { Tabs as TabsCustom } from '../../ui/Tabs'
import { usePolicies } from '../../hooks/usePolicies'
import { useClients } from '../../hooks/useClients'
import { Button } from '../Common/Button'
import { DashboardSkeleton } from '../Common/SkeletonLoader'

export default function BrokerInsurancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { policies, loading: policiesLoading } = usePolicies()
  const { clients, loading: clientsLoading } = useClients()

  const validTabs = ['overview', 'policies', 'coverage-requests']
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<string>(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview'
  )

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId })
  }

  const isLoading = policiesLoading || clientsLoading

  if (isLoading) {
    return <DashboardSkeleton />
  }

  const activePolicies = policies.filter((p) => p.status === 'active')
  const expiringPolicies = policies.filter((p) => p.status === 'expiring')
  const _expiredPolicies = policies.filter((p) => p.status === 'expired')

  const totalCoverage = policies.reduce((sum, p) => sum + (p.coverage_limit || 0), 0)
  const totalPremium = policies.reduce((sum, p) => sum + (p.premium || 0), 0)

  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'active':
        return { backgroundColor: 'var(--color-green-2)', color: 'var(--color-green-11)' }
      case 'expiring':
        return { backgroundColor: 'var(--color-yellow-2)', color: 'var(--color-yellow-11)' }
      case 'expired':
        return { backgroundColor: 'var(--color-red-2)', color: 'var(--color-red-11)' }
      default:
        return { backgroundColor: 'var(--color-gray-2)', color: 'var(--color-gray-11)' }
    }
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-background)',
    borderRadius: 12,
    border: '1px solid var(--color-border)',
    padding: 24,
  }

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    padding: 8,
    backgroundColor: `var(--color-${color}-2)`,
    borderRadius: 8,
  })

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    return client?.company_name || 'Unknown Client'
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Shield,
      content: (
        <Stack gap={24}>
          <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={16}>
            <Card style={cardStyle}>
              <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
                <div style={iconBoxStyle('green')}>
                  <CheckCircle color="var(--color-green-10)" size={24} />
                </div>
                <Text size="xs" weight="medium" style={{ color: 'var(--color-green-10)' }}>
                  Active
                </Text>
              </Row>
              <Text size="2xl" weight="bold">
                {activePolicies.length}
              </Text>
              <Text size="sm" muted style={{ marginTop: 4 }}>
                Active Policies
              </Text>
            </Card>

            <Card style={cardStyle}>
              <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
                <div style={iconBoxStyle('yellow')}>
                  <Clock color="var(--color-yellow-10)" size={24} />
                </div>
                <Text size="xs" weight="medium" style={{ color: 'var(--color-yellow-10)' }}>
                  Attention
                </Text>
              </Row>
              <Text size="2xl" weight="bold">
                {expiringPolicies.length}
              </Text>
              <Text size="sm" muted style={{ marginTop: 4 }}>
                Expiring Soon
              </Text>
            </Card>

            <Card style={cardStyle}>
              <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
                <div style={iconBoxStyle('blue')}>
                  <DollarSign color="var(--color-blue-10)" size={24} />
                </div>
              </Row>
              <Text size="2xl" weight="bold">
                ${(totalCoverage / 1000000).toFixed(1)}M
              </Text>
              <Text size="sm" muted style={{ marginTop: 4 }}>
                Total Coverage
              </Text>
            </Card>

            <Card style={cardStyle}>
              <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
                <div style={iconBoxStyle('purple')}>
                  <TrendingUp color="var(--color-purple-10)" size={24} />
                </div>
              </Row>
              <Text size="2xl" weight="bold">
                ${totalPremium.toLocaleString()}
              </Text>
              <Text size="sm" muted style={{ marginTop: 4 }}>
                Annual Premium
              </Text>
            </Card>
          </Grid>

          {expiringPolicies.length > 0 && (
            <Card
              style={{
                backgroundColor: 'var(--color-yellow-2)',
                border: '1px solid var(--color-yellow-6)',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <Row alignItems="center" gap={12} style={{ marginBottom: 16 }}>
                <AlertTriangle color="var(--color-yellow-10)" size={24} />
                <H3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-yellow-12)' }}>
                  Policies Requiring Attention
                </H3>
              </Row>
              <Stack gap={12}>
                {expiringPolicies.slice(0, 3).map((policy) => (
                  <Card
                    key={policy.id}
                    onPress={() => navigate(`/broker/insurance/policies/${policy.id}`)}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 8,
                      padding: 16,
                      border: '1px solid var(--color-yellow-6)',
                      cursor: 'pointer',
                    }}
                  >
                    <Row alignItems="center" justifyContent="space-between">
                      <Stack>
                        <Text weight="medium">{policy.policy_type}</Text>
                        <Text size="sm" muted>
                          {getClientName(policy.client_id)} - Expires{' '}
                          {new Date(policy.end_date).toLocaleDateString()}
                        </Text>
                      </Stack>
                      <ChevronRight color="var(--color-yellow-10)" size={20} />
                    </Row>
                  </Card>
                ))}
              </Stack>
            </Card>
          )}

          <Grid columns={{ base: 1, lg: 2 }} gap={24}>
            <Card style={cardStyle}>
              <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
                <H3 style={{ fontSize: 18, fontWeight: 600 }}>Recent Policies</H3>
                <Button variant="ghost" onPress={() => handleTabChange('policies')}>
                  View All
                </Button>
              </Row>
              <Stack gap={12}>
                {policies.slice(0, 5).map((policy) => {
                  const statusStyle = getStatusStyle(policy.status)
                  return (
                    <Card
                      key={policy.id}
                      onPress={() => navigate(`/broker/insurance/policies/${policy.id}`)}
                      style={{
                        backgroundColor: 'var(--color-gray-2)',
                        borderRadius: 8,
                        padding: 12,
                        cursor: 'pointer',
                      }}
                    >
                      <Row alignItems="center" justifyContent="space-between">
                        <Stack>
                          <Text weight="medium">{policy.policy_type}</Text>
                          <Text size="sm" muted>
                            {policy.carrier}
                          </Text>
                        </Stack>
                        <span
                          style={{
                            paddingLeft: 8,
                            paddingRight: 8,
                            paddingTop: 4,
                            paddingBottom: 4,
                            fontSize: 12,
                            fontWeight: 500,
                            borderRadius: 4,
                            backgroundColor: statusStyle.backgroundColor,
                            color: statusStyle.color,
                          }}
                        >
                          {policy.status}
                        </span>
                      </Row>
                    </Card>
                  )
                })}
              </Stack>
            </Card>

            <Card style={cardStyle}>
              <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 16 }}>
                <H3 style={{ fontSize: 18, fontWeight: 600 }}>Coverage by Type</H3>
              </Row>
              <Stack gap={16}>
                {[
                  'General Liability',
                  'Workers Compensation',
                  'Commercial Auto',
                  'Professional Liability',
                ].map((type) => {
                  const count = policies.filter((p) => p.policy_type === type).length
                  const percentage = policies.length > 0 ? (count / policies.length) * 100 : 0
                  return (
                    <Stack key={type}>
                      <Row
                        alignItems="center"
                        justifyContent="space-between"
                        style={{ marginBottom: 4 }}
                      >
                        <Text size="sm">{type}</Text>
                        <Text size="sm" weight="medium">
                          {count}
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
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </Stack>
                  )
                })}
              </Stack>
            </Card>
          </Grid>
        </Stack>
      ),
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: FileText,
      badge: policies.length,
      content: (
        <Stack gap={16}>
          <Row alignItems="center" justifyContent="space-between">
            <Text muted>Showing {policies.length} policies</Text>
            <Button variant="primary">
              <Row alignItems="center" gap={8}>
                <Plus size={16} />
                <span>Add Policy</span>
              </Row>
            </Button>
          </Row>
          {policies.length > 0 ? (
            <Stack gap={16}>
              {policies.map((policy) => {
                const statusStyle = getStatusStyle(policy.status)
                return (
                  <Card
                    key={policy.id}
                    onPress={() => navigate(`/broker/insurance/policies/${policy.id}`)}
                    style={{
                      backgroundColor: 'var(--color-background)',
                      borderRadius: 12,
                      border: '1px solid var(--color-border)',
                      padding: 24,
                      cursor: 'pointer',
                    }}
                  >
                    <Row
                      alignItems="flex-start"
                      justifyContent="space-between"
                      style={{ marginBottom: 16 }}
                    >
                      <Stack>
                        <Text size="md" weight="semibold">
                          {policy.policy_type}
                        </Text>
                        <Text size="sm" muted>
                          {policy.carrier}
                        </Text>
                      </Stack>
                      <span
                        style={{
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: statusStyle.backgroundColor,
                          color: statusStyle.color,
                        }}
                      >
                        {policy.status}
                      </span>
                    </Row>
                    <Grid columns={{ base: 2, sm: 3, md: 5 }} gap={16}>
                      <Stack>
                        <Text size="sm" muted>
                          Client
                        </Text>
                        <Text weight="medium">{getClientName(policy.client_id)}</Text>
                      </Stack>
                      <Stack>
                        <Text size="sm" muted>
                          Policy Number
                        </Text>
                        <Text weight="medium">{policy.policy_number}</Text>
                      </Stack>
                      <Stack>
                        <Text size="sm" muted>
                          Coverage
                        </Text>
                        <Text weight="medium">
                          ${(policy.coverage_limit / 1000000).toFixed(1)}M
                        </Text>
                      </Stack>
                      <Stack>
                        <Text size="sm" muted>
                          Start Date
                        </Text>
                        <Text weight="medium">
                          {new Date(policy.start_date).toLocaleDateString()}
                        </Text>
                      </Stack>
                      <Stack>
                        <Text size="sm" muted>
                          End Date
                        </Text>
                        <Text weight="medium">
                          {new Date(policy.end_date).toLocaleDateString()}
                        </Text>
                      </Stack>
                    </Grid>
                  </Card>
                )
              })}
            </Stack>
          ) : (
            <Card
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: 12,
                border: '1px solid var(--color-border)',
                padding: 48,
                textAlign: 'center',
              }}
            >
              <Stack alignItems="center">
                <FileText color="var(--color-text-muted)" size={48} style={{ marginBottom: 16 }} />
                <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  No Policies Found
                </H3>
                <Text muted>No policies have been added yet.</Text>
              </Stack>
            </Card>
          )}
        </Stack>
      ),
    },
    {
      id: 'coverage-requests',
      label: 'Coverage Requests',
      icon: Shield,
      content: (
        <Stack gap={16}>
          <Row alignItems="center" justifyContent="space-between">
            <Text muted>Pending coverage requests</Text>
            <Button variant="primary">
              <Row alignItems="center" gap={8}>
                <Plus size={16} />
                <span>New Request</span>
              </Row>
            </Button>
          </Row>
          <Card
            style={{
              backgroundColor: 'var(--color-background)',
              borderRadius: 12,
              border: '1px solid var(--color-border)',
              padding: 48,
              textAlign: 'center',
            }}
          >
            <Stack alignItems="center">
              <Shield color="var(--color-text-muted)" size={48} style={{ marginBottom: 16 }} />
              <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                Coverage Requests Coming Soon
              </H3>
              <Text muted>Coverage request management will be available in a future update.</Text>
            </Stack>
          </Card>
        </Stack>
      ),
    },
  ]

  return (
    <Stack gap={24}>
      <Row alignItems="center" justifyContent="space-between">
        <Stack>
          <H1 style={{ fontSize: 24, fontWeight: 'bold' }}>Insurance Management</H1>
          <Text muted>Manage policies, coverage requirements, and renewals</Text>
        </Stack>
        <Row alignItems="center" gap={12}>
          <Button variant="outlined">Export Report</Button>
          <Button variant="primary">
            <Row alignItems="center" gap={8}>
              <Plus size={16} />
              <span>Add Policy</span>
            </Row>
          </Button>
        </Row>
      </Row>

      <TabsCustom tabs={tabs} variant="enclosed" activeTab={activeTab} onChange={handleTabChange} />
    </Stack>
  )
}
