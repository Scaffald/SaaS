/**
 * Insurance Policy Parent-Child Model - UI Components
 * PolicyTree component displays insurance policies with expandable hierarchical structure
 */

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Stack, Row, Text, Card } from '@unicornlove/beyond-ui';
import { InsurancePolicy } from '../../types';
import { getAllPolicies } from '../../lib/api/insurancePolicyService';
import PolicyCard from './PolicyCard';
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
      <Stack style={{ gap: '16px' }}>
        <SkeletonLoader count={3} height={120} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Card style={{ padding: '24px' }}>
        <Row style={{ alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={24} color="var(--color-red-10)" />
          <Stack>
            <Text style={{ fontWeight: 500, color: 'var(--color-red-10)' }}>
              Error loading policies
            </Text>
            <Text style={{ fontSize: '14px', color: 'var(--color-10)' }}>
              {error}
            </Text>
          </Stack>
        </Row>
      </Card>
    );
  }

  if (policies.length === 0) {
    return (
      <Card style={{ padding: '24px' }}>
        <Stack style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: 500, color: 'var(--color-10)' }}>
            No insurance policies found
          </Text>
          <Text style={{ fontSize: '14px', color: 'var(--color-10)', marginTop: '4px' }}>
            Create your first insurance policy to get started
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack style={{ gap: '16px' }}>
      {policies.map((policy) => (
        <PolicyCard
          key={policy.id}
          policy={policy}
          isExpanded={expandedPolicyIds.has(policy.id)}
          onToggleExpand={() => toggleExpanded(policy.id)}
          onClick={() => onPolicyClick?.(policy)}
        />
      ))}
    </Stack>
  );
}
