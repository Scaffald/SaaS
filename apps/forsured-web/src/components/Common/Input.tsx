/**
 * Input - Re-export TextInput from @unicornlove/ui
 * 
 * The package component is called TextInput and supports label, error, and helperText props.
 */
export { TextInput as Input } from '@unicornlove/ui';
export type { TextInputProps as InputProps } from '@unicornlove/ui';

// Default export for backward compatibility
import { Input as TextInput } from '@unicornlove/ui';
export default TextInput;
