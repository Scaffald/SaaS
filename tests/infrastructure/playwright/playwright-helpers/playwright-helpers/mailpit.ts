/**
 * Mailpit helper for Playwright (Node).
 * Fetches the latest email for a recipient and extracts the magic link.
 * Requires Mailpit running at MAILPIT_URL (default http://127.0.0.1:54324).
 */

const MAILPIT_URL = process.env.MAILPIT_URL || 'http://127.0.0.1:54324'

export interface MailpitMessage {
  id: string
  from: string
  to: string[]
  subject: string
  date: string
  body: { text?: string; html?: string }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Get the latest email from Mailpit for a specific recipient.
 */
export async function getLatestEmailFromMailpit(
  recipient: string,
  timeoutMs = 15000
): Promise<MailpitMessage | null> {
  const startTime = Date.now()
  const pollInterval = 800

  while (Date.now() - startTime < timeoutMs) {
    try {
      const remainingTime = timeoutMs - (Date.now() - startTime)
      if (remainingTime < pollInterval) break

      const response = await fetchWithTimeout(
        `${MAILPIT_URL}/api/v1/messages`,
        {},
        Math.min(3000, remainingTime)
      )

      if (!response.ok) {
        await new Promise((r) => setTimeout(r, pollInterval))
        continue
      }

      const data = (await response.json()) as {
        messages?: { ID: string; To?: { Address: string }[] }[]
      }
      const messages = data.messages || []
      const forRecipient = messages.filter((m) =>
        m.To?.some(
          (t: { Address: string }) => t.Address.toLowerCase() === recipient.toLowerCase()
        )
      )

      if (forRecipient.length === 0) {
        await new Promise((r) => setTimeout(r, pollInterval))
        continue
      }

      const latest = forRecipient[0]
      const detailRes = await fetchWithTimeout(
        `${MAILPIT_URL}/api/v1/message/${latest.ID}`,
        {},
        Math.min(3000, remainingTime)
      )
      if (!detailRes.ok) continue

      const detail = (await detailRes.json()) as {
        ID: string
        From?: { Address?: string }
        To?: { Address: string }[]
        Subject?: string
        Date?: string
        Text?: string
        HTML?: string
      }

      return {
        id: String(detail.ID),
        from: detail.From?.Address ?? '',
        to: detail.To?.map((t: { Address: string }) => t.Address) ?? [],
        subject: detail.Subject ?? '',
        date: detail.Date ?? '',
        body: { text: detail.Text, html: detail.HTML },
      }
    } catch {
      await new Promise((r) => setTimeout(r, pollInterval))
    }
  }

  return null
}

/**
 * Extract the magic link (Supabase confirm/verify URL) from email HTML.
 */
export function extractMagicLinkFromEmailHtml(html: string): string | null {
  if (!html) return null
  const linkMatch = html.match(
    /href="([^"]*(?:\/auth\/v1\/(?:verify|confirm)|token_hash)[^"]*)"/i
  )
  if (!linkMatch?.[1]) return null
  return linkMatch[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
}
