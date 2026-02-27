/**
 * Select - Re-export SearchSelect from @scaffald/ui as Select

 *
 * Note: Beyond UI uses SearchSelect for dropdown selection.
 * The API is slightly different - uses 'value' instead of 'selected'.
 */
export { SearchSelect as Select } from '@scaffald/ui'
export type {
  SearchSelectProps as SelectProps,
  SearchSelectOption as SelectOption,
} from '@scaffald/ui'

// Default export for backward compatibility
import { SearchSelect as FormsSelect } from '@scaffald/ui'
export default FormsSelect
