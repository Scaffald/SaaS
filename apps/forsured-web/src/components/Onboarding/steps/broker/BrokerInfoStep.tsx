// src/components/onboarding/steps/broker/BrokerInfoStep.tsx
// REQ-126: Broker Onboarding - Broker Information Step
import React, { useState } from 'react';
import { Input as TextInput } from '@unicornlove/ui';
import { Button } from '@unicornlove/ui';
import { Heading2, BodyText } from '@unicornlove/ui';

interface BrokerInfoStepProps {
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

function BrokerInfoStep({ onComplete, initialData = {}, isLoading = false }: BrokerInfoStepProps) {
  const brokerInfo = initialData.brokerInfo || {};
  const [name, setName] = useState(brokerInfo.name || '');
  const [licenseNumber, setLicenseNumber] = useState(brokerInfo.licenseNumber || '');
  const [statesLicensed, setStatesLicensed] = useState(brokerInfo.statesLicensed || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!licenseNumber.trim()) newErrors.licenseNumber = 'License number is required';
    if (!statesLicensed.trim()) newErrors.statesLicensed = 'States licensed is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onComplete({
      brokerInfo: {
        name,
        licenseNumber,
        statesLicensed: statesLicensed.split(',').map(s => s.trim()).filter(Boolean),
      },
    });
  };

  return (
    <div className="broker-info-step">
      <Heading2 className="mb-2">Your Information</Heading2>
      <BodyText className="mb-6 text-gray-600">
        Tell us about your insurance broker credentials
      </BodyText>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Your Name"
          value={name}
          onChangeText={setName}
          error={errors.name}
          placeholder="Enter your full name"
          required
        />
        <TextInput
          label="License Number"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          error={errors.licenseNumber}
          placeholder="Enter your insurance license number"
          required
        />
        <TextInput
          label="States Licensed"
          value={statesLicensed}
          onChangeText={setStatesLicensed}
          error={errors.statesLicensed}
          placeholder="e.g., TX, CA, NY (comma-separated)"
          helperText="Enter states where you're licensed, separated by commas"
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

export default BrokerInfoStep;
