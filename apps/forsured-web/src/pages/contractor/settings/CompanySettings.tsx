// src/pages/contractor/settings/CompanySettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { YStack, XStack, Text, Button, H2, Input, Card } from '@unicornlove/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { scaffaldClient } from '../../../lib/scaffald/client';
import { toast } from 'sonner';

interface CompanyInfo {
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  website: string;
}

const defaultCompanyInfo: CompanyInfo = {
  name: '',
  address: { street: '', city: '', state: '', zip: '' },
  phone: '',
  website: '',
};

function ContractorCompanySettings() {
  const { user, isLoading: authLoading } = useAuth();

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [originalInfo, setOriginalInfo] = useState<CompanyInfo>(defaultCompanyInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Get the first company the user belongs to
  const companyId = user?.companies?.[0]?.company_id;

  // Fetch company data from Scaffald
  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    const fetchCompany = async () => {
      try {
        const company = await scaffaldClient.companies.get(companyId);
        if (company) {
          const info: CompanyInfo = {
            name: company.name,
            address: company.address || { street: '', city: '', state: '', zip: '' },
            phone: company.phone || '',
            website: company.website || '',
          };
          setCompanyInfo(info);
          setOriginalInfo(info);
        }
      } catch (err) {
        console.error('Failed to fetch company:', err);
        toast.error('Failed to load company information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [companyId]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(companyInfo) !== JSON.stringify(originalInfo);
  }, [companyInfo, originalInfo]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyId) return;

    setIsSaving(true);
    try {
      await scaffaldClient.companies.update(companyId, {
        name: companyInfo.name,
        address: companyInfo.address,
        phone: companyInfo.phone,
        website: companyInfo.website,
      });
      setOriginalInfo(companyInfo);
      toast.success('Company settings saved successfully');
    } catch (err) {
      console.error('Failed to save company settings:', err);
      toast.error('Failed to save company settings');
    } finally {
      setIsSaving(false);
    }
  }, [companyId, companyInfo]);

  const updateField = useCallback(<K extends keyof CompanyInfo>(
    key: K,
    value: CompanyInfo[K]
  ) => {
    setCompanyInfo(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateAddress = useCallback((field: keyof CompanyInfo['address'], value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  }, []);

  if (authLoading || isLoading) {
    return (
      <YStack gap="$4">
        <H2>Company Profile</H2>
        <YStack gap="$4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <YStack key={i} height={40} backgroundColor="$color3" borderRadius="$4" />
          ))}
        </YStack>
      </YStack>
    );
  }

  if (!companyId) {
    return (
      <YStack gap="$4">
        <H2>Company Profile</H2>
        <Card backgroundColor="$yellow2" borderWidth={1} borderColor="$yellow6" borderRadius="$4" padding="$4">
          <Text color="$yellow11">
            No company is linked to your account. Please complete onboarding to connect your company.
          </Text>
        </Card>
      </YStack>
    );
  }

  return (
    <YStack gap="$4">
      <H2>Company Profile</H2>
      <Text color="$color10" marginBottom="$6">
        Manage your company information. This data is synced with Scaffald.
      </Text>
      <form onSubmit={handleSubmit}>
        <YStack gap="$4">
          <Input
            label="Company Name"
            type="text"
            value={companyInfo.name}
            onChangeText={(value) => updateField('name', value)}
            required
          />
          <Input
            label="Street Address"
            type="text"
            value={companyInfo.address.street}
            onChangeText={(value) => updateAddress('street', value)}
          />
          <XStack gap="$4">
            <XStack flex={1}>
              <Input
                label="City"
                type="text"
                value={companyInfo.address.city}
                onChangeText={(value) => updateAddress('city', value)}
              />
            </XStack>
            <XStack flex={1}>
              <Input
                label="State"
                type="text"
                value={companyInfo.address.state}
                onChangeText={(value) => updateAddress('state', value)}
              />
            </XStack>
            <XStack flex={1}>
              <Input
                label="ZIP Code"
                type="text"
                value={companyInfo.address.zip}
                onChangeText={(value) => updateAddress('zip', value)}
              />
            </XStack>
          </XStack>
          <Input
            label="Phone"
            type="tel"
            value={companyInfo.phone}
            onChangeText={(value) => updateField('phone', value)}
          />
          <Input
            label="Website"
            type="url"
            value={companyInfo.website}
            onChangeText={(value) => updateField('website', value)}
            placeholder="https://example.com"
          />
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            variant="primary"
            marginTop="$6"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </YStack>
      </form>
    </YStack>
  );
}

export default ContractorCompanySettings;
