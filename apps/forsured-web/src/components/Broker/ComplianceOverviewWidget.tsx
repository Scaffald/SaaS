import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Briefcase,
  ClipboardList,
} from 'lucide-react'
import { Stack, Row, Text, H2, H3, Card, Grid, Box } from '@unicornlove/beyond-ui'
import { BrokerClient, PolicyData, Project, Task } from '../../types'

interface ComplianceOverviewWidgetProps {
  clients: BrokerClient[]
  policies: PolicyData[]
  projects: Project[]
  tasks?: Task[]
}

export default function ComplianceOverviewWidget({
  clients,
  policies,
  projects,
  tasks = [],
}: ComplianceOverviewWidgetProps) {
  const navigate = useNavigate()
  const totalClients = clients.length

  // Helper to safely get compliance score (default to 0 if undefined/null)
  const getScore = (client: BrokerClient): number => client.compliance_score ?? 0

  // Group clients by risk level
  const compliantClientsList = clients.filter((c) => getScore(c) >= 90)
  const warningClientsList = clients.filter((c) => getScore(c) >= 70 && getScore(c) < 90)
  const criticalClientsList = clients.filter((c) => getScore(c) < 70)

  const compliantClients = compliantClientsList.length
  const warningClients = warningClientsList.length
  const criticalClients = criticalClientsList.length

  // Calculate task counts for each risk category
  const getTaskCountForClients = (clientList: BrokerClient[]) => {
    const clientIds = new Set(clientList.map((c) => c.id))
    return tasks.filter((t) => t.client_id && clientIds.has(t.client_id)).length
  }

  const compliantTasks = getTaskCountForClients(compliantClientsList)
  const warningTasks = getTaskCountForClients(warningClientsList)
  const criticalTasks = getTaskCountForClients(criticalClientsList)

  const percentCompliant =
    totalClients > 0 ? Math.round((compliantClients / totalClients) * 100) : 0

  const today = new Date()
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const expiringThisMonth = policies.filter((policy) => {
    const endDate = new Date(policy.end_date)
    return endDate >= today && endDate <= endOfMonth
  }).length

  const activeProjects = projects.filter((p) => p.status === 'active').length

  const overallScore =
    clients.length > 0
      ? Math.round(clients.reduce((sum, c) => sum + getScore(c), 0) / clients.length)
      : 0

  // Navigate to tasks page with client filter for a risk category
  const handleRiskCategoryClick = (clientList: BrokerClient[]) => {
    if (clientList.length === 0) return

    if (clientList.length === 1) {
      navigate(`/broker/tasks?client=${clientList[0].id}`)
    } else {
      navigate('/broker/tasks')
    }
  }

  const getTrendIcon = () => {
    if (overallScore >= 90)
      return <TrendingUp size={20} />
    if (overallScore >= 70)
      return <AlertTriangle size={20} />
    return <TrendingDown size={20} />
  }

  const getTrendText = () => {
    if (overallScore >= 90) return 'Excellent compliance'
    if (overallScore >= 70) return 'Needs attention'
    return 'Critical issues'
  }


  return (
    <Card padding="xl">
      <Stack style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 24, marginBottom: 24 }}>
        <Row alignItems="center" justifyContent="space-between">
          <Stack>
            <H2>Compliance Overview</H2>
            <Text size="sm" muted>
              Real-time snapshot of your portfolio
            </Text>
          </Stack>
          <Row alignItems="center" gap={8} style={{ marginLeft: 'auto' }}>
            {getTrendIcon()}
            <Text size="sm" weight="medium">
              {getTrendText()}
            </Text>
          </Row>
        </Row>
      </Stack>

        <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={24}>
          <Card padding="md" style={{ backgroundColor: 'var(--color-blue-2)', border: '1px solid var(--color-blue-6)' }}>
            <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
              <Box
                width={40}
                height={40}
                align="center"
                justify="center"
                style={{
                  backgroundColor: 'var(--color-blue-9)',
                  borderRadius: 8,
                }}
              >
                <CheckCircle size={20} color="white" />
              </Box>
              <Stack alignItems="flex-end">
                <Text size="2xl" weight="bold" style={{ color: 'var(--color-blue-11)' }}>
                  {percentCompliant}%
                </Text>
              </Stack>
            </Row>
            <Stack>
              <Text size="sm" weight="medium" style={{ color: 'var(--color-blue-12)' }}>
                Compliant Clients
              </Text>
              <Text size="xs" style={{ color: 'var(--color-blue-11)', marginTop: 4 }}>
                {compliantClients} of {totalClients} clients at 90%+
              </Text>
            </Stack>
          </Card>

          <Card padding="md" style={{ backgroundColor: 'var(--color-yellow-2)', border: '1px solid var(--color-yellow-6)' }}>
            <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
              <Box
                width={40}
                height={40}
                align="center"
                justify="center"
                style={{
                  backgroundColor: 'var(--color-yellow-9)',
                  borderRadius: 8,
                }}
              >
                <AlertTriangle size={20} color="white" />
              </Box>
              <Stack alignItems="flex-end">
                <Text size="2xl" weight="bold" style={{ color: 'var(--color-yellow-11)' }}>
                  {expiringThisMonth}
                </Text>
              </Stack>
            </Row>
            <Stack>
              <Text size="sm" weight="medium" style={{ color: 'var(--color-yellow-12)' }}>
                Expiring This Month
              </Text>
              <Text size="xs" style={{ color: 'var(--color-yellow-11)', marginTop: 4 }}>
                Policies requiring renewal
              </Text>
            </Stack>
          </Card>

          <Card padding="md" style={{ backgroundColor: 'var(--color-green-2)', border: '1px solid var(--color-green-6)' }}>
            <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
              <Box
                width={40}
                height={40}
                align="center"
                justify="center"
                style={{
                  backgroundColor: 'var(--color-green-9)',
                  borderRadius: 8,
                }}
              >
                <Briefcase size={20} color="white" />
              </Box>
              <Stack alignItems="flex-end">
                <Text size="2xl" weight="bold" style={{ color: 'var(--color-green-11)' }}>
                  {activeProjects}
                </Text>
              </Stack>
            </Row>
            <Stack>
              <Text size="sm" weight="medium" style={{ color: 'var(--color-green-12)' }}>
                Active Projects
              </Text>
              <Text size="xs" style={{ color: 'var(--color-green-11)', marginTop: 4 }}>
                Currently in progress
              </Text>
            </Stack>
          </Card>

          <Card padding="md" style={{ backgroundColor: 'var(--color-purple-2)', border: '1px solid var(--color-purple-6)' }}>
            <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
              <Box
                width={40}
                height={40}
                align="center"
                justify="center"
                style={{
                  backgroundColor: 'var(--color-purple-9)',
                  borderRadius: 8,
                }}
              >
                <AlertCircle size={20} color="white" />
              </Box>
              <Stack alignItems="flex-end">
                <Text size="2xl" weight="bold" style={{ color: 'var(--color-purple-11)' }}>
                  {overallScore}
                </Text>
              </Stack>
            </Row>
            <Stack>
              <Text size="sm" weight="medium" style={{ color: 'var(--color-purple-12)' }}>
                Overall Score
              </Text>
              <Text size="xs" style={{ color: 'var(--color-purple-11)', marginTop: 4 }}>
                Portfolio average
              </Text>
            </Stack>
          </Card>
        </Grid>

        <Stack style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
          <H3 style={{ marginBottom: 16 }}>Risk Distribution</H3>
          <Grid columns={{ base: 1, sm: 3 }} gap={16}>
            <Card
              padding="md"
              pressable
              onPress={() => handleRiskCategoryClick(compliantClientsList)}
              disabled={compliantClients === 0}
              style={{
                backgroundColor: 'var(--color-green-2)',
                border: '1px solid var(--color-green-6)',
                alignItems: 'center',
                opacity: compliantClients === 0 ? 0.5 : 1,
                cursor: compliantClients === 0 ? 'default' : 'pointer',
              }}
            >
              <Stack alignItems="center">
                <Text size="xl" weight="bold" style={{ color: 'var(--color-green-11)' }}>
                  {compliantClients}
                </Text>
                <Text size="xs" style={{ color: 'var(--color-green-10)', marginTop: 4 }}>
                  Compliant
                </Text>
                <Text size="xs" muted>
                  &ge; 90%
                </Text>
                {tasks.length > 0 && (
                  <Row
                    alignItems="center"
                    justifyContent="center"
                    gap={4}
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px solid var(--color-green-6)',
                    }}
                  >
                    <ClipboardList size={12} style={{ color: 'var(--color-green-10)' }} />
                    <Text size="xs" weight="medium" style={{ color: 'var(--color-green-11)' }}>
                      {compliantTasks} tasks
                    </Text>
                  </Row>
                )}
              </Stack>
            </Card>
            <Card
              padding="md"
              pressable
              onPress={() => handleRiskCategoryClick(warningClientsList)}
              disabled={warningClients === 0}
              style={{
                backgroundColor: 'var(--color-yellow-2)',
                border: '1px solid var(--color-yellow-6)',
                alignItems: 'center',
                opacity: warningClients === 0 ? 0.5 : 1,
                cursor: warningClients === 0 ? 'default' : 'pointer',
              }}
            >
              <Stack alignItems="center">
                <Text size="xl" weight="bold" style={{ color: 'var(--color-yellow-11)' }}>
                  {warningClients}
                </Text>
                <Text size="xs" style={{ color: 'var(--color-yellow-10)', marginTop: 4 }}>
                  Warning
                </Text>
                <Text size="xs" muted>
                  70-89%
                </Text>
                {tasks.length > 0 && (
                  <Row
                    alignItems="center"
                    justifyContent="center"
                    gap={4}
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px solid var(--color-yellow-6)',
                    }}
                  >
                    <ClipboardList size={12} style={{ color: 'var(--color-yellow-10)' }} />
                    <Text size="xs" weight="medium" style={{ color: 'var(--color-yellow-11)' }}>
                      {warningTasks} tasks
                    </Text>
                  </Row>
                )}
              </Stack>
            </Card>
            <Card
              padding="md"
              pressable
              onPress={() => handleRiskCategoryClick(criticalClientsList)}
              disabled={criticalClients === 0}
              style={{
                backgroundColor: 'var(--color-red-2)',
                border: '1px solid var(--color-red-6)',
                alignItems: 'center',
                opacity: criticalClients === 0 ? 0.5 : 1,
                cursor: criticalClients === 0 ? 'default' : 'pointer',
              }}
            >
              <Stack alignItems="center">
                <Text size="xl" weight="bold" style={{ color: 'var(--color-red-11)' }}>
                  {criticalClients}
                </Text>
                <Text size="xs" style={{ color: 'var(--color-red-10)', marginTop: 4 }}>
                  Critical
                </Text>
                <Text size="xs" muted>
                  &lt; 70%
                </Text>
                {tasks.length > 0 && (
                  <Row
                    alignItems="center"
                    justifyContent="center"
                    gap={4}
                    style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-red-6)' }}
                  >
                    <ClipboardList size={12} style={{ color: 'var(--color-red-10)' }} />
                    <Text size="xs" weight="medium" style={{ color: 'var(--color-red-11)' }}>
                      {criticalTasks} tasks
                    </Text>
                  </Row>
                )}
              </Stack>
            </Card>
          </Grid>
        </Stack>
    </Card>
  )
}
