// @ts-nocheck
// Industry keyword mappings for job classification
// Keywords are matched case-insensitively against job title, description, and category

export interface IndustryKeywordConfig {
  industry_slug: string
  keywords: string[]
  negative_keywords?: string[] // Keywords that exclude this industry
  required_keywords?: string[] // All required keywords must be present
  weight: number // Higher weight = higher priority when multiple matches
}

// Construction and Trades industries
export const INDUSTRY_KEYWORDS: IndustryKeywordConfig[] = [
  {
    industry_slug: 'construction',
    keywords: [
      'construction',
      'builder',
      'building',
      'contractor',
      'subcontractor',
      'general contractor',
      'superintendent',
      'project manager construction',
      'construction manager',
      'site supervisor',
      'construction worker',
      'laborer',
      'heavy equipment',
      'excavation',
      'demolition',
      'framing',
      'concrete',
      'masonry',
      'steel work',
      'structural',
    ],
    weight: 10,
  },
  {
    industry_slug: 'carpentry',
    keywords: [
      'carpenter',
      'carpentry',
      'woodworking',
      'cabinet maker',
      'finish carpenter',
      'rough carpenter',
      'framer',
      'trim carpenter',
      'joiner',
    ],
    weight: 9,
  },
  {
    industry_slug: 'electrical',
    keywords: [
      'electrician',
      'electrical',
      'electric',
      'wiring',
      'electrical contractor',
      'journeyman electrician',
      'master electrician',
      'electrical engineer',
      'lighting',
      'power systems',
    ],
    weight: 9,
  },
  {
    industry_slug: 'plumbing',
    keywords: [
      'plumber',
      'plumbing',
      'pipefitter',
      'pipe fitter',
      'drain',
      'sewer',
      'water systems',
      'hvac plumber',
      'journeyman plumber',
      'master plumber',
    ],
    weight: 9,
  },
  {
    industry_slug: 'hvac',
    keywords: [
      'hvac',
      'heating',
      'ventilation',
      'air conditioning',
      'refrigeration',
      'hvac technician',
      'hvac installer',
      'hvac mechanic',
      'climate control',
    ],
    weight: 9,
  },
  {
    industry_slug: 'roofing',
    keywords: [
      'roofer',
      'roofing',
      'roof installer',
      'roof repair',
      'shingle',
      'roofing contractor',
    ],
    weight: 8,
  },
  {
    industry_slug: 'flooring',
    keywords: [
      'flooring',
      'floor installer',
      'tile setter',
      'hardwood floor',
      'carpet installer',
      'laminate',
      'vinyl floor',
    ],
    weight: 8,
  },
  {
    industry_slug: 'painting',
    keywords: [
      'painter',
      'painting',
      'paint contractor',
      'interior painter',
      'exterior painter',
      'drywall finisher',
    ],
    weight: 7,
  },
  {
    industry_slug: 'landscaping',
    keywords: [
      'landscaping',
      'landscaper',
      'lawn care',
      'groundskeeper',
      'horticulture',
      'irrigation',
      'tree service',
      'arborist',
    ],
    weight: 7,
  },
  {
    industry_slug: 'welding',
    keywords: [
      'welder',
      'welding',
      'fabrication',
      'metal fabrication',
      'certified welder',
      'tig welder',
      'mig welder',
      'pipe welder',
    ],
    weight: 8,
  },
  {
    industry_slug: 'software',
    keywords: [
      'software engineer',
      'developer',
      'programmer',
      'software developer',
      'full stack',
      'frontend',
      'backend',
      'mobile developer',
      'web developer',
      'devops',
      'software architect',
    ],
    negative_keywords: ['construction software', 'building software'],
    weight: 8,
  },
  {
    industry_slug: 'healthcare',
    keywords: [
      'nurse',
      'doctor',
      'physician',
      'medical',
      'healthcare',
      'hospital',
      'clinic',
      'patient care',
      'rn',
      'lpn',
      'cna',
      'medical assistant',
    ],
    weight: 8,
  },
  {
    industry_slug: 'manufacturing',
    keywords: [
      'manufacturing',
      'machinist',
      'cnc operator',
      'production',
      'assembly',
      'quality control',
      'factory',
      'industrial',
      'machine operator',
    ],
    weight: 7,
  },
  {
    industry_slug: 'automotive',
    keywords: [
      'automotive',
      'mechanic',
      'auto technician',
      'auto mechanic',
      'automotive technician',
      'car repair',
      'vehicle maintenance',
    ],
    weight: 7,
  },
  {
    industry_slug: 'engineering',
    keywords: [
      'civil engineer',
      'mechanical engineer',
      'structural engineer',
      'project engineer',
      'design engineer',
      'engineering',
    ],
    negative_keywords: ['software engineer'],
    weight: 8,
  },
  {
    industry_slug: 'architecture',
    keywords: [
      'architect',
      'architecture',
      'architectural designer',
      'draftsman',
      'cad designer',
      'building design',
    ],
    weight: 7,
  },
  {
    industry_slug: 'property_management',
    keywords: [
      'property manager',
      'property management',
      'facility manager',
      'building manager',
      'maintenance supervisor',
      'real estate',
    ],
    weight: 6,
  },
  {
    industry_slug: 'safety',
    keywords: [
      'safety officer',
      'safety manager',
      'hse',
      'health and safety',
      'safety coordinator',
      'osha',
      'safety inspector',
    ],
    weight: 7,
  },
]

// Helper function to normalize text for matching
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, ' ')
}

// Helper function to check if text contains keyword
export function containsKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalizeText(text)
  const normalizedKeyword = normalizeText(keyword)
  return normalizedText.includes(normalizedKeyword)
}

// Helper function to get industry by slug
export function getIndustryBySlug(slug: string): IndustryKeywordConfig | undefined {
  return INDUSTRY_KEYWORDS.find((config) => config.industry_slug === slug)
}
