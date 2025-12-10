// src/pages/contractor/ContractorTasks.tsx
import React from 'react';
import { CheckCircle } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';

function ContractorTasks() {
  const handleRefreshTasks = () => {
    console.log('Refreshing tasks');
  };

  // Simulate no pending tasks available
  const hasPendingTasks = false;

  return (
    <div className="contractor-tasks-page">
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>
      {!hasPendingTasks ? (
        <EmptyState
          icon={<CheckCircle size={48} />}
          title="No Pending Tasks"
          description="You're all caught up! Check back later for new assignments."
          primaryAction={{ label: 'Refresh Tasks', onClick: handleRefreshTasks }}
          helpLinks={[
            { label: 'How Tasks Work', href: '#' },
          ]}
        />
      ) : (
        // Render tasks list here
        <div>Contractor Tasks List</div>
      )}
    </div>
  );
}

export default ContractorTasks;
