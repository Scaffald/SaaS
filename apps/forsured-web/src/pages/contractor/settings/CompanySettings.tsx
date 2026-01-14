// src/pages/contractor/settings/CompanySettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Row, Text, Button, H2, Input, Card } from '@unicornlove/beyond-ui';
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
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Company Profile</H2>
        <Stack style={{ gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Stack
              key={i}
              style={{
                height: 40,
                backgroundColor: 'var(--color-3)',
                borderRadius: 'var(--radius-4)',
              }}
            />
          ))}
        </Stack>
      </Stack>
    );
  }

  if (!companyId) {
    return (
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Company Profile</H2>
        <Card
          style={{
            backgroundColor: 'var(--color-yellow-2)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: 'var(--color-yellow-6)',
            borderRadius: 'var(--radius-4)',
            padding: 'var(--space-4)',
          }}
        >
          <Text style={{ color: 'var(--color-yellow-11)' }}>
            No company is linked to your account. Please complete onboarding to connect your company.
          </Text>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      <H2>Company Profile</H2>
      <Text style={{ color: 'var(--color-10)', marginBottom: 'var(--space-6)' }}>
        Manage your company information. This data is synced with Scaffald.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <Input
            label="Company Name"
            type="text"
            value={companyInfo.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
          />
          <Input
            label="Street Address"
            type="text"
            value={companyInfo.address.street}
            onChange={(e) => updateAddress('street', e.target.value)}
          />
          <Row style={{ gap: 'var(--space-4)' }}>
            <Stack style={{ flex: 1 }}>
              <Input
                label="City"
                type="text"
                value={companyInfo.address.city}
                onChange={(e) => updateAddress('city', e.target.value)}
              />
            </Stack>
            <Stack style={{ flex: 1 }}>
              <Input
                label="State"
                type="text"
                value={companyInfo.address.state}
                onChange={(e) => updateAddress('state', e.target.value)}
              />
            </Stack>
            <Stack style={{ flex: 1 }}>
              <Input
                label="ZIP Code"
                type="text"
                value={companyInfo.address.zip}
                onChange={(e) => updateAddress('zip', e.target.value)}
              />
            </Stack>
          </Row>
          <Input
            label="Phone"
            type="tel"
            value={companyInfo.phone}
            onChange={(e) => updateField('phone', e.target.value)}
          />
          <Input
            label="Website"
            type="url"
            value={companyInfo.website}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="https://example.com"
          />
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            variant="primary"
            style={{ marginTop: 'var(--space-6)' }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

export default ContractorCompanySettings;
