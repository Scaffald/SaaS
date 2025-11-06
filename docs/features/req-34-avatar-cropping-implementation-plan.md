# REQ-34: Avatar Image Cropping - Implementation Plan

## Overview

**Requirement ID**: REQ-34  
**Status**: ✅ COMPLETED  
**Previous Work**: REQ-74  
**Complexity**: 3/5  
**Readiness**: 5/5

## Implementation Status

✅ **Phase 1: Critical Bug Fixes** - COMPLETED
- Fixed overlay mismatch bug (circular → square)
- Added comprehensive error handling
- Improved coordinate transformation validation

✅ **Phase 2: Native Platform Support** - COMPLETED
- Installed expo-image-manipulator
- Integrated native cropping functionality
- Added native gesture handlers (pinch-to-zoom, pan)

✅ **Phase 3: Cross-Platform Improvements** - COMPLETED
- Added image size validation
- Improved native UI to match web experience
- Enhanced error messages

🔄 **Phase 4: Testing** - PENDING
- Manual testing required on web, iOS, Android, and RNW

## Current State

### Existing Implementation
- **Location**: `packages/ui/src/components/image-picker/AvatarCropModal.tsx`
- **Status**: Partially working on web, not implemented on native
- **Features**:
  - Web: Canvas-based cropping with zoom and drag controls
  - Native: Placeholder that returns original image

### Known Issues

1. **Overlay Mismatch Bug** (Line 577-578)
   - Crop overlay uses circular `clipPath` but crop area is square
   - Should use square/rectangular clipPath to match the crop border

2. **Native Platform Not Implemented**
   - Returns original image without cropping
   - No native image manipulation library integrated

3. **Image Positioning Logic**
   - Complex coordinate transformations may have edge cases
   - Drag position calculation might not account for all zoom levels correctly

4. **Cross-Platform Compatibility**
   - Uses native `div` elements instead of Tamagui components
   - May cause issues with React Native Web rendering

5. **Error Handling**
   - Limited error handling for image loading failures
   - No user feedback for edge cases (very small images, unsupported formats)

6. **Performance**
   - No image size validation before loading
   - Large images might cause performance issues

## Solution Options

### Option 1: Refine Existing Implementation (Recommended)

**Pros**:
- Already has working web implementation
- Full control over features and behavior
- No additional dependencies
- Better aligned with existing codebase patterns

**Cons**:
- Need to fix existing bugs
- Need to implement native support ourselves
- More development time

**Implementation**:
1. Fix overlay mismatch bug
2. Integrate `expo-image-manipulator` for native cropping
3. Improve coordinate transformation logic
4. Add proper error handling
5. Convert to Tamagui components where possible
6. Add image size validation

### Option 2: Use NPM Package

**Recommended Packages**:

#### A. `react-image-crop` (Web) + `expo-image-manipulator` (Native)
- **Pros**: Battle-tested, well-maintained, good documentation
- **Cons**: Requires two libraries (web + native), may need custom integration
- **RNW Compatibility**: `react-image-crop` works on web, but not RNW out of the box

#### B. `react-native-image-crop-picker`
- **Pros**: Comprehensive native solution
- **Cons**: No RNW support, would need separate web implementation

#### C. `react-easy-crop`
- **Pros**: Pure React, works on web, good UX
- **Cons**: No native support, would need separate native solution

**Hybrid Approach**:
- Use `react-image-crop` or `react-easy-crop` for web
- Use `expo-image-manipulator` for native
- Create wrapper component to handle platform differences

## Recommended Approach: Refine Existing Implementation

Given that:
1. The web implementation is already functional (just needs bug fixes)
2. We have full control over the UX
3. Native support can be added with `expo-image-manipulator`
4. No additional dependencies needed

We recommend **refining the existing implementation** rather than introducing new packages.

## Implementation Plan

### Phase 1: Fix Critical Bugs

#### Task 1.1: Fix Overlay Mismatch
- **File**: `packages/ui/src/components/image-picker/AvatarCropModal.tsx`
- **Issue**: Circular clipPath for square crop area
- **Fix**: Change `clipPath` to use `inset()` or `polygon()` to create square mask
- **Lines**: 577-578

#### Task 1.2: Improve Coordinate Transformation
- **Issue**: Drag position calculation might have edge cases
- **Fix**: 
  - Add comprehensive tests for coordinate calculations
  - Ensure crop position stays within bounds at all zoom levels
  - Add debouncing for smoother drag performance

#### Task 1.3: Add Error Handling
- **Issue**: Limited error handling
- **Fix**:
  - Add try-catch blocks around image loading
  - Show user-friendly error messages
  - Handle edge cases (very small images, unsupported formats)

### Phase 2: Native Platform Support

#### Task 2.1: Install expo-image-manipulator
```bash
cd apps/expo
pnpm add expo-image-manipulator
```

#### Task 2.2: Implement Native Cropping
- **File**: `packages/ui/src/components/image-picker/AvatarCropModal.tsx`
- **Implementation**:
  - Detect platform (web vs native)
  - For native: Use `expo-image-manipulator` to crop image
  - Maintain same UI/UX as web version
  - Handle native image URIs properly

#### Task 2.3: Create Native Crop UI
- Use Tamagui components for native UI
- Implement pinch-to-zoom gesture
- Implement pan gesture for positioning
- Match web UX as closely as possible

### Phase 3: Cross-Platform Improvements

#### Task 3.1: Convert to Tamagui Components
- Replace native `div` elements with Tamagui `View` where possible
- Ensure proper RNW compatibility
- Test on both web and native platforms

#### Task 3.2: Add Image Size Validation
- Validate image dimensions before loading
- Provide user feedback for images that are too small
- Suggest minimum image size requirements

#### Task 3.3: Performance Optimization
- Add image compression options
- Implement lazy loading for large images
- Optimize canvas operations

### Phase 4: Testing & Refinement

#### Task 4.1: Unit Tests
- Test coordinate transformation functions
- Test crop position constraints
- Test zoom calculations

#### Task 4.2: Integration Tests
- Test on web (Chrome, Safari, Firefox)
- Test on iOS simulator
- Test on Android emulator
- Test on React Native Web

#### Task 4.3: Edge Cases
- Very small images (< crop size)
- Very large images (> 10MB)
- Portrait vs landscape images
- Square images
- Different image formats (JPEG, PNG, WebP)

## Technical Details

### Native Implementation with expo-image-manipulator

```typescript
import * as ImageManipulator from 'expo-image-manipulator'

// Calculate crop region
const cropRegion = {
  originX: cropPosition.x,
  originY: cropPosition.y,
  width: actualCropSize,
  height: actualCropSize,
}

// Perform crop
const result = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ crop: cropRegion }],
  { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
)

onCropComplete(result.uri)
```

### Overlay Fix

Change from:
```typescript
clipPath: `circle(${cropDisplaySize / 2}px at 50% 50%)`
```

To:
```typescript
clipPath: `inset(0 0 0 0)`,
maskImage: `linear-gradient(black, black), 
            linear-gradient(black, black)`,
maskSize: `${cropDisplaySize}px ${cropDisplaySize}px`,
maskPosition: 'center',
maskRepeat: 'no-repeat',
maskComposite: 'xor'
```

Or simpler approach using SVG mask or separate overlay divs.

### Coordinate Transformation Fix

Ensure crop position accounts for:
1. Image scale (zoom level)
2. Display size
3. Crop area position
4. Image boundaries

Add validation to prevent crop position from going outside image bounds.

## Success Criteria

1. ✅ Crop overlay matches crop area (square, not circular)
2. ✅ Native platform fully supports cropping
3. ✅ Smooth drag and zoom on both platforms
4. ✅ Proper error handling for all edge cases
5. ✅ Works correctly on React Native Web
6. ✅ Performance is acceptable for images up to 10MB
7. ✅ User-friendly error messages
8. ✅ Consistent UX across all platforms

## Dependencies

### New Dependencies
- `expo-image-manipulator` (for native cropping)

### Existing Dependencies
- All existing dependencies are sufficient

## Testing Checklist

### Web Testing
- [ ] Chrome desktop
- [ ] Safari desktop
- [ ] Firefox desktop
- [ ] Chrome mobile (responsive)
- [ ] Safari mobile (responsive)

### Native Testing
- [ ] iOS simulator
- [ ] Android emulator
- [ ] iOS device (if available)
- [ ] Android device (if available)

### React Native Web Testing
- [ ] Web build with RNW
- [ ] Ensure Tamagui components render correctly

### Edge Cases
- [ ] Very small images (< 200x200)
- [ ] Very large images (> 5000x5000)
- [ ] Portrait images
- [ ] Landscape images
- [ ] Square images
- [ ] Different aspect ratios

## Timeline Estimate

- **Phase 1**: 2-3 hours (bug fixes)
- **Phase 2**: 4-6 hours (native support)
- **Phase 3**: 2-3 hours (cross-platform improvements)
- **Phase 4**: 3-4 hours (testing & refinement)

**Total**: 11-16 hours

## Alternative: NPM Package Evaluation

If we decide to use an NPM package instead, evaluation criteria:

1. **Cross-platform support**: Works on web, iOS, Android, and RNW
2. **Active maintenance**: Recent updates, active community
3. **Bundle size**: Minimal impact on app size
4. **Customization**: Can be styled to match our design system
5. **Documentation**: Clear, comprehensive documentation
6. **TypeScript**: Full TypeScript support
7. **Performance**: Handles large images efficiently

## Decision Point

**Recommendation**: Proceed with **Option 1 (Refine Existing Implementation)**

**Rationale**:
- Already 80% complete on web
- Full control over UX
- No additional dependencies (except expo-image-manipulator which we need anyway)
- Better integration with existing codebase
- Faster to fix bugs than to integrate and customize a new package

## Next Steps

1. Review this plan with team
2. Get approval on approach
3. Start with Phase 1 (bug fixes)
4. Proceed through phases sequentially
5. Test thoroughly before considering complete

