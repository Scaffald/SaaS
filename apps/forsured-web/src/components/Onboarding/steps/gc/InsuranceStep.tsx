// src/components/onboarding/steps/gc/InsuranceStep.tsx
// REQ-126: GC Onboarding - Insurance Requirements Step
import { useState } from 'react';
import { Stack, Row, Text, H2, Input, Checkbox, Button } from '@unicornlove/beyond-ui';

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
    <Stack>
      <H2 style={{ marginBottom: 8 }}>Default Insurance Requirements</H2>
      <Text style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
        Set your default insurance requirements for subcontractors
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 16 }}>
          <Stack style={{ gap: 16 }}>
            <Stack style={{ gap: 8 }}>
              <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>General Liability Per Occurrence ($)</Text>
              <Input
                value={glPerOccurrence}
                onChange={(e) => setGlPerOccurrence(e.target.value)}
                placeholder="e.g., 1000000"
              />
              {errors.glPerOccurrence && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.glPerOccurrence}</Text>}
            </Stack>
            <Stack style={{ gap: 8 }}>
              <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>General Liability Aggregate ($)</Text>
              <Input
                value={glAggregate}
                onChange={(e) => setGlAggregate(e.target.value)}
                placeholder="e.g., 2000000"
              />
              {errors.glAggregate && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.glAggregate}</Text>}
            </Stack>
          </Stack>

          <Stack style={{ marginTop: 24, gap: 12 }}>
            <Row style={{ alignItems: 'center', gap: 8 }}>
              <Checkbox
                checked={wcRequired}
                onCheckedChange={(checked) => setWcRequired(checked === true)}
              />
              <Text>Workers Compensation Required</Text>
            </Row>
            <Row style={{ alignItems: 'center', gap: 8 }}>
              <Checkbox
                checked={autoRequired}
                onCheckedChange={(checked) => setAutoRequired(checked === true)}
              />
              <Text>Auto Liability Required</Text>
            </Row>
            <Row style={{ alignItems: 'center', gap: 8 }}>
              <Checkbox
                checked={umbrellaRequired}
                onCheckedChange={(checked) => setUmbrellaRequired(checked === true)}
              />
              <Text>Umbrella Coverage Required</Text>
            </Row>
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

export default InsuranceStep;
