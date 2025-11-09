# REQ-34: Avatar Cropping Implementation Summary

## 🚧 Current Status

Implementation is **in progress**. Core cropping mechanics exist, but several acceptance criteria and technical requirements for REQ-34 remain incomplete.

## ✅ Implemented So Far

- Cross-platform modal (`AvatarCropModal.tsx`) with zoom controls, drag/pan gestures, and square overlay mask.
- Basic error messaging, image dimension validation, and crop boundary constraints.
- Initial integration with `AvatarImagePicker` for cropping newly selected photos.
- Added `expo-image-manipulator` native dependency to support cropping on iOS/Android.

## ❗️ Outstanding Gaps

- **Schema validation**: `uploadAvatarInputSchema` still accepts any string input (no size/MIME/file-name guards).
- **Image processing pipeline**: Cropper returns blob/object URLs (web) or file URIs (native) without enforcing 512×512 output, compression, or base64 conversion.
- **Flip controls & live preview**: UI lacks horizontal/vertical flip buttons and real-time circular preview required by FR2/FR5/FR6.
- **Edit existing avatar**: `AvatarImagePicker` only opens the cropper for new selections; no “Edit Photo” flow for existing avatars.
- **Accessibility**: Missing aria/accessibility labels, focus handling, keyboard shortcuts, and announcements outlined in Task 10.
- **Automated tests**: No unit/integration coverage for cropper utilities or profile workflow.
- **Responsive polish**: Layout does not yet adapt per UX2/UX1 guidelines (mobile landscape vs desktop parity).

## Files Reviewed

- `packages/ui/src/components/image-picker/AvatarCropModal.tsx`
- `packages/ui/src/components/image-picker/AvatarImagePicker.tsx`
- `packages/core/features/profile/profile-general-left.tsx`
- `packages/supabase/functions/_shared/schemas/consolidated.ts`

## Recommended Next Actions

1. Harden Supabase schema validation (Task 2).
2. Introduce shared image-processing utilities that output compressed 512×512 base64 strings with flip support (Task 6).
3. Extend cropper UI for flip controls, live preview, accessibility, and responsive layouts (Tasks 3–5, 7, 10).
4. Integrate edit flow + improved messaging in `AvatarImagePicker` and `ProfileGeneralLeft` (Task 8 & 9).
5. Backfill automated tests and run `pnpm check`/`pnpm build` before moving REQ-34 to review (Task 11).

## Testing Coverage (Pending)

- Web: drag, zoom, crop, error states.
- Native: pinch/zoom, pan, crop completion.
- Edge cases: small/large images, invalid formats, corrupted data.

These scenarios are outstanding and should be addressed once the remaining functionality is implemented.

