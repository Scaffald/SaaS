// src/pages/gc/GCContractors.tsx
import React from 'react';
import { Users } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';

function GCContractors() {
  const handleInviteContractor = () => {
    console.log('Navigate to invite contractor flow');
  };

  // Simulate no contractors available
  const hasContractors = false;

  return (
    <div className="gc-contractors-page">
      <h1 className="text-2xl font-bold mb-6">Subcontractors</h1>
      {!hasContractors ? (
        <EmptyState
          icon={<Users size={48} />}
          title="No Subcontractors Yet"
          description="Invite subcontractors to your projects to track their compliance."
          primaryAction={{ label: 'Invite Subcontractor', onClick: handleInviteContractor }}
          helpLinks={[
            { label: 'How to Invite', href: '#' },
          ]}
        />
      ) : (
        // Render contractors list here
        <div>Subcontractors List</div>
      )}
    </div>
  );
}

export default GCContractors;
