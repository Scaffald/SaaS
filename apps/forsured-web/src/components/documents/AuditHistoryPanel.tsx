/**
 * AuditHistoryPanel Component (REQ-167)
 * Displays audit trail of field changes
 */

import { useState } from 'react';
import { YStack, XStack, Text, Card } from '@unicornlove/ui';
import { AuditEntry } from '../../types/ocr.types';
import { History, ChevronDown, ChevronUp } from 'lucide-react';

interface AuditHistoryPanelProps {
  auditHistory: AuditEntry[];
}

export const AuditHistoryPanel: React.FC<AuditHistoryPanelProps> = ({ auditHistory }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatValue = (value: string | number | unknown[] | unknown): string => {
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (auditHistory.length === 0) {
    return (
      <Card
        backgroundColor="$gray2"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        padding="$4"
      >
        <XStack alignItems="center" color="$color10">
          <History size={20} marginRight="$2" />
          <Text fontSize="$3">No audit history</Text>
        </XStack>
      </Card>
    );
  }

  return (
    <Card backgroundColor="$background" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
      <XStack
        as="button"
        width="100%"
        alignItems="center"
        justifyContent="space-between"
        padding="$4"
        hoverStyle={{ backgroundColor: '$backgroundHover' }}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="audit-history-content"
        cursor="pointer"
      >
        <XStack alignItems="center">
          <History size={20} color="$color10" marginRight="$2" />
          <Text fontSize="$3" fontWeight="500" color="$color12">
            Audit History ({auditHistory.length} {auditHistory.length === 1 ? 'entry' : 'entries'})
          </Text>
        </XStack>
        {isExpanded ? (
          <ChevronUp size={20} color="$color10" />
        ) : (
          <ChevronDown size={20} color="$color10" />
        )}
      </XStack>

      {isExpanded && (
        <YStack
          id="audit-history-content"
          borderTopWidth={1}
          borderTopColor="$borderColor"
          maxHeight={384}
          overflowY="auto"
        >
          {auditHistory.map((entry, index) => (
            <YStack
              key={entry.id}
              padding="$4"
              borderBottomWidth={index < auditHistory.length - 1 ? 1 : 0}
              borderBottomColor="$borderColor"
              hoverStyle={{ backgroundColor: '$backgroundHover' }}
            >
              <XStack alignItems="flex-start" justifyContent="space-between">
                <YStack flex={1}>
                  <Text fontSize="$3" fontWeight="500" color="$color12">
                    {entry.fieldName}
                  </Text>
                  <YStack marginTop="$1" fontSize="$3" color="$color11" gap="$1">
                    <Text>
                      <Text fontWeight="500">From:</Text>{' '}
                      <Text color="$red10">{formatValue(entry.oldValue)}</Text>
                    </Text>
                    <Text>
                      <Text fontWeight="500">To:</Text>{' '}
                      <Text color="$green10">{formatValue(entry.newValue)}</Text>
                    </Text>
                  </YStack>
                  <XStack marginTop="$2" alignItems="center" gap="$3" fontSize="$1" color="$color10">
                    <Text>
                      <Text fontWeight="500">Changed by:</Text> {entry.changedBy}
                    </Text>
                    <Text>
                      <Text fontWeight="500">Confidence:</Text> {entry.confidenceAtEdit}%
                    </Text>
                  </XStack>
                </YStack>
              </XStack>
              <Text marginTop="$2" fontSize="$1" color="$color9">
                {formatDate(entry.changedAt)}
              </Text>
            </YStack>
          ))}
        </YStack>
      )}
    </Card>
  );
};
