// src/components/onboarding/steps/gc/InsuranceStep.tsx
// REQ-126: GC Onboarding - Insurance Requirements Step
import React, { useState } from 'react';
import { Input as TextInput, Checkbox } from '@unicornlove/ui';
import { Button } from '@unicornlove/ui';
import { Heading2, BodyText } from '@unicornlove/ui';

interface InsuranceStepProps {
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

function InsuranceStep({ onComplete, initialData = {}, isLoading = false }: InsuranceStepProps) {
  const defaultRequirements = initialData.defaultRequirements || {};
  const [glPerOccurrence, setGlPerOccurrence] = useState(
    defaultRequirements.generalLiability?.perOccurrence?.toString() || ''
  );
  const [glAggregate, setGlAggregate] = useState(
    defaultRequirements.generalLiability?.aggregate?.toString() || ''
  );
  const [wcRequired, setWcRequired] = useState(defaultRequirements.workersComp?.required || false);
  const [autoRequired, setAutoRequired] = useState(defaultRequirements.autoLiability?.required || false);
  const [umbrellaRequired, setUmbrellaRequired] = useState(defaultRequirements.umbrella?.required || false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!glPerOccurrence.trim()) newErrors.glPerOccurrence = 'Per occurrence limit is required';
    if (!glAggregate.trim()) newErrors.glAggregate = 'Aggregate limit is required';
    if (isNaN(Number(glPerOccurrence)) || Number(glPerOccurrence) <= 0) {
      newErrors.glPerOccurrence = 'Must be a valid positive number';
    }
    if (isNaN(Number(glAggregate)) || Number(glAggregate) <= 0) {
      newErrors.glAggregate = 'Must be a valid positive number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onComplete({
      defaultRequirements: {
        generalLiability: {
          perOccurrence: Number(glPerOccurrence),
          aggregate: Number(glAggregate),
        },
        workersComp: {
          required: wcRequired,
        },
        autoLiability: {
          required: autoRequired,
        },
        umbrella: {
          required: umbrellaRequired,
        },
      },
    });
  };

  return (
    <div className="insurance-step">
      <Heading2 className="mb-2">Default Insurance Requirements</Heading2>
      <BodyText className="mb-6 text-gray-600">
        Set your default insurance requirements for subcontractors
      </BodyText>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <TextInput
            label="General Liability Per Occurrence ($)"
            value={glPerOccurrence}
            onChangeText={setGlPerOccurrence}
            error={errors.glPerOccurrence}
            placeholder="e.g., 1000000"
            keyboardType="numeric"
            required
          />
          <TextInput
            label="General Liability Aggregate ($)"
            value={glAggregate}
            onChangeText={setGlAggregate}
            error={errors.glAggregate}
            placeholder="e.g., 2000000"
            keyboardType="numeric"
            required
          />
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={wcRequired}
              onCheckedChange={setWcRequired}
            />
            <BodyText>Workers Compensation Required</BodyText>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={autoRequired}
              onCheckedChange={setAutoRequired}
            />
            <BodyText>Auto Liability Required</BodyText>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={umbrellaRequired}
              onCheckedChange={setUmbrellaRequired}
            />
            <BodyText>Umbrella Coverage Required</BodyText>
          </div>
        </div>

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

export default InsuranceStep;
