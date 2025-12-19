// src/pages/contractor/settings/DocumentSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { YStack, Text, Button, H2 } from '@unicornlove/ui';
import Checkbox from '../../../ui/Checkbox';
import { useSettings } from '../../../hooks/useSettings';
import { toast } from 'sonner';

function ContractorDocumentSettings() {
  const { contractorSettings, updateContractorSettings, isLoading, isSaving } = useSettings();

  const [autoShareWithGCs, setAutoShareWithGCs] = useState(true);
  const [originalAutoShare, setOriginalAutoShare] = useState(true);

  // Initialize from contractorSettings
  useEffect(() => {
    if (contractorSettings) {
      const autoShare = contractorSettings.auto_share_documents ?? true;
      setAutoShareWithGCs(autoShare);
      setOriginalAutoShare(autoShare);
    }
  }, [contractorSettings]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    return autoShareWithGCs !== originalAutoShare;
  }, [autoShareWithGCs, originalAutoShare]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateContractorSettings({
        auto_share_documents: autoShareWithGCs,
      });
      setOriginalAutoShare(autoShareWithGCs);
      toast.success('Document settings saved successfully');
    } catch (err) {
      console.error('Failed to save document settings:', err);
      toast.error('Failed to save document settings');
    }
  }, [autoShareWithGCs, updateContractorSettings]);

  if (isLoading) {
    return (
      <YStack gap="$4">
        <H2>Document Settings</H2>
        <YStack height={40} backgroundColor="$color3" borderRadius="$4" />
      </YStack>
    );
  }

  return (
    <YStack gap="$4">
      <H2>Document Settings</H2>
      <Text color="$color10" marginBottom="$6">
        Configure how your documents are shared with General Contractors.
      </Text>
      <form onSubmit={handleSubmit}>
        <YStack gap="$4">
          <Checkbox
            checked={autoShareWithGCs}
            onChange={(e) => setAutoShareWithGCs(e.target.checked)}
            label="Automatically share documents with General Contractors"
            helperText="When enabled, uploaded COIs and insurance documents will automatically be shared with GCs you work with."
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

export default ContractorDocumentSettings;
