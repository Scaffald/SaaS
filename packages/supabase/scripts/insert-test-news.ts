/**
 * Script to insert test news articles directly into the database
 * This bypasses the Edge Function import for testing purposes
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function insertTestNews() {
  console.log('📰 Inserting Test News Articles...\n')

  try {
    // Get construction industry ID
    const { data: industry, error: industryError } = await supabase
      .schema('core')
      .from('industries')
      .select('id')
      .eq('slug', 'construction')
      .single()

    if (industryError || !industry) {
      console.error('❌ Error finding Construction industry:', industryError)
      process.exit(1)
    }

    const industryId = industry.id
    console.log(`✓ Found Construction industry ID: ${industryId}\n`)

    // Get a feed ID to associate articles with
    const { data: feed, error: feedError } = await supabase
      .schema('core')
      .from('news_feeds')
      .select('id, name')
      .eq('industry_id', industryId)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (feedError || !feed) {
      console.error('❌ Error finding news feed:', feedError)
      console.error('💡 Make sure news feeds are seeded: pnpm supa:news:feeds')
      process.exit(1)
    }

    console.log(`✓ Using feed: ${feed.name} (${feed.id})\n`)

    // Insert test articles
    const testArticles = [
      {
        feed_id: feed.id,
        industry_id: industryId,
        guid: `test-article-1-${Date.now()}`,
        title: 'Construction Industry Sees Strong Growth in Q4 2024',
        description:
          'The construction sector continues to show robust growth with new infrastructure projects driving demand for skilled workers across multiple regions.',
        link: 'https://example.com/news/construction-growth-q4-2024',
        pub_date: new Date().toISOString(),
        source_name: feed.name,
      },
      {
        feed_id: feed.id,
        industry_id: industryId,
        guid: `test-article-2-${Date.now()}`,
        title: 'New Safety Regulations Take Effect for Construction Sites',
        description:
          'Updated OSHA guidelines require enhanced safety protocols on all construction sites, with emphasis on fall protection and equipment maintenance.',
        link: 'https://example.com/news/safety-regulations-2024',
        pub_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        source_name: feed.name,
      },
      {
        feed_id: feed.id,
        industry_id: industryId,
        guid: `test-article-3-${Date.now()}`,
        title: 'Technology Innovations Transforming Construction Industry',
        description:
          'From AI-powered project management to drone surveying, new technologies are revolutionizing how construction projects are planned and executed.',
        link: 'https://example.com/news/construction-technology-2024',
        pub_date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        source_name: feed.name,
      },
      {
        feed_id: feed.id,
        industry_id: industryId,
        guid: `test-article-4-${Date.now()}`,
        title: 'Workforce Development Programs Address Construction Labor Shortage',
        description:
          'New apprenticeship programs and training initiatives aim to attract more workers to the construction industry and address the ongoing labor shortage.',
        link: 'https://example.com/news/workforce-development-2024',
        pub_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        source_name: feed.name,
      },
      {
        feed_id: feed.id,
        industry_id: industryId,
        guid: `test-article-5-${Date.now()}`,
        title: 'Sustainable Building Materials Gain Traction in Construction',
        description:
          'Eco-friendly materials and green building practices are becoming standard as the industry moves toward more sustainable construction methods.',
        link: 'https://example.com/news/sustainable-materials-2024',
        pub_date: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
        source_name: feed.name,
      },
    ]

    console.log(`Inserting ${testArticles.length} test articles...\n`)

    let inserted = 0
    let errors = 0

    for (const article of testArticles) {
      const { error: insertError } = await supabase
        .schema('core')
        .from('cached_news_articles')
        .upsert(article, {
          onConflict: 'feed_id,guid',
          ignoreDuplicates: false,
        })

      if (insertError) {
        console.error(`❌ Error inserting article "${article.title}":`, insertError.message)
        errors++
      } else {
        console.log(`✓ Inserted: ${article.title}`)
        inserted++
      }
    }

    console.log(`\n=== Summary ===`)
    console.log(`Inserted: ${inserted}`)
    console.log(`Errors: ${errors}`)
    console.log(`Total: ${testArticles.length}`)

    // Verify the count
    const { count } = await supabase
      .schema('core')
      .from('cached_news_articles')
      .select('*', { count: 'exact', head: true })
      .eq('industry_id', industryId)

    console.log(`\n✓ Total articles in database for Construction industry: ${count}`)

    if (inserted > 0) {
      console.log('\n✅ Test articles inserted successfully!')
      console.log('   Your user should now see news in the widget.')
    }
  } catch (error) {
    console.error('❌ Error inserting test articles:', error)
    process.exit(1)
  }
}

insertTestNews().catch((error) => {
  console.error('\n💥 Failed to insert test articles:', error)
  process.exit(1)
})
