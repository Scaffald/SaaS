/**
 * Cross-platform file picker.
 *
 * Web: synthesizes a hidden `<input type="file">` and resolves with the
 *   first selected file as a `File`-like blob plus its data URI.
 * Native: uses `expo-document-picker` and returns the same shape.
 *
 * Replaces ad-hoc `<input type="file">` + `document.getElementById(...)?.click()`
 * patterns in profile/certification screens.
 */

export interface PickedFile {
  /** Original filename. */
  name: string
  /** MIME type when known. */
  type: string | null
  /** Byte size when known. */
  size: number | null
  /** Web: a `File` blob. Native: undefined (use `uri`). */
  file: File | null
  /** Native: a local file URI. Web: a `blob:` or `data:` URI. */
  uri: string
}

export interface PickFileOptions {
  /**
   * Accept list. Web: passes through to `<input accept>`. Native: passed to
   * expo-document-picker as MIME types (it ignores extensions starting with `.`).
   */
  accept?: string
  /** Whether to allow multiple selection. Defaults to false. */
  multiple?: boolean
}

export type PickFile = (options?: PickFileOptions) => Promise<PickedFile[]>

export const pickFile: PickFile = () => {
  throw new Error(
    '[platform/pickFile] platform-specific module was not resolved; check Metro config'
  )
}
