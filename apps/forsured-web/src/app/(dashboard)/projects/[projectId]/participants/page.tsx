/**
 * Participants Compliance Page
 * REQ-281: Participants Tab Compliance View - TASK-4
 *
 * Dedicated page for viewing project participants with compliance status filtering.
 */

'use client';

import React from 'react';
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Project
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Participants</h1>
          <p className="mt-2 text-sm text-gray-600">
            View and filter project participants by compliance status
          </p>
        </div>

        {/* Compliance View */}
        <ParticipantsComplianceView
          organizationId={MOCK_ORG_ID}
          projectId={projectId}
          onParticipantClick={handleParticipantClick}
        />
      </div>
    </div>
  );
}
