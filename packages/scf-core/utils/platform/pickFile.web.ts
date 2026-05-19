import type { PickFile, PickedFile } from './pickFile'

export const pickFile: PickFile = ({ accept, multiple = false } = {}) =>
  new Promise<PickedFile[]>((resolve) => {
    if (typeof document === 'undefined') {
      resolve([])
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    if (accept) input.accept = accept
    if (multiple) input.multiple = true
    input.style.display = 'none'

    const cleanup = () => {
      input.removeEventListener('change', onChange)
      if (input.parentNode) input.parentNode.removeChild(input)
    }

    const onChange = () => {
      const files = Array.from(input.files ?? [])
      const picked: PickedFile[] = files.map((file) => ({
        name: file.name,
        type: file.type || null,
        size: file.size,
        file,
        uri: URL.createObjectURL(file),
      }))
      cleanup()
      resolve(picked)
    }

    input.addEventListener('change', onChange)
    document.body.appendChild(input)
    input.click()
  })
