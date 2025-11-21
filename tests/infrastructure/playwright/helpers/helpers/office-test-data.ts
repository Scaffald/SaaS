import type { TestInfo } from '@playwright/test'

/**
 * Seed-aware Office Test Data Generators
 *
 * Provides deterministic test fixtures for Playwright suites so that
 * parallel workers can safely share expectations without random drift.
 */

type SeedConfig = {
  seed?: string | number
  scope?: string
  workerIndex?: number
  projectName?: string
}

type OrganizationData = {
  name: string
  slug: string
  description: string
  industry: string
  website: string
  phone: string
  email: string
  address: ReturnType<OfficeTestDataGenerator['generateRandomAddress']>
}

type JobData = {
  title: string
  description: string
  location: string
  salary: { min: number; max: number; currency: string }
  type: string
  experience: string
  education: string
}

type UniversityData = {
  name: string
  slug: string
  country: string
  state: string
  alphaCode: string
  domains: string[]
  webPages: string[]
}

type UserProfileData = {
  firstName: string
  lastName: string
  email: string
  phone: string
  bio: string
  address: ReturnType<OfficeTestDataGenerator['generateRandomAddress']>
  userTypes: string[]
  industry: string
}

type ApplicationData = {
  candidateName: string
  jobTitle: string
  status: string
  appliedDate: Date
  score: number
  notes: string
}

type JobOverrides = Partial<JobData> & { titlePrefix?: string }
type OrganizationOverrides = Partial<OrganizationData>
type UniversityOverrides = Partial<UniversityData>
type UserProfileOverrides = Partial<UserProfileData>
type ApplicationOverrides = Partial<ApplicationData>

type NumberGenerator = () => number

function hashSeed(input: string | number): number {
  const text = String(input)
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) || 1
}

function createMulberry32(seed: number): NumberGenerator {
  return () => {
    seed += 0x6d2b79f5
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function normalizeSeed(config: SeedConfig): number {
  const parts = [
    config.seed ?? 'office',
    config.projectName ?? 'pw',
    config.workerIndex ?? 0,
    config.scope ?? 'default',
  ]
  return hashSeed(parts.join(':'))
}

function buildScopeLabel(config: SeedConfig): string {
  const parts = [config.projectName ?? 'pw', config.workerIndex ?? 0, config.scope ?? 'suite']
  return parts.join('-')
}

export class OfficeTestDataGenerator {
  private readonly rng: NumberGenerator

  private sequence = 0

  private readonly scopeLabel: string

  constructor(config: SeedConfig = {}) {
    this.rng = createMulberry32(normalizeSeed(config))
    this.scopeLabel = buildScopeLabel(config)
  }

  private nextInt(min: number, max: number): number {
    const value = this.rng()
    return Math.floor(value * (max - min + 1)) + min
  }

  private pick<T>(items: T[]): T {
    return items[this.nextInt(0, items.length - 1)]
  }

  private nextIdentifier(prefix: string): string {
    this.sequence += 1
    const suffix = `${this.scopeLabel}-${this.sequence.toString().padStart(3, '0')}`
    const random = this.nextInt(1000, 9999)
    return `${prefix}-${suffix}-${random}`
  }

  generateRandomFirstName(): string {
    const firstNames = [
      'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey',
      'Riley', 'Cameron', 'Avery', 'Quinn', 'Sage',
      'Dakota', 'Reese', 'Skyler', 'Phoenix', 'River',
      'Rowan', 'Jamie', 'Charlie', 'Blake', 'Drew',
    ]
    return this.pick(firstNames)
  }

  generateRandomLastName(): string {
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
      'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
      'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    ]
    return this.pick(lastNames)
  }

  generateRandomName(): { firstName: string; lastName: string; fullName: string } {
    const firstName = this.generateRandomFirstName()
    const lastName = this.generateRandomLastName()
    return {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
    }
  }

  generateRandomEmail(prefix?: string): string {
    const domain = this.pick(['example.com', 'test.com', 'demo.com'])
    const name = prefix ?? this.nextIdentifier('user')
    return `${name}@${domain}`
  }

  generateRandomPhone(): string {
    const areaCode = this.nextInt(200, 999)
    const exchange = this.nextInt(200, 999)
    const number = this.nextInt(1000, 9999)
    return `(${areaCode}) ${exchange}-${number}`
  }

  generateRandomAddress(): {
    street: string
    city: string
    state: string
    zip: string
    full: string
  } {
    const streetNumber = this.nextInt(100, 9999)
    const streetNames = [
      'Main St', 'Oak Ave', 'Maple Dr', 'Park Blvd', 'Cedar Ln',
      'Pine St', 'Elm Ave', 'Washington St', 'Lake Dr', 'Hill Rd',
    ]
    const cities = [
      'Springfield', 'Riverside', 'Fairview', 'Madison', 'Georgetown',
      'Arlington', 'Salem', 'Franklin', 'Clinton', 'Bristol',
    ]
    const states = [
      'CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI',
    ]

    const street = `${streetNumber} ${this.pick(streetNames)}`
    const city = this.pick(cities)
    const state = this.pick(states)
    const zip = `${this.nextInt(10000, 99999)}`

    return {
      street,
      city,
      state,
      zip,
      full: `${street}, ${city}, ${state} ${zip}`,
    }
  }

  generateOrganizationData(overrides: OrganizationOverrides = {}): OrganizationData {
    const adjectives = ['Advanced', 'Premier', 'Quality', 'Expert', 'Professional', 'Elite']
    const types = ['Construction', 'Builders', 'Contractors', 'Services', 'Solutions', 'Group']

    const adj = this.pick(adjectives)
    const type = this.pick(types)
    const name = overrides.name ?? `${adj} ${type}`
    const slug = (overrides.slug ?? name.toLowerCase().replace(/\s+/g, '-')).slice(0, 50)

    const industries = [
      'Construction',
      'Manufacturing',
      'Transportation',
      'Energy & Utilities',
      'Healthcare',
    ]

    return {
      name,
      slug,
      description: overrides.description ?? `${name} is a leading company in the industry.`,
      industry: overrides.industry ?? this.pick(industries),
      website: overrides.website ?? `https://www.${slug}.com`,
      phone: overrides.phone ?? this.generateRandomPhone(),
      email: overrides.email ?? this.generateRandomEmail(slug),
      address: overrides.address ?? this.generateRandomAddress(),
    }
  }

  generateJobData(overrides: JobOverrides = {}): JobData {
    const titles = [
      'Construction Manager',
      'Project Manager',
      'Site Supervisor',
      'Electrician',
      'Plumber',
      'Carpenter',
      'Heavy Equipment Operator',
      'Safety Coordinator',
      'Estimator',
      'Foreman',
    ]

    const types = ['Full-time', 'Part-time', 'Contract', 'Temporary']
    const experiences = ['Entry Level', '1-3 years', '3-5 years', '5+ years']
    const educations = [
      'High School Diploma',
      'Trade School Certificate',
      'Associate Degree',
      "Bachelor's Degree",
    ]

    const address = this.generateRandomAddress()

    const minSalary = (overrides.salary?.min ?? this.nextInt(40, 80) * 1000)
    const maxSalary = overrides.salary?.max ?? minSalary + this.nextInt(10, 30) * 1000

    const defaultTitle = `${overrides.titlePrefix ?? 'Test Job'} ${this.nextIdentifier('job')}`
    const title = overrides.title ?? defaultTitle

    return {
      title,
      description: overrides.description ?? `We are seeking a qualified ${title} to join our team. This is an excellent opportunity for experienced professionals.`,
      location: overrides.location ?? `${address.city}, ${address.state}`,
      salary: overrides.salary ?? {
        min: minSalary,
        max: maxSalary,
        currency: 'USD',
      },
      type: overrides.type ?? this.pick(types),
      experience: overrides.experience ?? this.pick(experiences),
      education: overrides.education ?? this.pick(educations),
    }
  }

  generateUniversityData(overrides: UniversityOverrides = {}): UniversityData {
    const types = ['State', 'Tech', 'Community', 'Regional']
    const suffixes = ['University', 'College', 'Institute', 'Academy']

    const address = this.generateRandomAddress()
    const type = this.pick(types)
    const suffix = this.pick(suffixes)
    const name = overrides.name ?? `${address.city} ${type} ${suffix}`
    const slug = overrides.slug ?? name.toLowerCase().replace(/\s+/g, '-')

    const domain = `${slug}.edu`

    return {
      name,
      slug,
      country: overrides.country ?? 'United States',
      state: overrides.state ?? address.state,
      alphaCode: overrides.alphaCode ?? 'US',
      domains: overrides.domains ?? [domain],
      webPages: overrides.webPages ?? [`https://www.${domain}`],
    }
  }

  generateUserProfileData(overrides: UserProfileOverrides = {}): UserProfileData {
    const { firstName, lastName } = this.generateRandomName()
    const userTypes = overrides.userTypes ?? this.pick([
      ['worker'],
      ['employer'],
      ['worker', 'employer'],
    ])

    const industries = [
      'Construction',
      'Manufacturing',
      'Transportation',
      'Energy & Utilities',
    ]

    return {
      firstName: overrides.firstName ?? firstName,
      lastName: overrides.lastName ?? lastName,
      email: overrides.email ?? this.generateRandomEmail(`${firstName}.${lastName}`.toLowerCase()),
      phone: overrides.phone ?? this.generateRandomPhone(),
      bio: overrides.bio ?? `Experienced professional in the ${this.pick(industries)} industry.`,
      address: overrides.address ?? this.generateRandomAddress(),
      userTypes,
      industry: overrides.industry ?? this.pick(industries),
    }
  }

  generateApplicationData(overrides: ApplicationOverrides = {}): ApplicationData {
    const { fullName } = this.generateRandomName()
    const { title } = this.generateJobData({ titlePrefix: 'Candidate Job' })

    const statuses = ['new', 'screen', 'interview', 'offer', 'hired', 'rejected']
    const score = overrides.score ?? this.nextInt(60, 100)

    return {
      candidateName: overrides.candidateName ?? fullName,
      jobTitle: overrides.jobTitle ?? title,
      status: overrides.status ?? this.pick(statuses),
      appliedDate: overrides.appliedDate ?? new Date(2020, 0, this.nextInt(1, 28)),
      score,
      notes: overrides.notes ?? `Test application for ${fullName}`,
    }
  }

  generateTestData(type: 'organization' | 'job' | 'university' | 'user' | 'application'): unknown {
    switch (type) {
      case 'organization':
        return this.generateOrganizationData()
      case 'job':
        return this.generateJobData()
      case 'university':
        return this.generateUniversityData()
    case 'user':
      return this.generateUserProfileData()
    case 'application':
      return this.generateApplicationData()
    default:
      throw new Error(`Unknown test data type: ${String(type)}`)
  }
}

  generateTestId(prefix = 'test'): string {
    return this.nextIdentifier(prefix)
  }

  generateLoremIpsum(words = 50): string {
    const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`

    const wordsArray = lorem.split(' ')
    const selectedWords = []

    for (let i = 0; i < words; i += 1) {
      selectedWords.push(wordsArray[i % wordsArray.length])
    }

    return selectedWords.join(' ')
  }

  generateTimestamp(): string {
    const year = 2020 + this.nextInt(0, 4)
    const month = this.nextInt(0, 11)
    const day = this.nextInt(1, 28)
    const hour = this.nextInt(0, 23)
    const minute = this.nextInt(0, 59)
    const second = this.nextInt(0, 59)
    const date = new Date(Date.UTC(year, month, day, hour, minute, second))
    return date.toISOString().replace(/[:.]/g, '-').slice(0, -5)
  }

  async randomDelay(minMs = 100, maxMs = 500): Promise<void> {
    const delay = this.nextInt(minMs, maxMs)
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

export function createOfficeTestDataGenerator(config: SeedConfig = {}): OfficeTestDataGenerator {
  return new OfficeTestDataGenerator(config)
}

export function createGeneratorFromTestInfo(testInfo: Pick<TestInfo, 'workerIndex' | 'project' | 'title'>, seed?: string | number) {
  return createOfficeTestDataGenerator({
    seed: seed ?? process.env.PLAYWRIGHT_SEED ?? 'office',
    workerIndex: testInfo.workerIndex,
    projectName: testInfo.project.name,
    scope: testInfo.title,
  })
}

const defaultGenerator = createOfficeTestDataGenerator({ seed: process.env.PLAYWRIGHT_SEED ?? 'office-default' })

export function generateJobData(options: (JobOverrides & { generator?: OfficeTestDataGenerator }) | undefined = {}) {
  const { generator = defaultGenerator, ...overrides } = options
  return generator.generateJobData(overrides)
}

export function generateOrganizationData(options: (OrganizationOverrides & { generator?: OfficeTestDataGenerator }) | undefined = {}) {
  const { generator = defaultGenerator, ...overrides } = options
  return generator.generateOrganizationData(overrides)
}

export function generateUniversityData(options: (UniversityOverrides & { generator?: OfficeTestDataGenerator }) | undefined = {}) {
  const { generator = defaultGenerator, ...overrides } = options
  return generator.generateUniversityData(overrides)
}

export function generateUserProfileData(options: (UserProfileOverrides & { generator?: OfficeTestDataGenerator }) | undefined = {}) {
  const { generator = defaultGenerator, ...overrides } = options
  return generator.generateUserProfileData(overrides)
}

export function generateApplicationData(options: (ApplicationOverrides & { generator?: OfficeTestDataGenerator }) | undefined = {}) {
  const { generator = defaultGenerator, ...overrides } = options
  return generator.generateApplicationData(overrides)
}

export function generateTestData(type: 'organization' | 'job' | 'university' | 'user' | 'application', generator: OfficeTestDataGenerator = defaultGenerator) {
  return generator.generateTestData(type)
}

export function generateTestId(prefix = 'test', generator: OfficeTestDataGenerator = defaultGenerator): string {
  return generator.generateTestId(prefix)
}

export function generateLoremIpsum(words = 50, generator: OfficeTestDataGenerator = defaultGenerator): string {
  return generator.generateLoremIpsum(words)
}

export function generateTimestamp(generator: OfficeTestDataGenerator = defaultGenerator): string {
  return generator.generateTimestamp()
}

export async function randomDelay(minMs = 100, maxMs = 500, generator: OfficeTestDataGenerator = defaultGenerator): Promise<void> {
  await generator.randomDelay(minMs, maxMs)
}
