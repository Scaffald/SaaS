/**
 * NotificationPanel - Notification panel using Beyond UI

 */
import React from 'react'
import { Row, Stack, Text, Button } from '@scaffald/ui'
import { X, AlertTriangle, Clock, Info, AlertCircle } from 'lucide-react'
import { Alert } from '../../types'

interface NotificationPanelProps {
  alerts: Alert[]
  onClose: () => void
}

const severityStyles = {
  critical: {
    borderLeftColor: 'var(--color-red-9)',
    backgroundColor: 'var(--color-red-2)',
  },
  high: {
    borderLeftColor: 'var(--color-orange-9)',
    backgroundColor: 'var(--color-orange-2)',
  },
  medium: {
    borderLeftColor: 'var(--color-blue-9)',
    backgroundColor: 'var(--color-blue-2)',
  },
  default: {
    borderLeftColor: 'var(--color-border)',
    backgroundColor: 'var(--color-background-hover)',
  },
}

export default function NotificationPanel({ alerts, onClose }: NotificationPanelProps) {
  const getAlertIcon = (type: string, severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle size={20} />
      case 'high':
        return <AlertTriangle size={20} />
      case 'medium':
        return <Info size={20} />
      default:
        return <Clock size={20} />
    }
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return severityStyles.critical
      case 'high':
        return severityStyles.high
      case 'medium':
        return severityStyles.medium
      default:
        return severityStyles.default
    }
  }

  return (
    <Stack
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 384,
        height: '100%',
        backgroundColor: 'var(--color-background-hover)',
        boxShadow: '-4px 0 20px var(--color-shadow)',
        zIndex: 50,
        borderLeft: '1px solid var(--color-border)',
      }}
    >
      <Row
        alignItems="center"
        justifyContent="space-between"
        padding={16}
        style={{
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <Text size="lg" weight="semibold">
          Notifications
        </Text>
        <Button onPress={onClose} variant="ghost" style={{ padding: 4 }}>
          <X size={20} />
        </Button>
      </Row>

      <Stack
        flex={1}
        style={{
          overflow: 'auto',
          paddingBottom: 64,
        }}
      >
        {alerts.length === 0 ? (
          <Stack padding={24} alignItems="center" gap={12}>
            <Clock size={48} />
            <Text muted>No notifications</Text>
          </Stack>
        ) : (
          <Stack>
            {alerts.map((alert) => {
              const styles = getSeverityStyles(alert.severity)
              return (
                <Stack
                  key={alert.id}
                  padding={16}
                  style={{
                    borderLeftWidth: 4,
                    borderLeftStyle: 'solid',
                    ...styles,
                    opacity: alert.isRead ? 0.6 : 1,
                  }}
                >
                  <Row alignItems="flex-start" gap={12}>
                    {getAlertIcon(alert.type, alert.severity)}
                    <Stack flex={1} gap={4} style={{ minWidth: 0 }}>
                      <Text size="sm" weight="medium" style={{ marginBottom: 4 }}>
                        {alert.title}
                      </Text>
                      <Text size="sm" muted style={{ marginBottom: 8 }}>
                        {alert.message}
                      </Text>
                      {alert.dueDate && (
                        <Text size="xs" muted>
                          Due: {alert.dueDate.toLocaleDateString()}
                        </Text>
                      )}
                    </Stack>
                  </Row>
                </Stack>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
