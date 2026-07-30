import { Row, Stack, Text, useResponsive } from '@scaffald/ui'
import { useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { brand, layout, MARKETING_LINKS } from '../theme'
import { MarketingHeading } from './MarketingHeading'
import { MarketingLink } from './MarketingLink'
import { LiveRegion } from './LiveRegion'
import { useHover } from './useHover'

const ORG_TYPES = [
  'General contractor',
  'Construction',
  'Real Estate',
  'HR/Recruiting',
  'Education/Training',
  'Other',
]

type Status = 'idle' | 'sending' | 'sent' | 'error'
type FieldKey = 'name' | 'email' | 'company' | 'orgType'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const baseFieldStyle = {
  backgroundColor: 'rgba(255,255,255,0.1)',
  borderWidth: 1,
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 12,
  color: '#ffffff',
  fontSize: 14,
} as const

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <Stack gap={6} style={{ flex: 1 }}>
      <Row gap={4}>
        <Text size="sm" weight="medium" color={brand.tealPale}>
          {label}
        </Text>
        {required ? (
          <Text size="sm" color={brand.tealBright}>
            *
          </Text>
        ) : null}
      </Row>
      {children}
      {error ? (
        <Text size="xs" color="#fca5a5">
          {error}
        </Text>
      ) : null}
    </Stack>
  )
}

export type ContactSectionProps = {
  /**
   * 2 when embedded in the landing page (which already has an h1); 1 when this
   * is the whole page, as on /contact.
   */
  headingLevel?: 1 | 2
}

export function ContactSection({ headingLevel = 2 }: ContactSectionProps) {
  const { isMobile, select } = useResponsive()
  const { hovered, hoverProps } = useHover()
  const [status, setStatus] = useState<Status>('idle')
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({})
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    orgType: '',
    orgTypeOther: '',
    message: '',
    // Honeypot: hidden from humans, irresistible to naive bots.
    website: '',
  })

  const titleSize = select({ base: 30, sm: 36, md: 40, lg: 44 }) ?? 30
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))
  const markTouched = (key: FieldKey) => () => setTouched((prev) => ({ ...prev, [key]: true }))

  const errors: Partial<Record<FieldKey, string>> = {}
  if (!form.name.trim()) errors.name = 'Please enter your name.'
  if (!form.email.trim()) errors.email = 'Please enter your email.'
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'That email address looks incomplete.'
  if (!form.company.trim()) errors.company = 'Please enter your organization.'
  if (!form.orgType) errors.orgType = 'Please choose an organization type.'

  const errorFor = (key: FieldKey) => (touched[key] ? errors[key] : undefined)
  const isValid = Object.keys(errors).length === 0

  const submit = async () => {
    setTouched({ name: true, email: true, company: true, orgType: true })
    if (!isValid || status === 'sending') return

    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus('sent')
      setForm({
        name: '',
        email: '',
        company: '',
        orgType: '',
        orgTypeOther: '',
        message: '',
        website: '',
      })
      setTouched({})
    } catch {
      setStatus('error')
    }
  }

  const fieldStyle = (key: FieldKey) => ({
    ...baseFieldStyle,
    borderColor: errorFor(key) ? '#fca5a5' : 'rgba(255,255,255,0.2)',
  })

  return (
    <View nativeID="contact" style={{ backgroundColor: brand.deep, paddingVertical: 96 }}>
      <View
        style={{
          width: '100%',
          maxWidth: 640,
          marginHorizontal: 'auto',
          paddingHorizontal: layout.gutter,
        }}
      >
        <Stack align="center" gap={16} style={{ marginBottom: 48 }}>
          <MarketingHeading
            level={headingLevel}
            align="center"
            color="#ffffff"
            style={{ fontSize: titleSize, lineHeight: titleSize * 1.15, letterSpacing: -0.5 }}
          >
            Ready to start Scaffalding?
          </MarketingHeading>
          <Text align="center" color={brand.tealSoft} style={{ fontSize: 17 }}>
            Tell us about your organization and we will be in touch.
          </Text>
        </Stack>

        <LiveRegion>
          {status === 'sending'
            ? 'Sending your message.'
            : status === 'sent'
              ? 'Message received. We will be in touch within 1 business day.'
              : status === 'error'
                ? 'Something went wrong sending your message.'
                : ''}
        </LiveRegion>

        {status === 'sent' ? (
          <Stack
            align="center"
            gap={8}
            style={{
              backgroundColor: 'rgba(29,114,130,0.3)',
              borderWidth: 1,
              borderColor: 'rgba(63,181,199,0.4)',
              borderRadius: 16,
              padding: 32,
            }}
          >
            <Text style={{ fontSize: 36 }}>✓</Text>
            <Text size="lg" weight="semibold" color="#ffffff">
              Message received!
            </Text>
            <Text color={brand.tealSoft}>We will be in touch within 1 business day.</Text>
          </Stack>
        ) : (
          <Stack
            gap={20}
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 32,
            }}
          >
            <Stack gap={20} style={{ flexDirection: isMobile ? 'column' : 'row' }}>
              <Field label="Name" required error={errorFor('name')}>
                <TextInput
                  value={form.name}
                  onChangeText={set('name')}
                  onBlur={markTouched('name')}
                  placeholder="Your name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={fieldStyle('name')}
                  accessibilityLabel="Name"
                />
              </Field>
              <Field label="Email" required error={errorFor('email')}>
                <TextInput
                  value={form.email}
                  onChangeText={set('email')}
                  onBlur={markTouched('email')}
                  placeholder="you@company.com"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={fieldStyle('email')}
                  accessibilityLabel="Email"
                />
              </Field>
            </Stack>

            <Field label="Organization / Company" required error={errorFor('company')}>
              <TextInput
                value={form.company}
                onChangeText={set('company')}
                onBlur={markTouched('company')}
                placeholder="Company name"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={fieldStyle('company')}
                accessibilityLabel="Organization or company"
              />
            </Field>

            <Field label="Organization type" required error={errorFor('orgType')}>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                {ORG_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => {
                      set('orgType')(type)
                      markTouched('orgType')()
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: form.orgType === type }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      borderWidth: 1,
                      backgroundColor:
                        form.orgType === type ? brand.tealBright : 'rgba(255,255,255,0.1)',
                      borderColor:
                        form.orgType === type ? brand.tealBright : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <Text size="sm" color={form.orgType === type ? brand.deeper : '#ffffff'}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </Row>
            </Field>

            {form.orgType === 'Other' ? (
              <Field label="Please describe your organization">
                <TextInput
                  value={form.orgTypeOther}
                  onChangeText={set('orgTypeOther')}
                  placeholder="Tell us about your organization"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={baseFieldStyle}
                  accessibilityLabel="Organization description"
                />
              </Field>
            ) : null}

            <Field label="How can we help you?">
              <TextInput
                value={form.message}
                onChangeText={set('message')}
                placeholder="Tell us what you are looking for…"
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                numberOfLines={4}
                style={{ ...baseFieldStyle, minHeight: 104, textAlignVertical: 'top' }}
                accessibilityLabel="Message"
              />
            </Field>

            {/* Honeypot. Kept out of the tab order and off-screen rather than
                display:none, which some bots detect. */}
            <View
              style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
              pointerEvents="none"
              aria-hidden
            >
              <TextInput
                value={form.website}
                onChangeText={set('website')}
                autoComplete="off"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                tabIndex={-1}
              />
            </View>

            {status === 'error' ? (
              <Row gap={4} style={{ flexWrap: 'wrap' }}>
                <Text size="sm" color="#fca5a5">
                  Something went wrong. Please try again or email us at
                </Text>
                <MarketingLink href={`mailto:${MARKETING_LINKS.email}`} external>
                  <Text size="sm" color="#fca5a5" style={{ textDecorationLine: 'underline' }}>
                    {MARKETING_LINKS.email}
                  </Text>
                </MarketingLink>
              </Row>
            ) : null}

            <View {...hoverProps}>
              <Pressable
                onPress={submit}
                accessibilityRole="button"
                style={{
                  backgroundColor: hovered ? brand.tealHover : brand.teal,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text weight="semibold" color="#ffffff">
                  {status === 'sending' ? 'Sending…' : 'Submit'}
                </Text>
              </Pressable>
            </View>
          </Stack>
        )}
      </View>
    </View>
  )
}
