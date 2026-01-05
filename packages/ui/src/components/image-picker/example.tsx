import { useState } from 'react'
import { Text, YStack } from '@unicornlove/ui'
import { AvatarImagePicker } from './AvatarImagePicker'

/**
 * Example usage of the AvatarImagePicker component
 * This demonstrates how to integrate the component into your app
 */
export function AvatarImagePickerExample() {
  const [avatarUri, setAvatarUri] = useState<string>('')

  return (
    <YStack padding="$4" gap="$4" alignItems="center">
      <Text fontSize="$6" fontWeight="bold">
        Avatar Image Picker Example
      </Text>

      <AvatarImagePicker
        value={avatarUri}
        onImageSelect={setAvatarUri}
        size={150}
        placeholder="Upload Avatar"
      />

      {avatarUri && (
        <YStack gap="$2" alignItems="center">
          <Text fontSize="$4" fontWeight="600">
            Selected Image URI:
          </Text>
          <Text fontSize="$3" color="$color10" textAlign="center">
            {avatarUri}
          </Text>
        </YStack>
      )}
    </YStack>
  )
}
