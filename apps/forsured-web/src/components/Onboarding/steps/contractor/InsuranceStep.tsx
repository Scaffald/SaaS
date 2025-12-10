// src/components/onboarding/steps/contractor/InsuranceStep.tsx
// REQ-126: Contractor Onboarding - Insurance Information Step
import React, { useState } from 'react';
import { Input as TextInput } from '@unicornlove/ui';
import { Button } from '@unicornlove/ui';
import { Heading2, BodyText } from '@unicornlove/ui';

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
    <div className="insurance-step">
      <Heading2 className="mb-2">Your Insurance Information</Heading2>
      <BodyText className="mb-6 text-gray-600">
        Provide your current insurance policy details
      </BodyText>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Insurance Carrier"
          value={carrier}
          onChangeText={setCarrier}
          error={errors.carrier}
          placeholder="Enter insurance carrier name"
          required
        />
        <TextInput
          label="General Liability Policy Number"
          value={glPolicyNumber}
          onChangeText={setGlPolicyNumber}
          error={errors.glPolicyNumber}
          placeholder="Enter policy number"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            label="Per Occurrence Limit ($)"
            value={glPerOccurrence}
            onChangeText={setGlPerOccurrence}
            error={errors.glPerOccurrence}
            placeholder="e.g., 1000000"
            keyboardType="numeric"
            required
          />
          <TextInput
            label="Aggregate Limit ($)"
            value={glAggregate}
            onChangeText={setGlAggregate}
            error={errors.glAggregate}
            placeholder="e.g., 2000000"
            keyboardType="numeric"
            required
          />
        </div>
        <TextInput
          label="Expiration Date"
          value={glExpirationDate}
          onChangeText={setGlExpirationDate}
          error={errors.glExpirationDate}
          placeholder="YYYY-MM-DD"
          required
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

export default InsuranceStep;
