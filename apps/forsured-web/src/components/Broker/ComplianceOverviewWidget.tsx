import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Briefcase,
  ClipboardList,
} from 'lucide-react';
import { Stack, Row, Text, H2, H3, Card } from '@unicornlove/beyond-ui';
import { BrokerClient, PolicyData, Project, Task } from '../../types';

interface ComplianceOverviewWidgetProps {
  clients: BrokerClient[];
  policies: PolicyData[];
  projects: Project[];
  tasks?: Task[];
}

export default function ComplianceOverviewWidget({
  clients,
  policies,
  projects,
  tasks = [],
}: ComplianceOverviewWidgetProps) {
  const navigate = useNavigate();
  const totalClients = clients.length;

  // Helper to safely get compliance score (default to 0 if undefined/null)
  const getScore = (client: BrokerClient): number => client.compliance_score ?? 0;

  // Group clients by risk level
  const compliantClientsList = clients.filter((c) => getScore(c) >= 90);
  const warningClientsList = clients.filter(
    (c) => getScore(c) >= 70 && getScore(c) < 90
  );
  const criticalClientsList = clients.filter((c) => getScore(c) < 70);

  const compliantClients = compliantClientsList.length;
  const warningClients = warningClientsList.length;
  const criticalClients = criticalClientsList.length;

  // Calculate task counts for each risk category
  const getTaskCountForClients = (clientList: BrokerClient[]) => {
    const clientIds = new Set(clientList.map((c) => c.id));
    return tasks.filter((t) => t.client_id && clientIds.has(t.client_id)).length;
  };

  const compliantTasks = getTaskCountForClients(compliantClientsList);
  const warningTasks = getTaskCountForClients(warningClientsList);
  const criticalTasks = getTaskCountForClients(criticalClientsList);

  const percentCompliant =
    totalClients > 0 ? Math.round((compliantClients / totalClients) * 100) : 0;

  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const expiringThisMonth = policies.filter((policy) => {
    const endDate = new Date(policy.end_date);
    return endDate >= today && endDate <= endOfMonth;
  }).length;

  const activeProjects = projects.filter((p) => p.status === 'active').length;

  const overallScore =
    clients.length > 0
      ? Math.round(
          clients.reduce((sum, c) => sum + getScore(c), 0) /
            clients.length
        )
      : 0;

  // Navigate to tasks page with client filter for a risk category
  const handleRiskCategoryClick = (clientList: BrokerClient[]) => {
    if (clientList.length === 0) return;

    if (clientList.length === 1) {
      navigate(`/broker/tasks?client=${clientList[0].id}`);
    } else {
      navigate('/broker/tasks');
    }
  };

  const getTrendIcon = () => {
    if (overallScore >= 90)
      return <TrendingUp size={20} style={{ color: 'var(--color-green-10)' }} />;
    if (overallScore >= 70)
      return <Minus size={20} style={{ color: 'var(--color-yellow-10)' }} />;
    return <TrendingDown size={20} style={{ color: 'var(--color-red-10)' }} />;
  };

  const getTrendText = () => {
    if (overallScore >= 90) return 'Excellent compliance';
    if (overallScore >= 70) return 'Needs attention';
    return 'Critical issues';
  };

  const metricCardStyle = (color: string): React.CSSProperties => ({
    backgroundColor: `var(--color-${color}-2)`,
    borderRadius: 12,
    padding: 16,
    border: `1px solid var(--color-${color}-6)`,
    flex: 1,
    minWidth: '20%',
  });

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    width: 40,
    height: 40,
    backgroundColor: `var(--color-${color}-9)`,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const riskCardStyle = (color: string, disabled: boolean): React.CSSProperties => ({
    alignItems: 'center',
    padding: 16,
    backgroundColor: `var(--color-${color}-2)`,
    borderRadius: 8,
    border: `1px solid var(--color-${color}-6)`,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <Card
      style={{
        backgroundColor: 'var(--color-background)',
        borderRadius: 12,
        border: '1px solid var(--color-border)',
      }}
    >
      <Stack padding={24} style={{ borderBottom: '1px solid var(--color-border)' }}>
        <Row alignItems="center" justifyContent="space-between">
          <Stack>
            <H2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
              Compliance Overview
            </H2>
            <Text size="sm" muted>
              Real-time snapshot of your portfolio
            </Text>
          </Stack>
          <Row alignItems="center" gap={8}>
            {getTrendIcon()}
            <Text size="sm" weight="medium">
              {getTrendText()}
            </Text>
          </Row>
        </Row>
      </Stack>

      <Stack padding={24}>
        <Row gap={24} style={{ flexWrap: 'wrap' }}>
          <Card style={metricCardStyle('blue')}>
            <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
              <div style={iconBoxStyle('blue')}>
                <CheckCircle size={20} color="white" />
              </div>
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

          <Card style={metricCardStyle('yellow')}>
            <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
              <div style={iconBoxStyle('yellow')}>
                <AlertTriangle size={20} color="white" />
              </div>
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

          <Card style={metricCardStyle('green')}>
            <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
              <div style={iconBoxStyle('green')}>
                <Briefcase size={20} color="white" />
              </div>
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

          <Card style={metricCardStyle('purple')}>
            <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
              <div style={iconBoxStyle('purple')}>
                <AlertCircle size={20} color="white" />
              </div>
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
        </Row>

        <Stack style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
          <H3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 16 }}>
            Risk Distribution
          </H3>
          <Row gap={16} style={{ flexWrap: 'wrap' }}>
            <button
              onClick={() => handleRiskCategoryClick(compliantClientsList)}
              disabled={compliantClients === 0}
              style={{
                ...riskCardStyle('green', compliantClients === 0),
                background: 'none',
                textAlign: 'center',
              }}
            >
              <Text size="xl" weight="bold" style={{ color: 'var(--color-green-11)' }}>
                {compliantClients}
              </Text>
              <Text size="xs" style={{ color: 'var(--color-green-10)', marginTop: 4 }}>Compliant</Text>
              <Text size="xs" muted>&ge; 90%</Text>
              {tasks.length > 0 && (
                <Row
                  alignItems="center"
                  justifyContent="center"
                  gap={4}
                  style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-green-6)' }}
                >
                  <ClipboardList size={12} style={{ color: 'var(--color-green-10)' }} />
                  <Text size="xs" weight="medium" style={{ color: 'var(--color-green-11)' }}>
                    {compliantTasks} tasks
                  </Text>
                </Row>
              )}
            </button>
            <button
              onClick={() => handleRiskCategoryClick(warningClientsList)}
              disabled={warningClients === 0}
              style={{
                ...riskCardStyle('yellow', warningClients === 0),
                background: 'none',
                textAlign: 'center',
              }}
            >
              <Text size="xl" weight="bold" style={{ color: 'var(--color-yellow-11)' }}>
                {warningClients}
              </Text>
              <Text size="xs" style={{ color: 'var(--color-yellow-10)', marginTop: 4 }}>Warning</Text>
              <Text size="xs" muted>70-89%</Text>
              {tasks.length > 0 && (
                <Row
                  alignItems="center"
                  justifyContent="center"
                  gap={4}
                  style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-yellow-6)' }}
                >
                  <ClipboardList size={12} style={{ color: 'var(--color-yellow-10)' }} />
                  <Text size="xs" weight="medium" style={{ color: 'var(--color-yellow-11)' }}>
                    {warningTasks} tasks
                  </Text>
                </Row>
              )}
            </button>
            <button
              onClick={() => handleRiskCategoryClick(criticalClientsList)}
              disabled={criticalClients === 0}
              style={{
                ...riskCardStyle('red', criticalClients === 0),
                background: 'none',
                textAlign: 'center',
              }}
            >
              <Text size="xl" weight="bold" style={{ color: 'var(--color-red-11)' }}>
                {criticalClients}
              </Text>
              <Text size="xs" style={{ color: 'var(--color-red-10)', marginTop: 4 }}>Critical</Text>
              <Text size="xs" muted>&lt; 70%</Text>
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
            </button>
          </Row>
        </Stack>
      </Stack>
    </Card>
  );
}
