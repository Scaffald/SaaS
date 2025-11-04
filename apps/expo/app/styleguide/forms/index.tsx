// @ts-nocheck
import React, { useState } from 'react'
import { Paragraph, Text, YStack } from '@app/ui'
import { AddressAutocomplete, AvatarImagePicker, PhoneNumberInput } from '@app/ui'
import { StyleguidePage } from '../_components/StyleguidePage'
import { AnchorHeading } from '../_components/AnchorHeading'
import { ExampleCard } from '../_components/ExampleCard'

export default function FormsShowcasePage() {
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('500 5th Ave, New York, NY')
  const [avatar, setAvatar] = useState('')

  return (
    <StyleguidePage
      title="Form components showcase"
      description="Interactive playground combining Scaffald-specific primitives for profile creation and onboarding flows."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="profile-onboarding"
          title="Profile onboarding"
          description="Combine PhoneNumberInput, AddressAutocomplete, and AvatarImagePicker to mirror Bootstrap’s form layouts."
        />
        <ExampleCard
          title="Employee profile"
          description="Full-width layout showing how complex inputs adapt to responsive breakpoints."
          code={`<YStack gap="$4">
  <PhoneNumberInput
    label="Mobile"
    value={phone}
    onChangeText={setPhone}
    country={country}
  />
  <AddressAutocomplete
    value={address}
    onSelect={setAddress}
    mode="hybrid"
  />
  <AvatarImagePicker
    value={avatar}
    onChange={setAvatar}
  />
</YStack>`}
        >
          <YStack gap="$4">
            <PhoneNumberInput
              label="Mobile"
              value={phone}
              onChangeText={setPhone}
              onCountryChange={() => {}}
              description="Formats input as E.164 and validates live."
            />
            <AddressAutocomplete
              value={address}
              label="Company address"
              onChangeText={setAddress}
              onSelect={(value) => setAddress(value?.fullAddress ?? '')}
              mode="hybrid"
            />
            <AvatarImagePicker
              label="Profile photo"
              value={avatar}
              onChange={setAvatar}
              helperText="PNG or JPG up to 5MB"
            />
          </YStack>
        </ExampleCard>
        <AnchorHeading
          id="form-guidance"
          title="Usage guidance"
          description="Key considerations when composing higher-order form experiences."
        />
        <YStack gap="$3">
          <Paragraph fontSize={14} color="$color10">
            • Use Tamagui’s <Text fontFamily="monospace">Stack</Text> spacing tokens (<Text fontFamily="monospace">$4</Text>, <Text fontFamily="monospace">$5</Text>) to maintain visual rhythm.
          </Paragraph>
          <Paragraph fontSize={14} color="$color10">
            • Align validation feedback with <Text fontFamily="monospace">FieldError</Text> to reuse accessible messaging patterns.
          </Paragraph>
          <Paragraph fontSize={14} color="$color10">
            • When embedding in Bootstrap-like columns, wrap each control in a <Text fontFamily="monospace">YStack</Text> to preserve label spacing.
          </Paragraph>
        </YStack>
      </YStack>
    </StyleguidePage>
  )
}
