/**
 * REQ-262: Insurance Policy Parent-Child Model - UI Components
 * PolicyTree component displays insurance policies with expandable hierarchical structure
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { InsurancePolicy } from '../../types';
import { getAllPolicies } from '../../lib/api/insurancePolicyService';
import PolicyCard from './PolicyCard';
import Card from '../Common/Card';
import SkeletonLoader from '../Common/SkeletonLoader';

export interface PolicyTreeProps {
  organizationId: string;
  onPolicyClick?: (policy: InsurancePolicy) => void;
}

export default function PolicyTree({
  organizationId,
  onPolicyClick,
}: PolicyTreeProps) {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPolicyIds, setExpandedPolicyIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadPolicies();
  }, [organizationId]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPolicies(organizationId);
      setPolicies(data);
    } catch (err) {
      console.error('[PolicyTree] Error loading policies:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load insurance policies'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (policyId: string) => {
    setExpandedPolicyIds((prev) => {
      const next = new Set(prev);
      if (next.has(policyId)) {
        next.delete(policyId);
      } else {
        next.add(policyId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader count={3} height={120} />
      </div>
    );
  }

  if (error) {
    return (
      <Card padding="lg">
        <div className="flex items-center gap-3 text-error-600">
          <AlertCircle size={24} />
          <div>
            <p className="font-medium">Error loading policies</p>
            <p className="text-sm text-text-secondary">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (policies.length === 0) {
    return (
      <Card padding="lg">
        <div className="text-center text-text-secondary">
          <p className="font-medium">No insurance policies found</p>
          <p className="text-sm mt-1">
            Create your first insurance policy to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {policies.map((policy) => (
        <PolicyCard
          key={policy.id}
          policy={policy}
          isExpanded={expandedPolicyIds.has(policy.id)}
          onToggleExpand={() => toggleExpanded(policy.id)}
          onClick={() => onPolicyClick?.(policy)}
        />
      ))}
    </div>
  );
}
