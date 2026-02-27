/**
 * SyncReviewPanel — Collision resolution UI for Procore sync queue items
 *
 * Groups items into:
 * - "Ready to import" (no_match) — bulk import with checkboxes
 * - "Needs your decision" (exact_match / fuzzy_match) — side-by-side comparison
 *
 * User picks: Link to existing | Create new | Skip — per item or in bulk.
 * Confirm step commits all resolutions via procore.resolveSyncBatch.
 */

import { useState, useMemo } from 'react';
import { Stack, Row, Text, Button, Card, H3, Spinner } from '@unicornlove/beyond-ui';
import { ArrowLeft, Check, Link2, Plus, X } from 'lucide-react-native';
import { trpc } from '../../../../lib/trpc';

type Resolution = 'link' | 'create_new' | 'skip';

interface SyncReviewPanelProps {
  onBack: () => void;
}

export default function SyncReviewPanel({ onBack }: SyncReviewPanelProps) {
  const { data: queueItems, isLoading, refetch } = trpc.procore.getSyncQueue.useQuery();
  const resolveBatch = trpc.procore.resolveSyncBatch.useMutation();

  // Track user decisions: queueItemId -> resolution
  const [decisions, setDecisions] = useState<Record<string, Resolution>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  const items = queueItems ?? [];

  const { noMatch, hasMatch } = useMemo(() => {
    const noMatch = items.filter((i) => i.match_status === 'no_match');
    const hasMatch = items.filter((i) => i.match_status !== 'no_match');
    return { noMatch, hasMatch };
  }, [items]);

  // Auto-set "create_new" for no-match items that haven't been manually changed
  const effectiveDecisions = useMemo(() => {
    const result = { ...decisions };
    for (const item of noMatch) {
      if (!(item.id in result)) {
        result[item.id] = 'create_new';
      }
    }
    return result;
  }, [decisions, noMatch]);

  const setDecision = (id: string, resolution: Resolution) => {
    setDecisions((prev) => ({ ...prev, [id]: resolution }));
  };

  const allDecided = items.every((item) => item.id in effectiveDecisions);

  const summary = useMemo(() => {
    let imports = 0;
    let links = 0;
    let skips = 0;
    for (const res of Object.values(effectiveDecisions)) {
      if (res === 'create_new') imports++;
      else if (res === 'link') links++;
      else if (res === 'skip') skips++;
    }
    return { imports, links, skips };
  }, [effectiveDecisions]);

  const handleConfirm = async () => {
    const batchItems = Object.entries(effectiveDecisions).map(([queueItemId, resolution]) => ({
      queueItemId,
      resolution,
    }));
    await resolveBatch.mutateAsync({ items: batchItems });
    refetch();
    setShowConfirm(false);
    setDecisions({});
    onBack();
  };

  if (isLoading) {
    return (
      <Card style={{ padding: 'var(--space-6)' }}>
        <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
          <Spinner size="sm" />
          <Text>Loading sync queue...</Text>
        </Row>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card style={{ padding: 'var(--space-6)' }}>
        <Stack style={{ gap: 'var(--space-3)', alignItems: 'center' }}>
          <Check size={24} color="var(--color-green-10)" />
          <Text style={{ fontWeight: 600 }}>All caught up!</Text>
          <Text style={{ color: 'var(--color-10)', fontSize: 'var(--font-size-3)' }}>
            No items need your review.
          </Text>
          <Button onPress={onBack} variant="outline" size="sm">
            Back to integrations
          </Button>
        </Stack>
      </Card>
    );
  }

  // Confirm step
  if (showConfirm) {
    return (
      <Card style={{ padding: 'var(--space-6)' }}>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <H3>Confirm Import</H3>
          <Stack style={{ gap: 'var(--space-2)' }}>
            {summary.imports > 0 && (
              <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                <Plus size={14} color="var(--color-green-10)" />
                <Text style={{ fontSize: 'var(--font-size-3)' }}>
                  Import {summary.imports} new item{summary.imports !== 1 ? 's' : ''}
                </Text>
              </Row>
            )}
            {summary.links > 0 && (
              <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                <Link2 size={14} color="var(--color-blue-10)" />
                <Text style={{ fontSize: 'var(--font-size-3)' }}>
                  Link {summary.links} item{summary.links !== 1 ? 's' : ''} to existing records
                </Text>
              </Row>
            )}
            {summary.skips > 0 && (
              <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                <X size={14} color="var(--color-9)" />
                <Text style={{ fontSize: 'var(--font-size-3)' }}>
                  Skip {summary.skips} item{summary.skips !== 1 ? 's' : ''}
                </Text>
              </Row>
            )}
          </Stack>
          {resolveBatch.error && (
            <Text style={{ color: 'var(--color-red-10)', fontSize: 'var(--font-size-3)' }}>
              {resolveBatch.error.message}
            </Text>
          )}
          <Row style={{ gap: 'var(--space-3)' }}>
            <Button
              onPress={handleConfirm}
              variant="primary"
              disabled={resolveBatch.isPending}
              leftIcon={resolveBatch.isPending ? <Spinner size="sm" /> : undefined}
            >
              {resolveBatch.isPending ? 'Importing...' : 'Confirm Import'}
            </Button>
            <Button onPress={() => setShowConfirm(false)} variant="outline" disabled={resolveBatch.isPending}>
              Go Back
            </Button>
          </Row>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      {/* Header */}
      <Row style={{ alignItems: 'center', gap: 'var(--space-3)' }}>
        <Button onPress={onBack} variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />}>
          Back
        </Button>
        <H3>Review Procore Import</H3>
      </Row>

      {/* Ready to import section */}
      {noMatch.length > 0 && (
        <Card style={{ padding: 'var(--space-4)' }}>
          <Stack style={{ gap: 'var(--space-3)' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: 600 }}>
                Ready to import ({noMatch.length})
              </Text>
              <Button
                onPress={() => {
                  const updated: Record<string, Resolution> = { ...decisions };
                  for (const item of noMatch) updated[item.id] = 'skip';
                  setDecisions(updated);
                }}
                variant="ghost"
                size="sm"
              >
                Skip All
              </Button>
            </Row>
            {noMatch.map((item) => (
              <Row
                key={item.id}
                style={{
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-2)',
                  backgroundColor: 'var(--color-2)',
                  borderRadius: 'var(--radius-2)',
                }}
              >
                <Stack>
                  <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500 }}>
                    {(item.provider_data as Record<string, unknown>)?.name as string ?? 'Unknown'}
                  </Text>
                  <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)' }}>
                    {item.entity_type === 'project' ? 'Project' : 'Subcontractor'}
                  </Text>
                </Stack>
                <Row style={{ gap: 'var(--space-2)' }}>
                  <Button
                    onPress={() => setDecision(item.id, 'create_new')}
                    variant={effectiveDecisions[item.id] === 'create_new' ? 'primary' : 'outline'}
                    size="sm"
                  >
                    Import
                  </Button>
                  <Button
                    onPress={() => setDecision(item.id, 'skip')}
                    variant={effectiveDecisions[item.id] === 'skip' ? 'primary' : 'outline'}
                    size="sm"
                  >
                    Skip
                  </Button>
                </Row>
              </Row>
            ))}
          </Stack>
        </Card>
      )}

      {/* Needs your decision section */}
      {hasMatch.length > 0 && (
        <Card style={{ padding: 'var(--space-4)' }}>
          <Stack style={{ gap: 'var(--space-3)' }}>
            <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: 600 }}>
                Needs your decision ({hasMatch.length})
              </Text>
              <Row style={{ gap: 'var(--space-2)' }}>
                <Button
                  onPress={() => {
                    const updated: Record<string, Resolution> = { ...decisions };
                    for (const item of hasMatch) updated[item.id] = 'link';
                    setDecisions(updated);
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Link All
                </Button>
                <Button
                  onPress={() => {
                    const updated: Record<string, Resolution> = { ...decisions };
                    for (const item of hasMatch) updated[item.id] = 'create_new';
                    setDecisions(updated);
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Create All New
                </Button>
              </Row>
            </Row>
            {hasMatch.map((item) => {
              const providerName = (item.provider_data as Record<string, unknown>)?.name as string ?? 'Unknown';
              const confidence = item.match_confidence != null ? Math.round(Number(item.match_confidence) * 100) : null;
              return (
                <Card
                  key={item.id}
                  style={{
                    padding: 'var(--space-3)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <Stack style={{ gap: 'var(--space-3)' }}>
                    {/* Match badge */}
                    <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Text
                        style={{
                          fontSize: 'var(--font-size-2)',
                          fontWeight: 600,
                          color: item.match_status === 'exact_match' ? 'var(--color-green-10)' : 'var(--color-amber-10)',
                          backgroundColor: item.match_status === 'exact_match' ? 'var(--color-green-3)' : 'var(--color-amber-3)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-2)',
                        }}
                      >
                        {item.match_status === 'exact_match' ? 'Exact match' : `Likely match (${confidence}%)`}
                      </Text>
                      <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)' }}>
                        {item.entity_type === 'project' ? 'Project' : 'Subcontractor'}
                      </Text>
                    </Row>

                    {/* Two-column comparison */}
                    <Row style={{ gap: 'var(--space-4)' }}>
                      <Stack style={{ flex: 1, padding: 'var(--space-2)', backgroundColor: 'var(--color-2)', borderRadius: 'var(--radius-2)' }}>
                        <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)', fontWeight: 600 }}>
                          From Procore
                        </Text>
                        <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500 }}>
                          {providerName}
                        </Text>
                      </Stack>
                      <Stack style={{ flex: 1, padding: 'var(--space-2)', backgroundColor: 'var(--color-2)', borderRadius: 'var(--radius-2)' }}>
                        <Text style={{ fontSize: 'var(--font-size-2)', color: 'var(--color-9)', fontWeight: 600 }}>
                          In ForSured
                        </Text>
                        <Text style={{ fontSize: 'var(--font-size-3)', fontWeight: 500 }}>
                          {item.match_reason ?? 'Matched record'}
                        </Text>
                      </Stack>
                    </Row>

                    {/* Resolution buttons */}
                    <Row style={{ gap: 'var(--space-2)' }}>
                      <Button
                        onPress={() => setDecision(item.id, 'link')}
                        variant={decisions[item.id] === 'link' ? 'primary' : 'outline'}
                        size="sm"
                        leftIcon={<Link2 size={12} />}
                      >
                        Link to existing
                      </Button>
                      <Button
                        onPress={() => setDecision(item.id, 'create_new')}
                        variant={decisions[item.id] === 'create_new' ? 'primary' : 'outline'}
                        size="sm"
                        leftIcon={<Plus size={12} />}
                      >
                        Create new
                      </Button>
                      <Button
                        onPress={() => setDecision(item.id, 'skip')}
                        variant={decisions[item.id] === 'skip' ? 'primary' : 'outline'}
                        size="sm"
                      >
                        Skip
                      </Button>
                    </Row>
                  </Stack>
                </Card>
              );
            })}
          </Stack>
        </Card>
      )}

      {/* Confirm bar */}
      <Row style={{ justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <Button onPress={onBack} variant="outline">
          Cancel
        </Button>
        <Button onPress={() => setShowConfirm(true)} variant="primary" disabled={!allDecided}>
          Review &amp; Confirm ({Object.keys(effectiveDecisions).length} items)
        </Button>
      </Row>
    </Stack>
  );
}
