// src/pages/gc/GCContractors.tsx
import React from 'react';
import { Users } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import { useLexicon } from '../../contexts/LexiconContext';

function GCContractors() {
  // REQ-4: Use lexicon for dynamic labels
  const { t, getContractorLabel } = useLexicon();

  const handleInviteContractor = () => {
    console.log('Navigate to invite contractor flow');
  };

  // Simulate no contractors available
  const hasContractors = false;

  return (
    <div className="gc-contractors-page">
      <h1 className="text-2xl font-bold mb-6">{getContractorLabel(true)}</h1>
      {!hasContractors ? (
        <EmptyState
          icon={<Users size={48} />}
          title={`No ${getContractorLabel(true)} Yet`}
          description={`Invite ${getContractorLabel(true).toLowerCase()} to your projects to track their compliance.`}
          primaryAction={{ label: `Invite ${getContractorLabel()}`, onClick: handleInviteContractor }}
          helpLinks={[
            { label: 'How to Invite', href: '#' },
          ]}
        />
      ) : (
        // Render contractors list here
        <div>{getContractorLabel(true)} List</div>
      )}
    </div>
  );
}

export default GCContractors;
