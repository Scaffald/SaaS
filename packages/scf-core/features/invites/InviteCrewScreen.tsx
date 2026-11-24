/**
 * "Invite your crew" (#1398): share your personal link, invite people by
 * email or phone, and see who joined.
 *
 * Phone invites are never texted by Scaffald (TCPA: a contact list doesn't
 * give consent to texts from us). Each phone contact comes back with an
 * `sms:` link that opens the inviter's own messaging app with the text
 * filled in.
 *
 * A device contacts picker (expo-contacts) needs a native build and a
 * permission string, so it comes separately; typing or pasting works on
 * every platform.
 */
import type { CreateInvitesResponse, Invite, InviteResult } from '@scaffald/sdk'
import { Button, Chip, Row, Separator, Spinner, Stack, Text, TextArea } from '@scaffald/ui'
import { useMemo, useState } from 'react'
import { Linking, Platform, Share } from 'react-native'
import { copyToClipboard } from '../../utils/clipboard'
import { useCreateInvitesMutation, useInviteLink, useInvites } from '../../utils/invites-sdk-hooks'
import { parseContacts } from './parseContacts'

export interface InviteCrewScreenProps {
  /** `onboarding` when shown as the last onboarding step. */
  source?: 'app' | 'onboarding'
}

const MAX_CONTACTS = 50

export const SKIP_LABELS: Record<string, string> = {
  invalid: "Couldn't read this one",
  duplicate: 'Listed twice',
  self: "That's you",
  member: 'Already on Scaffald',
  recently_invited: 'You invited them recently',
  daily_limit: 'Daily limit reached; try again tomorrow',
  suppressed: "They've opted out of Scaffald emails",
}

export const FAIL_LABELS: Record<string, string> = {
  email_not_configured: "Email invites aren't switched on yet. Share your link instead.",
  send_limit: 'Sending limit reached for today; try again tomorrow',
  test_mode: 'Email sending is in test mode',
  send_failed: "Couldn't send; try again",
}

export function inviteStatusLabel(invite: Pick<Invite, 'status'>): string {
  switch (invite.status) {
    case 'onboarded':
      return 'Set up profile'
    case 'joined':
    case 'accepted':
      return 'Joined'
    case 'expired':
      return 'Expired'
    case 'declined':
      return 'Declined'
    default:
      return 'Invited'
  }
}

async function shareLink(text: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (Platform.OS !== 'web') {
      await Share.share({ message: text, url })
      return 'shared'
    }
    const nav =
      typeof navigator !== 'undefined'
        ? (navigator as Navigator & { share?: (d: ShareData) => Promise<void> })
        : null
    if (nav?.share) {
      await nav.share({ text, url })
      return 'shared'
    }
  } catch {
    // Cancelled or unsupported: fall through to copying.
  }
  return (await copyToClipboard(url)) ? 'copied' : 'failed'
}

function LinkCard() {
  const { data, isLoading } = useInviteLink()
  const [note, setNote] = useState<string | null>(null)
  if (isLoading || !data) {
    return isLoading ? <Spinner /> : null
  }
  return (
    <Stack gap={10} testID="invite-link-card">
      <Text weight="semibold">Your invite link</Text>
      <Text size="sm" color="gray" selectable>
        {data.link}
      </Text>
      <Row gap={8} wrap>
        <Button
          size="sm"
          variant="filled"
          onPress={async () => {
            const r = await shareLink(data.shareText, data.link)
            setNote(
              r === 'copied' ? 'Link copied' : r === 'failed' ? "Couldn't share the link" : null
            )
          }}
        >
          Share link
        </Button>
        <Button
          size="sm"
          onPress={async () =>
            setNote((await copyToClipboard(data.link)) ? 'Link copied' : "Couldn't copy")
          }
        >
          Copy link
        </Button>
      </Row>
      {note ? (
        <Text size="sm" color="gray">
          {note}
        </Text>
      ) : null}
    </Stack>
  )
}

function ResultRow({ result, label }: { result: InviteResult; label: string }) {
  if (result.status === 'ready') {
    return (
      <Row justify="space-between" align="center" gap={12} testID="invite-result-ready">
        <Stack style={{ flex: 1 }}>
          <Text size="sm">{label}</Text>
          <Text size="xs" color="gray">
            Ready to text from your phone
          </Text>
        </Stack>
        <Button size="sm" variant="filled" onPress={() => void Linking.openURL(result.smsUrl)}>
          Text invite
        </Button>
      </Row>
    )
  }
  const detail =
    result.status === 'sent'
      ? 'Invite emailed'
      : result.status === 'skipped'
        ? (SKIP_LABELS[result.reason] ?? 'Skipped')
        : (FAIL_LABELS[result.reason] ?? 'Not sent')
  return (
    <Stack testID={`invite-result-${result.status}`}>
      <Text size="sm">{label}</Text>
      <Text size="xs" color={result.status === 'failed' ? 'error' : 'gray'}>
        {detail}
      </Text>
    </Stack>
  )
}

function AddPeople({ source }: { source: 'app' | 'onboarding' }) {
  const [text, setText] = useState('')
  const [message, setMessage] = useState('')
  const [last, setLast] = useState<{ labels: string[]; response: CreateInvitesResponse } | null>(
    null
  )
  const parsed = useMemo(() => parseContacts(text), [text])
  const usable = parsed.filter((p) => p.contact)
  const unreadable = parsed.filter((p) => !p.contact)
  const mutation = useCreateInvitesMutation()

  const send = async () => {
    const batch = usable.slice(0, MAX_CONTACTS)
    const response = await mutation.mutateAsync({
      contacts: batch.map((p) => p.contact as NonNullable<typeof p.contact>),
      message: message.trim() || null,
      source,
    })
    setLast({ labels: batch.map((p) => p.raw), response })
    setText(unreadable.map((p) => p.raw).join('\n'))
  }

  return (
    <Stack gap={12}>
      <Text weight="semibold">Invite people</Text>
      <TextArea
        rows={4}
        value={text}
        onChangeText={setText}
        placeholder={'One per line: email or phone number\nsam@example.com\nPat 555-010-4411'}
        accessibilityLabel="Emails or phone numbers to invite"
        testID="invite-contacts-input"
      />
      <TextArea
        rows={2}
        value={message}
        onChangeText={(v) => setMessage(v.slice(0, 500))}
        placeholder="Add a personal note (optional)"
        accessibilityLabel="Personal note"
        testID="invite-message-input"
      />
      {parsed.length ? (
        <Text size="xs" color="gray">
          {`${usable.length} to invite`}
          {unreadable.length ? ` · ${unreadable.length} we can't read` : ''}
          {usable.length > MAX_CONTACTS ? ` · the first ${MAX_CONTACTS} go now` : ''}
        </Text>
      ) : null}
      <Text size="xs" color="gray">
        We email invites from Scaffald, with an unsubscribe link. Phone numbers get a ready-to-send
        text you send from your own phone; Scaffald never texts them.
      </Text>
      <Button
        variant="filled"
        disabled={!usable.length || mutation.isPending}
        onPress={() => void send()}
        testID="invite-send"
      >
        {mutation.isPending
          ? 'Sending…'
          : usable.length > 1
            ? `Invite ${Math.min(usable.length, MAX_CONTACTS)} people`
            : 'Invite'}
      </Button>
      {mutation.isError ? (
        <Text size="sm" color="error">
          {"Couldn't send invites. Check your connection and try again."}
        </Text>
      ) : null}
      {last ? (
        <Stack gap={10} testID="invite-results">
          {last.response.results.map((r) => (
            <ResultRow key={r.index} result={r} label={last.labels[r.index] ?? ''} />
          ))}
        </Stack>
      ) : null}
    </Stack>
  )
}

function YourInvites() {
  const { data, isLoading } = useInvites()
  if (isLoading) return <Spinner />
  if (!data || data.invites.length === 0) return null
  return (
    <Stack gap={10} testID="invite-status-list">
      <Row justify="space-between" align="center">
        <Text weight="semibold">Your invites</Text>
        <Text size="sm" color="gray">
          {`${data.counts.joined} joined of ${data.counts.invited}`}
        </Text>
      </Row>
      {data.invites
        .filter((i) => i.kind === 'targeted')
        .slice(0, 50)
        .map((i) => (
          <Row key={i.id} justify="space-between" align="center" gap={12}>
            <Text size="sm" style={{ flex: 1 }} numberOfLines={1}>
              {i.name || i.email || i.phone || 'Invite'}
            </Text>
            <Chip
              size="sm"
              tone={i.status === 'onboarded' || i.status === 'joined' ? 'accent' : 'neutral'}
            >
              {inviteStatusLabel(i)}
            </Chip>
          </Row>
        ))}
    </Stack>
  )
}

export function InviteCrewScreen({ source = 'app' }: InviteCrewScreenProps) {
  return (
    <Stack gap={24} style={{ maxWidth: 640, width: '100%' }} testID="invite-crew">
      {/* The page title already says "Invite your crew"; no second heading. */}
      <Text color="gray">
        Invite the people you work with. When they join, they'll see you invited them.
      </Text>
      <LinkCard />
      <Separator />
      <AddPeople source={source} />
      <Separator />
      <YourInvites />
    </Stack>
  )
}
