import type { GeneralProfileFormData } from '../config'

/**
 * react-hook-form's `dirtyFields` shape: a mirror of the form values where each
 * touched leaf is `true`. Nested objects (address) come back as nested records.
 */
export type DirtyFieldMap = Partial<Record<keyof GeneralProfileFormData, unknown>>

/** Display-only; the server ignores it and it is never the user's to change here. */
const NEVER_SENT: ReadonlySet<keyof GeneralProfileFormData> = new Set(['email'])

/**
 * Build the PATCH body for `/v1/profiles/general` from the form state.
 *
 * Only fields the user actually edited are included. The form used to submit its
 * entire value object, which is what made #580 destructive: when the GET failed
 * the form sat at `generalProfileDefaults` (empty strings throughout), and the
 * first edit sent `first_name: ""`, `last_name: ""`, `phone: ""` and a blank
 * address — all of which the server happily wrote, because it treats any key
 * that is not `undefined` as an intentional value.
 *
 * A minimal patch means that even if a future change lets an unpopulated form
 * become editable again, the blast radius is the one field that was touched.
 */
export function buildGeneralInfoPatch(
  data: GeneralProfileFormData,
  dirtyFields: DirtyFieldMap
): Partial<GeneralProfileFormData> {
  const patch: Partial<GeneralProfileFormData> = {}

  for (const key of Object.keys(dirtyFields) as Array<keyof GeneralProfileFormData>) {
    if (NEVER_SENT.has(key)) continue
    // A nested record whose leaves are all false means nothing under it changed.
    if (!hasDirtyLeaf(dirtyFields[key])) continue
    patch[key] = data[key] as never
  }

  return patch
}

/** True when `value` is `true`, or an object/array containing a dirty leaf. */
function hasDirtyLeaf(value: unknown): boolean {
  if (value === true) return true
  if (Array.isArray(value)) return value.some(hasDirtyLeaf)
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some(hasDirtyLeaf)
  }
  return false
}
