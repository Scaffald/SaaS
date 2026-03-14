import { ProfileCard } from '@scf/core/components/profile/ProfileCard'
import type { ComponentRef } from 'react'
import { forwardRef, memo } from 'react'
import type { View } from 'react-native'

import type { TalentProfile } from '../types'

type ResultCardProps = {
  profile: TalentProfile
  isSelected?: boolean
  onSelect: (profileId: string) => void
  /** Card variant — compact for map rail, full for expanded lists */
  variant?: 'compact' | 'full'
}

export const ResultCard = memo(
  forwardRef<ComponentRef<typeof View>, ResultCardProps>(
    ({ profile, isSelected, onSelect, variant = 'compact' }, forwardedRef) => {
      return (
        <ProfileCard
          ref={forwardedRef}
          id={profile.id}
          name={profile.name}
          title={profile.title}
          score={profile.score}
          experienceYears={profile.experienceYears}
          hourlyRate={profile.hourlyRate}
          locationLabel={profile.locationLabel}
          avatarUrl={profile.avatarUrl}
          badges={profile.badges}
          certifications={profile.certifications}
          skills={profile.skills}
          isSelected={isSelected}
          onPress={onSelect}
          variant={variant}
        />
      )
    }
  )
)

ResultCard.displayName = 'ResultCard'
