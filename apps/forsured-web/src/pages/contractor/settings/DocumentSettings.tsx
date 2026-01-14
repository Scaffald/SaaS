// src/pages/contractor/settings/DocumentSettings.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack, Text, Button, H2, Checkbox } from '@unicornlove/beyond-ui';
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
      <Stack style={{ gap: 'var(--space-4)' }}>
        <H2>Document Settings</H2>
        <Stack
          style={{
            height: 40,
            backgroundColor: 'var(--color-3)',
            borderRadius: 'var(--radius-4)',
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: 'var(--space-4)' }}>
      <H2>Document Settings</H2>
      <Text style={{ color: 'var(--color-10)', marginBottom: 'var(--space-6)' }}>
        Configure how your documents are shared with General Contractors.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack style={{ gap: 'var(--space-4)' }}>
          <Stack style={{ gap: 'var(--space-1)' }}>
            <Checkbox
              checked={autoShareWithGCs}
              onChange={(checked) => setAutoShareWithGCs(checked)}
              label="Automatically share documents with General Contractors"
            />
            <Text
              style={{
                fontSize: 'var(--font-size-2)',
                color: 'var(--color-10)',
                marginLeft: 'var(--space-6)',
              }}
            >
              When enabled, uploaded COIs and insurance documents will automatically be shared with GCs you work with.
            </Text>
          </Stack>
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

export default ContractorDocumentSettings;
