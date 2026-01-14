import { useState } from 'react';
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
  Plus,
} from 'lucide-react';
import { Stack, Row, Text, H1, H2, H3, Card } from '@unicornlove/beyond-ui';
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

  const getStatusColorProps = (status: PacketStatus): React.CSSProperties => {
    switch (status) {
      case 'DRAFT':
        return { backgroundColor: 'var(--color-gray-2)', color: 'var(--color-gray-10)', borderColor: 'var(--color-gray-8)' };
      case 'SENT':
        return { backgroundColor: 'var(--color-blue-2)', color: 'var(--color-blue-10)', borderColor: 'var(--color-blue-8)' };
      case 'VIEWED':
        return { backgroundColor: 'var(--color-blue-2)', color: 'var(--color-blue-10)', borderColor: 'var(--color-blue-8)' };
      case 'SIGNED':
        return { backgroundColor: 'var(--color-green-2)', color: 'var(--color-green-10)', borderColor: 'var(--color-green-8)' };
      case 'DECLINED':
        return { backgroundColor: 'var(--color-red-2)', color: 'var(--color-red-10)', borderColor: 'var(--color-red-8)' };
      case 'EXPIRED':
        return { backgroundColor: 'var(--color-orange-2)', color: 'var(--color-orange-10)', borderColor: 'var(--color-orange-8)' };
      default:
        return { backgroundColor: 'var(--color-gray-2)', color: 'var(--color-gray-10)', borderColor: 'var(--color-gray-8)' };
    }
  };

  const getSignerStatusIcon = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return <CheckCircle size={16} color="var(--color-green-10)" />;
      case 'DECLINED':
        return <X size={16} color="var(--color-red-10)" />;
      case 'VIEWED':
        return <Clock size={16} color="var(--color-blue-10)" />;
      case 'SENT':
        return <Clock size={16} color="var(--color-blue-10)" />;
      case 'PENDING':
      default:
        return <Clock size={16} color="var(--color-gray-10)" />;
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-background)',
    borderRadius: 12,
    border: '1px solid var(--color-border)',
    padding: 20,
    flex: 1,
    minWidth: 'calc(25% - 12px)',
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
      <Stack gap={16}>
        <div style={{ height: 32, backgroundColor: 'var(--color-gray-2)', borderRadius: 12, opacity: 0.5 }} />
        <div style={{ height: 128, backgroundColor: 'var(--color-gray-2)', borderRadius: 12, opacity: 0.5 }} />
        <div style={{ height: 128, backgroundColor: 'var(--color-gray-2)', borderRadius: 12, opacity: 0.5 }} />
      </Stack>
    );
  }

  return (
    <Stack gap={24}>
      <Row alignItems="center" justifyContent="space-between">
        <Stack>
          <H1 style={{ fontSize: 32, fontWeight: 700 }}>
            Broker Acknowledgements
          </H1>
          <Text muted style={{ fontSize: 18, marginTop: 4 }}>
            Review and manage broker acknowledgement packets for compliance
            verification
          </Text>
        </Stack>
        <Button color="primary" iconStart={Plus} onPress={() => setShowCreateModal(true)}>
          Create Packet
        </Button>
      </Row>

      <Row style={{ flexWrap: 'wrap', gap: 16 }}>
        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
            <Stack alignItems="center" justifyContent="center" style={{ width: 40, height: 40, backgroundColor: 'var(--color-blue-2)', borderRadius: 12 }}>
              <FileText color="var(--color-blue-10)" size={20} />
            </Stack>
            <Text size="3xl" weight="bold">
              {packets.length}
            </Text>
          </Row>
          <H3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)' }}>
            Total Packets
          </H3>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
            <Stack alignItems="center" justifyContent="center" style={{ width: 40, height: 40, backgroundColor: 'var(--color-green-2)', borderRadius: 12 }}>
              <CheckCircle color="var(--color-green-10)" size={20} />
            </Stack>
            <Text size="3xl" weight="bold">
              {packets.filter((p) => p.status === 'SIGNED').length}
            </Text>
          </Row>
          <H3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)' }}>Signed</H3>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
            <Stack alignItems="center" justifyContent="center" style={{ width: 40, height: 40, backgroundColor: 'var(--color-blue-2)', borderRadius: 12 }}>
              <Clock color="var(--color-blue-10)" size={20} />
            </Stack>
            <Text size="3xl" weight="bold">
              {
                packets.filter(
                  (p) => p.status === 'SENT' || p.status === 'VIEWED'
                ).length
              }
            </Text>
          </Row>
          <H3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)' }}>Pending</H3>
        </Card>

        <Card style={cardStyle}>
          <Row alignItems="center" justifyContent="space-between" style={{ marginBottom: 12 }}>
            <Stack alignItems="center" justifyContent="center" style={{ width: 40, height: 40, backgroundColor: 'var(--color-orange-2)', borderRadius: 12 }}>
              <AlertTriangle color="var(--color-orange-10)" size={20} />
            </Stack>
            <Text size="3xl" weight="bold">
              {packets.filter((p) => isExpiringSoon(p)).length}
            </Text>
          </Row>
          <H3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)' }}>
            Expiring Soon
          </H3>
        </Card>
      </Row>

      <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 12, border: '1px solid var(--color-border)', padding: 16 }}>
        <Row gap={16} style={{ flexWrap: 'wrap' }}>
          <Stack style={{ flex: 1, position: 'relative' }}>
            <Stack style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
              <Search
                size={20}
                color="var(--color-text-muted)"
              />
            </Stack>
            <input
              type="text"
              placeholder="Search by project, broker, GC, or jurisdiction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '10px',
                paddingBottom: '10px',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--color-text)',
              }}
            />
          </Stack>
          <Row alignItems="center" gap={8}>
            <Filter size={20} color="var(--color-text-muted)" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as PacketStatus | 'ALL')
              }
              style={{
                padding: '10px 16px',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--color-text)',
              }}
            >
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="VIEWED">Viewed</option>
              <option value="SIGNED">Signed</option>
              <option value="DECLINED">Declined</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </Row>
        </Row>
      </Card>

      {filteredPackets.length === 0 ? (
        <Card style={{ backgroundColor: 'var(--color-background)', borderRadius: 12, border: '1px solid var(--color-border)', padding: 48, textAlign: 'center' }}>
          <Stack alignItems="center">
            <FileText size={48} color="var(--color-text-muted)" style={{ marginBottom: 16 }} />
            <H3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              {searchTerm || statusFilter !== 'ALL'
                ? 'No packets found'
                : 'No acknowledgement packets yet'}
            </H3>
            <Text muted style={{ marginBottom: 24 }}>
              {searchTerm || statusFilter !== 'ALL'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first broker acknowledgement packet to get started'}
            </Text>
          </Stack>
        </Card>
      ) : (
        <Stack gap={16}>
          {filteredPackets.map((packet) => {
            const attestationCount = getAttestationCount(packet.attestations);
            const completionPct = getCompletionPercentage(packet);
            const expiringSoon = isExpiringSoon(packet);
            const statusProps = getStatusColorProps(packet.status);

            return (
              <Card
                key={packet.id}
                onPress={() => setSelectedPacketId(packet.id)}
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
              >
                <Stack style={{ padding: 24 }}>
                  <Row alignItems="flex-start" justifyContent="space-between" style={{ marginBottom: 16 }}>
                    <Stack style={{ flex: 1 }}>
                      <Row alignItems="center" gap={12} style={{ marginBottom: 8 }}>
                        <H3 style={{ fontSize: 18, fontWeight: 600 }}>
                          {getProjectName(packet.project_id)}
                        </H3>
                        <span
                          style={{
                            paddingLeft: 12,
                            paddingRight: 12,
                            paddingTop: 4,
                            paddingBottom: 4,
                            fontSize: 12,
                            fontWeight: 500,
                            borderRadius: 9999,
                            border: '1px solid',
                            ...statusProps,
                          }}
                        >
                          {packet.status}
                        </span>
                        {expiringSoon && (
                          <Row
                            alignItems="center"
                            gap={4}
                            style={{
                              paddingLeft: 8,
                              paddingRight: 8,
                              paddingTop: 4,
                              paddingBottom: 4,
                              fontSize: 12,
                              fontWeight: 500,
                              borderRadius: 8,
                              backgroundColor: 'var(--color-orange-2)',
                              color: 'var(--color-orange-10)',
                            }}
                          >
                            <AlertTriangle size={12} />
                            <Text size="xs" style={{ color: 'var(--color-orange-10)' }}>Expiring Soon</Text>
                          </Row>
                        )}
                      </Row>
                      <Row alignItems="center" gap={16}>
                        <Row alignItems="center" gap={4}>
                          <Shield size={14} color="var(--color-text-muted)" />
                          <Text size="sm" muted>
                            {getBrokerName(packet.broker_company_id)}
                          </Text>
                        </Row>
                        <Text size="sm" muted>•</Text>
                        <Row alignItems="center" gap={4}>
                          <Users size={14} color="var(--color-text-muted)" />
                          <Text size="sm" muted>
                            {getGCName(packet.gc_company_id)}
                          </Text>
                        </Row>
                        <Text size="sm" muted>•</Text>
                        <Text size="sm" muted>{packet.jurisdiction}</Text>
                      </Row>
                    </Stack>
                  </Row>

                  <Row style={{ flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                    <Card style={{ backgroundColor: 'var(--color-gray-2)', borderRadius: 12, padding: 12, flex: 1, minWidth: 'calc(33.333% - 11px)' }}>
                      <Text size="xs" muted style={{ marginBottom: 4 }}>
                        Effective Date
                      </Text>
                      <Row alignItems="center" gap={4}>
                        <Calendar size={14} />
                        <Text size="sm" weight="medium">
                          {formatDate(packet.effective_at)}
                        </Text>
                      </Row>
                    </Card>

                    <Card style={{ backgroundColor: 'var(--color-gray-2)', borderRadius: 12, padding: 12, flex: 1, minWidth: 'calc(33.333% - 11px)' }}>
                      <Text size="xs" muted style={{ marginBottom: 4 }}>
                        E&O Coverage
                      </Text>
                      <Text size="sm" weight="medium">
                        {formatCurrency(packet.eo_policy.limits_each_claim)} /{' '}
                        {formatCurrency(packet.eo_policy.limits_aggregate)}
                      </Text>
                    </Card>

                    <Card style={{ backgroundColor: 'var(--color-gray-2)', borderRadius: 12, padding: 12, flex: 1, minWidth: 'calc(33.333% - 11px)' }}>
                      <Text size="xs" muted style={{ marginBottom: 4 }}>
                        Licensed States
                      </Text>
                      <Text size="sm" weight="medium">
                        {packet.licensing.states.join(', ')}
                      </Text>
                    </Card>
                  </Row>

                  <Row alignItems="center" justifyContent="space-between">
                    <Row alignItems="center" gap={16}>
                      <Row alignItems="center" gap={8}>
                        <Text size="xs" muted>
                          Attestations:
                        </Text>
                        <Row alignItems="center" gap={4}>
                          <CheckCircle size={14} color="var(--color-green-10)" />
                          <Text size="xs" weight="medium">
                            {attestationCount.confirmed}/
                            {attestationCount.total}
                          </Text>
                        </Row>
                      </Row>

                      <Row alignItems="center" gap={8}>
                        {packet.signers.map((signer, idx) => (
                          <Row
                            key={idx}
                            alignItems="center"
                            gap={6}
                            style={{
                              paddingLeft: 8,
                              paddingRight: 8,
                              paddingTop: 4,
                              paddingBottom: 4,
                              backgroundColor: 'var(--color-background)',
                              borderRadius: 8,
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            {getSignerStatusIcon(signer.status)}
                            <Text size="xs" weight="medium" muted>
                              {signer.role}
                            </Text>
                          </Row>
                        ))}
                      </Row>
                    </Row>

                    <Row alignItems="center" gap={12}>
                      <Row alignItems="center" gap={8}>
                        <div style={{ width: 96, height: 8, backgroundColor: 'var(--color-gray-4)', borderRadius: 9999, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              backgroundColor: completionPct === 100 ? 'var(--color-green-10)' : 'var(--color-blue-10)',
                              width: `${completionPct}%`,
                            }}
                          />
                        </div>
                        <Text size="xs" weight="medium" muted>
                          {completionPct}%
                        </Text>
                      </Row>

                      <Button
                        variant="outlined"
                        size="sm"
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedPacketId(packet.id);
                        }}
                      >
                        View Details
                      </Button>
                    </Row>
                  </Row>
                </Stack>
              </Card>
            );
          })}
        </Stack>
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
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--color-background)',
            zIndex: 50,
            overflow: 'auto',
          }}
        >
          <BrokerAcknowledgementFormPage
            formId={createdFormId}
            onBack={() => setCreatedFormId(undefined)}
          />
        </div>
      )}
    </Stack>
  );
}
