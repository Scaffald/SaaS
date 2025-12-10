import React from 'react';
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
      return <TrendingUp className="text-success-600" size={20} />;
    if (overallScore >= 70)
      return <Minus className="text-warning-600" size={20} />;
    return <TrendingDown className="text-error-600" size={20} />;
  };

  const getTrendText = () => {
    if (overallScore >= 90) return 'Excellent compliance';
    if (overallScore >= 70) return 'Needs attention';
    return 'Critical issues';
  };

  return (
    <div className="bg-surface rounded-lg shadow-sm border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Compliance Overview
            </h2>
            <p className="text-sm text-text-secondary">
              Real-time snapshot of your portfolio
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getTrendIcon()}
            <span className="text-sm font-medium text-text-primary">
              {getTrendText()}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-white" size={20} />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-700">
                  {percentCompliant}%
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-primary-900">
                Compliant Clients
              </p>
              <p className="text-xs text-primary-700 mt-1">
                {compliantClients} of {totalClients} clients at 90%+
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-warning-50 to-warning-100 rounded-lg p-4 border border-warning-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-warning-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-white" size={20} />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-warning-700">
                  {expiringThisMonth}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-warning-900">
                Expiring This Month
              </p>
              <p className="text-xs text-warning-700 mt-1">
                Policies requiring renewal
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-lg p-4 border border-success-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-success-500 rounded-lg flex items-center justify-center">
                <Briefcase className="text-white" size={20} />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-success-700">
                  {activeProjects}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-success-900">
                Active Projects
              </p>
              <p className="text-xs text-success-700 mt-1">
                Currently in progress
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg p-4 border border-secondary-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-secondary-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-white" size={20} />
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-secondary-700">
                  {overallScore}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-900">
                Overall Score
              </p>
              <p className="text-xs text-secondary-700 mt-1">
                Portfolio average
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Risk Distribution
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleRiskCategoryClick(compliantClientsList)}
              className="text-center p-4 bg-success-50 rounded-lg border border-success-200 hover:border-success-400 hover:shadow-md transition-all cursor-pointer group"
              disabled={compliantClients === 0}
            >
              <p className="text-2xl font-bold text-success-700">
                {compliantClients}
              </p>
              <p className="text-xs text-success-600 mt-1">Compliant</p>
              <p className="text-xs text-text-secondary">&ge; 90%</p>
              {tasks.length > 0 && (
                <div className="mt-2 pt-2 border-t border-success-200 flex items-center justify-center space-x-1">
                  <ClipboardList size={12} className="text-success-600" />
                  <span className="text-xs font-medium text-success-700">
                    {compliantTasks} tasks
                  </span>
                </div>
              )}
            </button>
            <button
              onClick={() => handleRiskCategoryClick(warningClientsList)}
              className="text-center p-4 bg-warning-50 rounded-lg border border-warning-200 hover:border-warning-400 hover:shadow-md transition-all cursor-pointer group"
              disabled={warningClients === 0}
            >
              <p className="text-2xl font-bold text-warning-700">
                {warningClients}
              </p>
              <p className="text-xs text-warning-600 mt-1">Warning</p>
              <p className="text-xs text-text-secondary">70-89%</p>
              {tasks.length > 0 && (
                <div className="mt-2 pt-2 border-t border-warning-200 flex items-center justify-center space-x-1">
                  <ClipboardList size={12} className="text-warning-600" />
                  <span className="text-xs font-medium text-warning-700">
                    {warningTasks} tasks
                  </span>
                </div>
              )}
            </button>
            <button
              onClick={() => handleRiskCategoryClick(criticalClientsList)}
              className="text-center p-4 bg-error-50 rounded-lg border border-error-200 hover:border-error-400 hover:shadow-md transition-all cursor-pointer group"
              disabled={criticalClients === 0}
            >
              <p className="text-2xl font-bold text-error-700">
                {criticalClients}
              </p>
              <p className="text-xs text-error-600 mt-1">Critical</p>
              <p className="text-xs text-text-secondary">&lt; 70%</p>
              {tasks.length > 0 && (
                <div className="mt-2 pt-2 border-t border-error-200 flex items-center justify-center space-x-1">
                  <ClipboardList size={12} className="text-error-600" />
                  <span className="text-xs font-medium text-error-700">
                    {criticalTasks} tasks
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
