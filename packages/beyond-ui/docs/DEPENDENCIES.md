# Dependency policy and audit

Beyond-UI keeps **runtime dependencies minimal** and uses **optional peer dependencies** for features that not every app needs. This document summarizes the current state and the policy.

## Required dependencies

- **react** (`>=18.0.0`) – peer; required.
- **lucide-react-native** – only **direct runtime dependency**; used for icons (IconSelector and other icon usage). Kept in dependencies so the library works out of the box for icon features.

## Peer dependencies (required in consuming app when used)

- **react-native** (`>=0.74.0`) – **optional** peer. Omit for web-only apps; required for React Native.
- **react-native-svg** (`>=13.0.0`) – required for Chart components (BarChart, DonutChart, LinearChart, StackedBarChart, PopulationPyramid, etc.) and any component that uses SVG. If you don’t use those components, you can still install it to satisfy the peer or rely on optional handling if we ever make it optional.
- **react-native-reanimated** (`>=3.0.0`) – **optional** peer. Used for advanced animation (AnimatedView, etc.). If not installed, the library degrades gracefully.
- **react-native-gesture-handler** (`>=2.0.0`) – **optional** peer. Used for gesture-driven components. If not installed, those features may be no-ops or use fallbacks.
- **react-native-safe-area-context** (`>=4.0.0`) – **optional** peer. Used for safe area insets. If not installed, layout may not respect notches/status bar.

## Dev dependencies

All Storybook, testing, type, and build tools are **devDependencies**. They are not installed when consumers install `@unicornlove/beyond-ui`.

## Policy

1. **No required heavy runtimes** – No theme compiler, charting lib, rich-text editor, or map library as a required dependency.
2. **Optional/peer for platform or feature-specific libs** – React Native, Reanimated, Gesture Handler, and Safe Area are optional peers so web-only or minimal apps don’t pay the cost.
3. **react-native-svg** – Currently a required peer for chart and SVG-based components. Making it optional would require runtime checks and fallbacks; for now it remains peer (and many RN apps already have it).
4. **New features** – Prefer optional or peer dependencies for new capabilities (e.g. maps adapter, rich text, DnD). Document in this file when adding.

## Summary table

| Package                    | Type     | Optional | Used for                          |
|---------------------------|----------|----------|-----------------------------------|
| react                     | peer     | No       | Core                              |
| lucide-react-native       | direct   | No       | Icons                             |
| react-native              | peer     | Yes      | RN-only features                  |
| react-native-svg          | peer     | No       | Charts, SVG icons                 |
| react-native-reanimated   | peer     | Yes      | Advanced animation                |
| react-native-gesture-handler | peer  | Yes      | Gestures                          |
| react-native-safe-area-context | peer | Yes  | Safe areas                        |

This audit reflects the state as of the last update. When adding or changing dependencies, update this file and keep optional/peer usage for anything that isn’t needed by every consumer.
