// src/pages/gc/GCProjects.tsx
import { Archive } from 'lucide-react';
import { YStack, H1, EmptyState } from '@unicornlove/ui';
// import { useScaffaldSync } from '../../hooks/useScaffaldSync';
// import { useAuth } from '../../contexts/AuthContext';
// import SyncStatus from '../../components/scaffald/SyncStatus';

function GCProjects() {
  // const { profile } = useAuth();
  // const { projectSyncStatus, lastProjectSync, projectSyncError } = useScaffaldSync(
  //   profile?.company_connected ? 'mock-forsured-company-id' : null // Replace with actual forsuredCompanyId
  // );

  const handleCreateProject = () => {
    console.log('Navigate to create project page');
  };

  // Simulate no projects available
  const hasProjects = false;

  return (
    <YStack gap="$6">
      <H1>Projects</H1>
      {/* <YStack marginBottom="$4">
        <SyncStatus
          entityType="Projects"
          status={projectSyncStatus}
          lastSyncedAt={lastProjectSync}
          errorMessage={projectSyncError || undefined}
        />
      </YStack> */}
      {!hasProjects ? (
        <EmptyState
          icon={<Archive size={48} />}
          title="No Projects Yet"
          description="You haven't created any projects. Create one to get started."
          primaryAction={{ label: 'Create Project', onClick: handleCreateProject }}
          helpLinks={[
            { label: 'Learn about Projects', href: '#' },
          ]}
        />
      ) : (
        // Render projects list here
        <YStack>Projects List</YStack>
      )}
    </YStack>
  );
}

export default GCProjects;
