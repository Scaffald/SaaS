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
} from 'lucide-react';
import { YStack, XStack, Text, H1, H2, H3, Card } from '@unicornlove/ui';
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

  const getStatusColorProps = (status: PacketStatus) => {
    switch (status) {
      case 'DRAFT':
        return { backgroundColor: '$gray2', color: '$gray10', borderColor: '$gray8' };
      case 'SENT':
        return { backgroundColor: '$blue2', color: '$blue10', borderColor: '$blue8' };
      case 'VIEWED':
        return { backgroundColor: '$blue2', color: '$blue10', borderColor: '$blue8' };
      case 'SIGNED':
        return { backgroundColor: '$green2', color: '$green10', borderColor: '$green8' };
      case 'DECLINED':
        return { backgroundColor: '$red2', color: '$red10', borderColor: '$red8' };
      case 'EXPIRED':
        return { backgroundColor: '$orange2', color: '$orange10', borderColor: '$orange8' };
      default:
        return { backgroundColor: '$gray2', color: '$gray10', borderColor: '$gray8' };
    }
  };

  const getSignerStatusIcon = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return <CheckCircle size={16} color="$green10" />;
      case 'DECLINED':
        return <X size={16} color="$red10" />;
      case 'VIEWED':
        return <Clock size={16} color="$blue10" />;
      case 'SENT':
        return <Clock size={16} color="$blue10" />;
      case 'PENDING':
      default:
        return <Clock size={16} color="$gray10" />;
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
      <YStack gap="$4">
        <YStack height={32} backgroundColor="$backgroundHover" borderRadius="$4" opacity={0.5} />
        <YStack height={128} backgroundColor="$backgroundHover" borderRadius="$4" opacity={0.5} />
        <YStack height={128} backgroundColor="$backgroundHover" borderRadius="$4" opacity={0.5} />
      </YStack>
    );
  }

  return (
    <YStack gap="$6">
      <XStack alignItems="center" justifyContent="space-between">
        <YStack>
          <H1 fontSize="$10" fontWeight="700" color="$color12" fontFamily="$heading">
            Broker Acknowledgements
          </H1>
          <Text color="$color11" fontSize="$6" mt="$1">
            Review and manage broker acknowledgement packets for compliance
            verification
          </Text>
        </YStack>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          Create Packet
        </Button>
      </XStack>

      <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexWrap: 'wrap' }}>
        <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5" elevation={1} flex={1} minWidth="calc(25% - 12px)" $gtMd={{ minWidth: 'calc(25% - 12px)' }}>
          <XStack alignItems="center" justifyContent="space-between" mb="$3">
            <YStack width={40} height={40} backgroundColor="$blue2" borderRadius="$4" alignItems="center" justifyContent="center">
              <FileText color="$blue10" size={20} />
            </YStack>
            <Text fontSize="$9" fontWeight="700" color="$color12">
              {packets.length}
            </Text>
          </XStack>
          <H3 fontSize="$3" fontWeight="500" color="$color11">
            Total Packets
          </H3>
        </Card>

        <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5" elevation={1} flex={1} minWidth="calc(25% - 12px)" $gtMd={{ minWidth: 'calc(25% - 12px)' }}>
          <XStack alignItems="center" justifyContent="space-between" mb="$3">
            <YStack width={40} height={40} backgroundColor="$green2" borderRadius="$4" alignItems="center" justifyContent="center">
              <CheckCircle color="$green10" size={20} />
            </YStack>
            <Text fontSize="$9" fontWeight="700" color="$color12">
              {packets.filter((p) => p.status === 'SIGNED').length}
            </Text>
          </XStack>
          <H3 fontSize="$3" fontWeight="500" color="$color11">Signed</H3>
        </Card>

        <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5" elevation={1} flex={1} minWidth="calc(25% - 12px)" $gtMd={{ minWidth: 'calc(25% - 12px)' }}>
          <XStack alignItems="center" justifyContent="space-between" mb="$3">
            <YStack width={40} height={40} backgroundColor="$blue2" borderRadius="$4" alignItems="center" justifyContent="center">
              <Clock color="$blue10" size={20} />
            </YStack>
            <Text fontSize="$9" fontWeight="700" color="$color12">
              {
                packets.filter(
                  (p) => p.status === 'SENT' || p.status === 'VIEWED'
                ).length
              }
            </Text>
          </XStack>
          <H3 fontSize="$3" fontWeight="500" color="$color11">Pending</H3>
        </Card>

        <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$5" elevation={1} flex={1} minWidth="calc(25% - 12px)" $gtMd={{ minWidth: 'calc(25% - 12px)' }}>
          <XStack alignItems="center" justifyContent="space-between" mb="$3">
            <YStack width={40} height={40} backgroundColor="$orange2" borderRadius="$4" alignItems="center" justifyContent="center">
              <AlertTriangle color="$orange10" size={20} />
            </YStack>
            <Text fontSize="$9" fontWeight="700" color="$color12">
              {packets.filter((p) => isExpiringSoon(p)).length}
            </Text>
          </XStack>
          <H3 fontSize="$3" fontWeight="500" color="$color11">
            Expiring Soon
          </H3>
        </Card>
      </XStack>

      <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$4" elevation={1}>
        <XStack flexDirection="column" $gtMd={{ flexDirection: 'row' }} gap="$4">
          <YStack flex={1} position="relative">
            <YStack position="absolute" left="$3" top="50%" transform="translateY(-50%)" zIndex={1}>
              <Search
                size={20}
                color="$color11"
              />
            </YStack>
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
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--color-12)',
              }}
            />
          </YStack>
          <XStack alignItems="center" gap="$2">
            <Filter size={20} color="$color11" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as PacketStatus | 'ALL')
              }
              style={{
                padding: '10px 16px',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                color: 'var(--color-12)',
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
          </XStack>
        </XStack>
      </Card>

      {filteredPackets.length === 0 ? (
        <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor" padding="$12" alignItems="center">
          <FileText size={48} color="$color11" mb="$4" />
          <H3 fontSize="$6" fontWeight="600" color="$color12" mb="$2">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No packets found'
              : 'No acknowledgement packets yet'}
          </H3>
          <Text color="$color11" mb="$6">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first broker acknowledgement packet to get started'}
          </Text>
        </Card>
      ) : (
        <YStack gap="$4">
          {filteredPackets.map((packet) => {
            const attestationCount = getAttestationCount(packet.attestations);
            const completionPct = getCompletionPercentage(packet);
            const expiringSoon = isExpiringSoon(packet);

            return (
              <Card
                key={packet.id}
                backgroundColor="$background"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$borderColor"
                hoverStyle={{ borderColor: '$blue8' }}
                cursor="pointer"
                onPress={() => setSelectedPacketId(packet.id)}
              >
                <YStack padding="$6">
                  <XStack alignItems="flex-start" justifyContent="space-between" mb="$4">
                    <YStack flex={1}>
                      <XStack alignItems="center" gap="$3" mb="$2">
                        <H3 fontSize="$6" fontWeight="600" color="$color12">
                          {getProjectName(packet.project_id)}
                        </H3>
                        <Text
                          paddingHorizontal="$3"
                          paddingVertical="$1"
                          fontSize="$1"
                          fontWeight="500"
                          borderRadius={9999}
                          borderWidth={1}
                          {...getStatusColorProps(packet.status)}
                        >
                          {packet.status}
                        </Text>
                        {expiringSoon && (
                          <XStack
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            fontSize="$1"
                            fontWeight="500"
                            borderRadius="$2"
                            backgroundColor="$orange2"
                            color="$orange10"
                            alignItems="center"
                            gap="$1"
                          >
                            <AlertTriangle size={12} />
                            <Text fontSize="$1" color="$orange10">Expiring Soon</Text>
                          </XStack>
                        )}
                      </XStack>
                      <XStack alignItems="center" gap="$4" fontSize="$3" color="$color11">
                        <XStack alignItems="center" gap="$1">
                          <Shield size={14} />
                          <Text fontSize="$3" color="$color11">
                            {getBrokerName(packet.broker_company_id)}
                          </Text>
                        </XStack>
                        <Text fontSize="$3" color="$color11">•</Text>
                        <XStack alignItems="center" gap="$1">
                          <Users size={14} />
                          <Text fontSize="$3" color="$color11">
                            {getGCName(packet.gc_company_id)}
                          </Text>
                        </XStack>
                        <Text fontSize="$3" color="$color11">•</Text>
                        <Text fontSize="$3" color="$color11">{packet.jurisdiction}</Text>
                      </XStack>
                    </YStack>
                  </XStack>

                  <XStack flexWrap="wrap" gap="$4" mb="$4" $gtMd={{ flexWrap: 'wrap' }}>
                    <Card backgroundColor="$backgroundHover" borderRadius="$4" padding="$3" flex={1} minWidth="calc(33.333% - 11px)" $gtMd={{ minWidth: 'calc(33.333% - 11px)' }}>
                      <Text fontSize="$1" color="$color11" mb="$1">
                        Effective Date
                      </Text>
                      <XStack alignItems="center" gap="$1">
                        <Calendar size={14} />
                        <Text fontSize="$3" fontWeight="500" color="$color12">
                          {formatDate(packet.effective_at)}
                        </Text>
                      </XStack>
                    </Card>

                    <Card backgroundColor="$backgroundHover" borderRadius="$4" padding="$3" flex={1} minWidth="calc(33.333% - 11px)" $gtMd={{ minWidth: 'calc(33.333% - 11px)' }}>
                      <Text fontSize="$1" color="$color11" mb="$1">
                        E&O Coverage
                      </Text>
                      <Text fontSize="$3" fontWeight="500" color="$color12">
                        {formatCurrency(packet.eo_policy.limits_each_claim)} /{' '}
                        {formatCurrency(packet.eo_policy.limits_aggregate)}
                      </Text>
                    </Card>

                    <Card backgroundColor="$backgroundHover" borderRadius="$4" padding="$3" flex={1} minWidth="calc(33.333% - 11px)" $gtMd={{ minWidth: 'calc(33.333% - 11px)' }}>
                      <Text fontSize="$1" color="$color11" mb="$1">
                        Licensed States
                      </Text>
                      <Text fontSize="$3" fontWeight="500" color="$color12">
                        {packet.licensing.states.join(', ')}
                      </Text>
                    </Card>
                  </XStack>

                  <XStack alignItems="center" justifyContent="space-between">
                    <XStack alignItems="center" gap="$4">
                      <XStack alignItems="center" gap="$2">
                        <Text fontSize="$1" color="$color11">
                          Attestations:
                        </Text>
                        <XStack alignItems="center" gap="$1">
                          <CheckCircle size={14} color="$green10" />
                          <Text fontSize="$1" fontWeight="500" color="$color12">
                            {attestationCount.confirmed}/
                            {attestationCount.total}
                          </Text>
                        </XStack>
                      </XStack>

                      <XStack alignItems="center" gap="$2">
                        {packet.signers.map((signer, idx) => (
                          <XStack
                            key={idx}
                            alignItems="center"
                            gap="$1.5"
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            backgroundColor="$background"
                            borderRadius="$2"
                            borderWidth={1}
                            borderColor="$borderColor"
                          >
                            {getSignerStatusIcon(signer.status)}
                            <Text fontSize="$1" fontWeight="500" color="$color11">
                              {signer.role}
                            </Text>
                          </XStack>
                        ))}
                      </XStack>
                    </XStack>

                    <XStack alignItems="center" gap="$3">
                      <XStack alignItems="center" gap="$2">
                        <YStack width={96} height={8} backgroundColor="$backgroundHover" borderRadius={9999} overflow="hidden">
                          <YStack
                            height="100%"
                            backgroundColor={completionPct === 100 ? '$green10' : '$blue10'}
                            width={`${completionPct}%`}
                          />
                        </YStack>
                        <Text fontSize="$1" fontWeight="500" color="$color11">
                          {completionPct}%
                        </Text>
                      </XStack>

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
                    </XStack>
                  </XStack>
                </YStack>
              </Card>
            );
          })}
        </YStack>
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
        <YStack
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="$background"
          zIndex={50}
          overflow="auto"
        >
          <BrokerAcknowledgementFormPage
            formId={createdFormId}
            onBack={() => setCreatedFormId(undefined)}
          />
        </YStack>
      )}
    </YStack>
  );
}
