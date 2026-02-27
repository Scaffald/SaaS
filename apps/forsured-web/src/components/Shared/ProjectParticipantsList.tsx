import { Users, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { Stack, Row, Text } from '@scaffald/ui';
import StatusBadge from '../Common/StatusBadge';
import ComplianceScore from '../Common/ComplianceScore';

interface Participant {
  id: string;
  name: string;
  organizationName: string;
  role: string;
  status: 'invited' | 'accepted' | 'active' | 'completed' | 'removed';
  complianceStatus: 'compliant' | 'warning' | 'critical';
  complianceScore?: number;
  joinedDate?: string;
}

interface ProjectParticipantsListProps {
  participants: Participant[];
  onParticipantClick?: (participant: Participant) => void;
}

const getComplianceColor = (status: string): string => {
  switch (status) {
    case 'compliant':
      return 'var(--color-green10)';
    case 'warning':
      return 'var(--color-yellow10)';
    case 'critical':
      return 'var(--color-red10)';
    default:
      return 'var(--color-color10)';
  }
};

export default function ProjectParticipantsList({
  participants,
  onParticipantClick,
}: ProjectParticipantsListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return <CheckCircle color="var(--color-green10)" size={16} />;
      case 'invited':
      case 'accepted':
        return <Clock color="var(--color-blue10)" size={16} />;
      case 'removed':
        return <XCircle color="var(--color-red10)" size={16} />;
      default:
        return <AlertTriangle color="var(--color-yellow10)" size={16} />;
    }
  };

  return (
    <Stack
      style={{
        backgroundColor: 'var(--color-background)',
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--color-border)',
      }}
    >
      <Stack
        style={{
          padding: 24,
          borderBottomWidth: 1,
          borderBottomStyle: 'solid',
          borderBottomColor: 'var(--color-border)',
        }}
      >
        <Row style={{ alignItems: 'center', gap: 8 }}>
          <Users color="var(--color-color11)" size={20} />
          <Text style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-color12)' }}>
            Project Participants
          </Text>
          <Text style={{ fontSize: 14, color: 'var(--color-color11)' }}>
            ({participants.length})
          </Text>
        </Row>
      </Stack>

      <Stack>
        {participants.map((participant, index) => (
          <Stack
            key={participant.id}
            style={{
              padding: 24,
              borderTopWidth: index > 0 ? 1 : 0,
              borderTopStyle: 'solid',
              borderTopColor: 'var(--color-border)',
              cursor: onParticipantClick ? 'pointer' : 'default',
            }}
            onClick={() => onParticipantClick?.(participant)}
          >
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Row style={{ alignItems: 'center', gap: 16, flex: 1 }}>
                <Row
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: 'var(--color-blue3)',
                    borderRadius: '50%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-blue10)' }}>
                    {participant.organizationName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)}
                  </Text>
                </Row>

                <Stack style={{ flex: 1, minWidth: 0 }}>
                  <Row style={{ alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--color-color12)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {participant.organizationName}
                    </Text>
                    {getStatusIcon(participant.status)}
                  </Row>
                  <Row style={{ alignItems: 'center', gap: 12 }}>
                    <Text style={{ fontSize: 12, color: 'var(--color-color11)' }}>
                      {participant.name}
                    </Text>
                    <Row
                      style={{
                        alignItems: 'center',
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 2,
                        paddingBottom: 2,
                        borderRadius: 6,
                        backgroundColor: 'var(--color-color3)',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: 'var(--color-color11)' }}>
                        {participant.role}
                      </Text>
                    </Row>
                    <StatusBadge status={participant.status} size="sm" />
                  </Row>
                </Stack>
              </Row>

              <Row style={{ alignItems: 'center', gap: 24, marginLeft: 16 }}>
                {participant.complianceScore !== undefined && (
                  <Stack style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: 'var(--color-color11)', marginBottom: 4 }}>
                      Compliance
                    </Text>
                    <ComplianceScore
                      score={participant.complianceScore}
                      size="sm"
                      showTrend={false}
                    />
                  </Stack>
                )}

                <Stack style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: 'var(--color-color11)', marginBottom: 4 }}>
                    Status
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: getComplianceColor(participant.complianceStatus),
                    }}
                  >
                    {participant.complianceStatus}
                  </Text>
                </Stack>

                {participant.joinedDate && (
                  <Stack style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: 'var(--color-color11)', marginBottom: 4 }}>
                      Joined
                    </Text>
                    <Text style={{ fontSize: 14, color: 'var(--color-color12)' }}>
                      {new Date(participant.joinedDate).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </Text>
                  </Stack>
                )}
              </Row>
            </Row>
          </Stack>
        ))}
      </Stack>

      {participants.length === 0 && (
        <Stack style={{ padding: 48, alignItems: 'center' }}>
          <Users color="var(--color-color10)" size={48} style={{ marginBottom: 16 }} />
          <Text style={{ color: 'var(--color-color12)', fontWeight: 500, marginBottom: 8 }}>
            No participants yet
          </Text>
          <Text style={{ color: 'var(--color-color11)', fontSize: 14 }}>
            Invite contractors to join this project
          </Text>
        </Stack>
      )}
    </Stack>
  );
}
