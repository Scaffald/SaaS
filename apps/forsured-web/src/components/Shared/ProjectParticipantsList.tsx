import { Users, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { YStack, XStack, Text } from '@unicornlove/ui';
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

export default function ProjectParticipantsList({
  participants,
  onParticipantClick,
}: ProjectParticipantsListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return <CheckCircle color="$green10" size={16} />;
      case 'invited':
      case 'accepted':
        return <Clock color="$blue10" size={16} />;
      case 'removed':
        return <XCircle color="$red10" size={16} />;
      default:
        return <AlertTriangle color="$yellow10" size={16} />;
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return '$green10';
      case 'warning':
        return '$yellow10';
      case 'critical':
        return '$red10';
      default:
        return '$color10';
    }
  };

  return (
    <YStack
      backgroundColor="$background"
      borderRadius="$4"
      elevation={1}
      borderWidth={1}
      borderColor="$borderColor"
    >
      <YStack padding="$6" borderBottomWidth={1} borderColor="$borderColor">
        <XStack alignItems="center" gap="$2">
          <Users color="$color11" size={20} />
          <Text fontSize="$6" fontWeight="600" color="$color12">
            Project Participants
          </Text>
          <Text fontSize="$3" color="$color11">
            ({participants.length})
          </Text>
        </XStack>
      </YStack>

      <YStack>
        {participants.map((participant, index) => (
          <YStack
            key={participant.id}
            padding="$6"
            borderTopWidth={index > 0 ? 1 : 0}
            borderColor="$borderColor"
            hoverStyle={{ backgroundColor: '$backgroundHover' }}
            cursor={onParticipantClick ? 'pointer' : 'default'}
            onPress={() => onParticipantClick?.(participant)}
          >
            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" gap="$4" flex={1}>
                <XStack
                  width={48}
                  height={48}
                  backgroundColor="$blue3"
                  borderRadius={9999}
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Text fontSize="$3" fontWeight="600" color="$blue10">
                    {participant.organizationName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)}
                  </Text>
                </XStack>

                <YStack flex={1} minWidth={0}>
                  <XStack alignItems="center" gap="$2" marginBottom="$1">
                    <Text
                      fontSize="$3"
                      fontWeight="600"
                      color="$color12"
                      numberOfLines={1}
                    >
                      {participant.organizationName}
                    </Text>
                    {getStatusIcon(participant.status)}
                  </XStack>
                  <XStack alignItems="center" gap="$3">
                    <Text fontSize="$1" color="$color11">
                      {participant.name}
                    </Text>
                    <XStack
                      alignItems="center"
                      paddingHorizontal="$2"
                      paddingVertical="$0.5"
                      borderRadius="$2"
                      backgroundColor="$color3"
                    >
                      <Text fontSize="$1" color="$color11">
                        {participant.role}
                      </Text>
                    </XStack>
                    <StatusBadge status={participant.status} size="sm" />
                  </XStack>
                </YStack>
              </XStack>

              <XStack alignItems="center" gap="$6" marginLeft="$4">
                {participant.complianceScore !== undefined && (
                  <YStack alignItems="center">
                    <Text fontSize="$1" color="$color11" marginBottom="$1">
                      Compliance
                    </Text>
                    <ComplianceScore
                      score={participant.complianceScore}
                      size="sm"
                      showTrend={false}
                    />
                  </YStack>
                )}

                <YStack alignItems="center">
                  <Text fontSize="$1" color="$color11" marginBottom="$1">
                    Status
                  </Text>
                  <Text
                    fontSize="$3"
                    fontWeight="500"
                    color={getComplianceColor(participant.complianceStatus)}
                  >
                    {participant.complianceStatus}
                  </Text>
                </YStack>

                {participant.joinedDate && (
                  <YStack alignItems="center">
                    <Text fontSize="$1" color="$color11" marginBottom="$1">
                      Joined
                    </Text>
                    <Text fontSize="$3" color="$color12">
                      {new Date(participant.joinedDate).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </Text>
                  </YStack>
                )}
              </XStack>
            </XStack>
          </YStack>
        ))}
      </YStack>

      {participants.length === 0 && (
        <YStack padding="$12" alignItems="center">
          <Users color="$color10" size={48} marginBottom="$4" />
          <Text color="$color12" fontWeight="500" marginBottom="$2">
            No participants yet
          </Text>
          <Text color="$color11" fontSize="$3">
            Invite contractors to join this project
          </Text>
        </YStack>
      )}
    </YStack>
  );
}
