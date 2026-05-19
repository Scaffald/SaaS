import type { SetDocumentTitle } from './setDocumentTitle'

export const setDocumentTitle: SetDocumentTitle = () => {
  // no-op on native; use navigation.setOptions({ title }) instead
}
