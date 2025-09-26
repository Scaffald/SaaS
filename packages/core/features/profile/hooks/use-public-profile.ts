import { useQuery } from '@tanstack/react-query'

type PublicProfileStat = {
  label: string
  value: string
}

type PublicProfileSkillSections = {
  core: string[]
  platforms: string[]
  leadership: string[]
}

type PublicProfileCertification = {
  name: string
  issuer: string
  status: string
}

type PublicProfileProjectHighlight = {
  name: string
  location: string
  description: string
  impact: string
}

type PublicProfileExperience = {
  company: string
  role: string
  period: string
  highlights: string[]
}

export type PublicProfileReviewSummary = {
  averageRating: number
  totalReviews: number
  positivePercent: number
  negativePercent: number
  lastUpdated: string
}

export type PublicProfile = {
  name: string
  headline: string
  location: string
  summary: string
  availability: string
  travelRadius: string
  stats: PublicProfileStat[]
  focusAreas: string[]
  skills: PublicProfileSkillSections
  certifications: PublicProfileCertification[]
  safetyHighlights: string[]
  languages: string[]
  affiliations: string
  projectHighlights: PublicProfileProjectHighlight[]
  experience: PublicProfileExperience[]
  contact: {
    phone: string
  }
  reviewSummary: PublicProfileReviewSummary
}

const fallbackProfile: PublicProfile = {
  name: 'Alicia Ramirez',
  headline: 'Senior Electrical Foreman',
  location: 'Houston, Texas',
  summary:
    'Licensed foreman with 12 years coordinating electrical crews across petrochemical and large-scale commercial projects. Specializes in fast-track turnarounds, power distribution upgrades, and mentoring apprentices transitioning into leadership roles.',
  availability: 'Open to long-term contract leadership roles starting in July 2024',
  travelRadius: 'Willing to travel up to 100 miles for priority projects',
  stats: [
    { label: 'Experience', value: '12 years' },
    { label: 'Crew size managed', value: '8-24 tradespeople' },
    { label: 'Notable projects', value: '17 delivered' },
  ],
  focusAreas: ['Power distribution upgrades', 'Industrial automation', 'Safety-first leadership'],
  skills: {
    core: [
      'High-voltage terminations',
      'Control panel commissioning',
      'Conduit fabrication',
      'QA/QC documentation',
    ],
    platforms: ['Allen-Bradley PLC', 'AutoCAD Electrical', 'Bluebeam Revu'],
    leadership: ['Crew scheduling', 'Mentorship programs', 'Client walkdowns'],
  },
  certifications: [
    {
      name: 'OSHA 30-Hour Construction Safety',
      issuer: 'Occupational Safety and Health Administration',
      status: 'Active · Expires Sep 2026',
    },
    { name: 'NCCER Electrical Level 4', issuer: 'NCCER', status: 'Active · Verified 2024' },
    { name: 'NFPA 70E Arc Flash Qualified', issuer: 'NFPA', status: 'Completed 2023' },
    { name: 'TWIC Credential', issuer: 'Transportation Security Administration', status: 'Active' },
  ],
  safetyHighlights: [
    'Zero recordable incidents across 6 consecutive turnarounds',
    'Leads weekly safety stand-downs with bilingual materials',
    'Implements lockout/tagout refreshers before each shift',
  ],
  languages: ['English', 'Spanish'],
  affiliations: 'IBEW Local 716 · NCCER Certified Instructor',
  projectHighlights: [
    {
      name: 'Baytown Petrochem Expansion',
      location: 'Baytown, TX',
      description:
        'Managed electrical scope for $28M power distribution upgrade, coordinating with mechanical and civil leads.',
      impact:
        'Delivered two weeks early with 0 safety incidents and a 15% reduction in rework hours.',
    },
    {
      name: 'Houston Ship Channel Automation Retrofit',
      location: 'La Porte, TX',
      description:
        'Led night-shift crew reconfiguring control panels and SCADA instrumentation while maintaining live operations.',
      impact:
        'Achieved 98% first-pass inspection rate and kept uptime above 92% throughout cutover.',
    },
  ],
  experience: [
    {
      company: 'Nexus Infrastructure',
      role: 'Senior Electrical Foreman',
      period: '2020 — Present',
      highlights: [
        'Supervise multi-discipline crews across petrochemical outages and brownfield upgrades.',
        'Introduced digital job hazard analyses that decreased incident reports by 22%.',
      ],
    },
    {
      company: 'Gridworks Construction',
      role: 'Electrical Foreman',
      period: '2016 — 2020',
      highlights: [
        'Oversaw installation of switchgear and MCCs for two 500,000 sq ft logistics centers.',
        'Developed bilingual onboarding playbook adopted across three regional offices.',
      ],
    },
    {
      company: 'Lighthouse Industrial Services',
      role: 'Journeyman Electrician',
      period: '2012 — 2016',
      highlights: [
        'Performed terminations and testing on MV cable pulls ranging from 5kV to 15kV.',
        'Supported QA/QC walkdowns and redlined drawings for engineering updates.',
      ],
    },
  ],
  contact: {
    phone: '(832) 555-0198',
  },
  reviewSummary: {
    averageRating: 4.8,
    totalReviews: 42,
    positivePercent: 92,
    negativePercent: 8,
    lastUpdated: 'Updated May 2024',
  },
}

export const usePublicProfile = (username: string) => {
  return useQuery({
    queryKey: ['public-profile', username],
    queryFn: async (): Promise<PublicProfile> => {
      // TODO: Replace with API call when backend is ready.
      return fallbackProfile
    },
    placeholderData: fallbackProfile,
    enabled: Boolean(username),
  })
}
