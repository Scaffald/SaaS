/**
 * REQ-262: Insurance Policy Parent-Child Model - UI Components
 * EndorsementItem component displays a single policy endorsement with indentation
 */

import React from 'react';
import { FileCheck, DollarSign, Calendar } from 'lucide-react';
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
    <div className="flex items-start gap-3 p-3 bg-white rounded-md border border-border ml-8">
      {/* Icon */}
      <FileCheck size={16} className="text-success-500 mt-0.5 flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary">
            {endorsement.endorsement_type}
          </p>
          {endorsement.endorsement_code && (
            <span className="px-2 py-0.5 text-xs font-mono bg-bg-tertiary text-text-secondary rounded">
              {endorsement.endorsement_code}
            </span>
          )}
        </div>

        {endorsement.description && (
          <p className="text-xs text-text-secondary mt-1">
            {endorsement.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 mt-2">
          {endorsement.limit_amount && (
            <div className="flex items-center gap-1.5 text-xs">
              <DollarSign size={12} className="text-text-secondary" />
              <span className="text-text-secondary">Limit:</span>
              <span className="font-medium text-text-primary">
                {formatCurrency(endorsement.limit_amount)}
              </span>
            </div>
          )}

          {endorsement.effective_date && (
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar size={12} className="text-text-secondary" />
              <span className="text-text-secondary">Effective:</span>
              <span className="font-medium text-text-primary">
                {formatDate(endorsement.effective_date)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
