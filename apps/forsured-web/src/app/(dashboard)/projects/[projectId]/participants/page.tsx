/**
 * Participants Compliance Page
 * Participants Tab Compliance View - TASK-4
 *
 * Dedicated page for viewing project participants with compliance status filtering.
 */

'use client';

import React from 'react';
import { Stack, Row, Text, Button, H1 } from '@unicornlove/beyond-ui';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ParticipantsComplianceView } from '../../../../../components/participants/ParticipantsComplianceView';
import type { Participant } from '@unicornlove/compliance';

// TODO: Get from auth context
const MOCK_ORG_ID = '11111111-1111-4111-a111-111111111111';

export default function ParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const handleParticipantClick = (participant: Participant) => {
    // Navigate to participant detail or open a modal
    router.push(`/projects/${projectId}/participants/${participant.id}`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <Stack style={{ minHeight: '100vh', backgroundColor: 'var(--color-gray-2)' }}>
      <Stack style={{ maxWidth: 1120, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 'var(--space-4)', paddingRight: 'var(--space-4)', paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        {/* Header */}
        <Stack style={{ marginBottom: 'var(--space-8)' }}>
          <Button
            onPress={handleBack}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-gray-11)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <Row style={{ alignItems: 'center', gap: 'var(--space-1)' }}>
              <ArrowLeft size={16} />
              <Text style={{ fontSize: 'var(--font-size-2)' }}>Back to Project</Text>
            </Row>
          </Button>
          <H1>Participants</H1>
          <Text style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-2)', color: 'var(--color-gray-11)' }}>
            View and filter project participants by compliance status
          </Text>
        </Stack>

        {/* Compliance View */}
        <ParticipantsComplianceView
          organizationId={MOCK_ORG_ID}
          projectId={projectId}
          onParticipantClick={handleParticipantClick}
        />
      </Stack>
    </Stack>
  );
}
