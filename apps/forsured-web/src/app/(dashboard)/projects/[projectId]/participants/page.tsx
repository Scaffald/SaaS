/**
 * Participants Compliance Page
 * REQ-281: Participants Tab Compliance View - TASK-4
 *
 * Dedicated page for viewing project participants with compliance status filtering.
 */

'use client';

import React from 'react';
import { YStack, XStack, Text, Button, H1, H2, H3 } from '@unicornlove/ui';
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
    <YStack minHeight="100vh" backgroundColor="$gray2">
      <YStack maxWidth={1120} marginHorizontal="auto" paddingHorizontal="$4" paddingVertical="$8" $gtSm={{ paddingHorizontal: '$6' }} $gtLg={{ paddingHorizontal: '$8' }}>
        {/* Header */}
        <YStack marginBottom="$8">
          <Button
            onPress={handleBack}
            backgroundColor="transparent"
            color="$gray11"
            hoverStyle={{ color: '$gray12' }}
            marginBottom="$4"
          >
            <XStack alignItems="center" gap="$1">
              <ArrowLeft size={16} />
              <Text fontSize="$2">Back to Project</Text>
            </XStack>
          </Button>
          <H1>Participants</H1>
          <Text marginTop="$2" fontSize="$2" color="$gray11">
            View and filter project participants by compliance status
          </Text>
        </YStack>

        {/* Compliance View */}
        <ParticipantsComplianceView
          organizationId={MOCK_ORG_ID}
          projectId={projectId}
          onParticipantClick={handleParticipantClick}
        />
      </YStack>
    </YStack>
  );
}
