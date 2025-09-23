export type VerificationFieldMeta = {
  id: string
  label: string
  field: string
  subjectType: 'profile' | 'user' | 'user_private'
  description?: string
}

export const PROFILE_VERIFICATION_FIELDS: VerificationFieldMeta[] = [
  { id: 'profile.name', label: 'Full name', field: 'basic.full_name', subjectType: 'profile' },
  { id: 'profile.about', label: 'About', field: 'basic.about', subjectType: 'profile' },
]

export const USER_VERIFICATION_FIELDS: VerificationFieldMeta[] = [
  { id: 'user.displayName', label: 'Display name', field: 'basic.display_name', subjectType: 'user' },
  { id: 'user.headline', label: 'Headline', field: 'basic.headline', subjectType: 'user' },
  { id: 'user.bio', label: 'Bio', field: 'basic.bio', subjectType: 'user' },
  { id: 'user.openToWork', label: 'Open to work', field: 'availability.open_to_work', subjectType: 'user' },
]

export const PRIVATE_VERIFICATION_FIELDS: VerificationFieldMeta[] = [
  { id: 'private.email', label: 'Email', field: 'contact.email', subjectType: 'user_private' },
  { id: 'private.phone', label: 'Phone', field: 'contact.phone', subjectType: 'user_private' },
  { id: 'private.location', label: 'Location', field: 'contact.location', subjectType: 'user_private' },
  { id: 'private.openToTravel', label: 'Open to travel', field: 'availability.open_to_travel', subjectType: 'user_private' },
]
