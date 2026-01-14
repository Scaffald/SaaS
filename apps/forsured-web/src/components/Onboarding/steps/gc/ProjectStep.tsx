// src/components/onboarding/steps/gc/ProjectStep.tsx
// REQ-126: GC Onboarding - First Project Step (Optional)
import { useState } from 'react';
import { Stack, Text, H2, Input, Button } from '@unicornlove/beyond-ui';

interface ProjectStepProps {
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

function ProjectStep({ onComplete, initialData = {}, isLoading = false }: ProjectStepProps) {
  const firstProject = initialData.firstProject || {};
  const [projectName, setProjectName] = useState(firstProject.name || '');
  const [address, setAddress] = useState(firstProject.address || '');
  const [startDate, setStartDate] = useState(firstProject.startDate || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onComplete({
      firstProject: {
        name: projectName,
        address,
        startDate,
      },
    });
  };

  return (
    <Stack>
      <H2 style={{ marginBottom: 8 }}>Create Your First Project (Optional)</H2>
      <Text style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
        You can skip this step and create a project later
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 16 }}>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Project Name</Text>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
            />
          </Stack>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Project Address</Text>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter project address"
            />
          </Stack>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Start Date</Text>
            <Input
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="YYYY-MM-DD"
            />
            <Text style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Optional: You can set this later</Text>
          </Stack>
          <Stack style={{ marginTop: 24 }}>
            <Button
              onClick={handleSubmit}
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Stack>
  );
}

export default ProjectStep;
