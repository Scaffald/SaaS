/**
 * Shared branded email template wrapper.
 *
 * All transactional emails should use `wrapInBrandedTemplate()` to ensure
 * consistent branding across SendGrid, Supabase Auth, and any future providers.
 *
 * Colors are sourced from the design system in packages/ui/src/tokens/colors.ts.
 */

// ── Brand Colors (from colors.neutral / colors.primary / colors.gray) ──
export const EMAIL_COLORS = {
  /** Page / body background — neutral[50] */
  pageBg: '#fbf8f3',
  /** Header background — neutral[700] */
  headerBg: '#6b6055',
  /** Header title text — neutral[100] */
  headerTitle: '#f7f2eb',
  /** Header subtitle text — neutral[900] */
  headerSubtitle: '#2a2623',
  /** Card / content background */
  cardBg: '#ffffff',
  /** Section background (warm cream) — neutral[200] */
  sectionBg: '#f1e9df',
  /** Body text — gray[600] */
  bodyText: '#504940',
  /** Muted / footer text — gray[400] */
  mutedText: '#9e9790',
  /** CTA button background — primary[500] */
  ctaButton: '#1d7282',
  /** CTA button text */
  ctaButtonText: '#ffffff',
  /** Link color — primary[500] */
  link: '#1d7282',
  /** Border / divider — neutral[300] */
  border: '#e8dccb',
  /** Accent — neutral[500] */
  accent: '#c8b6a1',
} as const

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface BrandedTemplateOptions {
  /** Main header title (e.g. company or app name) */
  title: string
  /** Optional subtitle below the title */
  subtitle?: string
  /** Inner HTML content for the white card area */
  body: string
  /** Optional HTML for the warm-cream footer section */
  footerHtml?: string
  /** Optional logo image URL */
  logoUrl?: string
}

/**
 * Wraps arbitrary body HTML in a branded email layout.
 *
 * Structure:
 *   [Page bg: warm cream]
 *     [Optional logo]
 *     [Header: dark warm bg, light text]
 *     [White content card — your body HTML]
 *     [Warm cream footer section]
 */
export function wrapInBrandedTemplate(options: BrandedTemplateOptions): string {
  const { title, subtitle, body, footerHtml, logoUrl } = options
  const c = EMAIL_COLORS

  const logoBlock = logoUrl
    ? `<tr>
        <td align="center" style="padding:0;">
          <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(title)}" width="80" style="margin-bottom:-50px;width:80px;" />
        </td>
      </tr>`
    : ''

  const subtitleBlock = subtitle
    ? `<h2 style="color:${c.headerSubtitle};font-weight:400;font-size:14px;margin:0;padding:0;">
        ${escapeHtml(subtitle)}
      </h2>`
    : ''

  const footerBlock = footerHtml
    ? `<tr>
        <td style="color:${c.mutedText};padding:20px 30px;font-size:13px;line-height:20px;" bgcolor="${c.sectionBg}">
          ${footerHtml}
        </td>
      </tr>`
    : `<tr>
        <td style="color:${c.mutedText};padding:20px 30px;font-size:12px;line-height:18px;text-align:center;" bgcolor="${c.sectionBg}">
          <p style="margin:0;">You are receiving this email from Scaffald. Manage your notification preferences in your account settings.</p>
        </td>
      </tr>`

  return `<!DOCTYPE html>
<html lang="en" style="background-color:${c.pageBg};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin:0;padding:0;font-size:12px;font-weight:400;text-align:center;width:100%;">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { background:${c.pageBg}; margin:0; padding:0; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; font-weight:400; text-align:center; width:100%; }
    @media only screen and (max-width:480px) {
      .column { border-left:none !important; border-right:none !important; display:block; padding:10px 0 !important; width:100% !important; }
      .main { margin:10px auto !important; }
    }
  </style>
</head>
<body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:400;text-align:center;padding:0;margin:0;width:100%;" bgcolor="${c.pageBg}">
  <center>
    <table class="body" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:400;text-align:center;padding:0;margin:0;width:100%;" bgcolor="${c.pageBg}" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table class="main" style="width:100%;color:${c.bodyText};text-align:left;max-width:600px;margin:20px auto;" cellpadding="0" cellspacing="0">
            ${logoBlock}
            <tr>
              <td>
                <table class="content" style="width:100%;box-shadow:0 0 10px rgba(0,0,0,0.05);border-radius:8px;overflow:hidden;" cellpadding="0" cellspacing="0">
                  <!-- Header -->
                  <tr>
                    <td style="border-bottom:1px solid ${c.border};padding:40px 20px 30px;text-align:center;" bgcolor="${c.headerBg}">
                      <h1 style="color:${c.headerTitle};font-size:22px;font-weight:400;margin:0;padding:10px 0 5px;">
                        ${escapeHtml(title)}
                      </h1>
                      ${subtitleBlock}
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="color:${c.bodyText};padding:30px;font-size:14px;line-height:22px;" bgcolor="${c.cardBg}">
                      ${body}
                    </td>
                  </tr>
                  <!-- Footer -->
                  ${footerBlock}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`
}
