/* eslint-disable @typescript-eslint/no-explicit-any */
import { Info } from 'lucide-react';
import { YStack, XStack, Text, Card } from '@unicornlove/ui';
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
    <Card borderWidth={1} borderColor="$borderColor" padding="$6">
      <YStack gap="$4">
        <YStack>
          <Text fontSize="$6" fontWeight="600" color="$color12">
            {title}
          </Text>
          {description && (
            <Text fontSize="$2" color="$color11" marginTop="$1">
              {description}
            </Text>
          )}
          {minLimits && (
            <Text fontSize="$2" fontWeight="500" color="$blue10" marginTop="$2">
              Minimum Limits: {minLimits}
            </Text>
          )}
        </YStack>

        {infoNote && (
          <Card
            backgroundColor="$blue3"
            borderWidth={1}
            borderColor="$blue6"
            borderRadius="$4"
            padding="$3"
          >
            <XStack alignItems="flex-start" gap="$2">
              <Info size={16} color="$blue10" marginTop="$0.5" flexShrink={0} />
              <Text fontSize="$2" color="$blue11">
                {infoNote}
              </Text>
            </XStack>
          </Card>
        )}

        <YStack overflowX="auto">
          <table width="100%">
            <thead>
              <tr>
                <th>
                  <XStack paddingVertical="$3" paddingHorizontal="$2">
                    <Text textAlign="left" fontSize="$2" fontWeight="500" color="$color11">
                      Specification
                    </Text>
                  </XStack>
                </th>
                <th>
                  <XStack paddingVertical="$3" paddingHorizontal="$2" width={96} justifyContent="center">
                    <Text textAlign="center" fontSize="$2" fontWeight="500" color="$color11">
                      Included
                    </Text>
                  </XStack>
                </th>
                <th>
                  <XStack paddingVertical="$3" paddingHorizontal="$2" width={96} justifyContent="center">
                    <Text textAlign="center" fontSize="$2" fontWeight="500" color="$color11">
                      Excluded
                    </Text>
                  </XStack>
                </th>
                <th>
                  <XStack paddingVertical="$3" paddingHorizontal="$2" width={128} justifyContent="center">
                    <Text textAlign="center" fontSize="$2" fontWeight="500" color="$color11">
                      Quote to Add
                    </Text>
                  </XStack>
                </th>
                <th>
                  <XStack paddingVertical="$3" paddingHorizontal="$2">
                    <Text textAlign="left" fontSize="$2" fontWeight="500" color="$color11">
                      Notes
                    </Text>
                  </XStack>
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
                      <YStack paddingVertical="$4" paddingHorizontal="$2">
                        <Text fontSize="$2" fontWeight="500" color="$color12">
                          {req.name}
                        </Text>
                        {req.description && (
                          <Text fontSize="$1" color="$color11" marginTop="$1">
                            {req.description}
                          </Text>
                        )}
                      </YStack>
                    </td>
                    <td>
                      <XStack paddingVertical="$4" paddingHorizontal="$2" justifyContent="center">
                        <input
                          type="radio"
                          name={`${coverageCategory}-${index}`}
                          checked={status === 'included'}
                          onChange={() => handleStatusChange(req.name, 'included')}
                          disabled={disabled}
                        />
                      </XStack>
                    </td>
                    <td>
                      <XStack paddingVertical="$4" paddingHorizontal="$2" justifyContent="center">
                        <input
                          type="radio"
                          name={`${coverageCategory}-${index}`}
                          checked={status === 'excluded'}
                          onChange={() => handleStatusChange(req.name, 'excluded')}
                          disabled={disabled}
                        />
                      </XStack>
                    </td>
                    <td>
                      <XStack paddingVertical="$4" paddingHorizontal="$2" justifyContent="center">
                        <input
                          type="radio"
                          name={`${coverageCategory}-${index}`}
                          checked={status === 'quote_to_add'}
                          onChange={() =>
                            handleStatusChange(req.name, 'quote_to_add')
                          }
                          disabled={disabled}
                        />
                      </XStack>
                    </td>
                    <td>
                      <XStack paddingVertical="$4" paddingHorizontal="$2">
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
                      </XStack>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </YStack>
      </YStack>
    </Card>
  );
}
