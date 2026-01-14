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
import { Stack, Row, Text, H2, H3, Card } from '@unicornlove/beyond-ui';
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
        <Stack gap={16}>
          <div style={{ height: 128, backgroundColor: 'var(--color-gray-2)', borderRadius: 8, opacity: 0.5 }} />
          <div style={{ height: 128, backgroundColor: 'var(--color-gray-2)', borderRadius: 8, opacity: 0.5 }} />
        </Stack>
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
        return <CheckCircle size={18} color="var(--color-green-10)" />;
      case 'DECLINED':
        return <X size={18} color="var(--color-red-10)" />;
      case 'VIEWED':
        return <Clock size={18} color="var(--color-blue-10)" />;
      case 'SENT':
        return <Clock size={18} color="var(--color-blue-10)" />;
      case 'PENDING':
      default:
        return <Clock size={18} color="var(--color-text-muted)" />;
    }
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'created':
        return <FileText size={14} color="var(--color-text-muted)" />;
      case 'sent':
        return <Users size={14} color="var(--color-blue-10)" />;
      case 'viewed':
        return <Clock size={14} color="var(--color-blue-10)" />;
      case 'signed':
        return <CheckCircle size={14} color="var(--color-green-10)" />;
      case 'declined':
        return <X size={14} color="var(--color-red-10)" />;
      case 'expired':
        return <AlertTriangle size={14} color="var(--color-orange-10)" />;
      default:
        return <FileText size={14} color="var(--color-text-muted)" />;
    }
  };

  const formatResponsibility = (responsibility: string) => {
    return responsibility
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusColorProps = (status: string): React.CSSProperties => {
    switch (status) {
      case 'DRAFT':
        return { backgroundColor: 'var(--color-gray-2)', color: 'var(--color-text-muted)' };
      case 'SENT':
        return { backgroundColor: 'var(--color-blue-2)', color: 'var(--color-blue-10)' };
      case 'VIEWED':
        return { backgroundColor: 'var(--color-blue-2)', color: 'var(--color-blue-10)' };
      case 'SIGNED':
        return { backgroundColor: 'var(--color-green-2)', color: 'var(--color-green-10)' };
      case 'DECLINED':
        return { backgroundColor: 'var(--color-red-2)', color: 'var(--color-red-10)' };
      case 'EXPIRED':
        return { backgroundColor: 'var(--color-orange-2)', color: 'var(--color-orange-10)' };
      default:
        return { backgroundColor: 'var(--color-gray-2)', color: 'var(--color-text-muted)' };
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Broker Acknowledgement Details"
      size="xl"
    >
      <Stack gap={24}>
        <Row alignItems="flex-start" justifyContent="space-between" style={{ paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
          <Stack style={{ flex: 1 }}>
            <Row alignItems="center" gap={12} style={{ marginBottom: 8 }}>
              <H2 style={{ fontSize: 28, fontWeight: 700 }}>
                {getProjectName(currentPacket.project_id)}
              </H2>
              <span
                style={{
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 4,
                  paddingBottom: 4,
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 9999,
                  ...getStatusColorProps(currentPacket.status),
                }}
              >
                {currentPacket.status}
              </span>
            </Row>
            <Row alignItems="center" gap={16} style={{ fontSize: 14 }}>
              <Row alignItems="center" gap={4}>
                <Shield size={16} color="var(--color-text-muted)" />
                <Text size="sm" muted>
                  {getBrokerName(currentPacket.broker_company_id)}
                </Text>
              </Row>
              <Text size="sm" muted>•</Text>
              <Row alignItems="center" gap={4}>
                <Building size={16} color="var(--color-text-muted)" />
                <Text size="sm" muted>
                  {getGCName(currentPacket.gc_company_id)}
                </Text>
              </Row>
              <Text size="sm" muted>•</Text>
              <Text size="sm" muted>Version {currentPacket.version}</Text>
            </Row>
          </Stack>
          <Row gap={8}>
            {currentPacket.pdf_artifacts.length > 0 && (
              <Button variant="outlined" size="sm">
                <Row alignItems="center" gap={8}>
                  <Download size={16} />
                  <span>Download PDF</span>
                </Row>
              </Button>
            )}
          </Row>
        </Row>

        <Row style={{ flexWrap: 'wrap', gap: 16 }}>
          <Card style={{ backgroundColor: 'var(--color-gray-2)', borderRadius: 8, padding: 16, flex: 1, minWidth: 'calc(50% - 8px)' }}>
            <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
              <Calendar size={18} color="var(--color-text-muted)" />
              <H3 style={{ fontSize: 14, fontWeight: 600 }}>
                Effective Date
              </H3>
            </Row>
            <Text size="sm" muted>
              {formatDate(currentPacket.effective_at)}
            </Text>
          </Card>

          <Card style={{ backgroundColor: 'var(--color-gray-2)', borderRadius: 8, padding: 16, flex: 1, minWidth: 'calc(50% - 8px)' }}>
            <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
              <Calendar size={18} color="var(--color-text-muted)" />
              <H3 style={{ fontSize: 14, fontWeight: 600 }}>
                Expiration Date
              </H3>
            </Row>
            <Text size="sm" muted>
              {formatDate(currentPacket.expires_at)}
            </Text>
          </Card>

          <Card style={{ backgroundColor: 'var(--color-gray-2)', borderRadius: 8, padding: 16, flex: 1, minWidth: 'calc(50% - 8px)' }}>
            <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
              <Building size={18} color="var(--color-text-muted)" />
              <H3 style={{ fontSize: 14, fontWeight: 600 }}>Jurisdiction</H3>
            </Row>
            <Text size="sm" muted>
              {currentPacket.jurisdiction}
            </Text>
          </Card>

          <Card style={{ backgroundColor: 'var(--color-gray-2)', borderRadius: 8, padding: 16, flex: 1, minWidth: 'calc(50% - 8px)' }}>
            <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
              <Shield size={18} color="var(--color-text-muted)" />
              <H3 style={{ fontSize: 14, fontWeight: 600 }}>Liability Cap</H3>
            </Row>
            <Text size="sm" muted>
              {currentPacket.limits_liability.cap_type === 'EO_LIMITS'
                ? 'E&O Limits'
                : currentPacket.limits_liability.cap_type === 'CUSTOM'
                  ? formatCurrency(
                      currentPacket.limits_liability.cap_amount || 0
                    )
                  : 'Uncapped'}
            </Text>
          </Card>
        </Row>

        <Card style={{ backgroundColor: 'var(--color-gray-2)', borderRadius: 8, padding: 16 }}>
          <Row alignItems="center" gap={8} style={{ marginBottom: 16 }}>
            <CheckCircle size={18} />
            <H3 style={{ fontSize: 14, fontWeight: 600 }}>
              Attestations
            </H3>
          </Row>
          <Row style={{ flexWrap: 'wrap', gap: 12 }}>
            <Row alignItems="flex-start" gap={8} style={{ flex: 1, minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations.is_licensed_for_project_state ? (
                <CheckCircle size={16} color="var(--color-green-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              ) : (
                <X size={16} color="var(--color-red-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              )}
              <Text size="sm">
                Licensed for project state
              </Text>
            </Row>
            <Row alignItems="flex-start" gap={8} style={{ flex: 1, minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations.has_active_eo ? (
                <CheckCircle size={16} color="var(--color-green-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              ) : (
                <X size={16} color="var(--color-red-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              )}
              <Text size="sm">
                Active E&O policy
              </Text>
            </Row>
            <Row alignItems="flex-start" gap={8} style={{ flex: 1, minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations.documents_are_accurate ? (
                <CheckCircle size={16} color="var(--color-green-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              ) : (
                <X size={16} color="var(--color-red-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              )}
              <Text size="sm">
                Documents are accurate
              </Text>
            </Row>
            <Row alignItems="flex-start" gap={8} style={{ flex: 1, minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations.will_maintain_required_endorsements ? (
                <CheckCircle size={16} color="var(--color-green-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              ) : (
                <X size={16} color="var(--color-red-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              )}
              <Text size="sm">
                Will maintain required endorsements
              </Text>
            </Row>
            <Row alignItems="flex-start" gap={8} style={{ flex: 1, minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations.agrees_to_platform_terms ? (
                <CheckCircle size={16} color="var(--color-green-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              ) : (
                <X size={16} color="var(--color-red-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              )}
              <Text size="sm">
                Agrees to platform terms
              </Text>
            </Row>
            <Row alignItems="flex-start" gap={8} style={{ flex: 1, minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations.fraud_reporting_enabled ? (
                <CheckCircle size={16} color="var(--color-green-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              ) : (
                <X size={16} color="var(--color-red-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              )}
              <Text size="sm">
                Fraud reporting enabled
              </Text>
            </Row>
            <Row alignItems="flex-start" gap={8} style={{ flex: 1, minWidth: 'calc(50% - 6px)' }}>
              {currentPacket.attestations.data_use_agreed ? (
                <CheckCircle size={16} color="var(--color-green-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              ) : (
                <X size={16} color="var(--color-red-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              )}
              <Text size="sm">Data use agreed</Text>
            </Row>
            <Row alignItems="flex-start" gap={8} style={{ flex: 1, minWidth: 'calc(50% - 6px)' }}>
              <CheckCircle size={16} color="var(--color-blue-10)" style={{ marginTop: 2, flexShrink: 0 }} />
              <Text size="sm">
                Will notify changes within{' '}
                {currentPacket.attestations.will_notify_material_change_days}{' '}
                days
              </Text>
            </Row>
          </Row>
        </Card>

        <Card style={{ backgroundColor: 'var(--color-gray-2)', borderRadius: 8, padding: 16 }}>
          <Row alignItems="center" gap={8} style={{ marginBottom: 16 }}>
            <Shield size={18} />
            <H3 style={{ fontSize: 14, fontWeight: 600 }}>
              E&O Insurance Policy
            </H3>
          </Row>
          <Row style={{ flexWrap: 'wrap', gap: 16 }}>
            <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
              <Text size="xs" muted style={{ marginBottom: 4 }}>Carrier</Text>
              <Text size="sm" weight="medium">
                {currentPacket.eo_policy.carrier}
              </Text>
            </Stack>
            <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
              <Text size="xs" muted style={{ marginBottom: 4 }}>Policy Number</Text>
              <Text size="sm" weight="medium">
                {currentPacket.eo_policy.policy_number}
              </Text>
            </Stack>
            <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
              <Text size="xs" muted style={{ marginBottom: 4 }}>
                Each Claim Limit
              </Text>
              <Text size="sm" weight="medium">
                {formatCurrency(currentPacket.eo_policy.limits_each_claim)}
              </Text>
            </Stack>
            <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
              <Text size="xs" muted style={{ marginBottom: 4 }}>
                Aggregate Limit
              </Text>
              <Text size="sm" weight="medium">
                {formatCurrency(currentPacket.eo_policy.limits_aggregate)}
              </Text>
            </Stack>
            <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
              <Text size="xs" muted style={{ marginBottom: 4 }}>Effective Date</Text>
              <Text size="sm" weight="medium">
                {formatDate(currentPacket.eo_policy.effective)}
              </Text>
            </Stack>
            <Stack style={{ flex: 1, minWidth: 'calc(50% - 8px)' }}>
              <Text size="xs" muted style={{ marginBottom: 4 }}>
                Expiration Date
              </Text>
              <Text size="sm" weight="medium">
                {formatDate(currentPacket.eo_policy.expires)}
              </Text>
            </Stack>
          </Row>
        </Card>

        <Card style={{ backgroundColor: 'var(--color-gray-2)', borderRadius: 8, padding: 16 }}>
          <Row alignItems="center" gap={8} style={{ marginBottom: 16 }}>
            <FileText size={18} />
            <H3 style={{ fontSize: 14, fontWeight: 600 }}>
              Licensing Information
            </H3>
          </Row>
          <Stack gap={12}>
            <Stack>
              <Text size="xs" muted style={{ marginBottom: 8 }}>
                Licensed States
              </Text>
              <Row style={{ flexWrap: 'wrap', gap: 8 }}>
                {currentPacket.licensing.states.map((state) => (
                  <Badge key={state} variant="info">
                    {state}
                  </Badge>
                ))}
              </Row>
            </Stack>
            <Stack>
              <Text size="xs" muted style={{ marginBottom: 8 }}>
                License Details
              </Text>
              <Stack gap={8}>
                {currentPacket.licensing.license_numbers.map((license, idx) => (
                  <Row
                    key={idx}
                    alignItems="center"
                    justifyContent="space-between"
                    style={{
                      padding: 8,
                      backgroundColor: 'var(--color-background)',
                      borderRadius: 8,
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <Row alignItems="center" gap={12}>
                      <Badge variant="info">{license.state}</Badge>
                      <Text size="sm" weight="medium">
                        {license.number}
                      </Text>
                    </Row>
                    <Text size="xs" muted>
                      Expires: {formatDate(license.expires)}
                    </Text>
                  </Row>
                ))}
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card style={{ backgroundColor: 'var(--color-gray-2)', borderRadius: 8, padding: 16 }}>
          <Row alignItems="center" gap={8} style={{ marginBottom: 16 }}>
            <Users size={18} />
            <H3 style={{ fontSize: 14, fontWeight: 600 }}>
              Broker Responsibilities
            </H3>
          </Row>
          <Row style={{ flexWrap: 'wrap', gap: 8 }}>
            {currentPacket.responsibilities.map((resp, idx) => (
              <Row
                key={idx}
                alignItems="center"
                gap={8}
                style={{ flex: 1, minWidth: 'calc(50% - 4px)' }}
              >
                <CheckCircle size={14} color="var(--color-blue-10)" style={{ flexShrink: 0 }} />
                <Text size="sm">{formatResponsibility(resp)}</Text>
              </Row>
            ))}
          </Row>
        </Card>

        <Card style={{ backgroundColor: 'var(--color-gray-2)', borderRadius: 8, padding: 16 }}>
          <Row alignItems="center" gap={8} style={{ marginBottom: 16 }}>
            <Users size={18} />
            <H3 style={{ fontSize: 14, fontWeight: 600 }}>
              Signers
            </H3>
          </Row>
          <Stack gap={12}>
            {currentPacket.signers.map((signer, idx) => (
              <Row
                key={idx}
                alignItems="center"
                justifyContent="space-between"
                style={{
                  padding: 12,
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                }}
              >
                <Row alignItems="center" gap={12}>
                  {getSignerStatusIcon(signer.status)}
                  <Stack>
                    <Text size="sm" weight="medium">
                      {signer.email}
                    </Text>
                    <Text size="xs" muted>
                      Role: {signer.role}
                    </Text>
                  </Stack>
                </Row>
                <Stack alignItems="flex-end">
                  <span
                    style={{
                      paddingLeft: 8,
                      paddingRight: 8,
                      paddingTop: 4,
                      paddingBottom: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 4,
                      ...getStatusColorProps(signer.status),
                    }}
                  >
                    {signer.status}
                  </span>
                  {signer.acted_at && (
                    <Text size="xs" muted style={{ marginTop: 4 }}>
                      {formatDate(signer.acted_at)}
                    </Text>
                  )}
                </Stack>
              </Row>
            ))}
          </Stack>
        </Card>

        <Card style={{ backgroundColor: 'var(--color-gray-2)', borderRadius: 8, padding: 16 }}>
          <Row alignItems="center" gap={8} style={{ marginBottom: 16 }}>
            <Clock size={18} />
            <H3 style={{ fontSize: 14, fontWeight: 600 }}>
              Audit Log
            </H3>
          </Row>
          <Stack gap={8}>
            {currentPacket.audit_log.map((entry, idx) => (
              <Row
                key={idx}
                alignItems="flex-start"
                gap={12}
                style={{
                  padding: 8,
                  backgroundColor: 'var(--color-background)',
                  borderRadius: 8,
                }}
              >
                <div style={{ marginTop: 4 }}>{getEventIcon(entry.event)}</div>
                <Stack style={{ flex: 1 }}>
                  <Row alignItems="center" justifyContent="space-between">
                    <Text size="sm" weight="medium" style={{ textTransform: 'capitalize' }}>
                      {entry.event}
                    </Text>
                    <Text size="xs" muted>
                      {formatDate(entry.at)}
                    </Text>
                  </Row>
                  <Text size="xs" muted>
                    by {entry.actor}
                  </Text>
                </Stack>
              </Row>
            ))}
          </Stack>
        </Card>

        <Row justifyContent="flex-end" gap={12} style={{ paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
          {currentPacket.status === 'SENT' ||
            (currentPacket.status === 'VIEWED' && (
              <Button variant="primary">Send Reminder</Button>
            ))}
        </Row>
      </Stack>
    </Modal>
  );
}
