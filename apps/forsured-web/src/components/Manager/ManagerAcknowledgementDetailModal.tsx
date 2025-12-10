import React from 'react';
import {
  X,
  Shield,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  Users,
  AlertTriangle,
  Download,
  Building,
} from 'lucide-react';
import { useManagerAcknowledgements } from '../../hooks/useManagerAcknowledgements';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Badge from '../Common/Badge';

interface ManagerAcknowledgementDetailModalProps {
  packetId: string;
  onClose: () => void;
}

export default function ManagerAcknowledgementDetailModal({
  packetId,
  onClose,
}: ManagerAcknowledgementDetailModalProps) {
  const { currentPacket, loading, getProjectName, getBrokerName, getGCName } =
    useManagerAcknowledgements({ packetId });

  if (loading || !currentPacket) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Loading..." size="xl">
        <div className="space-y-4">
          <div className="h-32 bg-surface-secondary rounded animate-pulse"></div>
          <div className="h-32 bg-surface-secondary rounded animate-pulse"></div>
        </div>
      </Modal>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700';
      case 'SENT':
        return 'bg-blue-100 text-blue-700';
      case 'VIEWED':
        return 'bg-primary-100 text-primary-700';
      case 'SIGNED':
        return 'bg-success-100 text-success-700';
      case 'DECLINED':
        return 'bg-error-100 text-error-700';
      case 'EXPIRED':
        return 'bg-warning-100 text-warning-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSignerStatusIcon = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return <CheckCircle size={18} className="text-success-600" />;
      case 'DECLINED':
        return <X size={18} className="text-error-600" />;
      case 'VIEWED':
        return <Clock size={18} className="text-primary-600" />;
      case 'SENT':
        return <Clock size={18} className="text-blue-600" />;
      case 'PENDING':
      default:
        return <Clock size={18} className="text-gray-400" />;
    }
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'created':
        return <FileText size={14} className="text-gray-500" />;
      case 'sent':
        return <Users size={14} className="text-blue-500" />;
      case 'viewed':
        return <Clock size={14} className="text-primary-500" />;
      case 'signed':
        return <CheckCircle size={14} className="text-success-500" />;
      case 'declined':
        return <X size={14} className="text-error-500" />;
      case 'expired':
        return <AlertTriangle size={14} className="text-warning-500" />;
      default:
        return <FileText size={14} className="text-gray-500" />;
    }
  };

  const formatResponsibility = (responsibility: string) => {
    return responsibility
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Broker Acknowledgement Details"
      size="xl"
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-text-primary">
                {getProjectName(currentPacket.project_id)}
              </h2>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(currentPacket.status)}`}
              >
                {currentPacket.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <Shield size={16} />
                {getBrokerName(currentPacket.broker_company_id)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building size={16} />
                {getGCName(currentPacket.gc_company_id)}
              </span>
              <span>•</span>
              <span>Version {currentPacket.version}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {currentPacket.pdf_artifacts.length > 0 && (
              <Button variant="outline" size="sm">
                <Download size={16} className="mr-2" />
                Download PDF
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-bg-secondary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={18} className="text-text-secondary" />
              <h3 className="font-semibold text-text-primary">
                Effective Date
              </h3>
            </div>
            <p className="text-sm text-text-secondary">
              {formatDate(currentPacket.effective_at)}
            </p>
          </div>

          <div className="bg-bg-secondary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={18} className="text-text-secondary" />
              <h3 className="font-semibold text-text-primary">
                Expiration Date
              </h3>
            </div>
            <p className="text-sm text-text-secondary">
              {formatDate(currentPacket.expires_at)}
            </p>
          </div>

          <div className="bg-bg-secondary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building size={18} className="text-text-secondary" />
              <h3 className="font-semibold text-text-primary">Jurisdiction</h3>
            </div>
            <p className="text-sm text-text-secondary">
              {currentPacket.jurisdiction}
            </p>
          </div>

          <div className="bg-bg-secondary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} className="text-text-secondary" />
              <h3 className="font-semibold text-text-primary">Liability Cap</h3>
            </div>
            <p className="text-sm text-text-secondary">
              {currentPacket.limits_liability.cap_type === 'EO_LIMITS'
                ? 'E&O Limits'
                : currentPacket.limits_liability.cap_type === 'CUSTOM'
                  ? formatCurrency(
                      currentPacket.limits_liability.cap_amount || 0
                    )
                  : 'Uncapped'}
            </p>
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <CheckCircle size={18} />
            Attestations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              {currentPacket.attestations.is_licensed_for_project_state ? (
                <CheckCircle
                  size={16}
                  className="text-success-600 mt-0.5 flex-shrink-0"
                />
              ) : (
                <X size={16} className="text-error-600 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm text-text-primary">
                Licensed for project state
              </span>
            </div>
            <div className="flex items-start gap-2">
              {currentPacket.attestations.has_active_eo ? (
                <CheckCircle
                  size={16}
                  className="text-success-600 mt-0.5 flex-shrink-0"
                />
              ) : (
                <X size={16} className="text-error-600 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm text-text-primary">
                Active E&O policy
              </span>
            </div>
            <div className="flex items-start gap-2">
              {currentPacket.attestations.documents_are_accurate ? (
                <CheckCircle
                  size={16}
                  className="text-success-600 mt-0.5 flex-shrink-0"
                />
              ) : (
                <X size={16} className="text-error-600 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm text-text-primary">
                Documents are accurate
              </span>
            </div>
            <div className="flex items-start gap-2">
              {currentPacket.attestations
                .will_maintain_required_endorsements ? (
                <CheckCircle
                  size={16}
                  className="text-success-600 mt-0.5 flex-shrink-0"
                />
              ) : (
                <X size={16} className="text-error-600 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm text-text-primary">
                Will maintain required endorsements
              </span>
            </div>
            <div className="flex items-start gap-2">
              {currentPacket.attestations.agrees_to_platform_terms ? (
                <CheckCircle
                  size={16}
                  className="text-success-600 mt-0.5 flex-shrink-0"
                />
              ) : (
                <X size={16} className="text-error-600 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm text-text-primary">
                Agrees to platform terms
              </span>
            </div>
            <div className="flex items-start gap-2">
              {currentPacket.attestations.fraud_reporting_enabled ? (
                <CheckCircle
                  size={16}
                  className="text-success-600 mt-0.5 flex-shrink-0"
                />
              ) : (
                <X size={16} className="text-error-600 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm text-text-primary">
                Fraud reporting enabled
              </span>
            </div>
            <div className="flex items-start gap-2">
              {currentPacket.attestations.data_use_agreed ? (
                <CheckCircle
                  size={16}
                  className="text-success-600 mt-0.5 flex-shrink-0"
                />
              ) : (
                <X size={16} className="text-error-600 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm text-text-primary">Data use agreed</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle
                size={16}
                className="text-primary-600 mt-0.5 flex-shrink-0"
              />
              <span className="text-sm text-text-primary">
                Will notify changes within{' '}
                {currentPacket.attestations.will_notify_material_change_days}{' '}
                days
              </span>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Shield size={18} />
            E&O Insurance Policy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-secondary mb-1">Carrier</p>
              <p className="text-sm font-medium text-text-primary">
                {currentPacket.eo_policy.carrier}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Policy Number</p>
              <p className="text-sm font-medium text-text-primary">
                {currentPacket.eo_policy.policy_number}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">
                Each Claim Limit
              </p>
              <p className="text-sm font-medium text-text-primary">
                {formatCurrency(currentPacket.eo_policy.limits_each_claim)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">
                Aggregate Limit
              </p>
              <p className="text-sm font-medium text-text-primary">
                {formatCurrency(currentPacket.eo_policy.limits_aggregate)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">Effective Date</p>
              <p className="text-sm font-medium text-text-primary">
                {formatDate(currentPacket.eo_policy.effective)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-1">
                Expiration Date
              </p>
              <p className="text-sm font-medium text-text-primary">
                {formatDate(currentPacket.eo_policy.expires)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <FileText size={18} />
            Licensing Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-text-secondary mb-2">
                Licensed States
              </p>
              <div className="flex flex-wrap gap-2">
                {currentPacket.licensing.states.map((state) => (
                  <Badge key={state} variant="info">
                    {state}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-2">
                License Details
              </p>
              <div className="space-y-2">
                {currentPacket.licensing.license_numbers.map((license, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-surface rounded border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="info">{license.state}</Badge>
                      <span className="text-sm font-medium text-text-primary">
                        {license.number}
                      </span>
                    </div>
                    <span className="text-xs text-text-secondary">
                      Expires: {formatDate(license.expires)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Users size={18} />
            Broker Responsibilities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentPacket.responsibilities.map((resp, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-sm text-text-primary"
              >
                <CheckCircle
                  size={14}
                  className="text-primary-600 flex-shrink-0"
                />
                <span>{formatResponsibility(resp)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Users size={18} />
            Signers
          </h3>
          <div className="space-y-3">
            {currentPacket.signers.map((signer, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-surface rounded border border-border"
              >
                <div className="flex items-center gap-3">
                  {getSignerStatusIcon(signer.status)}
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {signer.email}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Role: {signer.role}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(signer.status)}`}
                  >
                    {signer.status}
                  </span>
                  {signer.acted_at && (
                    <p className="text-xs text-text-secondary mt-1">
                      {formatDate(signer.acted_at)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Clock size={18} />
            Audit Log
          </h3>
          <div className="space-y-2">
            {currentPacket.audit_log.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2 bg-surface rounded"
              >
                <div className="mt-1">{getEventIcon(entry.event)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary capitalize">
                      {entry.event}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {formatDate(entry.at)}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    by {entry.actor}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {currentPacket.status === 'SENT' ||
            (currentPacket.status === 'VIEWED' && (
              <Button variant="primary">Send Reminder</Button>
            ))}
        </div>
      </div>
    </Modal>
  );
}
