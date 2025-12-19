/**
 * REQ-262: Insurance Policy Parent-Child Model - UI Components
 * EndorsementItem component displays a single policy endorsement with indentation
 */

import { FileCheck, DollarSign, Calendar } from 'lucide-react';
import { YStack, XStack, Text, Card } from '@unicornlove/ui';
import { PolicyEndorsement } from '../../types';

export interface EndorsementItemProps {
  endorsement: PolicyEndorsement;
}

export default function EndorsementItem({ endorsement }: EndorsementItemProps) {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card
      flexDirection="row"
      alignItems="flex-start"
      gap="$3"
      padding="$3"
      backgroundColor="white"
      borderRadius="$2"
      borderWidth={1}
      borderColor="$borderColor"
      marginLeft="$8"
    >
      {/* Icon */}
      <FileCheck size={16} color="$green10" marginTop="$0.5" flexShrink={0} />

      {/* Content */}
      <YStack flex={1} minWidth={0}>
        <XStack alignItems="center" gap="$2">
          <Text fontSize="$2" fontWeight="500" color="$color12">
            {endorsement.endorsement_type}
          </Text>
          {endorsement.endorsement_code && (
            <Text
              paddingHorizontal="$2"
              paddingVertical="$0.5"
              fontSize="$1"
              fontFamily="$mono"
              backgroundColor="$backgroundHover"
              color="$color10"
              borderRadius="$1"
            >
              {endorsement.endorsement_code}
            </Text>
          )}
        </XStack>

        {endorsement.description && (
          <Text fontSize="$1" color="$color10" marginTop="$1">
            {endorsement.description}
          </Text>
        )}

        {/* Metadata */}
        <XStack flexWrap="wrap" alignItems="center" gap="$4" marginTop="$2">
          {endorsement.limit_amount && (
            <XStack alignItems="center" gap="$1.5">
              <DollarSign size={12} color="$color10" />
              <Text fontSize="$1" color="$color10">
                Limit:
              </Text>
              <Text fontSize="$1" fontWeight="500" color="$color12">
                {formatCurrency(endorsement.limit_amount)}
              </Text>
            </XStack>
          )}

          {endorsement.effective_date && (
            <XStack alignItems="center" gap="$1.5">
              <Calendar size={12} color="$color10" />
              <Text fontSize="$1" color="$color10">
                Effective:
              </Text>
              <Text fontSize="$1" fontWeight="500" color="$color12">
                {formatDate(endorsement.effective_date)}
              </Text>
            </XStack>
          )}
        </XStack>
      </YStack>
    </Card>
  );
}
