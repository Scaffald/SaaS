// src/components/onboarding/steps/gc/ProjectStep.tsx
// REQ-126: GC Onboarding - First Project Step (Optional)
import React, { useState } from 'react';
import { Input as TextInput } from '@unicornlove/ui';
import { Button } from '@unicornlove/ui';
import { Heading2, BodyText } from '@unicornlove/ui';

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
    <div className="project-step">
      <Heading2 className="mb-2">Create Your First Project (Optional)</Heading2>
      <BodyText className="mb-6 text-gray-600">
        You can skip this step and create a project later
      </BodyText>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Project Name"
          value={projectName}
          onChangeText={setProjectName}
          placeholder="Enter project name"
        />
        <TextInput
          label="Project Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Enter project address"
        />
        <TextInput
          label="Start Date"
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          helperText="Optional: You can set this later"
        />
        <div className="mt-6">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ProjectStep;
