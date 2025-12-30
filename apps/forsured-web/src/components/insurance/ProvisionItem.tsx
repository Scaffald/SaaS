/**
 * ProvisionItem - Policy provision item using Tamagui
 * REQ-262: Insurance Policy Parent-Child Model - UI Components
 */
import React from 'react';
import { XStack, YStack, Text } from '@unicornlove/ui';
import { Card } from '@unicornlove/ui';
import { FileText, DollarSign } from 'lucide-react';
import { PolicyProvision } from '../../types';

export interface ProvisionItemProps {
  provision: PolicyProvision;
}

export default function ProvisionItem({ provision }: ProvisionItemProps) {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProvisionLabel = (type: string) => {
    const labels: Record<string, string> = {
      per_occurrence: 'Per Occurrence',
      general_aggregate: 'General Aggregate',
      personal_advertising: 'Personal & Advertising Injury',
      products_completed: 'Products/Completed Operations',
      medical_payments: 'Medical Payments',
      damage_to_premises: 'Damage to Premises Rented',
      fire_damage: 'Fire Damage Legal Liability',
      employee_benefits: 'Employee Benefits Liability',
      other: 'Other',
    };
    return labels[type] || type;
  };

  return (
    <Card
      padding="$3"
      ml="$8"
      gap="$3"
    >
      <XStack alignItems="flex-start" gap="$3">
        <FileText size={16} color="currentColor" style={{ marginTop: 2, flexShrink: 0 }} />
        <YStack flex={1} minWidth={0} gap="$1">
          <Text fontSize="$2" fontWeight="500" color="$color11">
            {getProvisionLabel(provision.provision_type)}
          </Text>

          {provision.description && (
            <Text fontSize="$1" color="$color10" mt="$1">
              {provision.description}
            </Text>
          )}

          <XStack flexWrap="wrap" alignItems="center" gap="$4" mt="$2">
            {provision.limit_amount && (
              <XStack alignItems="center" gap="$1.5" fontSize="$1">
                <DollarSign size={12} color="currentColor" />
                <Text color="$color10">Limit:</Text>
                <Text fontWeight="500" color="$color11">
                  {formatCurrency(provision.limit_amount)}
                </Text>
              </XStack>
            )}

            {provision.deductible && (
              <XStack alignItems="center" gap="$1.5" fontSize="$1">
                <DollarSign size={12} color="currentColor" />
                <Text color="$color10">Deductible:</Text>
                <Text fontWeight="500" color="$color11">
                  {formatCurrency(provision.deductible)}
                </Text>
              </XStack>
            )}
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
}
