import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { usePolicies } from '../../hooks/usePolicies';
import { useClients } from '../../hooks/useClients';
import Button from '../Common/Button';
import { DashboardSkeleton } from '../Common/SkeletonLoader';

export default function BrokerPolicyDetailPage() {
  const { policyId } = useParams<{ policyId: string }>();
  const navigate = useNavigate();
  const { policies, loading: policiesLoading } = usePolicies();
  const { clients, loading: clientsLoading } = useClients();

  const policy = policies.find((p) => p.id === policyId);
  const client = clients.find((c) => c.id === policy?.client_id);

  const isLoading = policiesLoading || clientsLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!policy) {
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
            Policy Not Found
          </h3>
          <p className="text-text-secondary">
            The policy you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-700 border-success-300';
      case 'expiring':
        return 'bg-warning-100 text-warning-700 border-warning-300';
      case 'expired':
        return 'bg-error-100 text-error-700 border-error-300';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="text-success-600" size={20} />;
      case 'expiring':
        return <Clock className="text-warning-600" size={20} />;
      case 'expired':
        return <AlertTriangle className="text-error-600" size={20} />;
      default:
        return <Shield className="text-neutral-600" size={20} />;
    }
  };

  const daysUntilExpiry = Math.ceil(
    (new Date(policy.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/broker/insurance?tab=policies')}
            leftIcon={ArrowLeft}
            size="sm"
          >
            Back to Policies
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-text-primary">
                {policy.policy_type}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(policy.status)}`}>
                {getStatusIcon(policy.status)}
                <span className="ml-2">{policy.status}</span>
              </span>
            </div>
            <p className="text-text-secondary mt-1">
              {policy.policy_number} - {policy.carrier}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" leftIcon={Paperclip}>
            Documents
          </Button>
          <Button variant="primary" size="sm" leftIcon={Edit}>
            Edit Policy
          </Button>
        </div>
      </div>

      {policy.status === 'expiring' && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="text-warning-600" size={24} />
          <div>
            <p className="font-medium text-warning-900">
              Policy expires in {daysUntilExpiry} days
            </p>
            <p className="text-sm text-warning-700">
              Consider initiating renewal process soon.
            </p>
          </div>
          <div className="ml-auto">
            <Button variant="primary" size="sm">
              Start Renewal
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Policy Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <FileText className="text-text-tertiary" size={16} />
                  <span className="text-sm text-text-secondary">Policy Number</span>
                </div>
                <p className="font-medium text-text-primary">{policy.policy_number}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Building className="text-text-tertiary" size={16} />
                  <span className="text-sm text-text-secondary">Carrier</span>
                </div>
                <p className="font-medium text-text-primary">{policy.carrier}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Shield className="text-text-tertiary" size={16} />
                  <span className="text-sm text-text-secondary">Policy Type</span>
                </div>
                <p className="font-medium text-text-primary">{policy.policy_type}</p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <DollarSign className="text-text-tertiary" size={16} />
                  <span className="text-sm text-text-secondary">Coverage Limit</span>
                </div>
                <p className="font-medium text-text-primary">
                  ${(policy.coverage_limit / 1000000).toFixed(1)}M
                </p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="text-text-tertiary" size={16} />
                  <span className="text-sm text-text-secondary">Effective Date</span>
                </div>
                <p className="font-medium text-text-primary">
                  {new Date(policy.start_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="text-text-tertiary" size={16} />
                  <span className="text-sm text-text-secondary">Expiration Date</span>
                </div>
                <p className="font-medium text-text-primary">
                  {new Date(policy.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Coverage & Provisions
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-bg-secondary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-primary">Per Occurrence Limit</span>
                  <span className="font-semibold text-text-primary">
                    ${(policy.coverage_limit / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full w-full" />
                </div>
              </div>
              <div className="p-4 bg-bg-secondary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-primary">Aggregate Limit</span>
                  <span className="font-semibold text-text-primary">
                    ${((policy.coverage_limit * 2) / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full w-full" />
                </div>
              </div>
              {policy.premium && (
                <div className="p-4 bg-bg-secondary rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-text-primary">Annual Premium</span>
                    <span className="font-semibold text-text-primary">
                      ${policy.premium.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Endorsements & Conditions
            </h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-success-50 border border-success-200 rounded-lg">
                <CheckCircle className="text-success-600" size={20} />
                <span className="text-success-900">Additional Insured Endorsement</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-success-50 border border-success-200 rounded-lg">
                <CheckCircle className="text-success-600" size={20} />
                <span className="text-success-900">Waiver of Subrogation</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-success-50 border border-success-200 rounded-lg">
                <CheckCircle className="text-success-600" size={20} />
                <span className="text-success-900">Primary & Non-Contributory</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Policyholder
            </h2>
            {client ? (
              <div
                className="cursor-pointer hover:bg-bg-secondary p-3 -m-3 rounded-lg transition-colors"
                onClick={() => navigate(`/broker/clients/${client.id}`)}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-primary-600">
                      {client.company_name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{client.company_name}</p>
                    <p className="text-sm text-text-secondary">
                      {client.client_type === 'subcontractor' ? 'Subcontractor' : 'General Contractor'}
                    </p>
                  </div>
                </div>
                {client.primary_contact && (
                  <div className="flex items-center space-x-2 text-sm text-text-secondary">
                    <User size={14} />
                    <span>{client.primary_contact}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-text-secondary">Client information not available</p>
            )}
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Policy Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-success-600" size={16} />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Policy Issued</p>
                  <p className="text-sm text-text-secondary">
                    {new Date(policy.start_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {policy.status === 'expiring' && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="text-warning-600" size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Renewal Due</p>
                    <p className="text-sm text-text-secondary">
                      {new Date(policy.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  policy.status === 'expired' ? 'bg-error-100' : 'bg-neutral-100'
                }`}>
                  <Calendar className={policy.status === 'expired' ? 'text-error-600' : 'text-neutral-600'} size={16} />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Expiration</p>
                  <p className="text-sm text-text-secondary">
                    {new Date(policy.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <FileText size={16} className="mr-2" />
                View Certificate
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Paperclip size={16} className="mr-2" />
                Download Policy
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock size={16} className="mr-2" />
                Request Endorsement
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
