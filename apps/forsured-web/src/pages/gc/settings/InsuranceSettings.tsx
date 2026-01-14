// src/pages/gc/settings/InsuranceSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Text, Button, H2, H3, Input, Separator } from '@unicornlove/beyond-ui';
import Checkbox from '../../../ui/Checkbox';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

interface InsuranceRequirements {
  glPerOccurrence: string;
  glAggregate: string;
  wcRequired: boolean;
  autoRequired: boolean;
  umbrellaRequired: boolean;
}

function GCInsuranceSettings() {
  const { gcSettings, updateGCSettings, isLoading, isSaving } = useSettings();

  const [requirements, setRequirements] = useState<InsuranceRequirements>({
    glPerOccurrence: '1000000',
    glAggregate: '2000000',
    wcRequired: true,
    autoRequired: true,
    umbrellaRequired: false,
  });
  const [additionalInsured, setAdditionalInsured] = useState(true);
  const [waiverOfSubrogation, setWaiverOfSubrogation] = useState(true);

  const [originalState, setOriginalState] = useState({
    requirements: requirements,
    additionalInsured: true,
    waiverOfSubrogation: true,
  });

  // Initialize from gcSettings
  useEffect(() => {
    if (gcSettings) {
      const reqs = gcSettings.default_insurance_requirements as InsuranceRequirements | undefined;
      const newRequirements = {
        glPerOccurrence: reqs?.glPerOccurrence || '1000000',
        glAggregate: reqs?.glAggregate || '2000000',
        wcRequired: reqs?.wcRequired ?? true,
        autoRequired: reqs?.autoRequired ?? true,
        umbrellaRequired: reqs?.umbrellaRequired ?? false,
      };
      setRequirements(newRequirements);
      setAdditionalInsured(gcSettings.require_additional_insured);
      setWaiverOfSubrogation(gcSettings.require_waiver_of_subrogation);

      setOriginalState({
        requirements: newRequirements,
        additionalInsured: gcSettings.require_additional_insured,
        waiverOfSubrogation: gcSettings.require_waiver_of_subrogation,
      });
    }
  }, [gcSettings]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return (
      JSON.stringify(requirements) !== JSON.stringify(originalState.requirements) ||
      additionalInsured !== originalState.additionalInsured ||
      waiverOfSubrogation !== originalState.waiverOfSubrogation
    );
  }, [requirements, additionalInsured, waiverOfSubrogation, originalState]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateGCSettings({
        default_insurance_requirements: requirements,
        require_additional_insured: additionalInsured,
        require_waiver_of_subrogation: waiverOfSubrogation,
      });
      setOriginalState({
        requirements,
        additionalInsured,
        waiverOfSubrogation,
      });
      toast.success('Insurance requirements saved successfully');
    } catch (err) {
      console.error('Failed to save insurance settings:', err);
      toast.error('Failed to save insurance settings');
    }
  }, [requirements, additionalInsured, waiverOfSubrogation, updateGCSettings]);

  const updateRequirement = useCallback(<K extends keyof InsuranceRequirements>(
    key: K,
    value: InsuranceRequirements[K]
  ) => {
    setRequirements(prev => ({ ...prev, [key]: value }));
  }, []);

  if (isLoading) {
    return (
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Default Insurance Requirements</H2>
        <Stack style={{ gap: 'var(--space-4)' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <Stack key={i} style={{ height: 40, backgroundColor: 'var(--color-3)', borderRadius: 'var(--radius-4)' }} />
          ))}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      <H2>Default Insurance Requirements</H2>
      <Text style={{ color: 'var(--color-10)', marginBottom: 'var(--space-6)' }}>
        Set the default insurance requirements for subcontractors on your projects.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <Input
            label="General Liability Per Occurrence Limit ($)"
            type="number"
            value={requirements.glPerOccurrence}
            onChange={(e) => updateRequirement('glPerOccurrence', e.target.value)}
            required
          />
          <Input
            label="General Liability Aggregate Limit ($)"
            type="number"
            value={requirements.glAggregate}
            onChange={(e) => updateRequirement('glAggregate', e.target.value)}
            required
          />
          <Checkbox
            checked={requirements.wcRequired}
            onChange={(e) => updateRequirement('wcRequired', e.target.checked)}
            label="Workers Compensation Required"
          />
          <Checkbox
            checked={requirements.autoRequired}
            onChange={(e) => updateRequirement('autoRequired', e.target.checked)}
            label="Commercial Auto Required"
          />
          <Checkbox
            checked={requirements.umbrellaRequired}
            onChange={(e) => updateRequirement('umbrellaRequired', e.target.checked)}
            label="Umbrella/Excess Liability Required"
          />
          <Separator style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-6)' }} />
          <H3 style={{ marginBottom: 'var(--space-4)' }}>Endorsement Requirements</H3>
          <Checkbox
            checked={additionalInsured}
            onChange={(e) => setAdditionalInsured(e.target.checked)}
            label="Require Additional Insured Endorsement"
          />
          <Checkbox
            checked={waiverOfSubrogation}
            onChange={(e) => setWaiverOfSubrogation(e.target.checked)}
            label="Require Waiver of Subrogation"
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

export default GCInsuranceSettings;
