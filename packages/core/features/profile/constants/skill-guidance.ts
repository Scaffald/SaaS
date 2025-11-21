export type SkillTaxonomy = 'csi' | 'onet'

export interface SkillSuggestion {
  label: string
  taxonomy: SkillTaxonomy
  searchTerm?: string
}

export interface SkillGuidance {
  recommended: SkillSuggestion[]
  examples: SkillSuggestion[]
  tips: string[]
}

const defaultGuidance: SkillGuidance = {
  recommended: [
    { label: 'Project Scheduling', taxonomy: 'onet' },
    { label: 'Team Leadership', taxonomy: 'onet' },
    { label: 'OSHA Safety Compliance', taxonomy: 'csi', searchTerm: 'OSHA Safety' },
    { label: 'Blueprint Reading', taxonomy: 'csi' },
  ],
  examples: [
    { label: 'Jobsite Coordination', taxonomy: 'onet' },
    { label: 'Quality Control', taxonomy: 'onet' },
    { label: 'Equipment Operation', taxonomy: 'csi' },
  ],
  tips: [
    'Combine technical skills with leadership or communication abilities for balance.',
    'Highlight certifications or training tied to safety and productivity.',
    'Prioritize skills that match the roles you want next.',
  ],
}

export const SKILL_GUIDANCE_BY_INDUSTRY: Record<string, SkillGuidance> = {
  construction: {
    recommended: [
      { label: 'Blueprint Reading', taxonomy: 'csi' },
      { label: 'Jobsite Safety', taxonomy: 'csi', searchTerm: 'Jobsite Safety' },
      { label: 'Concrete Formwork', taxonomy: 'csi' },
      { label: 'Project Scheduling', taxonomy: 'onet' },
      { label: 'Crew Management', taxonomy: 'onet' },
    ],
    examples: [
      { label: 'OSHA 30 Certified', taxonomy: 'csi', searchTerm: 'OSHA 30' },
      { label: 'Quality Assurance', taxonomy: 'onet' },
      { label: 'Heavy Equipment Operation', taxonomy: 'csi' },
      { label: 'Cost Estimating', taxonomy: 'onet' },
    ],
    tips: [],
  },
  electrical: {
    recommended: [
      { label: 'National Electrical Code', taxonomy: 'csi', searchTerm: 'NEC' },
      { label: 'Panel Installation', taxonomy: 'csi' },
      { label: 'Troubleshooting', taxonomy: 'onet' },
      { label: 'Low Voltage Systems', taxonomy: 'csi' },
      { label: 'Project Documentation', taxonomy: 'onet' },
    ],
    examples: [
      { label: 'Motor Controls', taxonomy: 'csi' },
      { label: 'Blueprint Interpretation', taxonomy: 'onet' },
      { label: 'Energy Audits', taxonomy: 'onet' },
    ],
    tips: [
      'Call out specialty training such as fire alarm or controls certifications.',
      'Mention code updates you have mastered recently.',
      'Include troubleshooting skills to show breadth beyond installs.',
    ],
  },
  hvac: {
    recommended: [
      { label: 'EPA 608 Certification', taxonomy: 'csi', searchTerm: 'EPA 608' },
      { label: 'System Diagnostics', taxonomy: 'onet' },
      { label: 'Ductwork Fabrication', taxonomy: 'csi' },
      { label: 'Load Calculations', taxonomy: 'onet' },
      { label: 'Preventive Maintenance', taxonomy: 'onet' },
    ],
    examples: [
      { label: 'Chiller Maintenance', taxonomy: 'csi' },
      { label: 'Building Automation Systems', taxonomy: 'onet' },
      { label: 'Air Balancing', taxonomy: 'csi' },
    ],
    tips: [
      'List manufacturer trainings to show equipment familiarity.',
      'Pair troubleshooting skills with energy efficiency knowledge.',
      'Include digital controls experience for modern systems.',
    ],
  },
  plumbing: {
    recommended: [
      { label: 'Pipefitting', taxonomy: 'csi' },
      { label: 'Fixture Installation', taxonomy: 'csi' },
      { label: 'Backflow Prevention', taxonomy: 'onet' },
      { label: 'Blueprint Reading', taxonomy: 'onet' },
      { label: 'Hydronic Systems', taxonomy: 'csi' },
    ],
    examples: [
      { label: 'Gas Line Installation', taxonomy: 'csi' },
      { label: 'Drainage Systems', taxonomy: 'onet' },
      { label: 'Water Quality Testing', taxonomy: 'onet' },
    ],
    tips: [
      'Highlight licenses and journeyman/master status up front.',
      'Add inspection or testing skills to show quality focus.',
      'Mention customer-facing skills if you handle service calls.',
    ],
  },
}

export const getSkillGuidanceForIndustry = (industrySlug: string | undefined): SkillGuidance => {
  if (!industrySlug) {
    return defaultGuidance
  }

  return SKILL_GUIDANCE_BY_INDUSTRY[industrySlug] ?? defaultGuidance
}
