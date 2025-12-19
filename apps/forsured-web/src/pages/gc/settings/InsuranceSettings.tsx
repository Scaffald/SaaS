// src/pages/gc/settings/InsuranceSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { YStack, Text, Button, H2, H3, Input } from '@unicornlove/ui';
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
      <YStack gap="$4">
        <H2>Default Insurance Requirements</H2>
        <YStack gap="$4">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <YStack key={i} height={40} backgroundColor="$color3" borderRadius="$4" />
          ))}
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack gap="$4">
      <H2>Default Insurance Requirements</H2>
      <Text color="$color10" marginBottom="$6">
        Set the default insurance requirements for subcontractors on your projects.
      </Text>
      <form onSubmit={handleSubmit}>
        <YStack gap="$4">
          <Input
            label="General Liability Per Occurrence Limit ($)"
            type="number"
            value={requirements.glPerOccurrence}
            onChangeText={(value) => updateRequirement('glPerOccurrence', value)}
            required
          />
          <Input
            label="General Liability Aggregate Limit ($)"
            type="number"
            value={requirements.glAggregate}
            onChangeText={(value) => updateRequirement('glAggregate', value)}
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
          <YStack borderTopWidth={1} borderTopColor="$borderColor" marginVertical="$6" />
          <H3 marginBottom="$4">Endorsement Requirements</H3>
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
            marginTop="$6"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </YStack>
      </form>
    </YStack>
  );
}

export default GCInsuranceSettings;
