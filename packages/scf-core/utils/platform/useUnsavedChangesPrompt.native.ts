import { useEffect } from 'react'
import { Alert } from 'react-native'
import { useNavigation } from "expo-router/react-navigation"
import type { UseUnsavedChangesPrompt } from './useUnsavedChangesPrompt'

export const useUnsavedChangesPrompt: UseUnsavedChangesPrompt = (isDirty) => {
  const navigation = useNavigation()

  useEffect(() => {
    if (!isDirty) return

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault()
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      )
    })

    return unsubscribe
  }, [isDirty, navigation])
}
