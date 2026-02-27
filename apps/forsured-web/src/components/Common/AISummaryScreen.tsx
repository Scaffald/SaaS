/**
 * AISummaryScreen - AI analysis summary screen using Beyond UI

 */
import React from 'react'
import { Stack, Row, Text, Button, Chip } from '@scaffald/ui'
import { CheckCircle, AlertTriangle, Sparkles, TrendingUp, FileCheck } from 'lucide-react'

interface AISummaryScreenProps {
  title: string
  whatWasAnalyzed: string
  keyFindings: string[]
  confidence: number
  recommendations?: string[]
  actionsTaken?: string[]
  actionsRequiringReview?: string[]
  onClose?: () => void
  onConfirm?: () => void
}

const actionSectionStyles = {
  success: {
    backgroundColor: 'var(--color-green-2)',
    borderColor: 'var(--color-green-6)',
    textColor: 'var(--color-green-11)',
  },
  warning: {
    backgroundColor: 'var(--color-yellow-2)',
    borderColor: 'var(--color-yellow-6)',
    textColor: 'var(--color-yellow-11)',
  },
}

export default function AISummaryScreen({
  title,
  whatWasAnalyzed,
  keyFindings,
  confidence,
  recommendations = [],
  actionsTaken = [],
  actionsRequiringReview = [],
  onClose,
  onConfirm,
}: AISummaryScreenProps) {
  const getConfidenceVariant = (conf: number): 'success' | 'warning' | 'error' => {
    if (conf >= 90) return 'success'
    if (conf >= 70) return 'warning'
    return 'error'
  }

  return (
    <Stack gap={24}>
      {/* Header */}
      <Row
        alignItems="center"
        gap={12}
        style={{
          paddingBottom: 16,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <Stack
          alignItems="center"
          justifyContent="center"
          style={{
            width: 40,
            height: 40,
            backgroundColor: 'var(--color-blue-3)',
            borderRadius: '50%',
          }}
        >
          <Sparkles size={20} />
        </Stack>
        <Stack flex={1}>
          <Text size="lg" weight="semibold">
            {title}
          </Text>
          <Text size="sm" muted>
            AI Analysis Summary
          </Text>
        </Stack>
        <Chip variant={getConfidenceVariant(confidence)} size="md">
          {confidence}% confidence
        </Chip>
      </Row>

      {/* What Was Analyzed */}
      <Stack gap={8}>
        <Row alignItems="center" gap={8}>
          <FileCheck size={16} />
          <Text size="sm" weight="semibold">
            What Was Analyzed
          </Text>
        </Row>
        <Text size="sm" muted>
          {whatWasAnalyzed}
        </Text>
      </Stack>

      {/* Key Findings */}
      {keyFindings.length > 0 && (
        <Stack gap={12}>
          <Row alignItems="center" gap={8}>
            <TrendingUp size={16} />
            <Text size="sm" weight="semibold">
              Key Findings
            </Text>
          </Row>
          <Stack gap={8}>
            {keyFindings.map((finding, index) => (
              <Row key={index} alignItems="flex-start" gap={8}>
                <CheckCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
                <Text size="sm" muted style={{ flex: 1 }}>
                  {finding}
                </Text>
              </Row>
            ))}
          </Stack>
        </Stack>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Stack gap={12}>
          <Text size="sm" weight="semibold">
            Recommendations
          </Text>
          <Stack gap={8}>
            {recommendations.map((rec, index) => (
              <Row key={index} alignItems="flex-start" gap={8}>
                <Text size="sm" style={{ color: 'var(--color-blue-9)', marginTop: 2 }}>
                  •
                </Text>
                <Text size="sm" muted style={{ flex: 1 }}>
                  {rec}
                </Text>
              </Row>
            ))}
          </Stack>
        </Stack>
      )}

      {/* Actions Taken Automatically */}
      {actionsTaken.length > 0 && (
        <Stack
          padding={16}
          gap={8}
          style={{
            borderRadius: 12,
            border: '1px solid',
            ...actionSectionStyles.success,
          }}
        >
          <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
            <CheckCircle size={16} />
            <Text
              size="sm"
              weight="semibold"
              style={{ color: actionSectionStyles.success.textColor }}
            >
              Actions Taken Automatically
            </Text>
          </Row>
          <Stack gap={4}>
            {actionsTaken.map((action, index) => (
              <Text key={index} size="sm" style={{ color: actionSectionStyles.success.textColor }}>
                ✓ {action}
              </Text>
            ))}
          </Stack>
        </Stack>
      )}

      {/* Actions Requiring Review */}
      {actionsRequiringReview.length > 0 && (
        <Stack
          padding={16}
          gap={8}
          style={{
            borderRadius: 12,
            border: '1px solid',
            ...actionSectionStyles.warning,
          }}
        >
          <Row alignItems="center" gap={8} style={{ marginBottom: 8 }}>
            <AlertTriangle size={16} />
            <Text
              size="sm"
              weight="semibold"
              style={{ color: actionSectionStyles.warning.textColor }}
            >
              Actions Requiring Review
            </Text>
          </Row>
          <Stack gap={4}>
            {actionsRequiringReview.map((action, index) => (
              <Text key={index} size="sm" style={{ color: actionSectionStyles.warning.textColor }}>
                ⚠ {action}
              </Text>
            ))}
          </Stack>
        </Stack>
      )}

      {/* Actions */}
      {(onClose || onConfirm) && (
        <Row
          gap={12}
          style={{
            paddingTop: 16,
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {onClose && (
            <Button variant="secondary" onPress={onClose} style={{ flex: 1 }}>
              Close
            </Button>
          )}
          {onConfirm && (
            <Button variant="primary" onPress={onConfirm} style={{ flex: 1 }}>
              Confirm & Continue
            </Button>
          )}
        </Row>
      )}
    </Stack>
  )
}
