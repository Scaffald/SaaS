import type { DownloadFile } from './downloadFile'

export const downloadFile: DownloadFile = ({ url, filename }) => {
  if (typeof document === 'undefined' || !url) return Promise.resolve()

  const anchor = document.createElement('a')
  anchor.href = url
  if (filename) anchor.download = filename
  // For cross-origin URLs the `download` attribute is ignored unless the
  // resource sets `Content-Disposition`; opening in a new tab is the safer
  // fallback in that case.
  anchor.rel = 'noopener noreferrer'
  anchor.target = '_blank'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  return Promise.resolve()
}
