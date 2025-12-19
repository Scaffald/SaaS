import { useEffect, useRef } from 'react';
import type { ProfileWizardStepId } from '../utils/wizardSteps';
import type { SaveStepInput, WizardStepPayloads } from './useProfileWizard';

interface UseWizardAutoSaveOptions {
  step: ProfileWizardStepId;
  payload: WizardStepPayloads[ProfileWizardStepId];
  enabled?: boolean;
  isDirty?: boolean;
  debounceMs?: number;
  onSave: (input: SaveStepInput) => Promise<unknown>;
  onSavingStateChange?: (isSaving: boolean) => void;
}

export function useWizardAutoSave({
  step,
  payload,
  enabled = true,
  isDirty = true,
  debounceMs = 500,
  onSave,
  onSavingStateChange,
}: UseWizardAutoSaveOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPayloadRef = useRef(payload);
  const isSavingRef = useRef(false);

  useEffect(() => {
    latestPayloadRef.current = payload;
  }, [payload]);

  useEffect(() => {
    if (!enabled || !isDirty) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        isSavingRef.current = true;
        onSavingStateChange?.(true);
        await onSave({
          step,
          data: latestPayloadRef.current,
        });
      } finally {
        isSavingRef.current = false;
        onSavingStateChange?.(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, isDirty, debounceMs, onSave, step, onSavingStateChange]);
}
