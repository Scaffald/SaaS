/**
 * Inspect full RSS XML structure
 */

async function inspectRSS() {
  const feedUrl = 'https://weworkremotely.com/remote-jobs.rss'

  console.log('\n🔍 Fetching RSS feed XML...\n')

  const response = await fetch(feedUrl)
  const xml = await response.text()
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []

  console.log(`Found ${items.length} items\n`)
  console.log('First item full XML:\n')
  console.log('═'.repeat(80))
  console.log(items[0])
  console.log('═'.repeat(80))
}

inspectRSS().catch(console.error)
