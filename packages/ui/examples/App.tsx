import { TamaguiProvider } from 'tamagui'
import { config } from '@unicornlove/ui'
import { Button, Card, Input, Text, YStack, XStack } from '@unicornlove/ui'
import { useState } from 'react'

export default function App() {
  const [inputValue, setInputValue] = useState('')

  return (
    <TamaguiProvider config={config}>
      <YStack flex={1} bg="$background" p="$4" gap="$4">
        <Text fontSize="$8" fontWeight="600">
          @unicornlove/ui Example
        </Text>

        <Card p="$4" bg="$color1" borderRadius="$4">
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="600">
              Form Components
            </Text>
            <Input placeholder="Enter text..." value={inputValue} onChangeText={setInputValue} />
            <Button onPress={() => alert(`You entered: ${inputValue}`)}>Submit</Button>
          </YStack>
        </Card>

        <Card p="$4" bg="$color1" borderRadius="$4">
          <YStack gap="$3">
            <Text fontSize="$6" fontWeight="600">
              Theme Customization
            </Text>
            <Text fontSize="$4" color="$color11">
              This example uses the default scaffald theme. You can customize colors, tokens, and
              component styles using the theme factory.
            </Text>
          </YStack>
        </Card>

        <XStack gap="$2" flexWrap="wrap">
          <Button variant="outlined">Outlined</Button>
          <Button bg="$blue9" color="white">
            Primary
          </Button>
          <Button bg="$green9" color="white">
            Success
          </Button>
          <Button bg="$red9" color="white">
            Danger
          </Button>
        </XStack>
      </YStack>
    </TamaguiProvider>
  )
}
