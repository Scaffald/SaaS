import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const TO_EMAIL = process.env.CONTACT_FORM_TO ?? 'hello@scaffald.com'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.name || !body?.email || !body?.company || !body?.orgType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 503 })
  }
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { name, email, company, orgType, orgTypeOther, message } = body

  try {
    await resend.emails.send({
      from: 'Scaffald <noreply@scaffald.com>',
      to: TO_EMAIL,
      replyTo: email,
      subject: `New contact form submission — ${company}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Organization: ${company}`,
        `Type: ${orgType}${orgType === 'Other' ? ` — ${orgTypeOther ?? ''}` : ''}`,
        '',
        message ? `Message:\n${message}` : '(No message)',
      ].join('\n'),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
