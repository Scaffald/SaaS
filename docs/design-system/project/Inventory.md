# Inventory

`@scaffald/ui` exports 115 component folders at `packages/ui/src/components`. The ten marked **documented** have guidelines and a static preview in this system; the others are listed so a consumer knows they exist and where to read them.

| Family | Components |
| --- | --- |
| Actions | **Button**, ButtonGroup, ToolbarButton, ToolbarButtonGroup, NavIconButton, GlassIconButton, SocialButton, SocialLoginGroup, AppStoreButton |
| Forms | **Input**, **Checkbox**, **Toggle**, Radio, Form, FieldError, HelperText, PasswordStrength, PhoneNumberInput, NumericStepper, Slider, GlassSlider, DatePicker, DatePickerBase, DatePickerDay, DatePickerHeader, Dropdown, SearchSelect, ResponsiveSelect, SegmentedControl, SettingsFormField, FileUpload, ImagePicker, UploadSurface, IconSelector, RichTextEditor, Address, TradeControls |
| Surfaces | **Card**, SelectableCard, DiscoverCard, GlassPanel, GlassSurface, GlassWidget, GlassGroup, Widgets, Sheet, Modal, Popover, Tooltip, ContextMenu, EditMenu, ActionSheet, CommandMenu |
| Data | **Metric**, **StatusIndicator**, **Chip**, Table, List, ListItem, ListItemAccessory, Checklist, Kanban, Lane, Chart, ProgressBar, Stepper, Skeleton, Spinner, LoadingOverlay, States, Pagination, PageControl, NotificationTag, NotificationListItem, SaveStatusIndicator, Assessment |
| Navigation | **Tabs**, TabBar, Breadcrumb, NavigationBar, NavigationList, Sidebar, SaaSNavigation, SaaSSectionHeader, ScreenHeader, BottomBar, BottomToolbar, ListToolbar, ToolbarSearchBar, SearchAccessory, CarouselPager, ScrollArea |
| Typography | **Heading** (with Text, Paragraph, Label, Caption), Icon, Icons, IconCircle, Avatar |
| Settings | SettingsPageLayout, SettingsSectionHeader, SettingsIntegrationsGrid, SettingsNotificationTable, SettingsTeamTable, SettingsToggleCard, AppearanceThemeCard |
| Feedback | Alert (iOS 26 style), Toast, CookieConsent, Onboarding, ActivityView |
| Layout | Layout (Box, Row, Stack, Spacer, Separator), Grid, Responsive, Maps |

Hooks, providers and contexts (`ThemeProvider`, `useThemeContext`, `useResponsive`, `ToastContext`, `TabsContext`) get no card.
