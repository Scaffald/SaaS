declare module 'expo-clipboard' {
  export type ClipboardContentType = 'text' | 'url' | 'image'

  export interface ClipboardItem {
    content: string
    /**
     * Type of clipboard content. Only `'text'` is guaranteed.
     */
    type: ClipboardContentType
  }

  export function isAvailableAsync(): Promise<boolean>

  export function setStringAsync(text: string): Promise<void>

  export function getStringAsync(): Promise<string>

  export function getStringArrayAsync(options?: { allowPlainSansData?: boolean }): Promise<string[]>

  export function getItemsAsync(): Promise<ClipboardItem[]>

  export function clearAsync(): Promise<void>
}
