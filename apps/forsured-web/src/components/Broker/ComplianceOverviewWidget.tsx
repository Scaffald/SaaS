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
import { YStack, XStack, Text, H2, H3, Card } from '@unicornlove/ui';
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

    // If single client, filter by that client
    // If multiple clients, we need a different approach - navigate to tasks page
    // For now, navigate to tasks page where user can further filter
    if (clientList.length === 1) {
      navigate(`/broker/tasks?client=${clientList[0].id}`);
    } else {
      // For multiple clients, we could encode multiple client IDs but that's complex
      // Instead, navigate to tasks page - users can see all tasks there
      // Future enhancement could support multi-client filtering
      navigate('/broker/tasks');
    }
  };

  const getTrendIcon = () => {
    if (overallScore >= 90)
      return <TrendingUp color="$green10" size={20} />;
    if (overallScore >= 70)
      return <Minus color="$yellow10" size={20} />;
    return <TrendingDown color="$red10" size={20} />;
  };

  const getTrendText = () => {
    if (overallScore >= 90) return 'Excellent compliance';
    if (overallScore >= 70) return 'Needs attention';
    return 'Critical issues';
  };

  return (
    <Card
      backgroundColor="$background"
      borderRadius="$4"
      elevation={1}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <YStack padding="$6" borderBottomWidth={1} borderColor="$borderColor">
        <XStack alignItems="center" justifyContent="space-between">
          <YStack>
            <H2 fontSize="$6" fontWeight="600" color="$color12">
              Compliance Overview
            </H2>
            <Text fontSize="$3" color="$color11">
              Real-time snapshot of your portfolio
            </Text>
          </YStack>
          <XStack alignItems="center" gap="$2">
            {getTrendIcon()}
            <Text fontSize="$3" fontWeight="500" color="$color12">
              {getTrendText()}
            </Text>
          </XStack>
        </XStack>
      </YStack>

      <YStack padding="$6">
        <XStack
          flexDirection="column"
          $gtMd={{ flexDirection: 'row' }}
          gap="$6"
          flexWrap="wrap"
        >
          <Card
            backgroundColor="$blue2"
            borderRadius="$4"
            padding="$4"
            borderWidth={1}
            borderColor="$blue6"
            flex={1}
            minWidth="20%"
          >
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
              <YStack width={40} height={40} backgroundColor="$blue9" borderRadius="$4" alignItems="center" justifyContent="center">
                <CheckCircle color="white" size={20} />
              </YStack>
              <YStack alignItems="flex-end">
                <Text fontSize="$9" fontWeight="bold" color="$blue11">
                  {percentCompliant}%
                </Text>
              </YStack>
            </XStack>
            <YStack>
              <Text fontSize="$3" fontWeight="500" color="$blue12">
                Compliant Clients
              </Text>
              <Text fontSize="$1" color="$blue11" marginTop="$1">
                {compliantClients} of {totalClients} clients at 90%+
              </Text>
            </YStack>
          </Card>

          <Card
            backgroundColor="$yellow2"
            borderRadius="$4"
            padding="$4"
            borderWidth={1}
            borderColor="$yellow6"
            flex={1}
            minWidth="20%"
          >
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
              <YStack width={40} height={40} backgroundColor="$yellow9" borderRadius="$4" alignItems="center" justifyContent="center">
                <AlertTriangle color="white" size={20} />
              </YStack>
              <YStack alignItems="flex-end">
                <Text fontSize="$9" fontWeight="bold" color="$yellow11">
                  {expiringThisMonth}
                </Text>
              </YStack>
            </XStack>
            <YStack>
              <Text fontSize="$3" fontWeight="500" color="$yellow12">
                Expiring This Month
              </Text>
              <Text fontSize="$1" color="$yellow11" marginTop="$1">
                Policies requiring renewal
              </Text>
            </YStack>
          </Card>

          <Card
            backgroundColor="$green2"
            borderRadius="$4"
            padding="$4"
            borderWidth={1}
            borderColor="$green6"
            flex={1}
            minWidth="20%"
          >
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
              <YStack width={40} height={40} backgroundColor="$green9" borderRadius="$4" alignItems="center" justifyContent="center">
                <Briefcase color="white" size={20} />
              </YStack>
              <YStack alignItems="flex-end">
                <Text fontSize="$9" fontWeight="bold" color="$green11">
                  {activeProjects}
                </Text>
              </YStack>
            </XStack>
            <YStack>
              <Text fontSize="$3" fontWeight="500" color="$green12">
                Active Projects
              </Text>
              <Text fontSize="$1" color="$green11" marginTop="$1">
                Currently in progress
              </Text>
            </YStack>
          </Card>

          <Card
            backgroundColor="$purple2"
            borderRadius="$4"
            padding="$4"
            borderWidth={1}
            borderColor="$purple6"
            flex={1}
            minWidth="20%"
          >
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
              <YStack width={40} height={40} backgroundColor="$purple9" borderRadius="$4" alignItems="center" justifyContent="center">
                <AlertCircle color="white" size={20} />
              </YStack>
              <YStack alignItems="flex-end">
                <Text fontSize="$9" fontWeight="bold" color="$purple11">
                  {overallScore}
                </Text>
              </YStack>
            </XStack>
            <YStack>
              <Text fontSize="$3" fontWeight="500" color="$purple12">
                Overall Score
              </Text>
              <Text fontSize="$1" color="$purple11" marginTop="$1">
                Portfolio average
              </Text>
            </YStack>
          </Card>
        </XStack>

        <YStack marginTop="$6" paddingTop="$6" borderTopWidth={1} borderColor="$borderColor">
          <H3 fontSize="$3" fontWeight="600" color="$color12" marginBottom="$4">
            Risk Distribution
          </H3>
          <XStack gap="$4" flexWrap="wrap">
            <Card
              as="button"
              alignItems="center"
              padding="$4"
              backgroundColor="$green2"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$green6"
              hoverStyle={{ borderColor: '$green8', elevation: 2 }}
              cursor="pointer"
              disabled={compliantClients === 0}
              opacity={compliantClients === 0 ? 0.5 : 1}
              onClick={() => handleRiskCategoryClick(compliantClientsList)}
            >
              <Text fontSize="$8" fontWeight="bold" color="$green11">
                {compliantClients}
              </Text>
              <Text fontSize="$1" color="$green10" marginTop="$1">Compliant</Text>
              <Text fontSize="$1" color="$color11">&ge; 90%</Text>
              {tasks.length > 0 && (
                <XStack marginTop="$2" paddingTop="$2" borderTopWidth={1} borderColor="$green6" alignItems="center" justifyContent="center" gap="$1">
                  <ClipboardList size={12} color="$green10" />
                  <Text fontSize="$1" fontWeight="500" color="$green11">
                    {compliantTasks} tasks
                  </Text>
                </XStack>
              )}
            </Card>
            <Card
              as="button"
              alignItems="center"
              padding="$4"
              backgroundColor="$yellow2"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$yellow6"
              hoverStyle={{ borderColor: '$yellow8', elevation: 2 }}
              cursor="pointer"
              disabled={warningClients === 0}
              opacity={warningClients === 0 ? 0.5 : 1}
              onClick={() => handleRiskCategoryClick(warningClientsList)}
            >
              <Text fontSize="$8" fontWeight="bold" color="$yellow11">
                {warningClients}
              </Text>
              <Text fontSize="$1" color="$yellow10" marginTop="$1">Warning</Text>
              <Text fontSize="$1" color="$color11">70-89%</Text>
              {tasks.length > 0 && (
                <XStack marginTop="$2" paddingTop="$2" borderTopWidth={1} borderColor="$yellow6" alignItems="center" justifyContent="center" gap="$1">
                  <ClipboardList size={12} color="$yellow10" />
                  <Text fontSize="$1" fontWeight="500" color="$yellow11">
                    {warningTasks} tasks
                  </Text>
                </XStack>
              )}
            </Card>
            <Card
              as="button"
              alignItems="center"
              padding="$4"
              backgroundColor="$red2"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$red6"
              hoverStyle={{ borderColor: '$red8', elevation: 2 }}
              cursor="pointer"
              disabled={criticalClients === 0}
              opacity={criticalClients === 0 ? 0.5 : 1}
              onClick={() => handleRiskCategoryClick(criticalClientsList)}
            >
              <Text fontSize="$8" fontWeight="bold" color="$red11">
                {criticalClients}
              </Text>
              <Text fontSize="$1" color="$red10" marginTop="$1">Critical</Text>
              <Text fontSize="$1" color="$color11">&lt; 70%</Text>
              {tasks.length > 0 && (
                <XStack marginTop="$2" paddingTop="$2" borderTopWidth={1} borderColor="$red6" alignItems="center" justifyContent="center" gap="$1">
                  <ClipboardList size={12} color="$red10" />
                  <Text fontSize="$1" fontWeight="500" color="$red11">
                    {criticalTasks} tasks
                  </Text>
                </XStack>
              )}
            </Card>
          </XStack>
        </YStack>
      </YStack>
    </Card>
  );
}
