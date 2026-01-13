/**
 * Input component exports
 *
 * Provides both complete Input component and composable sub-components
 * for maximum flexibility matching Figma design system guidelines
 */

// Main Input component
export { Input } from './Input'
export type { InputProps, InputState, InputType } from './Input.types'

// Composable sub-components (can be used independently)
export { InputLabel } from './InputLabel'
export type { InputLabelProps, InputLabelType } from './InputLabel'

export { InputHelperText } from './InputHelperText'
export type { InputHelperTextProps, InputHelperTextType } from './InputHelperText'

export {
  InputExternalAddon,
  InputLeftSide,
  InputRightSide,
} from './InputAddon'
export type {
  InputExternalAddonProps,
  InputLeftSideProps,
  InputRightSideProps,
} from './InputAddon'
