// src/components/onboarding/steps/contractor/InsuranceStep.tsx
// REQ-126: Contractor Onboarding - Insurance Information Step
import { useState } from 'react';
import { YStack, XStack, Text, H2, Input, Button } from '@unicornlove/ui';

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
    <YStack>
      <H2 marginBottom="$2">Your Insurance Information</H2>
      <Text marginBottom="$6" color="$color10">
        Provide your current insurance policy details
      </Text>
      <YStack tag="form" onSubmit={handleSubmit} gap="$4">
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Insurance Carrier</Text>
          <Input
            value={carrier}
            onChangeText={setCarrier}
            placeholder="Enter insurance carrier name"
          />
          {errors.carrier && <Text color="$red10" fontSize="$2">{errors.carrier}</Text>}
        </YStack>
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">General Liability Policy Number</Text>
          <Input
            value={glPolicyNumber}
            onChangeText={setGlPolicyNumber}
            placeholder="Enter policy number"
          />
          {errors.glPolicyNumber && <Text color="$red10" fontSize="$2">{errors.glPolicyNumber}</Text>}
        </YStack>
        <XStack gap="$4" flexWrap="wrap">
          <YStack flex={1} minWidth="45%" gap="$2">
            <Text fontWeight="600" color="$color12">Per Occurrence Limit ($)</Text>
            <Input
              value={glPerOccurrence}
              onChangeText={setGlPerOccurrence}
              placeholder="e.g., 1000000"
            />
            {errors.glPerOccurrence && <Text color="$red10" fontSize="$2">{errors.glPerOccurrence}</Text>}
          </YStack>
          <YStack flex={1} minWidth="45%" gap="$2">
            <Text fontWeight="600" color="$color12">Aggregate Limit ($)</Text>
            <Input
              value={glAggregate}
              onChangeText={setGlAggregate}
              placeholder="e.g., 2000000"
            />
            {errors.glAggregate && <Text color="$red10" fontSize="$2">{errors.glAggregate}</Text>}
          </YStack>
        </XStack>
        <YStack gap="$2">
          <Text fontWeight="600" color="$color12">Expiration Date</Text>
          <Input
            value={glExpirationDate}
            onChangeText={setGlExpirationDate}
            placeholder="YYYY-MM-DD"
          />
          {errors.glExpirationDate && <Text color="$red10" fontSize="$2">{errors.glExpirationDate}</Text>}
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
