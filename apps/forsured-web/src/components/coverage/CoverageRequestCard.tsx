/**
 * REQ-273: Coverage Request Workflow - UI Components
 * CoverageRequestCard component displays a single coverage request with actions
 */

import React from 'react';
import { FileQuestion, DollarSign, Calendar, User } from 'lucide-react';
import { CoverageRequest } from '../../types';
import Card from '../Common/Card';
import StatusBadge from '../Common/StatusBadge';

export interface CoverageRequestCardProps {
  request: CoverageRequest;
  onProvideQuote?: (requestId: string) => void;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  userRole?: 'broker' | 'subcontractor' | 'manager';
}

export default function CoverageRequestCard({
  request,
  onProvideQuote,
  onApprove,
  onReject,
  onCancel,
  userRole = 'subcontractor',
}: CoverageRequestCardProps) {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (
    status: string
  ): 'success' | 'warning' | 'danger' | 'info' => {
    const colors: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      pending: 'warning',
      quoted: 'info',
      approved: 'success',
      rejected: 'danger',
      cancelled: 'danger',
    };
    return colors[status] || 'info';
  };

  const canBrokerProvideQuote = userRole === 'broker' && request.status === 'pending';
  const canSubApproveReject =
    userRole === 'subcontractor' && request.status === 'quoted';
  const canCancel =
    (userRole === 'subcontractor' || userRole === 'manager') &&
    request.status === 'pending';

  return (
    <Card padding="none">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Request Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <FileQuestion className="text-primary-600" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {request.coverage_type} Coverage Request
                </h3>
                <p className="text-sm text-text-secondary">
                  Request #{request.id.substring(0, 8)}
                </p>
              </div>
            </div>

            {/* Request Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {/* Quote Amount (if quoted) */}
              {request.quote_amount && (
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-text-secondary" />
                  <div>
                    <p className="text-xs text-text-secondary">Quote Amount</p>
                    <p className="text-sm font-medium text-text-primary">
                      {formatCurrency(request.quote_amount)}
                    </p>
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-text-secondary" />
                <div>
                  <p className="text-xs text-text-secondary">Requested On</p>
                  <p className="text-sm font-medium text-text-primary">
                    {formatDate(request.created_at)}
                  </p>
                </div>
              </div>

              {/* Broker (if assigned) */}
              {request.broker_id && (
                <div className="flex items-center gap-2">
                  <User size={16} className="text-text-secondary" />
                  <div>
                    <p className="text-xs text-text-secondary">Assigned Broker</p>
                    <p className="text-sm font-medium text-text-primary">
                      Broker #{request.broker_id.substring(0, 8)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quote Details (if available) */}
            {request.quote_details && (
              <div className="mt-3 p-3 bg-bg-secondary rounded-md">
                <p className="text-xs font-semibold text-text-primary mb-1">
                  Quote Details:
                </p>
                <pre className="text-xs text-text-secondary font-mono overflow-x-auto">
                  {JSON.stringify(request.quote_details, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Right: Status and Actions */}
          <div className="flex flex-col items-end gap-2">
            <StatusBadge
              status={request.status}
              variant={getStatusColor(request.status)}
            />

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-2">
              {/* Broker: Provide Quote */}
              {canBrokerProvideQuote && onProvideQuote && (
                <button
                  onClick={() => onProvideQuote(request.id)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                >
                  Provide Quote
                </button>
              )}

              {/* Sub: Approve/Reject Quote */}
              {canSubApproveReject && (
                <>
                  {onApprove && (
                    <button
                      onClick={() => onApprove(request.id)}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-success-600 hover:bg-success-700 rounded-md transition-colors"
                    >
                      Approve Quote
                    </button>
                  )}
                  {onReject && (
                    <button
                      onClick={() => onReject(request.id)}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-danger-600 hover:bg-danger-700 rounded-md transition-colors"
                    >
                      Reject Quote
                    </button>
                  )}
                </>
              )}

              {/* Cancel Request */}
              {canCancel && onCancel && (
                <button
                  onClick={() => onCancel(request.id)}
                  className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary border border-border hover:border-border-dark rounded-md transition-colors"
                >
                  Cancel Request
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
