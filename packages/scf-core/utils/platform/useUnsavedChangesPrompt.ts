/**
 * Prompt the user before leaving a screen with unsaved changes.
 *
 * Web: attaches a `beforeunload` listener that triggers the browser's native
 *   "Leave site?" dialog when `isDirty` is true.
 * Native: attaches a `beforeRemove` navigation listener that shows an
 *   `Alert.alert` confirmation. If navigation is unavailable (e.g. component
 *   mounted outside a navigator), it falls back to a no-op — the screen's
 *   own modal Cancel flow remains the primary UX.
 *
 * Replaces the 4× duplicated `useEffect` pattern across profile screens.
 */

export type UseUnsavedChangesPrompt = (isDirty: boolean) => void

// Shared default — replaced by .web.ts / .native.ts via Metro resolution.
export const useUnsavedChangesPrompt: UseUnsavedChangesPrompt = () => {
  // no-op default; platform variant always overrides
}
