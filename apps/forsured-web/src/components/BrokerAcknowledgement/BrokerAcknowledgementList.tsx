/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { useBrokerAcknowledgements } from '../../hooks/useBrokerAcknowledgements';
import Button from '../Common/Button';
import StatusBadge from '../Common/StatusBadge';
import CreateBrokerAckFormModal from './CreateBrokerAckFormModal';

export default function BrokerAcknowledgementList() {
  const navigate = useNavigate();
  const { forms, loading } = useBrokerAcknowledgements();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      form.subcontractor_company_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      form.gc_project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.broker_agency_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || form.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-success-600';
    if (score >= 70) return 'text-warning-600';
    return 'text-error-600';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-surface-secondary rounded animate-pulse"></div>
        <div className="h-32 bg-surface-secondary rounded animate-pulse"></div>
        <div className="h-32 bg-surface-secondary rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Broker Acknowledgement Forms
          </h1>
          <p className="text-text-secondary mt-1">
            Manage insurance verification forms for subcontractor projects
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus size={16} className="mr-2" />
          New Form
        </Button>
      </div>

      <div className="bg-surface rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              placeholder="Search by company, project, or broker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-text-secondary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending_broker">Pending Broker</option>
              <option value="pending_subcontractor">
                Pending Subcontractor
              </option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {filteredForms.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border p-12 text-center">
          <FileText size={48} className="mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {searchTerm || statusFilter !== 'all'
              ? 'No forms found'
              : 'No acknowledgement forms yet'}
          </h3>
          <p className="text-text-secondary mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first broker acknowledgement form to get started'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={16} className="mr-2" />
              Create First Form
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredForms.map((form) => (
            <div
              key={form.id}
              className="bg-surface rounded-lg border border-border p-6 hover:border-primary-300 transition-colors cursor-pointer"
              onClick={() => navigate(`/broker/acknowledgements/${form.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-text-primary">
                      {form.subcontractor_company_name}
                    </h3>
                    <StatusBadge status={form.status as any} size="xs" />
                  </div>
                  <p className="text-text-secondary">{form.gc_project_name}</p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${getComplianceColor(form.compliance_score)}`}
                  >
                    {form.compliance_score}%
                  </div>
                  <p className="text-xs text-text-secondary">Compliance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-text-secondary">Broker Agency</p>
                  <p className="text-sm font-medium text-text-primary">
                    {form.broker_agency_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Broker Contact</p>
                  <p className="text-sm font-medium text-text-primary">
                    {form.broker_contact_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-text-secondary" />
                  <div>
                    <p className="text-sm text-text-secondary">Due Date</p>
                    <p className="text-sm font-medium text-text-primary">
                      {new Date(form.date_due).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {form.missing_endorsements &&
                form.missing_endorsements.length > 0 && (
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle
                      size={16}
                      className="text-warning-600 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-warning-900">
                        {form.missing_endorsements.length} Missing Endorsement
                        {form.missing_endorsements.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-warning-700 mt-1">
                        Click to view details and resolve issues
                      </p>
                    </div>
                  </div>
                )}

              {form.status === 'approved' && form.date_reviewed && (
                <div className="bg-success-50 border border-success-200 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle
                    size={16}
                    className="text-success-600 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-success-900">
                      Approved on{' '}
                      {new Date(form.date_reviewed).toLocaleDateString()}
                    </p>
                    {form.manager_notes && (
                      <p className="text-xs text-success-700 mt-1">
                        {form.manager_notes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateBrokerAckFormModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(formId) => {
            setShowCreateModal(false);
            navigate(`/broker/acknowledgements/${formId}`);
          }}
        />
      )}
    </div>
  );
}
