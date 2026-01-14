// src/components/onboarding/steps/broker/AgencyStep.tsx
// REQ-126: Broker Onboarding - Agency Setup Step
import { useState } from 'react';
import { Stack, Text, H2, Input, Button } from '@unicornlove/beyond-ui';

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
    <Stack>
      <H2 style={{ marginBottom: 8 }}>Agency Information</H2>
      <Text style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
        Tell us about your insurance agency
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 16 }}>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Agency Name</Text>
            <Input
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="Enter your agency name"
            />
            {errors.agencyName && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.agencyName}</Text>}
          </Stack>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Address</Text>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your agency address"
            />
            {errors.address && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.address}</Text>}
          </Stack>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Phone</Text>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
            />
            {errors.phone && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.phone}</Text>}
          </Stack>
          <Stack style={{ gap: 8 }}>
            <Text style={{ fontWeight: 600, color: 'var(--color-text)' }}>Website (Optional)</Text>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
            {errors.website && <Text style={{ color: 'var(--color-red-10)', fontSize: 12 }}>{errors.website}</Text>}
          </Stack>
          <Stack style={{ marginTop: 24 }}>
            <Button
              onPress={handleSubmit}
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

export default AgencyStep;
