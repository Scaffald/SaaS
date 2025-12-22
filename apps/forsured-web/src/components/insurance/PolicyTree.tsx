/**
 * REQ-262: Insurance Policy Parent-Child Model - UI Components
 * PolicyTree component displays insurance policies with expandable hierarchical structure
 */

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { YStack, XStack, Text, Card } from '@unicornlove/ui';
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
      <YStack gap="$4">
        <SkeletonLoader count={3} height={120} />
      </YStack>
    );
  }

  if (error) {
    return (
      <Card padding="$6">
        <XStack alignItems="center" gap="$3">
          <AlertCircle size={24} color="$red10" />
          <YStack>
            <Text fontWeight="500" color="$red10">
              Error loading policies
            </Text>
            <Text fontSize="$2" color="$color10">
              {error}
            </Text>
          </YStack>
        </XStack>
      </Card>
    );
  }

  if (policies.length === 0) {
    return (
      <Card padding="$6">
        <YStack alignItems="center">
          <Text fontWeight="500" color="$color10">
            No insurance policies found
          </Text>
          <Text fontSize="$2" color="$color10" mt="$1">
            Create your first insurance policy to get started
          </Text>
        </YStack>
      </Card>
    );
  }

  return (
    <YStack gap="$4">
      {policies.map((policy) => (
        <PolicyCard
          key={policy.id}
          policy={policy}
          isExpanded={expandedPolicyIds.has(policy.id)}
          onToggleExpand={() => toggleExpanded(policy.id)}
          onClick={() => onPolicyClick?.(policy)}
        />
      ))}
    </YStack>
  );
}
