/**
 * Documents Storage Preference REST API
 * Get/set user storage backend preference.
 * Migrated from tRPC documentsRouter.getStoragePreference / setStoragePreference.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

app.get('/', async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  if (!supabase || !user?.id) return c.json({ error: 'Unauthorized' }, 401)

  const { data, error } = await supabase
    .schema('core')
    .from('users')
    .select('storage_preference')
    .eq('id', user.id)
    .single()

  if (error) {
    return c.json({ error: `Failed to get storage preference: ${error.message}` }, 500)
  }

  return c.json({
    storagePreference: (data?.storage_preference as string) || 'supabase',
  })
})

app.put(
  '/',
  zValidator(
    'json',
    z.object({
      storagePreference: z.enum(['supabase', 'dropbox', 'google_drive']),
    })
  ),
  async (c) => {
    const supabase = c.get('supabase')
    const user = c.get('user')
    if (!supabase || !user?.id) return c.json({ error: 'Unauthorized' }, 401)

    const { storagePreference } = c.req.valid('json')

    const { error } = await supabase
      .schema('core')
      .from('users')
      .update({ storage_preference: storagePreference })
      .eq('id', user.id)

    if (error) {
      return c.json({ error: `Failed to update storage preference: ${error.message}` }, 500)
    }

    return c.json({
      storagePreference,
      message: 'Storage preference updated successfully',
    })
  }
)

export default app
