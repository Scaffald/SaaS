/**
 * application-attachments bucket limits (#1229, migration 376): 20 MB and a
 * fixed MIME list on every project — prod allowed 500 MB and zip, dev 10 MB.
 *
 * Uploads with the service role: it bypasses storage RLS but not the bucket's
 * size and type limits, which is exactly what this pins.
 */

import { assertEquals } from '../shared/assert.ts'
import { createAdminClient } from '../shared/setup.ts'

const BUCKET = 'application-attachments'
const MB = 1024 * 1024

async function upload(bytes: number, contentType: string) {
  const path = `limits-probe/${crypto.randomUUID()}`
  const { error } = await createAdminClient()
    .storage.from(BUCKET)
    .upload(path, new Uint8Array(bytes), { contentType, upsert: false })
  if (!error) await createAdminClient().storage.from(BUCKET).remove([path])
  return error ? String((error as { statusCode?: string }).statusCode ?? error.message) : 'ok'
}

Deno.test({
  name: 'Storage limits - application-attachments takes a 19 MB PDF, refuses 21 MB and zip (#1229)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    assertEquals(await upload(19 * MB, 'application/pdf'), 'ok', '19 MB PDF is within the limit')
    const big = await upload(21 * MB, 'application/pdf')
    assertEquals(big !== 'ok', true, `21 MB must be refused, got ${big}`)
    assertEquals(await upload(1 * MB, 'image/png'), 'ok', 'portfolio images are allowed')
    const zip = await upload(1 * MB, 'application/zip')
    assertEquals(zip !== 'ok', true, `zip must be refused, got ${zip}`)
  },
})
