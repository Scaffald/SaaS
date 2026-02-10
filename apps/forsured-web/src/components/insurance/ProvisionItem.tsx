/**
 * ProvisionItem - Policy provision item using Beyond UI
 * Insurance Policy Parent-Child Model - UI Components
 */
import React from 'react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
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
      style={{
        padding: '12px',
        marginLeft: '32px',
        gap: '12px',
      }}
    >
      <Row style={{ alignItems: 'flex-start', gap: '12px' }}>
        <FileText size={16} color="currentColor" style={{ marginTop: 2, flexShrink: 0 }} />
        <Stack style={{ flex: 1, minWidth: 0, gap: '4px' }}>
          <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-11)' }}>
            {getProvisionLabel(provision.provision_type)}
          </Text>

          {provision.description && (
            <Text style={{ fontSize: '12px', color: 'var(--color-10)', marginTop: '4px' }}>
              {provision.description}
            </Text>
          )}

          <Row style={{ flexWrap: 'wrap', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
            {provision.limit_amount && (
              <Row style={{ alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <DollarSign size={12} color="currentColor" />
                <Text style={{ color: 'var(--color-10)' }}>Limit:</Text>
                <Text style={{ fontWeight: 500, color: 'var(--color-11)' }}>
                  {formatCurrency(provision.limit_amount)}
                </Text>
              </Row>
            )}

            {provision.deductible && (
              <Row style={{ alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <DollarSign size={12} color="currentColor" />
                <Text style={{ color: 'var(--color-10)' }}>Deductible:</Text>
                <Text style={{ fontWeight: 500, color: 'var(--color-11)' }}>
                  {formatCurrency(provision.deductible)}
                </Text>
              </Row>
            )}
          </Row>
        </Stack>
      </Row>
    </Card>
  );
}
