import { Alert } from 'react-native'
import type { ConfirmDialog } from './confirmDialog'

export const confirmDialog: ConfirmDialog = ({
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  destructive = false,
}) =>
  new Promise<boolean>((resolve) => {
    Alert.alert(title ?? '', message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ])
  })
