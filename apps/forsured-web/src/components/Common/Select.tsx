/**
 * Select - Re-export SearchSelect from @unicornlove/beyond-ui as Select
 * Migrated from Tamagui to Beyond UI
 *
 * Note: Beyond UI uses SearchSelect for dropdown selection.
 * The API is slightly different - uses 'value' instead of 'selected'.
 */
export { SearchSelect as Select } from '@unicornlove/beyond-ui';
export type { SearchSelectProps as SelectProps, SearchSelectOption as SelectOption } from '@unicornlove/beyond-ui';

// Default export for backward compatibility
import { SearchSelect as FormsSelect } from '@unicornlove/beyond-ui';
export default FormsSelect;
