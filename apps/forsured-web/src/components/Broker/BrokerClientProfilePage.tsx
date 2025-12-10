import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  Shield,
  AlertTriangle,
  CheckCircle,
  FileText,
  TrendingUp,
  Users,
  Calendar,
} from 'lucide-react';
import { useClients } from '../../hooks/useClients';
import { usePolicies } from '../../hooks/usePolicies';
import { useProjects } from '../../hooks/useProjects';
import Button from '../Common/Button';
import Tabs from '../../ui/Tabs';
import { DashboardSkeleton } from '../Common/SkeletonLoader';

export default function BrokerClientProfilePage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients, loading: clientsLoading } = useClients();
  const { policies, loading: policiesLoading } = usePolicies();
  const { projects, loading: projectsLoading } = useProjects();

  const client = clients.find((c) => c.id === clientId);
  const clientPolicies = policies.filter((p) => p.client_id === clientId);
  const clientProjects = projects.filter((p) => p.client_id === clientId);

  const validTabs = ['overview', 'compliance', 'policies', 'projects', 'documents'];
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview'
  );

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const isLoading = clientsLoading || policiesLoading || projectsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="text-center py-16 bg-surface rounded-lg border border-border">
          <AlertTriangle className="mx-auto text-error-500 mb-4" size={64} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Client Not Found
          </h3>
          <p className="text-text-secondary">
            The client you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  const getRiskBadge = (risk: string) => {
    const styles = {
      low: 'bg-success-100 text-success-700 border-success-300',
      medium: 'bg-warning-100 text-warning-700 border-warning-300',
      high: 'bg-error-100 text-error-700 border-error-300',
    };
    return styles[risk as keyof typeof styles] || styles.medium;
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-success-600';
    if (score >= 70) return 'text-warning-600';
    return 'text-error-600';
  };

  const getComplianceBg = (score: number) => {
    if (score >= 90) return 'bg-success-600';
    if (score >= 70) return 'bg-warning-600';
    return 'bg-error-600';
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Building,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-bg-secondary rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="text-text-tertiary" size={18} />
                <span className="text-sm font-medium text-text-secondary">
                  Compliance Score
                </span>
              </div>
              <p className={`text-2xl font-bold ${getComplianceColor(client.compliance_score)}`}>
                {client.compliance_score}%
              </p>
            </div>
            <div className="bg-bg-secondary rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="text-text-tertiary" size={18} />
                <span className="text-sm font-medium text-text-secondary">
                  Active Policies
                </span>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {clientPolicies.filter((p) => p.status === 'active').length}
              </p>
            </div>
            <div className="bg-bg-secondary rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Building className="text-text-tertiary" size={18} />
                <span className="text-sm font-medium text-text-secondary">
                  Active Projects
                </span>
              </div>
              <p className="text-2xl font-bold text-text-primary">
                {clientProjects.filter((p) => p.status === 'active').length}
              </p>
            </div>
            <div className="bg-bg-secondary rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="text-text-tertiary" size={18} />
                <span className="text-sm font-medium text-text-secondary">
                  Risk Level
                </span>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskBadge(client.risk_level)}`}
              >
                {client.risk_level.charAt(0).toUpperCase() + client.risk_level.slice(1)}
              </span>
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.primary_contact && (
                <div className="flex items-center space-x-3">
                  <Users className="text-text-tertiary" size={18} />
                  <div>
                    <p className="text-sm text-text-secondary">Primary Contact</p>
                    <p className="text-text-primary font-medium">{client.primary_contact}</p>
                  </div>
                </div>
              )}
              {client.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="text-text-tertiary" size={18} />
                  <div>
                    <p className="text-sm text-text-secondary">Email</p>
                    <p className="text-text-primary font-medium">{client.email}</p>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="text-text-tertiary" size={18} />
                  <div>
                    <p className="text-sm text-text-secondary">Phone</p>
                    <p className="text-text-primary font-medium">{client.phone}</p>
                  </div>
                </div>
              )}
              {client.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="text-text-tertiary" size={18} />
                  <div>
                    <p className="text-sm text-text-secondary">Address</p>
                    <p className="text-text-primary font-medium">{client.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {client.notes && (
            <div className="bg-surface rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Notes</h3>
              <p className="text-text-secondary">{client.notes}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Compliance Overview
            </h3>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-32 h-32 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${getComplianceColor(client.compliance_score)}`}>
                    {client.compliance_score}%
                  </span>
                </div>
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    className={getComplianceBg(client.compliance_score).replace('bg-', 'stroke-')}
                    strokeWidth="12"
                    strokeDasharray={`${(client.compliance_score / 100) * 352} 352`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-text-secondary mb-2">
                  {client.compliance_score >= 90
                    ? 'Excellent compliance status. All requirements are being met.'
                    : client.compliance_score >= 70
                    ? 'Good compliance status with some areas needing attention.'
                    : 'Compliance issues detected. Immediate action required.'}
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="text-success-500" size={16} />
                    <span className="text-text-secondary">
                      {clientPolicies.filter((p) => p.status === 'active').length} Active Policies
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="text-warning-500" size={16} />
                    <span className="text-text-secondary">
                      {clientPolicies.filter((p) => p.status === 'expiring').length} Expiring Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Coverage Status
            </h3>
            <div className="space-y-4">
              {clientPolicies.length > 0 ? (
                clientPolicies.map((policy) => (
                  <div
                    key={policy.id}
                    className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-text-primary">{policy.policy_type}</p>
                      <p className="text-sm text-text-secondary">
                        {policy.carrier} - {policy.policy_number}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        policy.status === 'active'
                          ? 'bg-success-100 text-success-700'
                          : policy.status === 'expiring'
                          ? 'bg-warning-100 text-warning-700'
                          : 'bg-error-100 text-error-700'
                      }`}
                    >
                      {policy.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-text-secondary text-center py-4">
                  No policies found for this client.
                </p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: FileText,
      badge: clientPolicies.length,
      content: (
        <div className="space-y-4">
          {clientPolicies.length > 0 ? (
            clientPolicies.map((policy) => (
              <div
                key={policy.id}
                className="bg-surface rounded-lg border border-border p-6 hover:border-primary-300 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-text-primary">{policy.policy_type}</h4>
                    <p className="text-sm text-text-secondary">{policy.carrier}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      policy.status === 'active'
                        ? 'bg-success-100 text-success-700'
                        : policy.status === 'expiring'
                        ? 'bg-warning-100 text-warning-700'
                        : 'bg-error-100 text-error-700'
                    }`}
                  >
                    {policy.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-text-secondary">Policy Number</p>
                    <p className="font-medium text-text-primary">{policy.policy_number}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Coverage Limit</p>
                    <p className="font-medium text-text-primary">
                      ${(policy.coverage_limit / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Start Date</p>
                    <p className="font-medium text-text-primary">
                      {new Date(policy.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary">End Date</p>
                    <p className="font-medium text-text-primary">
                      {new Date(policy.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-surface rounded-lg border border-border">
              <FileText className="mx-auto text-text-tertiary mb-4" size={48} />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No Policies Found
              </h3>
              <p className="text-text-secondary">
                This client doesn't have any policies on record.
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: Building,
      badge: clientProjects.length,
      content: (
        <div className="space-y-4">
          {clientProjects.length > 0 ? (
            clientProjects.map((project) => (
              <div
                key={project.id}
                className="bg-surface rounded-lg border border-border p-6 hover:border-primary-300 transition-colors cursor-pointer"
                onClick={() => navigate(`/broker/projects/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-text-primary">{project.name}</h4>
                    {project.location && (
                      <p className="text-sm text-text-secondary flex items-center space-x-1">
                        <MapPin size={14} />
                        <span>{project.location}</span>
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      project.status === 'active'
                        ? 'bg-success-100 text-success-700'
                        : project.status === 'completed'
                        ? 'bg-neutral-100 text-neutral-700'
                        : 'bg-warning-100 text-warning-700'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center space-x-6 text-sm text-text-secondary">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>
                      {new Date(project.start_date).toLocaleDateString()} -{' '}
                      {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield size={14} />
                    <span>{project.compliance_status}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-surface rounded-lg border border-border">
              <Building className="mx-auto text-text-tertiary mb-4" size={48} />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No Projects Found
              </h3>
              <p className="text-text-secondary">
                This client doesn't have any projects on record.
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      content: (
        <div className="text-center py-16 bg-surface rounded-lg border border-border">
          <FileText className="mx-auto text-text-tertiary mb-4" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Documents Coming Soon
          </h3>
          <p className="text-text-secondary">
            Document management for this client will be available in a future update.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/broker/clients')}
            leftIcon={ArrowLeft}
            size="sm"
          >
            Back to Clients
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {client.company_name}
            </h1>
            <div className="flex items-center space-x-3 mt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  client.client_type === 'subcontractor'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-secondary-100 text-secondary-700'
                }`}
              >
                {client.client_type === 'subcontractor' ? 'Subcontractor' : 'General Contractor'}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRiskBadge(client.risk_level)}`}
              >
                {client.risk_level} risk
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            Edit Client
          </Button>
          <Button variant="primary" size="sm">
            Add Policy
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} variant="enclosed" activeTab={activeTab} onChange={handleTabChange} />
    </div>
  );
}
