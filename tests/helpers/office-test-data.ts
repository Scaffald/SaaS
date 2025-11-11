/**
 * Office Test Data Generators
 *
 * Provides utilities for generating randomized test data
 */

/**
 * Generate a random number between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Pick a random item from an array
 */
function randomItem<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)]
}

/**
 * Generate a random timestamp for recent dates
 */
function randomRecentDate(daysAgo = 30): Date {
  const now = Date.now()
  const offset = randomInt(0, daysAgo * 24 * 60 * 60 * 1000)
  return new Date(now - offset)
}

/**
 * Generate a random first name
 */
export function generateRandomFirstName(): string {
  const firstNames = [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey',
    'Riley', 'Cameron', 'Avery', 'Quinn', 'Sage',
    'Dakota', 'Reese', 'Skyler', 'Phoenix', 'River',
    'Rowan', 'Jamie', 'Charlie', 'Blake', 'Drew',
  ]
  return randomItem(firstNames)
}

/**
 * Generate a random last name
 */
export function generateRandomLastName(): string {
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
    'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
    'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  ]
  return randomItem(lastNames)
}

/**
 * Generate a random full name
 */
export function generateRandomName(): { firstName: string; lastName: string; fullName: string } {
  const firstName = generateRandomFirstName()
  const lastName = generateRandomLastName()
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
  }
}

/**
 * Generate a random email address
 */
export function generateRandomEmail(prefix?: string): string {
  const timestamp = Date.now()
  const random = randomInt(1000, 9999)
  const domain = randomItem(['example.com', 'test.com', 'demo.com'])
  const name = prefix || `test${timestamp}${random}`
  return `${name}@${domain}`
}

/**
 * Generate a random phone number (US format)
 */
export function generateRandomPhone(): string {
  const areaCode = randomInt(200, 999)
  const exchange = randomInt(200, 999)
  const number = randomInt(1000, 9999)
  return `(${areaCode}) ${exchange}-${number}`
}

/**
 * Generate a random address
 */
export function generateRandomAddress(): {
  street: string
  city: string
  state: string
  zip: string
  full: string
} {
  const streetNumber = randomInt(100, 9999)
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

  const street = `${streetNumber} ${randomItem(streetNames)}`
  const city = randomItem(cities)
  const state = randomItem(states)
  const zip = `${randomInt(10000, 99999)}`

  return {
    street,
    city,
    state,
    zip,
    full: `${street}, ${city}, ${state} ${zip}`,
  }
}

/**
 * Generate random organization data
 */
export function generateOrganizationData(): {
  name: string
  slug: string
  description: string
  industry: string
  website: string
  phone: string
  email: string
  address: ReturnType<typeof generateRandomAddress>
} {
  const adjectives = ['Advanced', 'Premier', 'Quality', 'Expert', 'Professional', 'Elite']
  const types = ['Construction', 'Builders', 'Contractors', 'Services', 'Solutions', 'Group']

  const adj = randomItem(adjectives)
  const type = randomItem(types)
  const name = `${adj} ${type}`
  const slug = name.toLowerCase().replace(/\s+/g, '-')

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
    description: `${name} is a leading company in the industry.`,
    industry: randomItem(industries),
    website: `https://www.${slug}.com`,
    phone: generateRandomPhone(),
    email: generateRandomEmail(slug),
    address: generateRandomAddress(),
  }
}

/**
 * Generate random job data
 */
export function generateJobData(): {
  title: string
  description: string
  location: string
  salary: { min: number; max: number; currency: string }
  type: string
  experience: string
  education: string
} {
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
    'Bachelor\'s Degree',
  ]

  const title = randomItem(titles)
  const address = generateRandomAddress()

  const minSalary = randomInt(40, 80) * 1000
  const maxSalary = minSalary + randomInt(10, 30) * 1000

  return {
    title,
    description: `We are seeking a qualified ${title} to join our team. This is an excellent opportunity for experienced professionals.`,
    location: `${address.city}, ${address.state}`,
    salary: {
      min: minSalary,
      max: maxSalary,
      currency: 'USD',
    },
    type: randomItem(types),
    experience: randomItem(experiences),
    education: randomItem(educations),
  }
}

/**
 * Generate random university data
 */
export function generateUniversityData(): {
  name: string
  slug: string
  country: string
  state: string
  alphaCode: string
  domains: string[]
  webPages: string[]
} {
  const types = ['State', 'Tech', 'Community', 'Regional']
  const suffixes = ['University', 'College', 'Institute', 'Academy']

  const address = generateRandomAddress()
  const type = randomItem(types)
  const suffix = randomItem(suffixes)
  const name = `${address.city} ${type} ${suffix}`
  const slug = name.toLowerCase().replace(/\s+/g, '-')

  const domain = `${slug}.edu`

  return {
    name,
    slug,
    country: 'United States',
    state: address.state,
    alphaCode: 'US',
    domains: [domain],
    webPages: [`https://www.${domain}`],
  }
}

/**
 * Generate random user profile data
 */
export function generateUserProfileData(): {
  firstName: string
  lastName: string
  email: string
  phone: string
  bio: string
  address: ReturnType<typeof generateRandomAddress>
  userTypes: string[]
  industry: string
} {
  const { firstName, lastName } = generateRandomName()
  const userTypes = randomItem([
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
    firstName,
    lastName,
    email: generateRandomEmail(`${firstName}.${lastName}`.toLowerCase()),
    phone: generateRandomPhone(),
    bio: `Experienced professional in the ${randomItem(industries)} industry.`,
    address: generateRandomAddress(),
    userTypes,
    industry: randomItem(industries),
  }
}

/**
 * Generate random application data
 */
export function generateApplicationData(): {
  candidateName: string
  jobTitle: string
  status: string
  appliedDate: Date
  score: number
  notes: string
} {
  const { fullName } = generateRandomName()
  const { title } = generateJobData()

  const statuses = ['new', 'screen', 'interview', 'offer', 'hired', 'rejected']
  const score = randomInt(60, 100)

  return {
    candidateName: fullName,
    jobTitle: title,
    status: randomItem(statuses),
    appliedDate: randomRecentDate(60),
    score,
    notes: `Test application for ${fullName}`,
  }
}

/**
 * Generate test data based on entity type
 */
export function generateTestData(type: 'organization' | 'job' | 'university' | 'user' | 'application') {
  switch (type) {
    case 'organization':
      return generateOrganizationData()
    case 'job':
      return generateJobData()
    case 'university':
      return generateUniversityData()
    case 'user':
      return generateUserProfileData()
    case 'application':
      return generateApplicationData()
    default:
      throw new Error(`Unknown test data type: ${type}`)
  }
}

/**
 * Generate a unique ID for test data
 */
export function generateTestId(prefix = 'test'): string {
  const timestamp = Date.now()
  const random = randomInt(1000, 9999)
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Generate Lorem Ipsum text
 */
export function generateLoremIpsum(words = 50): string {
  const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`

  const wordsArray = lorem.split(' ')
  const selectedWords = []

  for (let i = 0; i < words; i++) {
    selectedWords.push(wordsArray[i % wordsArray.length])
  }

  return selectedWords.join(' ')
}

/**
 * Generate a timestamp string for filenames
 */
export function generateTimestamp(): string {
  const now = new Date()
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5)
}

/**
 * Wait for a random duration (simulates human interaction)
 */
export async function randomDelay(minMs = 100, maxMs = 500): Promise<void> {
  const delay = randomInt(minMs, maxMs)
  await new Promise(resolve => setTimeout(resolve, delay))
}
