/**
 * Select - Re-export from @unicornlove/ui
 */
export { Select } from '@unicornlove/ui';
export type { SelectProps, SelectOption } from '@unicornlove/ui';

// Default export for backward compatibility
import { Select as FormsSelect } from '@unicornlove/ui';
export default FormsSelect;
