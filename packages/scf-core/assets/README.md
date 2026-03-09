# Scaffald Brand Assets

This directory contains the official Scaffald brand assets including logos, icons, and brand colors.

## Components

### ScaffaldLogo
The full Scaffald logo with text. Use this for headers, footers, and main branding areas.

```tsx
import { ScaffaldLogo } from '@app/core/assets'

// Default usage
<ScaffaldLogo />

// Custom sizing
<ScaffaldLogo width={300} height={50} />

// Custom colors
<ScaffaldLogo 
  primaryColor="#1a365d"
  secondaryColor="#2d3748"
  gradientStart="#63b3ed"
  gradientEnd="#3182ce"
/>
```

### ScaffaldIcon
Icon-only version of the Scaffald logo (just the scaffold symbol). Use this for app icons, favicons, and compact spaces.

```tsx
import { ScaffaldIcon } from '@app/core/assets'

// Default usage
<ScaffaldIcon />

// Custom sizing
<ScaffaldIcon size={48} />

// Custom colors
<ScaffaldIcon 
  size={32}
  primaryColor="#38A169"
  secondaryColor="#D69E2E"
/>
```

## Brand Colors

Use the official brand colors for consistent theming:

```tsx
import { BRAND_COLORS } from '@app/core/assets'

// Primary colors
const primary = BRAND_COLORS.primary      // #239cb2
const secondary = BRAND_COLORS.secondary  // #2A7F8E

// Gradient colors
const gradientStart = BRAND_COLORS.gradientStart  // #76EAFF
const gradientEnd = BRAND_COLORS.gradientEnd      // #239CB2

// Semantic colors
const success = BRAND_COLORS.success  // #38A169
const warning = BRAND_COLORS.warning  // #D69E2E
const error = BRAND_COLORS.error      // #E53E3E
const info = BRAND_COLORS.info        // #3182CE
```

## Usage Guidelines

### Logo Usage
- **Full Logo**: Use for headers, footers, splash screens, and main branding
- **Icon Only**: Use for app icons, favicons, loading states, and compact spaces
- **Minimum Size**: Logo should be at least 120px wide, icon at least 24px
- **Clear Space**: Maintain clear space around the logo equal to the height of the "S" in "SCAFFALD"

### Color Usage
- **Primary**: Use for main text, important buttons, and key UI elements
- **Secondary**: Use for secondary text, borders, and supporting elements
- **Gradients**: Use for highlights, accents, and visual interest
- **Semantic Colors**: Use for status indicators, alerts, and feedback

### Animation
Both components support animation through props:

```tsx
import { useSharedValue, withSpring } from 'react-native-reanimated'

const animatedSize = useSharedValue(48)

// Animate size changes
animatedSize.value = withSpring(72)

<ScaffaldIcon size={animatedSize.value} />
```

## File Structure

```
packages/core/assets/
├── ScaffaldLogo.tsx      # Full logo component
├── ScaffaldIcon.tsx      # Icon-only component
├── brand-colors.ts       # Brand color constants
├── ScaffaldLogo.demo.tsx # Usage examples
├── index.ts             # Exports
└── README.md            # This file
```

## Demo

See `ScaffaldLogo.demo.tsx` for comprehensive usage examples and variations.
