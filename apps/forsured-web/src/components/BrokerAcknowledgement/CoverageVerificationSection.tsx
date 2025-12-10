/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Info } from 'lucide-react';
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
    <div className="bg-surface rounded-lg border border-border p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        )}
        {minLimits && (
          <p className="text-sm font-medium text-primary-600 mt-2">
            Minimum Limits: {minLimits}
          </p>
        )}
      </div>

      {infoNote && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-start space-x-2">
          <Info size={16} className="text-primary-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-primary-900">{infoNote}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-sm font-medium text-text-secondary">
                Specification
              </th>
              <th className="text-center py-3 px-2 text-sm font-medium text-text-secondary w-24">
                Included
              </th>
              <th className="text-center py-3 px-2 text-sm font-medium text-text-secondary w-24">
                Excluded
              </th>
              <th className="text-center py-3 px-2 text-sm font-medium text-text-secondary w-32">
                Quote to Add
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-text-secondary">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req, index) => {
              const item = getItemForRequirement(req.name);
              const status = item?.verification_status || 'not_applicable';

              return (
                <tr
                  key={index}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-4 px-2">
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {req.name}
                      </p>
                      {req.description && (
                        <p className="text-xs text-text-secondary mt-1">
                          {req.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <input
                      type="radio"
                      name={`${coverageCategory}-${index}`}
                      checked={status === 'included'}
                      onChange={() => handleStatusChange(req.name, 'included')}
                      disabled={disabled}
                      className="w-4 h-4 text-success-600 focus:ring-success-500"
                    />
                  </td>
                  <td className="py-4 px-2 text-center">
                    <input
                      type="radio"
                      name={`${coverageCategory}-${index}`}
                      checked={status === 'excluded'}
                      onChange={() => handleStatusChange(req.name, 'excluded')}
                      disabled={disabled}
                      className="w-4 h-4 text-error-600 focus:ring-error-500"
                    />
                  </td>
                  <td className="py-4 px-2 text-center">
                    <input
                      type="radio"
                      name={`${coverageCategory}-${index}`}
                      checked={status === 'quote_to_add'}
                      onChange={() =>
                        handleStatusChange(req.name, 'quote_to_add')
                      }
                      disabled={disabled}
                      className="w-4 h-4 text-warning-600 focus:ring-warning-500"
                    />
                  </td>
                  <td className="py-4 px-2">
                    {status === 'excluded' && (
                      <textarea
                        rows={2}
                        placeholder="Explain deficiency..."
                        value={item?.notes || ''}
                        onChange={(e) =>
                          handleNotesChange(req.name, e.target.value)
                        }
                        disabled={disabled}
                        className="w-full text-sm border border-border rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
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
                        className="w-full text-sm border border-border rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
