// src/components/onboarding/steps/gc/CompanyStep.tsx
// REQ-126: GC Onboarding - Company Information Step
import { useState } from 'react';
import { YStack } from '@unicornlove/ui';
import { Input as TextInput, Button, Heading2 } from '@unicornlove/ui';

interface CompanyStepProps {
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

function CompanyStep({ onComplete, initialData = {}, isLoading = false }: CompanyStepProps) {
  const [companyName, setCompanyName] = useState(initialData.companyName || '');
  const [address, setAddress] = useState(initialData.address || '');
  const [phone, setPhone] = useState(initialData.phone || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onComplete({
      company: {
        name: companyName,
        address,
        phone,
      },
    });
  };

  return (
    <YStack>
      <Heading2 marginBottom="$6">Company Information</Heading2>
      <YStack as="form" onSubmit={handleSubmit} gap="$4">
        <TextInput
          label="Company Name"
          value={companyName}
          onChangeText={setCompanyName}
          error={errors.companyName}
          placeholder="Enter your company name"
          required
        />
        <TextInput
          label="Address"
          value={address}
          onChangeText={setAddress}
          error={errors.address}
          placeholder="Enter your company address"
          required
        />
        <TextInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          required
        />
        <YStack marginTop="$6">
          <Button
            type="submit"
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

export default CompanyStep;
