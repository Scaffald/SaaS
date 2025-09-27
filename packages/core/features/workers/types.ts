export type TalentProfile = {
  id: string
  name: string
  title: string
  experienceYears: number
  hourlyRate: number
  score: number
  scoreLabel?: string
  badges: Array<{
    id: string
    label: string
    tone: 'success' | 'warning' | 'danger'
  }>
  certifications: string[]
  skills: string[]
  locationLabel: string
  coordinates: [number, number]
  organization?: string
  avatarUrl?: string | null
}

export type ActiveFilter = {
  id: string
  label: string
  category: 'location' | 'radius' | 'skill' | 'certification' | 'other'
}
