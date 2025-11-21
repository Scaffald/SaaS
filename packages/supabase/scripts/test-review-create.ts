import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

async function testReviewCreate() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('Testing review creation...')

  // Test user ID from the curl
  const userId = '3b36100b-da48-4c1d-83f9-ad58ec0cd705'
  const subjectId = '4b178d0e-bafd-49c2-af06-593c6db91062'

  // Check if a review already exists
  const { data: existing, error: checkError } = await supabase
    .from('reviews')
    .select('*')
    .eq('author_user_id', userId)
    .eq('subject_id', subjectId)
    .eq('subject_type', 'user')
    .eq('kind', 'review')

  if (checkError) {
    console.error('Error checking existing reviews:', checkError)
  } else {
    console.log('Existing reviews:', existing)
  }

  // Try to create a new review
  const { data: newReview, error: insertError } = await supabase
    .from('reviews')
    .insert({
      author_user_id: userId,
      subject_id: subjectId,
      subject_type: 'user',
      status: 'draft',
      metadata: {},
    })
    .select()
    .single()

  if (insertError) {
    console.error('Insert error:', insertError)
  } else {
    console.log('Created review:', newReview)
  }
}

testReviewCreate()
