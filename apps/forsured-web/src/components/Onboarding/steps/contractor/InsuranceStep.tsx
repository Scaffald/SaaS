// src/components/onboarding/steps/contractor/InsuranceStep.tsx
// REQ-126: Contractor Onboarding - Insurance Information Step
import { useState } from 'react';
import { Stack, Row, Text, H2, Input, Button } from '@unicornlove/beyond-ui';

interface InsuranceStepProps {
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

function InsuranceStep({ onComplete, initialData = {}, isLoading = false }: InsuranceStepProps) {
  const insurance = initialData.insurance || {};
  const gl = insurance.generalLiability || {};
  const [carrier, setCarrier] = useState(insurance.carrier || '');
  const [glPolicyNumber, setGlPolicyNumber] = useState(gl.policyNumber || '');
  const [glPerOccurrence, setGlPerOccurrence] = useState(gl.perOccurrence?.toString() || '');
  const [glAggregate, setGlAggregate] = useState(gl.aggregate?.toString() || '');
  const [glExpirationDate, setGlExpirationDate] = useState(gl.expirationDate || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!carrier.trim()) newErrors.carrier = 'Insurance carrier is required';
    if (!glPolicyNumber.trim()) newErrors.glPolicyNumber = 'Policy number is required';
    if (!glPerOccurrence.trim()) newErrors.glPerOccurrence = 'Per occurrence limit is required';
    if (!glAggregate.trim()) newErrors.glAggregate = 'Aggregate limit is required';
    if (!glExpirationDate.trim()) newErrors.glExpirationDate = 'Expiration date is required';
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
      insurance: {
        carrier,
        generalLiability: {
          policyNumber: glPolicyNumber,
          perOccurrence: Number(glPerOccurrence),
          aggregate: Number(glAggregate),
          expirationDate: glExpirationDate,
        },
      },
    });
  };

  return (
    <Stack>
      <H2 style={{ marginBottom: 8 }}>Your Insurance Information</H2>
      <Text style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
        Provide your current insurance policy details
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 16 }}>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Insurance Carrier</Text>
            <Input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="Enter insurance carrier name"
            />
            {errors.carrier && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.carrier}</Text>}
          </Stack>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>General Liability Policy Number</Text>
            <Input
              value={glPolicyNumber}
              onChange={(e) => setGlPolicyNumber(e.target.value)}
              placeholder="Enter policy number"
            />
            {errors.glPolicyNumber && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.glPolicyNumber}</Text>}
          </Stack>
          <Row style={{ gap: 16, flexWrap: 'wrap' }}>
            <Stack style={{ flex: 1, minWidth: '45%', gap: 8 }}>
              <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Per Occurrence Limit ($)</Text>
              <Input
                value={glPerOccurrence}
                onChange={(e) => setGlPerOccurrence(e.target.value)}
                placeholder="e.g., 1000000"
              />
              {errors.glPerOccurrence && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.glPerOccurrence}</Text>}
            </Stack>
            <Stack style={{ flex: 1, minWidth: '45%', gap: 8 }}>
              <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Aggregate Limit ($)</Text>
              <Input
                value={glAggregate}
                onChange={(e) => setGlAggregate(e.target.value)}
                placeholder="e.g., 2000000"
              />
              {errors.glAggregate && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.glAggregate}</Text>}
            </Stack>
          </Row>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Expiration Date</Text>
            <Input
              value={glExpirationDate}
              onChange={(e) => setGlExpirationDate(e.target.value)}
              placeholder="YYYY-MM-DD"
            />
            {errors.glExpirationDate && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.glExpirationDate}</Text>}
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
