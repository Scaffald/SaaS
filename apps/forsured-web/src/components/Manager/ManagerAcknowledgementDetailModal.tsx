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
import { YStack, XStack, Text, H2, H3, Card } from '@unicornlove/ui';
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
        <YStack gap="$4">
          <YStack height={128} backgroundColor="$backgroundHover" borderRadius="$4" opacity={0.5} />
          <YStack height={128} backgroundColor="$backgroundHover" borderRadius="$4" opacity={0.5} />
        </YStack>
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


  const getSignerStatusIcon = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return <CheckCircle size={18} color="$green10" />;
      case 'DECLINED':
        return <X size={18} color="$red10" />;
      case 'VIEWED':
        return <Clock size={18} color="$blue10" />;
      case 'SENT':
        return <Clock size={18} color="$blue10" />;
      case 'PENDING':
      default:
        return <Clock size={18} color="$gray10" />;
    }
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'created':
        return <FileText size={14} color="$gray10" />;
      case 'sent':
        return <Users size={14} color="$blue10" />;
      case 'viewed':
        return <Clock size={14} color="$blue10" />;
      case 'signed':
        return <CheckCircle size={14} color="$green10" />;
      case 'declined':
        return <X size={14} color="$red10" />;
      case 'expired':
        return <AlertTriangle size={14} color="$orange10" />;
      default:
        return <FileText size={14} color="$gray10" />;
    }
  };

  const formatResponsibility = (responsibility: string) => {
    return responsibility
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return '$gray2';
      case 'SENT':
        return '$blue2';
      case 'VIEWED':
        return '$blue2';
      case 'SIGNED':
        return '$green2';
      case 'DECLINED':
        return '$red2';
      case 'EXPIRED':
        return '$orange2';
      default:
        return '$gray2';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return '$gray10';
      case 'SENT':
        return '$blue10';
      case 'VIEWED':
        return '$blue10';
      case 'SIGNED':
        return '$green10';
      case 'DECLINED':
        return '$red10';
      case 'EXPIRED':
        return '$orange10';
      default:
        return '$gray10';
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Broker Acknowledgement Details"
      size="xl"
    >
      <YStack gap="$6">
        <XStack alignItems="flex-start" justifyContent="space-between" paddingBottom="$4" borderBottomWidth={1} borderColor="$borderColor">
          <YStack flex={1}>
            <XStack alignItems="center" gap="$3" mb="$2">
              <H2 fontSize="$9" fontWeight="700" color="$color12">
                {getProjectName(currentPacket.project_id)}
              </H2>
              <Text
                paddingHorizontal="$3"
                paddingVertical="$1"
                fontSize="$3"
                fontWeight="500"
                borderRadius={9999}
                backgroundColor={getStatusBgColor(currentPacket.status)}
                color={getStatusTextColor(currentPacket.status)}
              >
                {currentPacket.status}
              </Text>
            </XStack>
            <XStack alignItems="center" gap="$4" fontSize="$3" color="$color11">
              <XStack alignItems="center" gap="$1">
                <Shield size={16} />
                <Text fontSize="$3" color="$color11">
                  {getBrokerName(currentPacket.broker_company_id)}
                </Text>
              </XStack>
              <Text fontSize="$3" color="$color11">•</Text>
              <XStack alignItems="center" gap="$1">
                <Building size={16} />
                <Text fontSize="$3" color="$color11">
                  {getGCName(currentPacket.gc_company_id)}
                </Text>
              </XStack>
              <Text fontSize="$3" color="$color11">•</Text>
              <Text fontSize="$3" color="$color11">Version {currentPacket.version}</Text>
            </XStack>
          </YStack>
          <XStack gap="$2">
            {currentPacket.pdf_artifacts.length > 0 && (
              <Button variant="outline" size="$2">
                <XStack alignItems="center" gap="$2">
                  <Download size={16} />
                  <Text>Download PDF</Text>
                </XStack>
              </Button>
            )}
          </XStack>
        </XStack>

        <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexWrap: 'wrap' }}>
          <Card
            backgroundColor="$backgroundHover"
            borderRadius="$4"
            padding="$4"
            flex={1}
            minWidth="calc(50% - 8px)"
            $gtMd={{ minWidth: 'calc(50% - 8px)' }}
          >
            <XStack alignItems="center" gap="$2" mb="$2">
              <Calendar size={18} color="$color11" />
              <H3 fontSize="$4" fontWeight="600" color="$color12">
                Effective Date
              </H3>
            </XStack>
            <Text fontSize="$3" color="$color11">
              {formatDate(currentPacket.effective_at)}
            </Text>
          </Card>

          <Card
            backgroundColor="$backgroundHover"
            borderRadius="$4"
            padding="$4"
            flex={1}
            minWidth="calc(50% - 8px)"
            $gtMd={{ minWidth: 'calc(50% - 8px)' }}
          >
            <XStack alignItems="center" gap="$2" mb="$2">
              <Calendar size={18} color="$color11" />
              <H3 fontSize="$4" fontWeight="600" color="$color12">
                Expiration Date
              </H3>
            </XStack>
            <Text fontSize="$3" color="$color11">
              {formatDate(currentPacket.expires_at)}
            </Text>
          </Card>

          <Card
            backgroundColor="$backgroundHover"
            borderRadius="$4"
            padding="$4"
            flex={1}
            minWidth="calc(50% - 8px)"
            $gtMd={{ minWidth: 'calc(50% - 8px)' }}
          >
            <XStack alignItems="center" gap="$2" mb="$2">
              <Building size={18} color="$color11" />
              <H3 fontSize="$4" fontWeight="600" color="$color12">Jurisdiction</H3>
            </XStack>
            <Text fontSize="$3" color="$color11">
              {currentPacket.jurisdiction}
            </Text>
          </Card>

          <Card
            backgroundColor="$backgroundHover"
            borderRadius="$4"
            padding="$4"
            flex={1}
            minWidth="calc(50% - 8px)"
            $gtMd={{ minWidth: 'calc(50% - 8px)' }}
          >
            <XStack alignItems="center" gap="$2" mb="$2">
              <Shield size={18} color="$color11" />
              <H3 fontSize="$4" fontWeight="600" color="$color12">Liability Cap</H3>
            </XStack>
            <Text fontSize="$3" color="$color11">
              {currentPacket.limits_liability.cap_type === 'EO_LIMITS'
                ? 'E&O Limits'
                : currentPacket.limits_liability.cap_type === 'CUSTOM'
                  ? formatCurrency(
                      currentPacket.limits_liability.cap_amount || 0
                    )
                  : 'Uncapped'}
            </Text>
          </Card>
        </XStack>

        <Card backgroundColor="$backgroundHover" borderRadius="$4" padding="$4">
          <XStack alignItems="center" gap="$2" mb="$4">
            <CheckCircle size={18} />
            <H3 fontSize="$4" fontWeight="600" color="$color12">
              Attestations
            </H3>
          </XStack>
          <XStack flexWrap="wrap" gap="$3" $gtMd={{ flexWrap: 'wrap' }}>
            <XStack alignItems="flex-start" gap="$2" flex={1} minWidth="calc(50% - 6px)" $gtMd={{ minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations.is_licensed_for_project_state ? (
                <CheckCircle
                  size={16}
                  color="$green10"
                  mt="$0.5"
                  flexShrink={0}
                />
              ) : (
                <X size={16} color="$red10" mt="$0.5" flexShrink={0} />
              )}
              <Text fontSize="$3" color="$color12">
                Licensed for project state
              </Text>
            </XStack>
            <XStack alignItems="flex-start" gap="$2" flex={1} minWidth="calc(50% - 6px)" $gtMd={{ minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations.has_active_eo ? (
                <CheckCircle
                  size={16}
                  color="$green10"
                  mt="$0.5"
                  flexShrink={0}
                />
              ) : (
                <X size={16} color="$red10" mt="$0.5" flexShrink={0} />
              )}
              <Text fontSize="$3" color="$color12">
                Active E&O policy
              </Text>
            </XStack>
            <XStack alignItems="flex-start" gap="$2" flex={1} minWidth="calc(50% - 6px)" $gtMd={{ minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations.documents_are_accurate ? (
                <CheckCircle
                  size={16}
                  color="$green10"
                  mt="$0.5"
                  flexShrink={0}
                />
              ) : (
                <X size={16} color="$red10" mt="$0.5" flexShrink={0} />
              )}
              <Text fontSize="$3" color="$color12">
                Documents are accurate
              </Text>
            </XStack>
            <XStack alignItems="flex-start" gap="$2" flex={1} minWidth="calc(50% - 6px)" $gtMd={{ minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations
                .will_maintain_required_endorsements ? (
                <CheckCircle
                  size={16}
                  color="$green10"
                  mt="$0.5"
                  flexShrink={0}
                />
              ) : (
                <X size={16} color="$red10" mt="$0.5" flexShrink={0} />
              )}
              <Text fontSize="$3" color="$color12">
                Will maintain required endorsements
              </Text>
            </XStack>
            <XStack alignItems="flex-start" gap="$2" flex={1} minWidth="calc(50% - 6px)" $gtMd={{ minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations.agrees_to_platform_terms ? (
                <CheckCircle
                  size={16}
                  color="$green10"
                  mt="$0.5"
                  flexShrink={0}
                />
              ) : (
                <X size={16} color="$red10" mt="$0.5" flexShrink={0} />
              )}
              <Text fontSize="$3" color="$color12">
                Agrees to platform terms
              </Text>
            </XStack>
            <XStack alignItems="flex-start" gap="$2" flex={1} minWidth="calc(50% - 6px)" $gtMd={{ minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations.fraud_reporting_enabled ? (
                <CheckCircle
                  size={16}
                  color="$green10"
                  mt="$0.5"
                  flexShrink={0}
                />
              ) : (
                <X size={16} color="$red10" mt="$0.5" flexShrink={0} />
              )}
              <Text fontSize="$3" color="$color12">
                Fraud reporting enabled
              </Text>
            </XStack>
            <XStack alignItems="flex-start" gap="$2" flex={1} minWidth="calc(50% - 6px)" $gtMd={{ minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations.data_use_agreed ? (
                <CheckCircle
                  size={16}
                  color="$green10"
                  mt="$0.5"
                  flexShrink={0}
                />
              ) : (
                <X size={16} color="$red10" mt="$0.5" flexShrink={0} />
              )}
              <Text fontSize="$3" color="$color12">Data use agreed</Text>
            </XStack>
            <XStack alignItems="flex-start" gap="$2" flex={1} minWidth="calc(50% - 6px)" $gtMd={{ minWidth: 'calc(50% - 6px)' }}>
              <CheckCircle
                size={16}
                color="$blue10"
                mt="$0.5"
                flexShrink={0}
              />
              <Text fontSize="$3" color="$color12">
                Will notify changes within{' '}
                {currentPacket.attestations.will_notify_material_change_days}{' '}
                days
              </Text>
            </XStack>
          </XStack>
        </Card>

        <Card backgroundColor="$backgroundHover" borderRadius="$4" padding="$4">
          <XStack alignItems="center" gap="$2" mb="$4">
            <Shield size={18} />
            <H3 fontSize="$4" fontWeight="600" color="$color12">
              E&O Insurance Policy
            </H3>
          </XStack>
          <XStack flexWrap="wrap" gap="$4" $gtMd={{ flexWrap: 'wrap' }}>
            <YStack flex={1} minWidth="calc(50% - 8px)" $gtMd={{ minWidth: 'calc(50% - 8px)' }}>
              <Text fontSize="$1" color="$color11" mb="$1">Carrier</Text>
              <Text fontSize="$3" fontWeight="500" color="$color12">
                {currentPacket.eo_policy.carrier}
              </Text>
            </YStack>
            <YStack flex={1} minWidth="calc(50% - 8px)" $gtMd={{ minWidth: 'calc(50% - 8px)' }}>
              <Text fontSize="$1" color="$color11" mb="$1">Policy Number</Text>
              <Text fontSize="$3" fontWeight="500" color="$color12">
                {currentPacket.eo_policy.policy_number}
              </Text>
            </YStack>
            <YStack flex={1} minWidth="calc(50% - 8px)" $gtMd={{ minWidth: 'calc(50% - 8px)' }}>
              <Text fontSize="$1" color="$color11" mb="$1">
                Each Claim Limit
              </Text>
              <Text fontSize="$3" fontWeight="500" color="$color12">
                {formatCurrency(currentPacket.eo_policy.limits_each_claim)}
              </Text>
            </YStack>
            <YStack flex={1} minWidth="calc(50% - 8px)" $gtMd={{ minWidth: 'calc(50% - 8px)' }}>
              <Text fontSize="$1" color="$color11" mb="$1">
                Aggregate Limit
              </Text>
              <Text fontSize="$3" fontWeight="500" color="$color12">
                {formatCurrency(currentPacket.eo_policy.limits_aggregate)}
              </Text>
            </YStack>
            <YStack flex={1} minWidth="calc(50% - 8px)" $gtMd={{ minWidth: 'calc(50% - 8px)' }}>
              <Text fontSize="$1" color="$color11" mb="$1">Effective Date</Text>
              <Text fontSize="$3" fontWeight="500" color="$color12">
                {formatDate(currentPacket.eo_policy.effective)}
              </Text>
            </YStack>
            <YStack flex={1} minWidth="calc(50% - 8px)" $gtMd={{ minWidth: 'calc(50% - 8px)' }}>
              <Text fontSize="$1" color="$color11" mb="$1">
                Expiration Date
              </Text>
              <Text fontSize="$3" fontWeight="500" color="$color12">
                {formatDate(currentPacket.eo_policy.expires)}
              </Text>
            </YStack>
          </XStack>
        </Card>

        <Card backgroundColor="$backgroundHover" borderRadius="$4" padding="$4">
          <XStack alignItems="center" gap="$2" mb="$4">
            <FileText size={18} />
            <H3 fontSize="$4" fontWeight="600" color="$color12">
              Licensing Information
            </H3>
          </XStack>
          <YStack gap="$3">
            <YStack>
              <Text fontSize="$1" color="$color11" mb="$2">
                Licensed States
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {currentPacket.licensing.states.map((state) => (
                  <Badge key={state} variant="info">
                    {state}
                  </Badge>
                ))}
              </XStack>
            </YStack>
            <YStack>
              <Text fontSize="$1" color="$color11" mb="$2">
                License Details
              </Text>
              <YStack gap="$2">
                {currentPacket.licensing.license_numbers.map((license, idx) => (
                  <XStack
                    key={idx}
                    alignItems="center"
                    justifyContent="space-between"
                    padding="$2"
                    backgroundColor="$background"
                    borderRadius="$4"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <XStack alignItems="center" gap="$3">
                      <Badge variant="info">{license.state}</Badge>
                      <Text fontSize="$3" fontWeight="500" color="$color12">
                        {license.number}
                      </Text>
                    </XStack>
                    <Text fontSize="$1" color="$color11">
                      Expires: {formatDate(license.expires)}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            </YStack>
          </YStack>
        </Card>

        <Card backgroundColor="$backgroundHover" borderRadius="$4" padding="$4">
          <XStack alignItems="center" gap="$2" mb="$4">
            <Users size={18} />
            <H3 fontSize="$4" fontWeight="600" color="$color12">
              Broker Responsibilities
            </H3>
          </XStack>
          <XStack flexWrap="wrap" gap="$2" $gtMd={{ flexWrap: 'wrap' }}>
            {currentPacket.responsibilities.map((resp, idx) => (
              <XStack
                key={idx}
                alignItems="center"
                gap="$2"
                fontSize="$3"
                color="$color12"
                flex={1}
                minWidth="calc(50% - 4px)"
                $gtMd={{ minWidth: 'calc(50% - 4px)' }}
              >
                <CheckCircle
                  size={14}
                  color="$blue10"
                  flexShrink={0}
                />
                <Text fontSize="$3" color="$color12">{formatResponsibility(resp)}</Text>
              </XStack>
            ))}
          </XStack>
        </Card>

        <Card backgroundColor="$backgroundHover" borderRadius="$4" padding="$4">
          <XStack alignItems="center" gap="$2" mb="$4">
            <Users size={18} />
            <H3 fontSize="$4" fontWeight="600" color="$color12">
              Signers
            </H3>
          </XStack>
          <YStack gap="$3">
            {currentPacket.signers.map((signer, idx) => (
              <XStack
                key={idx}
                alignItems="center"
                justifyContent="space-between"
                padding="$3"
                backgroundColor="$background"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <XStack alignItems="center" gap="$3">
                  {getSignerStatusIcon(signer.status)}
                  <YStack>
                    <Text fontSize="$3" fontWeight="500" color="$color12">
                      {signer.email}
                    </Text>
                    <Text fontSize="$1" color="$color11">
                      Role: {signer.role}
                    </Text>
                  </YStack>
                </XStack>
                <YStack alignItems="flex-end">
                  <Text
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    fontSize="$1"
                    fontWeight="500"
                    borderRadius="$2"
                    backgroundColor={getStatusBgColor(signer.status)}
                    color={getStatusTextColor(signer.status)}
                  >
                    {signer.status}
                  </Text>
                  {signer.acted_at && (
                    <Text fontSize="$1" color="$color11" mt="$1">
                      {formatDate(signer.acted_at)}
                    </Text>
                  )}
                </YStack>
              </XStack>
            ))}
          </YStack>
        </Card>

        <Card backgroundColor="$backgroundHover" borderRadius="$4" padding="$4">
          <XStack alignItems="center" gap="$2" mb="$4">
            <Clock size={18} />
            <H3 fontSize="$4" fontWeight="600" color="$color12">
              Audit Log
            </H3>
          </XStack>
          <YStack gap="$2">
            {currentPacket.audit_log.map((entry, idx) => (
              <XStack
                key={idx}
                alignItems="flex-start"
                gap="$3"
                padding="$2"
                backgroundColor="$background"
                borderRadius="$4"
              >
                <YStack mt="$1">{getEventIcon(entry.event)}</YStack>
                <YStack flex={1}>
                  <XStack alignItems="center" justifyContent="space-between">
                    <Text fontSize="$3" fontWeight="500" color="$color12" textTransform="capitalize">
                      {entry.event}
                    </Text>
                    <Text fontSize="$1" color="$color11">
                      {formatDate(entry.at)}
                    </Text>
                  </XStack>
                  <Text fontSize="$1" color="$color11">
                    by {entry.actor}
                  </Text>
                </YStack>
              </XStack>
            ))}
          </YStack>
        </Card>

        <XStack justifyContent="flex-end" gap="$3" paddingTop="$4" borderTopWidth={1} borderColor="$borderColor">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {currentPacket.status === 'SENT' ||
            (currentPacket.status === 'VIEWED' && (
              <Button variant="primary">Send Reminder</Button>
            ))}
        </XStack>
      </YStack>
    </Modal>
  );
}
