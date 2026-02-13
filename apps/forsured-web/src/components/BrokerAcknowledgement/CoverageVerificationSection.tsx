/* eslint-disable @typescript-eslint/no-explicit-any */
import { Info } from 'lucide-react';
import { Stack, Row, Text, Card } from '@scaffald/ui';
import {
  AcknowledgementCoverageItem,
  CoverageVerificationStatus,
} from '../../types';

interface CoverageRequirement {
  name: string;
  description?: string;
}

interface CoverageVerificationSectionProps {
  title: string;
  description?: string;
  minLimits?: string;
  requirements: CoverageRequirement[];
  coverageCategory: string;
  formId: string;
  existingItems: AcknowledgementCoverageItem[];
  onChange: (items: Partial<AcknowledgementCoverageItem>[]) => void;
  disabled?: boolean;
  infoNote?: string;
}

export default function CoverageVerificationSection({
  title,
  description,
  minLimits,
  requirements,
  coverageCategory,
  formId,
  existingItems,
  onChange,
  disabled = false,
  infoNote,
}: CoverageVerificationSectionProps) {
  const getItemForRequirement = (reqName: string) => {
    return existingItems.find(
      (item) =>
        item.coverage_category === coverageCategory &&
        item.requirement_name === reqName
    );
  };

  const handleStatusChange = (
    reqName: string,
    status: CoverageVerificationStatus
  ) => {
    const existingItem = getItemForRequirement(reqName);
    const updatedItems = [...existingItems];

    if (existingItem) {
      const index = updatedItems.findIndex((i) => i.id === existingItem.id);
      updatedItems[index] = {
        ...existingItem,
        verification_status: status,
        notes: status === 'included' ? '' : existingItem.notes,
        quote_details:
          status === 'quote_to_add' ? existingItem.quote_details : '',
      };
    } else {
      updatedItems.push({
        form_id: formId,
        coverage_category: coverageCategory as any,
        requirement_name: reqName,
        verification_status: status,
        ai_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as AcknowledgementCoverageItem);
    }

    onChange(updatedItems);
  };

  const handleNotesChange = (reqName: string, notes: string) => {
    const existingItem = getItemForRequirement(reqName);
    if (!existingItem) return;

    const updatedItems = existingItems.map((item) =>
      item.id === existingItem.id ? { ...item, notes } : item
    );

    onChange(updatedItems);
  };

  const handleQuoteChange = (reqName: string, quoteDetails: string) => {
    const existingItem = getItemForRequirement(reqName);
    if (!existingItem) return;

    const updatedItems = existingItems.map((item) =>
      item.id === existingItem.id
        ? { ...item, quote_details: quoteDetails }
        : item
    );

    onChange(updatedItems);
  };

  return (
    <Card style={{ border: '1px solid var(--color-border)', padding: 'var(--space-6)' }}>
      <Stack style={{ gap: 'var(--space-4)' }}>
        <Stack>
          <Text style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, color: 'var(--color-gray-12)' }}>
            {title}
          </Text>
          {description && (
            <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)', marginTop: 'var(--space-1)' }}>
              {description}
            </Text>
          )}
          {minLimits && (
            <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-blue-10)', marginTop: 'var(--space-2)' }}>
              Minimum Limits: {minLimits}
            </Text>
          )}
        </Stack>

        {infoNote && (
          <Card
            style={{
              backgroundColor: 'var(--color-blue-3)',
              border: '1px solid var(--color-blue-6)',
              borderRadius: 'var(--radius-4)',
              padding: 'var(--space-3)',
            }}
          >
            <Row style={{ alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <Info size={16} style={{ color: 'var(--color-blue-10)', marginTop: 'var(--space-0-5)', flexShrink: 0 }} />
              <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-blue-11)' }}>
                {infoNote}
              </Text>
            </Row>
          </Card>
        )}

        <Stack style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>
                  <Row style={{ paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-3)', paddingLeft: 'var(--space-2)', paddingRight: 'var(--space-2)' }}>
                    <Text style={{ textAlign: 'left', fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-11)' }}>
                      Specification
                    </Text>
                  </Row>
                </th>
                <th>
                  <Row style={{ paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-3)', paddingLeft: 'var(--space-2)', paddingRight: 'var(--space-2)', width: 96, justifyContent: 'center' }}>
                    <Text style={{ textAlign: 'center', fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-11)' }}>
                      Included
                    </Text>
                  </Row>
                </th>
                <th>
                  <Row style={{ paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-3)', paddingLeft: 'var(--space-2)', paddingRight: 'var(--space-2)', width: 96, justifyContent: 'center' }}>
                    <Text style={{ textAlign: 'center', fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-11)' }}>
                      Excluded
                    </Text>
                  </Row>
                </th>
                <th>
                  <Row style={{ paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-3)', paddingLeft: 'var(--space-2)', paddingRight: 'var(--space-2)', width: 128, justifyContent: 'center' }}>
                    <Text style={{ textAlign: 'center', fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-11)' }}>
                      Quote to Add
                    </Text>
                  </Row>
                </th>
                <th>
                  <Row style={{ paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-3)', paddingLeft: 'var(--space-2)', paddingRight: 'var(--space-2)' }}>
                    <Text style={{ textAlign: 'left', fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-11)' }}>
                      Notes
                    </Text>
                  </Row>
                </th>
              </tr>
            </thead>
            <tbody>
              {requirements.map((req, index) => {
                const item = getItemForRequirement(req.name);
                const status = item?.verification_status || 'not_applicable';

                return (
                  <tr key={index}>
                    <td>
                      <Stack style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)', paddingLeft: 'var(--space-2)', paddingRight: 'var(--space-2)' }}>
                        <Text style={{ fontSize: 'var(--font-size-2)', fontWeight: 500, color: 'var(--color-gray-12)' }}>
                          {req.name}
                        </Text>
                        {req.description && (
                          <Text style={{ fontSize: 'var(--font-size-1)', color: 'var(--color-gray-11)', marginTop: 'var(--space-1)' }}>
                            {req.description}
                          </Text>
                        )}
                      </Stack>
                    </td>
                    <td>
                      <Row style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)', paddingLeft: 'var(--space-2)', paddingRight: 'var(--space-2)', justifyContent: 'center' }}>
                        <input
                          type="radio"
                          name={`${coverageCategory}-${index}`}
                          checked={status === 'included'}
                          onChange={() => handleStatusChange(req.name, 'included')}
                          disabled={disabled}
                        />
                      </Row>
                    </td>
                    <td>
                      <Row style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)', paddingLeft: 'var(--space-2)', paddingRight: 'var(--space-2)', justifyContent: 'center' }}>
                        <input
                          type="radio"
                          name={`${coverageCategory}-${index}`}
                          checked={status === 'excluded'}
                          onChange={() => handleStatusChange(req.name, 'excluded')}
                          disabled={disabled}
                        />
                      </Row>
                    </td>
                    <td>
                      <Row style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)', paddingLeft: 'var(--space-2)', paddingRight: 'var(--space-2)', justifyContent: 'center' }}>
                        <input
                          type="radio"
                          name={`${coverageCategory}-${index}`}
                          checked={status === 'quote_to_add'}
                          onChange={() =>
                            handleStatusChange(req.name, 'quote_to_add')
                          }
                          disabled={disabled}
                        />
                      </Row>
                    </td>
                    <td>
                      <Row style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)', paddingLeft: 'var(--space-2)', paddingRight: 'var(--space-2)' }}>
                        {status === 'excluded' && (
                          <textarea
                            rows={2}
                            placeholder="Explain deficiency..."
                            value={item?.notes || ''}
                            onChange={(e) =>
                              handleNotesChange(req.name, e.target.value)
                            }
                            disabled={disabled}
                            style={{
                              width: '100%',
                              fontSize: 'var(--font-size-2)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-2)',
                              padding: 'var(--space-1) var(--space-2)',
                              resize: 'none',
                            }}
                          />
                        )}
                        {status === 'quote_to_add' && (
                          <textarea
                            rows={2}
                            placeholder="Quote details..."
                            value={item?.quote_details || ''}
                            onChange={(e) =>
                              handleQuoteChange(req.name, e.target.value)
                            }
                            disabled={disabled}
                            style={{
                              width: '100%',
                              fontSize: 'var(--font-size-2)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-2)',
                              padding: 'var(--space-1) var(--space-2)',
                              resize: 'none',
                            }}
                          />
                        )}
                      </Row>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Stack>
      </Stack>
    </Card>
  );
}
