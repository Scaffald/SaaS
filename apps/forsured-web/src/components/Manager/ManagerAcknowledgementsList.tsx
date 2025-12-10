import React, { useState } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Shield,
  FileText,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  useManagerAcknowledgements,
  PacketStatus,
} from '../../hooks/useManagerAcknowledgements';
import Button from '../Common/Button';
import ManagerAcknowledgementDetailModal from './ManagerAcknowledgementDetailModal';
import CreateBrokerAckFormModal from '../BrokerAcknowledgement/CreateBrokerAckFormModal';
import BrokerAcknowledgementFormPage from '../BrokerAcknowledgement/BrokerAcknowledgementFormPage';

export default function ManagerAcknowledgementsList() {
  const {
    packets,
    loading,
    getProjectName,
    getBrokerName,
    getGCName,
    getCompletionPercentage,
    isExpiringSoon,
    getAttestationCount,
  } = useManagerAcknowledgements();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PacketStatus | 'ALL'>('ALL');
  const [selectedPacketId, setSelectedPacketId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdFormId, setCreatedFormId] = useState<string | undefined>(
    undefined
  );

  const filteredPackets = packets.filter((packet) => {
    const projectName = getProjectName(packet.project_id);
    const brokerName = getBrokerName(packet.broker_company_id);
    const gcName = getGCName(packet.gc_company_id);

    const matchesSearch =
      searchTerm === '' ||
      projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brokerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gcName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      packet.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || packet.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: PacketStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'SENT':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'VIEWED':
        return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'SIGNED':
        return 'bg-success-100 text-success-700 border-success-200';
      case 'DECLINED':
        return 'bg-error-100 text-error-700 border-error-200';
      case 'EXPIRED':
        return 'bg-warning-100 text-warning-700 border-warning-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSignerStatusIcon = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return <CheckCircle size={16} className="text-success-600" />;
      case 'DECLINED':
        return <X size={16} className="text-error-600" />;
      case 'VIEWED':
        return <Clock size={16} className="text-primary-600" />;
      case 'SENT':
        return <Clock size={16} className="text-blue-600" />;
      case 'PENDING':
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
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
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Broker Acknowledgements
          </h1>
          <p className="text-text-secondary text-lg mt-1">
            Review and manage broker acknowledgement packets for compliance
            verification
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          Create Packet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-lg shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-text-primary">
              {packets.length}
            </span>
          </div>
          <h3 className="text-sm font-medium text-text-secondary">
            Total Packets
          </h3>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-success-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-text-primary">
              {packets.filter((p) => p.status === 'SIGNED').length}
            </span>
          </div>
          <h3 className="text-sm font-medium text-text-secondary">Signed</h3>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="text-blue-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-text-primary">
              {
                packets.filter(
                  (p) => p.status === 'SENT' || p.status === 'VIEWED'
                ).length
              }
            </span>
          </div>
          <h3 className="text-sm font-medium text-text-secondary">Pending</h3>
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-warning-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-text-primary">
              {packets.filter((p) => isExpiringSoon(p)).length}
            </span>
          </div>
          <h3 className="text-sm font-medium text-text-secondary">
            Expiring Soon
          </h3>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              placeholder="Search by project, broker, GC, or jurisdiction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-text-secondary" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as PacketStatus | 'ALL')
              }
              className="px-4 py-2.5 bg-bg-primary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="VIEWED">Viewed</option>
              <option value="SIGNED">Signed</option>
              <option value="DECLINED">Declined</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {filteredPackets.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border p-12 text-center">
          <FileText size={48} className="mx-auto text-text-secondary mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No packets found'
              : 'No acknowledgement packets yet'}
          </h3>
          <p className="text-text-secondary mb-6">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first broker acknowledgement packet to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPackets.map((packet) => {
            const attestationCount = getAttestationCount(packet.attestations);
            const completionPct = getCompletionPercentage(packet);
            const expiringSoon = isExpiringSoon(packet);

            return (
              <div
                key={packet.id}
                className="bg-surface rounded-lg border border-border hover:border-primary-300 transition-all cursor-pointer group"
                onClick={() => setSelectedPacketId(packet.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary-600 transition-colors">
                          {getProjectName(packet.project_id)}
                        </h3>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(packet.status)}`}
                        >
                          {packet.status}
                        </span>
                        {expiringSoon && (
                          <span className="px-2 py-1 text-xs font-medium rounded bg-warning-100 text-warning-700 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            Expiring Soon
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Shield size={14} />
                          {getBrokerName(packet.broker_company_id)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {getGCName(packet.gc_company_id)}
                        </span>
                        <span>•</span>
                        <span>{packet.jurisdiction}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-bg-secondary rounded-lg p-3">
                      <p className="text-xs text-text-secondary mb-1">
                        Effective Date
                      </p>
                      <p className="text-sm font-medium text-text-primary flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(packet.effective_at)}
                      </p>
                    </div>

                    <div className="bg-bg-secondary rounded-lg p-3">
                      <p className="text-xs text-text-secondary mb-1">
                        E&O Coverage
                      </p>
                      <p className="text-sm font-medium text-text-primary">
                        {formatCurrency(packet.eo_policy.limits_each_claim)} /{' '}
                        {formatCurrency(packet.eo_policy.limits_aggregate)}
                      </p>
                    </div>

                    <div className="bg-bg-secondary rounded-lg p-3">
                      <p className="text-xs text-text-secondary mb-1">
                        Licensed States
                      </p>
                      <p className="text-sm font-medium text-text-primary">
                        {packet.licensing.states.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-text-secondary">
                          Attestations:
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle size={14} className="text-success-600" />
                          <span className="text-xs font-medium text-text-primary">
                            {attestationCount.confirmed}/
                            {attestationCount.total}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {packet.signers.map((signer, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 px-2 py-1 bg-bg-primary rounded border border-border"
                          >
                            {getSignerStatusIcon(signer.status)}
                            <span className="text-xs font-medium text-text-secondary">
                              {signer.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              completionPct === 100
                                ? 'bg-success-500'
                                : 'bg-primary-500'
                            }`}
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-text-secondary">
                          {completionPct}%
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPacketId(packet.id);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPacketId && (
        <ManagerAcknowledgementDetailModal
          packetId={selectedPacketId}
          onClose={() => setSelectedPacketId(null)}
        />
      )}

      {showCreateModal && (
        <CreateBrokerAckFormModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(formId) => {
            setShowCreateModal(false);
            setCreatedFormId(formId);
          }}
        />
      )}

      {createdFormId && (
        <div className="fixed inset-0 bg-bg-primary z-50 overflow-auto">
          <BrokerAcknowledgementFormPage
            formId={createdFormId}
            onBack={() => setCreatedFormId(undefined)}
          />
        </div>
      )}
    </div>
  );
}
