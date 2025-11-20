// @ts-nocheck

import { AnchorHeading, ExampleCard, StyleguidePage } from '@app/styleguide'
import { CustomCheckbox, CustomRadio, ToggleCard, ToggleSwitch } from '@app/ui'
import { Check } from '@tamagui/lucide-icons'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Checkbox, Label, Paragraph, RadioGroup, Switch, Text, XStack, YStack } from 'tamagui'

const RADIO_OPTIONS = [
  { value: 'standard', label: 'Standard', description: 'Core coverage' },
  { value: 'plus', label: 'Plus', description: 'Adds dental' },
  { value: 'premium', label: 'Premium', description: 'All benefits' },
] as const

export default function FormChoicePage() {
  const [customCheckboxChecked, setCustomCheckboxChecked] = useState(true)
  const [primitiveCheckboxChecked, setPrimitiveCheckboxChecked] = useState(true)
  const [customRadioValue, setCustomRadioValue] = useState(RADIO_OPTIONS[0].value)
  const [primitiveRadioValue, setPrimitiveRadioValue] = useState(RADIO_OPTIONS[0].value)
  const [customToggleChecked, setCustomToggleChecked] = useState(true)
  const [primitiveSwitchChecked, setPrimitiveSwitchChecked] = useState(true)
  const [customCardChecked, setCustomCardChecked] = useState(false)
  const [primitiveCardChecked, setPrimitiveCardChecked] = useState(false)

  return (
    <StyleguidePage
      title="Choice controls"
      description="Compare Scaffald’s custom components with Tamagui primitives to verify styling after upgrades."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="checkboxes"
          title="Checkboxes"
          description="Custom checkbox vs. Tamagui checkbox for inline preference selections."
        />
        <ExampleCard
          title="Notification preference"
          description="Both columns share identical state stories so you can verify hover, focus, and disabled visuals."
          code={`<XStack gap="$4">
  <CustomCheckbox checked={custom} onCheckedChange={setCustom} />
  <Checkbox checked={primitive} onCheckedChange={(value) => setPrimitive(value === true)}>
    <Checkbox.Indicator>
      <Check size={12} />
    </Checkbox.Indicator>
  </Checkbox>
</XStack>`}
        >
          <ComparisonGrid>
            <ComparisonColumn title="Custom checkbox">
              <XStack gap="$3" alignItems="center">
                <CustomCheckbox
                  checked={customCheckboxChecked}
                  onCheckedChange={setCustomCheckboxChecked}
                  aria-label="Custom notification checkbox"
                />
                <Label fontSize={13}>Send me security notifications</Label>
              </XStack>
              <Paragraph fontSize={12} color="$color10">
                Wrapper handles animation, focus ring, and theme alignment. Indicator always
                centered.
              </Paragraph>
            </ComparisonColumn>
            <ComparisonColumn title="Tamagui checkbox">
              <XStack gap="$3" alignItems="center">
                <Checkbox
                  size="$3"
                  checked={primitiveCheckboxChecked}
                  onCheckedChange={(value) => setPrimitiveCheckboxChecked(value === true)}
                >
                  <Checkbox.Indicator>
                    <Check size={12} color="white" />
                  </Checkbox.Indicator>
                </Checkbox>
                <Label fontSize={13}>Send me security notifications</Label>
              </XStack>
              <Paragraph fontSize={12} color="$color10">
                Pure primitive baseline. Use to validate theme token mapping and focus outline
                parity.
              </Paragraph>
            </ComparisonColumn>
          </ComparisonGrid>
        </ExampleCard>

        <AnchorHeading
          id="radios"
          title="Radio groups"
          description="Side-by-side stacked options for mutually exclusive choices."
        />
        <ExampleCard
          title="Benefit tier"
          description="Custom implementation mirrors legacy radio visuals while Tamagui RadioGroup shows out-of-the-box styling."
          code={`<XStack gap="$4" alignItems="flex-start">
  {RADIO_OPTIONS.map((option) => (
    <CustomRadio
      key={option.value}
      checked={value === option.value}
      onCheckedChange={() => setValue(option.value)}
    />
  ))}
</XStack>`}
        >
          <ComparisonGrid>
            <ComparisonColumn title="Custom radios">
              <YStack gap="$3">
                {RADIO_OPTIONS.map((option) => (
                  <XStack key={option.value} gap="$3" alignItems="center">
                    <CustomRadio
                      checked={customRadioValue === option.value}
                      onCheckedChange={() => setCustomRadioValue(option.value)}
                      aria-label={`${option.label} plan (custom)`}
                    />
                    <YStack gap="$1">
                      <Text fontSize={13} fontWeight="600" color="$color11">
                        {option.label}
                      </Text>
                      <Text fontSize={12} color="$color10">
                        {option.description}
                      </Text>
                    </YStack>
                  </XStack>
                ))}
              </YStack>
              <Paragraph fontSize={12} color="$color10">
                Maintains Bootstrap-style dot sizing, hover states, and RLS-friendly focus outlines.
              </Paragraph>
            </ComparisonColumn>
            <ComparisonColumn title="Tamagui RadioGroup">
              <RadioGroup
                value={primitiveRadioValue}
                onValueChange={setPrimitiveRadioValue}
                orientation="vertical"
                gap="$3"
              >
                {RADIO_OPTIONS.map((option) => (
                  <YStack key={option.value} gap="$1">
                    <RadioGroup.Item value={option.value} size="$3">
                      <RadioGroup.Indicator />
                    </RadioGroup.Item>
                    <Text fontSize={13} fontWeight="600" color="$color11">
                      {option.label}
                    </Text>
                    <Text fontSize={12} color="$color10">
                      {option.description}
                    </Text>
                  </YStack>
                ))}
              </RadioGroup>
              <Paragraph fontSize={12} color="$color10">
                Baseline Tamagui RadioGroup for parity checks across platforms.
              </Paragraph>
            </ComparisonColumn>
          </ComparisonGrid>
        </ExampleCard>

        <AnchorHeading
          id="toggles"
          title="Toggle switches"
          description="Confirm thumb alignment and focus styles for binary on/off controls."
        />
        <ExampleCard
          title="Platform availability"
          description="Custom toggle aligns with Bootstrap pill aesthetic while Switch shows primitive behavior."
          code={`<XStack gap="$4">
  <ToggleSwitch checked={custom} onCheckedChange={setCustom} />
  <Switch checked={primitive} onCheckedChange={setPrimitive} />
</XStack>`}
        >
          <ComparisonGrid>
            <ComparisonColumn title="Custom toggle switch">
              <XStack gap="$3" alignItems="center">
                <ToggleSwitch
                  checked={customToggleChecked}
                  onCheckedChange={setCustomToggleChecked}
                  aria-label="Custom toggle switch"
                />
                <Text fontSize={13} color="$color11">
                  Available on mobile
                </Text>
              </XStack>
              <Paragraph fontSize={12} color="$color10">
                Animated thumb offset ensures consistent spacing with our design tokens.
              </Paragraph>
            </ComparisonColumn>
            <ComparisonColumn title="Tamagui Switch">
              <XStack gap="$3" alignItems="center">
                <Switch
                  size="$3"
                  checked={primitiveSwitchChecked}
                  onCheckedChange={setPrimitiveSwitchChecked}
                >
                  <Switch.Thumb />
                </Switch>
                <Text fontSize={13} color="$color11">
                  Available on mobile
                </Text>
              </XStack>
              <Paragraph fontSize={12} color="$color10">
                Use as reference for platform defaults and accessibility states.
              </Paragraph>
            </ComparisonColumn>
          </ComparisonGrid>
        </ExampleCard>

        <AnchorHeading
          id="toggle-cards"
          title="Toggle cards"
          description="Composite choice components that bundle copy, icon, and switch."
        />
        <ExampleCard
          title="Employee onboarding add-ons"
          description="Compare the higher-level ToggleCard to a primitive stack + Switch combo."
          code={`<ToggleCard
  title="Equipment stipend"
  description="Include $800 annual hardware allowance"
  checked={checked}
  onCheckedChange={setChecked}
/>

<YStack borderWidth={1} borderColor="$borderColor" rounded="$3" px="$4" py="$3">
  <XStack justify="space-between" alignItems="center">
    <Text fontWeight="600">Equipment stipend</Text>
    <Switch checked={value} onCheckedChange={setValue}>
      <Switch.Thumb />
    </Switch>
  </XStack>
</YStack>`}
        >
          <ComparisonGrid>
            <ComparisonColumn title="Custom ToggleCard">
              <ToggleCard
                title="Equipment stipend"
                description="Include $800 annual hardware allowance."
                checked={customCardChecked}
                onCheckedChange={setCustomCardChecked}
                expandedContent={
                  <Paragraph fontSize={12} color="$color10">
                    Adds a monthly payroll allowance and procurement checklist.
                  </Paragraph>
                }
              />
              <Paragraph fontSize={12} color="$color10">
                Entire card is pressable, includes expandable content, and wraps ToggleSwitch.
              </Paragraph>
            </ComparisonColumn>
            <ComparisonColumn title="Primitive card + switch">
              <YStack
                borderWidth={1}
                borderColor="$borderColor"
                rounded="$3"
                px="$4"
                py="$3"
                gap="$2"
              >
                <XStack justify="space-between" alignItems="center">
                  <YStack gap="$1">
                    <Text fontSize={14} fontWeight="600" color="$color11">
                      Equipment stipend
                    </Text>
                    <Text fontSize={12} color="$color10">
                      Include $800 annual hardware allowance.
                    </Text>
                  </YStack>
                  <Switch checked={primitiveCardChecked} onCheckedChange={setPrimitiveCardChecked}>
                    <Switch.Thumb />
                  </Switch>
                </XStack>
              </YStack>
              <Paragraph fontSize={12} color="$color10">
                Manual composition using YStack + Switch for baseline comparison.
              </Paragraph>
            </ComparisonColumn>
          </ComparisonGrid>
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}

type ComparisonColumnProps = {
  title: string
  children: ReactNode
}

const ComparisonColumn = ({ title, children }: ComparisonColumnProps) => (
  <YStack
    flex={1}
    minWidth={220}
    gap="$3"
    borderWidth={1}
    borderColor="$borderColor"
    rounded="$3"
    px="$3"
    py="$3"
    bg="$color2"
  >
    <Text
      fontSize={12}
      fontWeight="600"
      color="$color11"
      textTransform="uppercase"
      letterSpacing={0.4}
    >
      {title}
    </Text>
    {children}
  </YStack>
)

const ComparisonGrid = ({ children }: { children: ReactNode }) => (
  <XStack gap="$4" flexWrap="wrap" $sm={{ flexDirection: 'column' }}>
    {children}
  </XStack>
)
