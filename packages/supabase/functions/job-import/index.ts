import { serve } from 'https://deno.land/std@0.168.0/http/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../_shared/database.types.ts'

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
}

interface JobData {
  feed_id: string
  external_id: string
  title: string
  company_name?: string
  company_logo?: string
  job_location?: string
  job_type?: string
  job_category?: string
  description?: string
  compensation_min?: number
  compensation_max?: number
  compensation_currency?: string
  posted_date?: string
  application_url: string
  external_url: string
  raw_data: Record<string, unknown>
}

// Parse RSS feed
async function parseRSSFeed(url: string): Promise<JobData[]> {
  try {
    const response = await fetch(url)
    const xml = await response.text()

    // Simple XML parsing for RSS
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []

    const jobs: JobData[] = []

    for (const item of items) {
      // Extract fields
      const title =
        item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
        item.match(/<title>(.*?)<\/title>/)?.[1] ||
        ''

      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
      const description =
        item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
        item.match(/<description>(.*?)<\/description>/)?.[1] ||
        ''
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''

      // Extract category/company from title (WeWorkRemotely format: "Company: Title")
      const titleParts = title.split(': ')
      const company_name = titleParts.length > 1 ? titleParts[0].trim() : undefined
      const job_title = titleParts.length > 1 ? titleParts.slice(1).join(': ').trim() : title

      // Extract location from description if available
      const locationMatch = description.match(/location:?\s*([^<]+)/i)
      const job_location = locationMatch ? locationMatch[1].trim() : 'Remote'

      jobs.push({
        feed_id: 'weworkremotely',
        external_id: link,
        title: job_title,
        company_name,
        job_location,
        description: description.replace(/<[^>]*>/g, '').trim(),
        posted_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        application_url: link,
        external_url: link,
        raw_data: {
          title,
          link,
          description,
          pubDate,
        },
      })
    }

    return jobs
  } catch (error) {
    console.error('Error parsing RSS feed:', error)
    return []
  }
}

// Map job to industry
function mapJobToIndustry(job: JobData): string | null {
  const text = `${job.title} ${job.description} ${job.job_category || ''}`.toLowerCase()

  // Industry keywords
  const industries = {
    Construction: ['construction', 'builder', 'contractor', 'building'],
    Electrical: ['electrician', 'electrical', 'wiring', 'power'],
    Plumbing: ['plumber', 'plumbing', 'pipe', 'drain'],
    HVAC: ['hvac', 'heating', 'cooling', 'ventilation', 'air conditioning'],
    Carpentry: ['carpenter', 'carpentry', 'woodwork', 'framing'],
    Roofing: ['roofer', 'roofing', 'shingle'],
    Software: ['software', 'developer', 'engineer', 'programmer', 'coding'],
    Design: ['designer', 'design', 'ux', 'ui', 'graphic'],
  }

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return industry
    }
  }

  return null
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY') ?? ''
    )

    // Get active feeds
    const { data: feeds, error: feedsError } = await supabase
      .schema('core')
      .from('external_job_feeds')
      .select('*')
      .eq('is_active', true)

    if (feedsError) throw feedsError

    console.log(`Processing ${feeds?.length || 0} feeds`)

    const results = {
      processed: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
    }

    for (const feed of feeds || []) {
      try {
        console.log(`Processing feed: ${feed.name} (${feed.url})`)

        // Parse feed based on type
        let jobs: JobData[] = []

        if (feed.feed_type === 'rss') {
          jobs = await parseRSSFeed(feed.url)
        }

        console.log(`Found ${jobs.length} jobs in feed`)
        results.processed += jobs.length

        // Process each job
        for (const job of jobs) {
          try {
            // Map to industry
            const industry = mapJobToIndustry(job)

            // Skip if no industry match
            if (!industry && feed.require_industry_match) {
              results.skipped++
              continue
            }

            // Get industry ID
            let industryId: string | null = null
            if (industry) {
              const { data: industryData } = await supabase
                .schema('core')
                .from('industries')
                .select('id')
                .eq('name', industry)
                .single()

              industryId = industryData?.id || null
            }

            // Insert job
            const { data: insertedJob, error: insertError } = await supabase
              .schema('core')
              .from('external_jobs')
              .upsert(
                {
                  feed_id: feed.id,
                  external_guid: job.external_id,
                  title: job.title,
                  company_name: job.company_name,
                  company_logo: job.company_logo,
                  job_location: job.job_location,
                  job_type: job.job_type,
                  job_category: job.job_category,
                  description: job.description,
                  compensation_min: job.compensation_min,
                  compensation_max: job.compensation_max,
                  compensation_currency: job.compensation_currency,
                  posted_date: job.posted_date,
                  application_url: job.application_url,
                  external_url: job.external_url,
                  raw_data: job.raw_data,
                },
                {
                  onConflict: 'feed_id,external_guid',
                  ignoreDuplicates: false,
                }
              )
              .select()
              .single()

            if (insertError) {
              console.error('Insert error:', insertError)
              results.errors++
            } else {
              results.imported++

              // Map to industry if found
              if (industryId && insertedJob) {
                await supabase.schema('core').from('external_job_industries').upsert(
                  {
                    external_job_id: insertedJob.id,
                    industry_id: industryId,
                    confidence_score: 0.8,
                    mapped_by: 'rule',
                  },
                  {
                    onConflict: 'external_job_id,industry_id',
                    ignoreDuplicates: true,
                  }
                )
              }
            }
          } catch (jobError) {
            console.error('Error processing job:', jobError)
            results.errors++
          }
        }

        // Update feed last_fetched_at
        await supabase
          .schema('core')
          .from('external_job_feeds')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', feed.id)
      } catch (feedError) {
        console.error(`Error processing feed ${feed.name}:`, feedError)
        results.errors++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
