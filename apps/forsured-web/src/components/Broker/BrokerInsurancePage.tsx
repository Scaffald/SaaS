import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { usePolicies } from '../../hooks/usePolicies';
import { useClients } from '../../hooks/useClients';
import { Button } from '../Common/Button';
import Tabs from '../../ui/Tabs';
import { DashboardSkeleton } from '../Common/SkeletonLoader';

export default function BrokerInsurancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { policies, loading: policiesLoading } = usePolicies();
  const { clients, loading: clientsLoading } = useClients();

  const validTabs = ['overview', 'policies', 'coverage-requests'];
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

  const isLoading = policiesLoading || clientsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const activePolicies = policies.filter((p) => p.status === 'active');
  const expiringPolicies = policies.filter((p) => p.status === 'expiring');
  const _expiredPolicies = policies.filter((p) => p.status === 'expired');

  const totalCoverage = policies.reduce((sum, p) => sum + (p.coverage_limit || 0), 0);
  const totalPremium = policies.reduce((sum, p) => sum + (p.premium || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-700';
      case 'expiring':
        return 'bg-warning-100 text-warning-700';
      case 'expired':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.company_name || 'Unknown Client';
  };

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Shield,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-success-100 rounded-lg">
                  <CheckCircle className="text-success-600" size={24} />
                </div>
                <span className="text-xs text-success-600 font-medium">Active</span>
              </div>
              <p className="text-3xl font-bold text-text-primary">{activePolicies.length}</p>
              <p className="text-sm text-text-secondary mt-1">Active Policies</p>
            </div>

            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <Clock className="text-warning-600" size={24} />
                </div>
                <span className="text-xs text-warning-600 font-medium">Attention</span>
              </div>
              <p className="text-3xl font-bold text-text-primary">{expiringPolicies.length}</p>
              <p className="text-sm text-text-secondary mt-1">Expiring Soon</p>
            </div>

            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <DollarSign className="text-primary-600" size={24} />
                </div>
              </div>
              <p className="text-3xl font-bold text-text-primary">
                ${(totalCoverage / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-text-secondary mt-1">Total Coverage</p>
            </div>

            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <TrendingUp className="text-secondary-600" size={24} />
                </div>
              </div>
              <p className="text-3xl font-bold text-text-primary">
                ${totalPremium.toLocaleString()}
              </p>
              <p className="text-sm text-text-secondary mt-1">Annual Premium</p>
            </div>
          </div>

          {expiringPolicies.length > 0 && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="text-warning-600" size={24} />
                <h3 className="text-lg font-semibold text-warning-900">
                  Policies Requiring Attention
                </h3>
              </div>
              <div className="space-y-3">
                {expiringPolicies.slice(0, 3).map((policy) => (
                  <div
                    key={policy.id}
                    className="flex items-center justify-between bg-white rounded-lg p-4 border border-warning-200 cursor-pointer hover:border-warning-400 transition-colors"
                    onClick={() => navigate(`/broker/insurance/policies/${policy.id}`)}
                  >
                    <div>
                      <p className="font-medium text-text-primary">{policy.policy_type}</p>
                      <p className="text-sm text-text-secondary">
                        {getClientName(policy.client_id)} - Expires{' '}
                        {new Date(policy.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="text-warning-600" size={20} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Recent Policies</h3>
                <Button
                  variant="ghost"
                  onClick={() => handleTabChange('policies')}
                >
                  <Button.Text>View All</Button.Text>
                </Button>
              </div>
              <div className="space-y-3">
                {policies.slice(0, 5).map((policy) => (
                  <div
                    key={policy.id}
                    className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg cursor-pointer hover:bg-bg-tertiary transition-colors"
                    onClick={() => navigate(`/broker/insurance/policies/${policy.id}`)}
                  >
                    <div>
                      <p className="font-medium text-text-primary">{policy.policy_type}</p>
                      <p className="text-sm text-text-secondary">{policy.carrier}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(policy.status)}`}>
                      {policy.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Coverage by Type</h3>
              </div>
              <div className="space-y-4">
                {['General Liability', 'Workers Compensation', 'Commercial Auto', 'Professional Liability'].map((type) => {
                  const count = policies.filter((p) => p.policy_type === type).length;
                  const percentage = policies.length > 0 ? (count / policies.length) * 100 : 0;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-text-primary">{type}</span>
                        <span className="text-sm font-medium text-text-primary">{count}</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: FileText,
      badge: policies.length,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-text-secondary">
              Showing {policies.length} policies
            </p>
            <Button variant="primary">
              <Button.Icon><Plus size={16} /></Button.Icon>
              <Button.Text>Add Policy</Button.Text>
            </Button>
          </div>
          {policies.length > 0 ? (
            policies.map((policy) => (
              <div
                key={policy.id}
                className="bg-surface rounded-lg border border-border p-6 hover:border-primary-300 transition-colors cursor-pointer"
                onClick={() => navigate(`/broker/insurance/policies/${policy.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-text-primary">{policy.policy_type}</h4>
                    <p className="text-sm text-text-secondary">{policy.carrier}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(policy.status)}`}>
                    {policy.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-text-secondary">Client</p>
                    <p className="font-medium text-text-primary">{getClientName(policy.client_id)}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Policy Number</p>
                    <p className="font-medium text-text-primary">{policy.policy_number}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Coverage</p>
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
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Policies Found</h3>
              <p className="text-text-secondary">No policies have been added yet.</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'coverage-requests',
      label: 'Coverage Requests',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-text-secondary">Pending coverage requests</p>
            <Button variant="primary">
              <Button.Icon><Plus size={16} /></Button.Icon>
              <Button.Text>New Request</Button.Text>
            </Button>
          </div>
          <div className="text-center py-16 bg-surface rounded-lg border border-border">
            <Shield className="mx-auto text-text-tertiary mb-4" size={48} />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Coverage Requests Coming Soon
            </h3>
            <p className="text-text-secondary">
              Coverage request management will be available in a future update.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Insurance Management</h1>
          <p className="text-text-secondary">
            Manage policies, coverage requirements, and renewals
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outlined">
            <Button.Text>Export Report</Button.Text>
          </Button>
          <Button variant="primary">
            <Button.Icon><Plus size={16} /></Button.Icon>
            <Button.Text>Add Policy</Button.Text>
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} variant="enclosed" activeTab={activeTab} onChange={handleTabChange} />
    </div>
  );
}
