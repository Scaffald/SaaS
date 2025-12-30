/// <reference path="./tamagui.d.ts" />

export * from './components'
export * from './config'
export * from './hooks'
export * from './tamagui.config'
export * from './themes'
export * from './types'
export * from '@tamagui/toast'
// export * from 'tamagui'

export * from '@tamagui/accordion'
export * from '@tamagui/adapt'
export * from '@tamagui/alert-dialog'
export * from '@tamagui/animate-presence'
export * from '@tamagui/avatar'
export * from '@tamagui/checkbox'
export * from '@tamagui/compose-refs'
export * from '@tamagui/create-context'
export * from '@tamagui/font-size'
export * from '@tamagui/form'
export * from '@tamagui/group'
export * from '@tamagui/react-native-media-driver'
export * from '@tamagui/elements'
export * from '@tamagui/helpers-tamagui'
export * from '@tamagui/image'
export * from '@tamagui/label'
export * from '@tamagui/list-item'
export * from '@tamagui/popper'
export * from '@tamagui/portal'
export * from '@tamagui/progress'
export * from '@tamagui/radio-group'
export * from '@tamagui/scroll-view'
export * from '@tamagui/select'
export * from '@tamagui/separator'
export * from '@tamagui/shapes'
export * from '@tamagui/slider'
export * from '@tamagui/stacks'
export * from '@tamagui/switch'
export * from '@tamagui/tabs'
export * from '@tamagui/theme'
export * from '@tamagui/toggle-group'
export * from '@tamagui/tooltip'
export * from '@tamagui/use-controllable-state'
export * from '@tamagui/use-debounce'
export * from '@tamagui/use-force-update'
export * from '@tamagui/use-window-dimensions'
export * from '@tamagui/visually-hidden'

export { createTamagui } from 'tamagui'

export type { ShorthandViewStyleProps, ShorthandTextStyleProps } from 'tamagui'
export { TamaguiProvider } from 'tamagui'

export { Anchor } from 'tamagui'
export { Card, CardHeader, CardFooter, CardBackground } from '@tamagui/card'
export type { CardProps, CardHeaderProps, CardFooterProps } from '@tamagui/card'
export { EnsureFlexed } from 'tamagui'
export { Fieldset } from 'tamagui'
export { H1, H2, H3, H4, H5, H6 } from 'tamagui'
export { Input } from 'tamagui'
export { Paragraph } from 'tamagui'
export { ScrollView } from 'tamagui'
export { SizableText } from 'tamagui'
export { Spinner } from 'tamagui'
export { TextArea } from 'tamagui'
export { Text } from 'tamagui'

// since we overlap with StackProps and potentially others
// lets be explicit on what gets exported
export type {
  AnimationKeys,
  ColorTokens,
  CreateTamaguiConfig,
  CreateTamaguiProps,
  FontColorTokens,
  FontLanguages,
  FontLetterSpacingTokens,
  FontLineHeightTokens,
  FontFamilyTokens,
  FontSizeTokens,
  FontStyleTokens,
  FontTokens,
  FontTransformTokens,
  FontWeightTokens,
  GenericFont,
  GenericStackVariants,
  GenericTamaguiConfig,
  GenericTextVariants,
  GetAnimationKeys,
  GetProps,
  GetRef,
  GetThemeValueForKey,
  GroupNames,
  Longhands,
  Media,
  MediaPropKeys,
  MediaQueries,
  MediaQueryState,
  RadiusTokens,
  Shorthands,
  SizeTokens,
  SpacerProps,
  SpaceTokens,
  SpecificTokens,
  StackNonStyleProps,
  ViewProps,
  StackProps,
  StaticConfig,
  Styleable,
  TamaguiBaseTheme,
  TamaguiBuildOptions,
  TamaguiComponent,
  TamaguiConfig,
  TamaguiCustomConfig,
  TamaguiElement,
  TamaguiInternalConfig,
  TamaguiProviderProps,
  TamaguiSettings,
  TamaguiTextElement,
  TextNonStyleProps,
  TextProps,
  ThemeKeys,
  ThemeName,
  ThemeParsed,
  ThemeProps,
  Themes,
  ThemeTokens,
  ThemeValueFallback,
  Token,
  Tokens,
  TypeOverride,
  Variable,
  VariantSpreadExtras,
  VariantSpreadFunction,
  ZIndexTokens,
  ViewStyle,
  TextStyle,
} from '@tamagui/core'

export {
  Configuration,
  ComponentContext,
  GroupContext,
  FontLanguage,
  // components
  Spacer,
  Stack,
  Theme,
  Unspaced,
  View,
  createComponent,
  createFont,
  createShorthands,
  createStyledContext,
  createTheme,
  createTokens,
  createVariable,
  getConfig,
  getMedia,
  getCSSStylesAtomic,
  getThemes,
  getToken,
  getTokenValue,
  getTokens,
  getVariable,
  setupReactNative,
  getVariableName,
  getVariableValue,
  insertFont,
  setConfig,
  setupDev,
  // constants
  isChrome,
  isClient,
  isServer,
  isTamaguiComponent,
  isTamaguiElement,
  isTouchable,
  isVariable,
  isWeb,
  isWebTouchable,
  matchMedia,
  mediaObjectToString,
  mediaQueryConfig,
  mediaState,
  setOnLayoutStrategy,
  spacedChildren,
  styled,
  themeable,
  // hooks
  useDidFinishSSR,
  useEvent,
  useGet,
  useIsTouchDevice,
  useIsomorphicLayoutEffect,
  useMedia,
  useProps,
  usePropsAndStyle,
  useStyle,
  useConfiguration,
  useTheme,
  useThemeName,
  variableToString,
  withStaticProperties,
} from '@tamagui/core'
