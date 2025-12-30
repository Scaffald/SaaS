/**
 * NotificationPanel - Notification panel using Tamagui
 */
import React from 'react';
import { XStack, YStack, Text, Button, styled } from '@unicornlove/ui';
import { X, AlertTriangle, Clock, Info, AlertCircle } from 'lucide-react';
import { Alert } from '../../types';

interface NotificationPanelProps {
  alerts: Alert[];
  onClose: () => void;
}

const AlertItem = styled(YStack, {
  name: 'AlertItem',
  padding: '$4',
  borderLeftWidth: 4,
  
  variants: {
    severity: {
      critical: {
        borderLeftColor: '$red9',
        backgroundColor: '$red2',
      },
      high: {
        borderLeftColor: '$orange9',
        backgroundColor: '$orange2',
      },
      medium: {
        borderLeftColor: '$blue9',
        backgroundColor: '$blue2',
      },
      default: {
        borderLeftColor: '$borderColor',
        backgroundColor: '$backgroundHover',
      },
    },
    read: {
      true: {
        opacity: 0.6,
      },
    },
  } as const,
});

export default function NotificationPanel({
  alerts,
  onClose,
}: NotificationPanelProps) {
  const getAlertIcon = (type: string, severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={20} color="currentColor" />;
      case 'high':
        return <AlertTriangle size={20} color="currentColor" />;
      case 'medium':
        return <Info size={20} color="currentColor" />;
      default:
        return <Clock size={20} color="currentColor" />;
    }
  };

  const getSeverityVariant = (severity: string): 'critical' | 'high' | 'medium' | 'default' => {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'default';
    }
  };

  return (
    <YStack
      position="absolute"
      top={0}
      right={0}
      width={384}
      height="100%"
      backgroundColor="$backgroundHover"
      shadowColor="$shadowColor"
      shadowRadius={20}
      shadowOffset={{ width: -4, height: 0 }}
      zIndex={50}
      borderLeftWidth={1}
      borderLeftColor="$borderColor"
    >
      <XStack
        alignItems="center"
        justifyContent="space-between"
        padding="$4"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <Text fontSize="$5" fontWeight="600" color="$color11">
          Notifications
        </Text>
        <Button
          onPress={onClose}
          padding="$1"
          hoverStyle={{ backgroundColor: '$backgroundHover' }}
          borderRadius="$3"
        >
          <X size={20} color="currentColor" />
        </Button>
      </XStack>

      <YStack flex={1} overflow="scroll" paddingBottom="$16">
        {alerts.length === 0 ? (
          <YStack padding="$6" alignItems="center" gap="$3">
            <Clock size={48} color="currentColor" />
            <Text color="$color10">No notifications</Text>
          </YStack>
        ) : (
          <YStack>
            {alerts.map((alert) => (
              <AlertItem
                key={alert.id}
                severity={getSeverityVariant(alert.severity)}
                read={alert.isRead}
              >
                <XStack alignItems="flex-start" gap="$3">
                  {getAlertIcon(alert.type, alert.severity)}
                  <YStack flex={1} minWidth={0} gap="$1">
                    <Text fontSize="$2" fontWeight="500" color="$color11" mb="$1">
                      {alert.title}
                    </Text>
                    <Text fontSize="$2" color="$color10" mb="$2">
                      {alert.message}
                    </Text>
                    {alert.dueDate && (
                      <Text fontSize="$1" color="$color9">
                        Due: {alert.dueDate.toLocaleDateString()}
                      </Text>
                    )}
                  </YStack>
                </XStack>
              </AlertItem>
            ))}
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
