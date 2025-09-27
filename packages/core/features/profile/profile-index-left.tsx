import { ScrollView, YStack } from '@app/ui'

import { ProfileOverview } from './components/ProfileOverview'
import { GeneralForm } from './components/GeneralForm'
import { SkillsForm } from './components/SkillsForm'
import { BackgroundForm } from './components/BackgroundForm'
import { ContactAvailabilityForm } from './components/ContactAvailabilityForm'

export function ProfileIndexLeft() {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <YStack gap="$5" pb="$8">
        {/* Overview Section */}
        <ProfileOverview />

        {/* General Information Form */}
        <GeneralForm />

        {/* Skills Form */}
        <SkillsForm />

        {/* Background Form */}
        <BackgroundForm />

        {/* Contact & Availability Form */}
        <ContactAvailabilityForm />
      </YStack>
    </ScrollView>
  )
}
