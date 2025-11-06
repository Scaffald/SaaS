# REQ-34: Avatar Cropping - Quick Summary

## Current Status

✅ **Web implementation**: ~80% complete, has bugs  
❌ **Native implementation**: Not implemented (returns original image)

## Key Bugs Identified

1. **Overlay Mismatch** (Critical)
   - Location: `AvatarCropModal.tsx` line 577-578
   - Issue: Uses circular `clipPath` but crop area is square
   - Impact: Visual mismatch between crop area and overlay

2. **Native Not Implemented**
   - Location: `AvatarCropModal.tsx` line 269-276
   - Issue: Returns original image without cropping
   - Impact: No cropping on mobile devices

3. **Potential Coordinate Issues**
   - Complex drag/zoom calculations may have edge cases
   - Needs thorough testing

## Recommended Solution

**Refine existing implementation** rather than using an NPM package.

### Why?
- Web implementation is already functional
- Full control over UX
- Only need `expo-image-manipulator` for native (lightweight)
- Better integration with existing codebase

## NPM Package Options (If Needed)

### For Web:
- `react-image-crop` - Popular, well-maintained, but no RNW support
- `react-easy-crop` - Pure React, good UX, but no native support

### For Native:
- `expo-image-manipulator` - Official Expo solution, recommended
- `react-native-image-crop-picker` - Comprehensive, but no RNW support

### Hybrid Approach:
- Use `react-image-crop` for web + `expo-image-manipulator` for native
- Requires wrapper component for platform detection

## Implementation Priority

1. **Fix overlay mismatch bug** (30 min)
2. **Add native support with expo-image-manipulator** (4-6 hours)
3. **Improve error handling** (1-2 hours)
4. **Add comprehensive testing** (2-3 hours)

**Total Estimate**: 8-12 hours

## Next Steps

1. Review implementation plan: `docs/features/req-34-avatar-cropping-implementation-plan.md`
2. Decide on approach (refine vs package)
3. Start with Phase 1 (bug fixes)
4. Proceed through implementation phases

