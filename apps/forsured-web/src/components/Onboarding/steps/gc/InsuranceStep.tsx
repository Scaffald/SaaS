// src/components/onboarding/steps/gc/InsuranceStep.tsx
// REQ-126: GC Onboarding - Insurance Requirements Step
import { useState } from 'react';
import { YStack, XStack, Text, H2, Input, Checkbox, Button } from '@unicornlove/ui';

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
    <YStack>
      <H2 marginBottom="$2">Default Insurance Requirements</H2>
      <Text marginBottom="$6" color="$color10">
        Set your default insurance requirements for subcontractors
      </Text>
      <YStack tag="form" onSubmit={handleSubmit} gap="$4">
        <YStack gap="$4">
          <YStack gap="$2">
            <Text fontWeight="600" color="$color12">General Liability Per Occurrence ($)</Text>
            <Input
              value={glPerOccurrence}
              onChangeText={setGlPerOccurrence}
              placeholder="e.g., 1000000"
            />
            {errors.glPerOccurrence && <Text color="$red10" fontSize="$2">{errors.glPerOccurrence}</Text>}
          </YStack>
          <YStack gap="$2">
            <Text fontWeight="600" color="$color12">General Liability Aggregate ($)</Text>
            <Input
              value={glAggregate}
              onChangeText={setGlAggregate}
              placeholder="e.g., 2000000"
            />
            {errors.glAggregate && <Text color="$red10" fontSize="$2">{errors.glAggregate}</Text>}
          </YStack>
        </YStack>

        <YStack marginTop="$6" gap="$3">
          <XStack alignItems="center" gap="$2">
            <Checkbox
              checked={wcRequired}
              onCheckedChange={setWcRequired}
            />
            <Text>Workers Compensation Required</Text>
          </XStack>
          <XStack alignItems="center" gap="$2">
            <Checkbox
              checked={autoRequired}
              onCheckedChange={setAutoRequired}
            />
            <Text>Auto Liability Required</Text>
          </XStack>
          <XStack alignItems="center" gap="$2">
            <Checkbox
              checked={umbrellaRequired}
              onCheckedChange={setUmbrellaRequired}
            />
            <Text>Umbrella Coverage Required</Text>
          </XStack>
        </YStack>

        <YStack marginTop="$6">
          <Button
            onPress={handleSubmit}
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </YStack>
      </YStack>
    </YStack>
  );
}

export default InsuranceStep;
