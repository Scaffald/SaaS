# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Cookie consent** – CookieConsentProvider, CookieConsentBanner, CookiePreferencesDialog with injectable storage adapter.
- **Image picker** – useFilePicker (web + optional native), AvatarCropModal, AvatarImagePicker.
- **Kanban** – KanbanBoard, KanbanColumn, KanbanCard (layout-only; optional DnD via peer).
- **IconSelector** – Modal grid picker with search, Lucide icon set.
- **NotificationTag** – Small badge component (sm/md sizes).
- **Charts** – StackedBarChart and PopulationPyramid (SVG-based, no gifted-charts).
- **Maps** – MapContainer, MapPin, MapTooltip, MapFallback (provider-agnostic; no map library dependency).
- **CONTRIBUTING.md** – Contribution guide (setup, code standards, testing, PR process).

## [0.1.0] - Initial release

- Core component library: Button, Input, Card, Modal, Tabs, Accordion, and 60+ components.
- Design tokens (colors, spacing, typography, borders, shadows, breakpoints).
- Layout: Stack, Row, Grid, Box.
- Accessibility: FocusGuard, LiveRegion, SkipLink, useFocusTrap, useFocusRing.
- Animation: AnimatedView, transitions, spring/timing configs.
- Form: Fieldset, FormField, FormRow, FormActions.
- Responsive: useResponsive, useWindowDimensions, Show/Hide.
- Cross-platform: React Native and web via react-native-web.

[Unreleased]: https://github.com/Unicorn/unicornlove-beyond-ui/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Unicorn/unicornlove-beyond-ui/releases/tag/v0.1.0
