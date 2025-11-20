import { Platform } from 'react-native'
import { SearchSelectMobile } from './SearchSelectMobile'
import { SearchSelectWeb } from './SearchSelectWeb'
import type { SearchSelectProps } from './types'

export function SearchSelect<T>(props: SearchSelectProps<T>) {
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android'
  const useMobileSheet = props.forceMobileSheet || (!props.forceWebPopover && isNative)

  if (useMobileSheet) {
    return <SearchSelectMobile {...props} />
  }

  return <SearchSelectWeb {...props} />
}
