/**
 * Set the browser document title.
 *
 * Web: writes `document.title`.
 * Native: no-op. Native screens express their title through the navigation
 *   header — use `navigation.setOptions({ title })` for that.
 */

export type SetDocumentTitle = (title: string) => void

export const setDocumentTitle: SetDocumentTitle = () => {
  // no-op default
}
