/**
 * Insurance Policy Parent-Child Model - UI Components
 * EndorsementItem component displays a single policy endorsement with indentation
 */

import { FileCheck, DollarSign, Calendar } from 'lucide-react';
import { Stack, Row, Text, Card } from '@scaffald/ui';
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
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px',
        backgroundColor: 'white',
        borderRadius: '4px',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--color-border)',
        marginLeft: '32px',
      }}
    >
      {/* Icon */}
      <FileCheck size={16} color="var(--color-green-10)" style={{ marginTop: '2px', flexShrink: 0 }} />

      {/* Content */}
      <Stack style={{ flex: 1, minWidth: 0 }}>
        <Row style={{ alignItems: 'center', gap: '8px' }}>
          <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-12)' }}>
            {endorsement.endorsement_type}
          </Text>
          {endorsement.endorsement_code && (
            <Text
              style={{
                paddingLeft: '8px',
                paddingRight: '8px',
                paddingTop: '2px',
                paddingBottom: '2px',
                fontSize: '12px',
                fontFamily: 'monospace',
                backgroundColor: 'var(--color-background-hover)',
                color: 'var(--color-10)',
                borderRadius: '2px',
              }}
            >
              {endorsement.endorsement_code}
            </Text>
          )}
        </Row>

        {endorsement.description && (
          <Text style={{ fontSize: '12px', color: 'var(--color-10)', marginTop: '4px' }}>
            {endorsement.description}
          </Text>
        )}

        {/* Metadata */}
        <Row style={{ flexWrap: 'wrap', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
          {endorsement.limit_amount && (
            <Row style={{ alignItems: 'center', gap: '6px' }}>
              <DollarSign size={12} color="var(--color-10)" />
              <Text style={{ fontSize: '12px', color: 'var(--color-10)' }}>
                Limit:
              </Text>
              <Text style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-12)' }}>
                {formatCurrency(endorsement.limit_amount)}
              </Text>
            </Row>
          )}

          {endorsement.effective_date && (
            <Row style={{ alignItems: 'center', gap: '6px' }}>
              <Calendar size={12} color="var(--color-10)" />
              <Text style={{ fontSize: '12px', color: 'var(--color-10)' }}>
                Effective:
              </Text>
              <Text style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-12)' }}>
                {formatDate(endorsement.effective_date)}
              </Text>
            </Row>
          )}
        </Row>
      </Stack>
    </Card>
  );
}
