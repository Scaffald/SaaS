declare module 'flow-remove-types' {
  interface FlowRemoveTypesOptions {
    pretty?: boolean
    ignoreDocblock?: boolean
    all?: boolean
    sourceMaps?: boolean
  }

  interface FlowRemoveTypesResult {
    code: string
    map?: string | null
  }

  export default function flowRemoveTypes(
    code: string,
    options?: FlowRemoveTypesOptions
  ): FlowRemoveTypesResult
}
