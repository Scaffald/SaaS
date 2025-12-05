/**
 * Enhanced job seeding script
 * Parses RSS feeds and extracts structured job data including
 * responsibilities, requirements, benefits, and more
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface ParsedJobData {
  title: string
  company_name: string
  description: string
  responsibilities: string[]
  requirements: string[]
  benefits: string[]
  job_location: string
  job_type: string | null
  job_category: string | null
  compensation_min: number | null
  compensation_max: number | null
  compensation_currency: string
  compensation_period: string | null
  company_website: string | null
}

/**
 * Parse job description to extract structured sections
 */
function parseJobDescription(description: string, title: string): ParsedJobData {
  // Clean HTML tags
  const cleanText = description
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Initialize result
  const result: ParsedJobData = {
    title,
    company_name: 'Unknown Company',
    description: cleanText.substring(0, 1000),
    responsibilities: [],
    requirements: [],
    benefits: [],
    job_location: 'Remote',
    job_type: null,
    job_category: null,
    compensation_min: null,
    compensation_max: null,
    compensation_currency: 'USD',
    compensation_period: null,
    company_website: null,
  }

  // Extract responsibilities
  const responsibilitiesMatch = cleanText.match(
    /(?:responsibilities|duties|you will|what you'll do)[:\s]+(.*?)(?=(?:requirements|qualifications|benefits|about|we offer|$))/is
  )
  if (responsibilitiesMatch) {
    result.responsibilities = extractBulletPoints(responsibilitiesMatch[1])
  }

  // Extract requirements/qualifications
  const requirementsMatch = cleanText.match(
    /(?:requirements|qualifications|what we're looking for|you have|you are|must have)[:\s]+(.*?)(?=(?:responsibilities|benefits|about|we offer|nice to have|$))/is
  )
  if (requirementsMatch) {
    result.requirements = extractBulletPoints(requirementsMatch[1])
  }

  // Extract benefits
  const benefitsMatch = cleanText.match(
    /(?:benefits|perks|we offer|what we offer|why join)[:\s]+(.*?)(?=(?:requirements|responsibilities|about|apply|$))/is
  )
  if (benefitsMatch) {
    result.benefits = extractBulletPoints(benefitsMatch[1])
  }

  // Extract compensation
  const compensationData = extractCompensation(cleanText)
  if (compensationData) {
    result.compensation_min = compensationData.min
    result.compensation_max = compensationData.max
    result.compensation_currency = compensationData.currency
    result.compensation_period = compensationData.period
  }

  // Extract location
  const locationMatch = cleanText.match(
    /(?:location|based in|office in)[:\s]+([^,.;]+(?:,\s*[A-Z]{2})?)/i
  )
  if (locationMatch) {
    result.job_location = locationMatch[1].trim()
  } else if (/remote/i.test(cleanText)) {
    result.job_location = 'Remote'
  }

  // Extract job type
  const jobTypeMatch = cleanText.match(
    /\b(full[- ]?time|part[- ]?time|contract|temporary|intern(?:ship)?)\b/i
  )
  if (jobTypeMatch) {
    const type = jobTypeMatch[1].toLowerCase().replace(/[-\s]/g, '_')
    result.job_type = type
  }

  // Extract company website
  const websiteMatch = cleanText.match(
    /(?:website|visit us|learn more)[:\s]+(?:at\s+)?(https?:\/\/[^\s,;)]+)/i
  )
  if (websiteMatch) {
    result.company_website = websiteMatch[1]
  }

  // Infer job category from title
  result.job_category = inferJobCategory(title)

  return result
}

/**
 * Extract bullet points from text
 */
function extractBulletPoints(text: string): string[] {
  const points: string[] = []

  // Try to find explicit bullet points
  const bulletMatches = text.match(/[•\-*]\s*([^•\-*\n]+)/g)
  if (bulletMatches && bulletMatches.length > 0) {
    points.push(
      ...bulletMatches.map((m) => m.replace(/^[•\-*]\s*/, '').trim()).filter((p) => p.length > 10)
    )
  }

  // If no bullet points, try to split by sentence and take meaningful ones
  if (points.length === 0) {
    const sentences = text
      .split(/[.;]\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 300)

    points.push(...sentences.slice(0, 5))
  }

  return points.filter((p) => p.length > 0).slice(0, 8) // Max 8 points
}

/**
 * Extract compensation information
 */
function extractCompensation(text: string): {
  min: number | null
  max: number | null
  currency: string
  period: string | null
} | null {
  // Look for salary patterns like "$60,000 - $80,000" or "$60k-$80k"
  const salaryPattern =
    /\$\s*(\d+)[,k]?\s*(?:[-–to]\s*\$?\s*(\d+)[,k]?)?(?:\s*(per\s+hour|\/hr|per\s+year|\/year|annually))?/i
  const match = text.match(salaryPattern)

  if (match) {
    const min = Number.parseInt(match[1], 10) * (match[1].includes('k') ? 1000 : 1)
    const max = match[2] ? Number.parseInt(match[2], 10) * (match[2].includes('k') ? 1000 : 1) : null
    const period = match[3] ? (match[3].includes('hour') ? 'hourly' : 'yearly') : 'yearly'

    return {
      min,
      max,
      currency: 'USD',
      period,
    }
  }

  return null
}

/**
 * Infer job category from title
 */
function inferJobCategory(title: string): string | null {
  const lowerTitle = title.toLowerCase()

  const categories: Record<string, string[]> = {
    Engineering: ['engineer', 'developer', 'programmer', 'architect', 'devops'],
    Design: ['designer', 'ux', 'ui', 'creative', 'graphic'],
    Product: ['product manager', 'product owner', 'pm'],
    Sales: ['sales', 'account executive', 'business development'],
    Marketing: ['marketing', 'seo', 'content', 'social media'],
    Operations: ['operations', 'logistics', 'coordinator'],
    Construction: [
      'foreman',
      'superintendent',
      'estimator',
      'project manager',
      'carpenter',
      'electrician',
      'plumber',
    ],
    Management: ['manager', 'director', 'vp', 'chief', 'head of'],
  }

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lowerTitle.includes(keyword))) {
      return category
    }
  }

  return null
}

/**
 * Parse company name from title
 */
function parseCompanyFromTitle(title: string): { company: string; jobTitle: string } {
  // Try pattern: "Company Name: Job Title"
  const colonPattern = /^(.+?):\s*(.+)$/
  const colonMatch = title.match(colonPattern)

  if (colonMatch) {
    return {
      company: colonMatch[1].trim(),
      jobTitle: colonMatch[2].trim(),
    }
  }

  // Try pattern: "Job Title at Company Name"
  const atPattern = /^(.+?)\s+at\s+(.+)$/i
  const atMatch = title.match(atPattern)

  if (atMatch) {
    return {
      company: atMatch[2].trim(),
      jobTitle: atMatch[1].trim(),
    }
  }

  // Default: use whole title as job title
  return {
    company: 'Unknown Company',
    jobTitle: title,
  }
}

/**
 * Seed jobs from RSS feeds
 */
export async function seedJobs(limit = 10) {
  console.log('\n💼 Seeding External Jobs with Enhanced Parsing...')

  const { data: feeds, error: feedsError } = await supabase
    .from('external_job_feeds')
    .select('*')
    .eq('is_active', true)

  if (feedsError) {
    // Table doesn't exist yet - this is expected if jobs feature hasn't been set up
    if (feedsError.code === 'PGRST205') {
      console.log('⏭️  Skipping external jobs seeding (external_job_feeds table not found)')
      console.log("   This is expected if the jobs feature hasn't been set up yet.")
      return 0
    }
    console.error('❌ Error fetching feeds:', feedsError)
    return 0
  }

  console.log(`   Found ${feeds?.length || 0} active job feeds`)

  let totalImported = 0

  for (const feed of feeds || []) {
    console.log(`\n   Processing: ${feed.name}`)

    try {
      const response = await fetch(feed.url)
      if (!response.ok) {
        console.error(`   ❌ Failed to fetch: ${response.statusText}`)
        continue
      }

      const xml = await response.text()
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []

      console.log(`   Found ${items.length} jobs in feed`)

      let imported = 0
      for (const item of items.slice(0, limit)) {
        // Extract raw data from RSS
        const rawTitle =
          item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
          item.match(/<title>(.*?)<\/title>/)?.[1] ||
          ''
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
        const rawDescription = item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || ''
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''

        // Extract category and type from RSS feed directly
        const feedCategory = item.match(/<category>(.*?)<\/category>/)?.[1] || null
        const feedType = item.match(/<type>(.*?)<\/type>/)?.[1] || null
        const feedRegion = item.match(/<region>(.*?)<\/region>/)?.[1] || null

        // Decode HTML entities in description
        const decodedDescription = rawDescription
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&amp;/g, '&')

        // Parse company name from title
        const { company, jobTitle } = parseCompanyFromTitle(rawTitle)

        // Parse job description with enhanced extraction
        const parsedData = parseJobDescription(decodedDescription, jobTitle)
        parsedData.company_name = company !== 'Unknown Company' ? company : parsedData.company_name
        parsedData.title = jobTitle

        // Override with RSS feed fields if available
        if (feedCategory) parsedData.job_category = feedCategory
        if (feedType) parsedData.job_type = feedType
        if (feedRegion && feedRegion !== 'Anywhere in the World') {
          parsedData.job_location = feedRegion
        }

        const { error: insertError } = await supabase.from('external_jobs').upsert(
          {
            feed_id: feed.id,
            external_guid: link,
            title: parsedData.title || 'Untitled Position',
            company_name: parsedData.company_name,
            job_location: parsedData.job_location,
            job_type: parsedData.job_type,
            job_category: parsedData.job_category,
            description: parsedData.description,
            responsibilities:
              parsedData.responsibilities.length > 0 ? parsedData.responsibilities : null,
            requirements: parsedData.requirements.length > 0 ? parsedData.requirements : null,
            benefits: parsedData.benefits.length > 0 ? parsedData.benefits : null,
            compensation_min: parsedData.compensation_min,
            compensation_max: parsedData.compensation_max,
            compensation_currency: parsedData.compensation_currency,
            compensation_period: parsedData.compensation_period,
            company_website: parsedData.company_website,
            posted_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            application_url: link,
            external_url: link,
            is_active: true,
            raw_data: {
              title: rawTitle,
              link,
              description: rawDescription,
              pubDate,
            },
          },
          {
            onConflict: 'feed_id,external_guid',
          }
        )

        if (insertError) {
          console.error('   ⚠️  Insert error:', insertError.message)
        } else {
          imported++
        }
      }

      console.log(`   ✅ Imported ${imported} jobs from ${feed.name}`)
      totalImported += imported

      // Update last_fetched_at
      await supabase
        .from('external_job_feeds')
        .update({
          last_fetched_at: new Date().toISOString(),
          last_success_at: new Date().toISOString(),
          error_count: 0,
        })
        .eq('id', feed.id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`   ❌ Error processing feed: ${errorMessage}`)

      // Update error info
      await supabase
        .from('external_job_feeds')
        .update({
          error_count: (feed.error_count || 0) + 1,
          last_error: errorMessage,
        })
        .eq('id', feed.id)
    }
  }

  return totalImported
}

// Allow running this script standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  seedJobs(10)
    .then((count) => {
      console.log(`\n✅ Successfully seeded ${count} jobs`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Error seeding jobs:', error)
      process.exit(1)
    })
}
