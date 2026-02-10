/**
 * AuditHistoryPanel Component
 * Displays audit trail of field changes
 */

import React, { useState } from 'react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
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
        style={{
          backgroundColor: 'var(--color-gray-2)',
          borderRadius: '8px',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: 'var(--color-border)',
          padding: '16px',
        }}
      >
        <Row style={{ alignItems: 'center', color: 'var(--color-gray-10)' }}>
          <History size={20} style={{ marginRight: '8px' }} />
          <Text style={{ fontSize: '14px' }}>No audit history</Text>
        </Row>
      </Card>
    );
  }

  return (
    <Card
      style={{
        backgroundColor: 'var(--color-background)',
        borderRadius: '8px',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'var(--color-border)',
      }}
    >
      <button
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="audit-history-content"
      >
        <Row style={{ alignItems: 'center' }}>
          <History size={20} color="var(--color-gray-10)" style={{ marginRight: '8px' }} />
          <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-gray-12)' }}>
            Audit History ({auditHistory.length} {auditHistory.length === 1 ? 'entry' : 'entries'})
          </Text>
        </Row>
        {isExpanded ? (
          <ChevronUp size={20} color="var(--color-gray-10)" />
        ) : (
          <ChevronDown size={20} color="var(--color-gray-10)" />
        )}
      </button>

      {isExpanded && (
        <Stack
          id="audit-history-content"
          style={{
            borderTopWidth: 1,
            borderTopStyle: 'solid',
            borderTopColor: 'var(--color-border)',
            maxHeight: '384px',
            overflowY: 'auto',
          }}
        >
          {auditHistory.map((entry, index) => (
            <Stack
              key={entry.id}
              style={{
                padding: '16px',
                borderBottomWidth: index < auditHistory.length - 1 ? 1 : 0,
                borderBottomStyle: 'solid',
                borderBottomColor: 'var(--color-border)',
              }}
            >
              <Row style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Stack style={{ flex: 1 }}>
                  <Text style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-gray-12)' }}>
                    {entry.fieldName}
                  </Text>
                  <Stack style={{ marginTop: '4px', fontSize: '14px', color: 'var(--color-gray-11)', gap: '4px' }}>
                    <Text>
                      <Text style={{ fontWeight: 500 }}>From:</Text>{' '}
                      <Text style={{ color: 'var(--color-red-10)' }}>{formatValue(entry.oldValue)}</Text>
                    </Text>
                    <Text>
                      <Text style={{ fontWeight: 500 }}>To:</Text>{' '}
                      <Text style={{ color: 'var(--color-green-10)' }}>{formatValue(entry.newValue)}</Text>
                    </Text>
                  </Stack>
                  <Row style={{ marginTop: '8px', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--color-gray-10)' }}>
                    <Text>
                      <Text style={{ fontWeight: 500 }}>Changed by:</Text> {entry.changedBy}
                    </Text>
                    <Text>
                      <Text style={{ fontWeight: 500 }}>Confidence:</Text> {entry.confidenceAtEdit}%
                    </Text>
                  </Row>
                </Stack>
              </Row>
              <Text style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-gray-9)' }}>
                {formatDate(entry.changedAt)}
              </Text>
            </Stack>
          ))}
        </Stack>
      )}
    </Card>
  );
};
