/**
 * AISummaryScreen - AI analysis summary screen using Tamagui
 */
import React from 'react';
import { YStack, XStack, Text, styled } from '@unicornlove/ui';
import { Button } from '@unicornlove/ui';
import { Chip as Badge } from '@unicornlove/ui';
import {
  CheckCircle,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

interface AISummaryScreenProps {
  title: string;
  whatWasAnalyzed: string;
  keyFindings: string[];
  confidence: number;
  recommendations?: string[];
  actionsTaken?: string[];
  actionsRequiringReview?: string[];
  onClose?: () => void;
  onConfirm?: () => void;
}

const ActionSection = styled(YStack, {
  name: 'ActionSection',
  borderRadius: '$3',
  padding: '$4',
  borderWidth: 1,
  
  variants: {
    type: {
      success: {
        backgroundColor: '$green2',
        borderColor: '$green6',
      },
      warning: {
        backgroundColor: '$yellow2',
        borderColor: '$yellow6',
      },
    },
  } as const,
});

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
    if (conf >= 90) return 'success';
    if (conf >= 70) return 'warning';
    return 'error';
  };

  return (
    <YStack gap="$6">
      {/* Header */}
      <XStack
        alignItems="center"
        gap="$3"
        paddingBottom="$4"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <YStack
          width={40}
          height={40}
          backgroundColor="$blue3"
          borderRadius="$10"
          alignItems="center"
          justifyContent="center"
        >
          <Sparkles size={20} color="currentColor" />
        </YStack>
        <YStack flex={1}>
          <Text fontSize="$5" fontWeight="600" color="$color11">
            {title}
          </Text>
          <Text fontSize="$2" color="$color10">
            AI Analysis Summary
          </Text>
        </YStack>
        <Badge variant={getConfidenceVariant(confidence)} size="md">
          {confidence}% confidence
        </Badge>
      </XStack>

      {/* What Was Analyzed */}
      <YStack gap="$2">
        <XStack alignItems="center" gap="$2">
          <FileCheck size={16} color="currentColor" />
          <Text fontSize="$2" fontWeight="600" color="$color11">
            What Was Analyzed
          </Text>
        </XStack>
        <Text fontSize="$2" color="$color10">
          {whatWasAnalyzed}
        </Text>
      </YStack>

      {/* Key Findings */}
      {keyFindings.length > 0 && (
        <YStack gap="$3">
          <XStack alignItems="center" gap="$2">
            <TrendingUp size={16} color="currentColor" />
            <Text fontSize="$2" fontWeight="600" color="$color11">
              Key Findings
            </Text>
          </XStack>
          <YStack gap="$2">
            {keyFindings.map((finding, index) => (
              <XStack key={index} alignItems="flex-start" gap="$2">
                <CheckCircle
                  size={16}
                  color="currentColor"
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <Text fontSize="$2" color="$color10" flex={1}>
                  {finding}
                </Text>
              </XStack>
            ))}
          </YStack>
        </YStack>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <YStack gap="$3">
          <Text fontSize="$2" fontWeight="600" color="$color11">
            Recommendations
          </Text>
          <YStack gap="$2">
            {recommendations.map((rec, index) => (
              <XStack key={index} alignItems="flex-start" gap="$2">
                <Text fontSize="$2" color="$blue9" style={{ marginTop: 2 }}>
                  •
                </Text>
                <Text fontSize="$2" color="$color10" flex={1}>
                  {rec}
                </Text>
              </XStack>
            ))}
          </YStack>
        </YStack>
      )}

      {/* Actions Taken Automatically */}
      {actionsTaken.length > 0 && (
        <ActionSection type="success">
          <XStack alignItems="center" gap="$2" mb="$2">
            <CheckCircle size={16} color="currentColor" />
            <Text fontSize="$2" fontWeight="600" color="$green11">
              Actions Taken Automatically
            </Text>
          </XStack>
          <YStack gap="$1">
            {actionsTaken.map((action, index) => (
              <Text key={index} fontSize="$2" color="$green11">
                ✓ {action}
              </Text>
            ))}
          </YStack>
        </ActionSection>
      )}

      {/* Actions Requiring Review */}
      {actionsRequiringReview.length > 0 && (
        <ActionSection type="warning">
          <XStack alignItems="center" gap="$2" mb="$2">
            <AlertTriangle size={16} color="currentColor" />
            <Text fontSize="$2" fontWeight="600" color="$yellow11">
              Actions Requiring Review
            </Text>
          </XStack>
          <YStack gap="$1">
            {actionsRequiringReview.map((action, index) => (
              <Text key={index} fontSize="$2" color="$yellow11">
                ⚠ {action}
              </Text>
            ))}
          </YStack>
        </ActionSection>
      )}

      {/* Actions */}
      {(onClose || onConfirm) && (
        <XStack gap="$3" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
          {onClose && (
            <Button variant="secondary" onPress={onClose} fullWidth>
              Close
            </Button>
          )}
          {onConfirm && (
            <Button variant="primary" onPress={onConfirm} fullWidth>
              Confirm & Continue
            </Button>
          )}
        </XStack>
      )}
    </YStack>
  );
}
