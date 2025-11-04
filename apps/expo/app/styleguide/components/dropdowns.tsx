// @ts-nocheck
import React, { useState } from 'react'
import { Button, Text, YStack } from '@app/ui'
import { ChevronDown } from '@tamagui/lucide-icons'
import { StyleguidePage } from '../_components/StyleguidePage'
import { AnchorHeading } from '../_components/AnchorHeading'
import { ExampleCard } from '../_components/ExampleCard'

const menuItems = ['Edit profile', 'Duplicate', 'Archive', 'Delete']

export default function DropdownsPage() {
  const [open, setOpen] = useState(false)

  return (
    <StyleguidePage
      title="Dropdowns"
      description="Menu trigger plus overlay list replicating Bootstrap’s dropdown component."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="dropdown-basic"
          title="Basic menu"
          description="Use stateful container to toggle menu visibility. Production implementations should upgrade to Tamagui DropdownMenu."
        />
        <ExampleCard
          title="Actions menu"
          description="Button toggles card-style menu aligned to bottom left."
          code={`const [open, setOpen] = useState(false)
<Button iconAfter={ChevronDown} onPress={() => setOpen((prev) => !prev)}>Actions</Button>`}
        >
          <YStack gap="$3" alignItems="flex-start">
            <Button
              iconAfter={ChevronDown}
              onPress={() => setOpen((previous) => !previous)}
              backgroundColor="$color3"
              color="$color11"
            >
              Actions
            </Button>
            {open ? (
              <YStack
                borderWidth={1}
                borderColor="$color6"
                borderRadius="$4"
                backgroundColor="$color1"
                shadowColor="rgba(0,0,0,0.1)"
                shadowRadius={12}
                width={200}
                paddingVertical="$2"
              >
                {menuItems.map((item) => (
                  <Text
                    key={item}
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    fontSize={13}
                    color="$color11"
                  >
                    {item}
                  </Text>
                ))}
              </YStack>
            ) : null}
          </YStack>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}
