import type { SetDocumentTitle } from './setDocumentTitle'

export const setDocumentTitle: SetDocumentTitle = (title) => {
  if (typeof document === 'undefined') return
  document.title = title
}
