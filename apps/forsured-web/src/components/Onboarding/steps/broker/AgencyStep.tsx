// src/components/onboarding/steps/broker/AgencyStep.tsx
// REQ-126: Broker Onboarding - Agency Setup Step
import { useState } from 'react';
import { Input as TextInput, Button, Heading2, BodyText } from '@unicornlove/ui';
import { YStack } from 'tamagui';

interface AgencyStepProps {
  onComplete: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

function AgencyStep({ onComplete, initialData = {}, isLoading = false }: AgencyStepProps) {
  const agency = initialData.agency || {};
  const [agencyName, setAgencyName] = useState(agency.name || '');
  const [address, setAddress] = useState(agency.address || '');
  const [phone, setPhone] = useState(agency.phone || '');
  const [website, setWebsite] = useState(agency.website || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!agencyName.trim()) newErrors.agencyName = 'Agency name is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    if (website && !website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Please enter a valid URL (e.g., https://example.com)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onComplete({
      agency: {
        name: agencyName,
        address,
        phone,
        website: website || undefined,
      },
    });
  };

  return (
    <YStack>
      <Heading2 marginBottom="$2">Agency Information</Heading2>
      <BodyText marginBottom="$6" color="$color10">
        Tell us about your insurance agency
      </BodyText>
      <YStack asChild gap="$4">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Agency Name"
            value={agencyName}
            onChangeText={setAgencyName}
            error={errors.agencyName}
            placeholder="Enter your agency name"
            required
          />
          <TextInput
            label="Address"
            value={address}
            onChangeText={setAddress}
            error={errors.address}
            placeholder="Enter your agency address"
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
          <TextInput
            label="Website (Optional)"
            value={website}
            onChangeText={setWebsite}
            error={errors.website}
            placeholder="https://example.com"
            keyboardType="url"
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
        </form>
      </YStack>
    </YStack>
  );
}

export default AgencyStep;
