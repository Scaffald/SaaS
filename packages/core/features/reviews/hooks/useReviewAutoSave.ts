import { useCallback, useEffect, useRef } from "react";
import type { ReviewDraft } from "../types/review-draft";

interface UseReviewAutoSaveOptions {
  draft: ReviewDraft;
  enabled: boolean;
  onSave: (draft: ReviewDraft) => Promise<void>;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  debounceMs?: number;
}

/**
 * Auto-save hook with debouncing
 * Automatically saves review draft after changes with configurable delay
 */
export function useReviewAutoSave({
  draft,
  enabled,
  onSave,
  onSaveSuccess,
  onSaveError,
  debounceMs = 500,
}: UseReviewAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDraftRef = useRef<ReviewDraft>(draft);
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      await onSave(draft);
      previousDraftRef.current = draft;
      onSaveSuccess?.();
    } catch (error) {
      onSaveError?.(error as Error);
    } finally {
      isSavingRef.current = false;
    }
  }, [draft, onSave, onSaveSuccess, onSaveError]);

  // Effect to trigger debounced save
  useEffect(() => {
    if (!enabled) return;

    // Check if draft actually changed
    const draftChanged =
      JSON.stringify(draft) !== JSON.stringify(previousDraftRef.current);

    if (!draftChanged) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [draft, enabled, save, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving: isSavingRef.current,
    forceSave: save,
  };
}
