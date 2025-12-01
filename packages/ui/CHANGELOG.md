# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-30

### Added
- Initial release of `@unicornlove/ui` standalone component library
- Comprehensive UI component library for Tamagui and Expo
- Support for iOS, Android, and Web platforms
- Configurable theme system with factory utilities
- Type definitions for geographic (Boundary, Coordinate) and phone utilities
- Extensive component library including:
  - Form components (Input, Checkbox, Radio, PhoneNumberInput, ToggleSwitch, etc.)
  - Layout components (Card, Stack, Sheet, Dialog, Modal, etc.)
  - Navigation components (Breadcrumb, Tabs, Accordion, etc.)
  - Data display components (Charts, Tables, Lists, etc.)
  - Feedback components (Toast, Spinner, Loading states, etc.)
  - Map components with Mapbox integration
  - Rich text editor components
  - And many more...
- Comprehensive documentation and API reference
- Example Expo app demonstrating component usage
- TypeScript definitions for all components
- CJS, ESM, and DTS build outputs

### Platform Support
- ✅ iOS
- ✅ Android
- ✅ Web

### Breaking Changes
- This is the initial release, extracted from the legacy `@app/ui` package
- Domain-specific components (ImageUpload, domain-specific layouts, etc.) have been moved to `@app/core` and are not included in this standalone package

### Dependencies
- React >= 18.0.0
- React Native >= 0.74.0 (optional)
- Expo >= 51.0.0 (optional)
- Tamagui >= 1.138.0
- React Hook Form >= 7.0.0
- Zod >= 3.0.0

[1.0.0]: https://github.com/Unicorn/SCF-Scaffald/releases/tag/@unicornlove/ui-v1.0.0

