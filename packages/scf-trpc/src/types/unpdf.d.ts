/**
 * Type declaration for unpdf (Deno-only dependency).
 * This file is used in edge function context where unpdf is available.
 */
declare module 'unpdf' {
  interface ExtractTextOptions {
    mergePages?: boolean
  }

  interface ExtractTextResult {
    text: string[]
    totalPages: number
  }

  export function extractText(
    fileBytes: Uint8Array,
    options?: ExtractTextOptions
  ): Promise<ExtractTextResult>
}
