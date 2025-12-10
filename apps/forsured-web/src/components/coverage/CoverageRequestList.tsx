/**
 * REQ-273: Coverage Request Workflow - UI Components
 * CoverageRequestList component displays all coverage requests for an organization
 */

import React, { useState, useEffect } from 'react';
import { FileQuestion } from 'lucide-react';
import { CoverageRequest } from '../../types';
import { getAllCoverageRequests } from '../../lib/api/coverageRequestService';
import CoverageRequestCard from './CoverageRequestCard';

export interface CoverageRequestListProps {
  organizationId: string;
  userRole?: 'broker' | 'subcontractor' | 'manager';
  onProvideQuote?: (requestId: string) => void;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

export default function CoverageRequestList({
  organizationId,
  userRole = 'subcontractor',
  onProvideQuote,
  onApprove,
  onReject,
  onCancel,
}: CoverageRequestListProps) {
  const [requests, setRequests] = useState<CoverageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, [organizationId]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllCoverageRequests(organizationId);
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load coverage requests');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-sm text-text-secondary">Loading coverage requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-danger-50 border border-danger-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <FileQuestion className="text-danger-600" size={20} />
          <h3 className="text-sm font-semibold text-danger-900">Error Loading Requests</h3>
        </div>
        <p className="text-sm text-danger-700">{error}</p>
        <button
          onClick={loadRequests}
          className="mt-3 px-4 py-2 text-sm font-medium text-white bg-danger-600 hover:bg-danger-700 rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center p-12 bg-bg-secondary rounded-lg border-2 border-dashed border-border">
        <FileQuestion className="mx-auto text-text-tertiary mb-4" size={48} />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          No Coverage Requests
        </h3>
        <p className="text-sm text-text-secondary">
          {userRole === 'subcontractor'
            ? 'Request coverage from your broker to get started'
            : 'No coverage requests have been submitted yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-text-primary">
          Coverage Requests
          <span className="ml-2 text-sm font-normal text-text-secondary">
            ({requests.length} {requests.length === 1 ? 'request' : 'requests'})
          </span>
        </h2>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <CoverageRequestCard
            key={request.id}
            request={request}
            userRole={userRole}
            onProvideQuote={onProvideQuote}
            onApprove={onApprove}
            onReject={onReject}
            onCancel={onCancel}
          />
        ))}
      </div>
    </div>
  );
}
