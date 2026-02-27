/**
 * Mock for @scaffald/ui and @unicornlove/beyond-ui in forsured-web tests.
 * Uses explicit named exports so the dependency chain validation test can
 * verify each component by checking for `export const <Name>` in the file.
 * Re-exports from the workspace-level beyond-ui mock for consistent behaviour
 * (handles testID → data-testid, etc.).
 */
import * as BU from '../../../../../../tests/infrastructure/vitest/mocks/beyond-ui'

export const useTheme = BU.useTheme
export const useThemeContext = BU.useThemeContext
export const useToast = BU.useToast
export const ThemeProvider = BU.ThemeProvider
export const styled = BU.styled
export const createTheme = BU.createTheme

export const Stack = BU.Stack
export const Row = BU.Row
export const Box = BU.Box
export const View = BU.View
export const YStack = BU.YStack
export const XStack = BU.XStack
export const Text = BU.Text
export const H1 = BU.H1
export const H2 = BU.H2
export const H3 = BU.H3
export const H4 = BU.H4
export const H5 = BU.H5
export const H6 = BU.H6
export const Paragraph = BU.Paragraph
export const Label = BU.Label

export const Button = BU.Button
export const Input = BU.Input
export const TextArea = BU.TextArea
export const Checkbox = BU.Checkbox
export const Switch = BU.Switch
export const Toggle = BU.Toggle
export const ToggleSwitch = BU.ToggleSwitch
export const ResponsiveSelect = BU.ResponsiveSelect
export const SearchSelect = BU.SearchSelect

export const Card = BU.Card
export const Badge = BU.Badge
export const Chip = BU.Chip
export const Spinner = BU.Spinner
export const Avatar = BU.Avatar
export const Separator = BU.Separator
export const Spacer = BU.Spacer
export const Anchor = BU.Anchor
export const Group = BU.Group
export const Circle = BU.Circle
export const VisuallyHidden = BU.VisuallyHidden
export const Modal = BU.Modal
export const Tooltip = BU.Tooltip
export const Portal = BU.Portal
export const EmptyState = BU.EmptyState
export const Tabs = BU.Tabs
export const Form = BU.Form
export const Progress = BU.Progress
export const Image = BU.Image
export const ScrollView = BU.ScrollView
