import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function importJobs() {
  console.log('Fetching job feeds...')

  const { data: feeds, error: feedsError } = await supabase
    .from('external_job_feeds')
    .select('*')
    .eq('is_active', true)

  if (feedsError) {
    console.error('Error fetching feeds:', feedsError)
    return
  }

  console.log(`Found ${feeds?.length || 0} active feeds`)

  for (const feed of feeds || []) {
    console.log(`\nProcessing feed: ${feed.name}`)
    console.log(`URL: ${feed.url}`)

    try {
      const response = await fetch(feed.url)
      const xml = await response.text()

      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
      console.log(`Found ${items.length} jobs in feed`)

      let imported = 0
      for (const item of items.slice(0, 5)) {
        // Import first 5 for testing
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

        // Extract company/title
        const titleParts = title.split(': ')
        const company_name = titleParts.length > 1 ? titleParts[0].trim() : undefined
        const job_title = titleParts.length > 1 ? titleParts.slice(1).join(': ').trim() : title

        const { error: insertError } = await supabase.from('external_jobs').upsert(
          {
            feed_id: feed.id,
            external_guid: link,
            title: job_title,
            company_name,
            job_location: 'Remote',
            description: description.replace(/<[^>]*>/g, '').substring(0, 500),
            posted_date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            application_url: link,
            external_url: link,
            raw_data: { title, link, description, pubDate },
          },
          {
            onConflict: 'feed_id,external_guid',
          }
        )

        if (insertError) {
          console.error('Insert error:', insertError)
        } else {
          imported++
        }
      }

      console.log(`✓ Imported ${imported} jobs from ${feed.name}`)

      // Update last_fetched_at
      await supabase
        .from('external_job_feeds')
        .update({ last_fetched_at: new Date().toISOString() })
        .eq('id', feed.id)
    } catch (error) {
      console.error(`Error processing feed:`, error)
    }
  }

  // Check total jobs
  const { count } = await supabase.from('external_jobs').select('*', { count: 'exact', head: true })

  console.log(`\n✓ Total jobs in database: ${count}`)
}

importJobs().catch(console.error)
