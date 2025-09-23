import { useMemo } from 'react'

import {
  Button,
  Paragraph,
  ScrollView,
  Separator,
  Spinner,
  Switch,
  SwitchProps,
  Text,
  XStack,
  YStack,
  useTheme,
  useToastController,
} from '@app/ui'
import { BadgeCheck } from '@tamagui/lucide-icons'
import { SchemaForm, formFields } from '@app/utils/SchemaForm'
import { api, createAdminUsersHooks, type RouterOutputs } from '@app/utils/api'
import { z } from 'zod'

import {
  PRIVATE_VERIFICATION_FIELDS,
  PROFILE_VERIFICATION_FIELDS,
  USER_VERIFICATION_FIELDS,
  type VerificationFieldMeta,
} from './verification-config'

type AdminUserDetail = RouterOutputs['admin']['users']['detail']

const ProfileSchema = z.object({
  name: formFields.text.describe('Full name // Jane Smith'),
  about: formFields.textarea.describe('About // Professional summary'),
})

const PublicSchema = z.object({
  displayName: formFields.text.describe('Display name // Displayed publicly'),
  username: formFields.text.describe('Username // Optional vanity handle'),
  slug: formFields.text.describe('Slug // Profile slug'),
  headline: formFields.text.describe('Headline // Short pitch'),
  bio: formFields.textarea.describe('Bio // Longer bio'),
  openToWork: formFields.boolean_switch.describe('Open to work'),
})

const PrivateSchema = z.object({
  email: formFields.text.describe('Email // example@email.com'),
  phone: formFields.text.describe('Phone // Contact number'),
  location: formFields.text.describe('Location // City, State'),
  openToTravel: formFields.boolean_switch.describe('Open to travel'),
})

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch (_error) {
    return value
  }
}

const verificationFields = [
  ...PROFILE_VERIFICATION_FIELDS,
  ...USER_VERIFICATION_FIELDS,
  ...PRIVATE_VERIFICATION_FIELDS,
]

const verificationFieldLabel = new Map(verificationFields.map((meta) => [meta.field, meta.label]))

type AdminUserDetailScreenProps = {
  workerId: string
  organizationId?: string | null
}

const VerificationToggle = ({
  meta,
  checked,
  onCheckedChange,
  disabled,
}: {
  meta: VerificationFieldMeta
  checked: boolean
  onCheckedChange: NonNullable<SwitchProps['onCheckedChange']>
  disabled?: boolean
}) => {
  return (
    <XStack ai="center" jc="space-between" gap="$3">
      <Paragraph>{meta.label}</Paragraph>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled}>
        <Switch.Thumb />
      </Switch>
    </XStack>
  )
}

export const AdminUserDetailScreen = ({ workerId, organizationId }: AdminUserDetailScreenProps) => {
  const hooks = useMemo(() => createAdminUsersHooks(organizationId ?? null), [organizationId])
  const utils = api.useUtils()
  const toast = useToastController()
  const theme = useTheme()

  const detailQuery = hooks.useDetail({ workerId })
  const updateMutation = hooks.useUpdate({
    onSuccess: async () => {
      toast.show('Saved changes')
      await utils.admin.users.detail.invalidate({ workerId, organizationId: organizationId ?? null })
      await utils.admin.users.search.invalidate()
    },
  })
  const verifyMutation = hooks.useVerify({
    onSuccess: async () => {
      toast.show('Field verified')
      await utils.admin.users.detail.invalidate({ workerId, organizationId: organizationId ?? null })
    },
  })
  const revokeMutation = hooks.useRevoke({
    onSuccess: async () => {
      toast.show('Verification revoked')
      await utils.admin.users.detail.invalidate({ workerId, organizationId: organizationId ?? null })
    },
  })

  if (detailQuery.isPending) {
    return (
      <XStack justifyContent="center" padding="$6">
        <Spinner size="large" />
      </XStack>
    )
  }

  if (detailQuery.error || !detailQuery.data) {
    return <Paragraph color="$red10">{detailQuery.error?.message ?? 'Unable to load worker details.'}</Paragraph>
  }

  const detail = detailQuery.data as AdminUserDetail
  const verifiedFields = new Set(detail.verification.fields)
  const isVerificationLoading = verifyMutation.isPending || revokeMutation.isPending

  const handleVerificationToggle = (meta: VerificationFieldMeta, nextValue: boolean) => {
    if (nextValue) {
      verifyMutation.mutate({
        workerId,
        field: meta.field,
        subjectType: meta.subjectType,
      })
    } else {
      revokeMutation.mutate({
        workerId,
        field: meta.field,
        subjectType: meta.subjectType,
      })
    }
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
      <YStack gap="$6">
        <YStack gap="$2">
          <Paragraph size="$3" fontWeight="700">
            Verification status
          </Paragraph>
          <XStack ai="center" gap="$2">
            {detail.verification.status === 'verified' ? (
              <BadgeCheck size={18} color={theme.green10.val} />
            ) : null}
            <Paragraph color={detail.verification.status === 'verified' ? '$green11' : '$color11'}>
              {detail.verification.status.toUpperCase()}
            </Paragraph>
          </XStack>
        </YStack>

        <YStack gap="$4" borderWidth={1} borderColor="$color5" borderRadius="$6" padding="$4">
          <Paragraph fontWeight="700">Profile basics</Paragraph>
          <SchemaForm
            schema={ProfileSchema}
            defaultValues={{
              name: detail.profile?.name ?? '',
              about: detail.profile?.about ?? '',
            }}
            onSubmit={(values) =>
              updateMutation.mutate({
                workerId,
                profileData: {
                  name: values.name.trim() || null,
                  about: values.about.trim() || null,
                },
              })
            }
            renderAfter={({ submit }) => (
              <Button onPress={() => submit()} disabled={updateMutation.isPending}>
                Save profile
              </Button>
            )}
          >
            {(fields) => <YStack gap="$3">{Object.values(fields)}</YStack>}
          </SchemaForm>

          <Separator />
          <YStack gap="$3">
            <Paragraph fontWeight="600">Verification controls</Paragraph>
            {PROFILE_VERIFICATION_FIELDS.map((meta) => (
              <VerificationToggle
                key={meta.id}
                meta={meta}
                checked={verifiedFields.has(meta.field)}
                disabled={isVerificationLoading}
                onCheckedChange={(value) => handleVerificationToggle(meta, Boolean(value))}
              />
            ))}
          </YStack>
        </YStack>

        <YStack gap="$4" borderWidth={1} borderColor="$color5" borderRadius="$6" padding="$4">
          <Paragraph fontWeight="700">Public profile</Paragraph>
          <SchemaForm
            schema={PublicSchema}
            defaultValues={{
              displayName: detail.displayName ?? '',
              username: detail.username ?? '',
              slug: detail.slug ?? '',
              headline: detail.headline ?? '',
              bio: detail.bio ?? '',
              openToWork: Boolean(detail.openToWork),
            }}
            onSubmit={(values) =>
              updateMutation.mutate({
                workerId,
                publicData: {
                  displayName: values.displayName.trim() || null,
                  username: values.username.trim() || null,
                  slug: values.slug.trim() || null,
                  headline: values.headline.trim() || null,
                  bio: values.bio.trim() || null,
                  openToWork: values.openToWork,
                },
              })
            }
            renderAfter={({ submit }) => (
              <Button onPress={() => submit()} disabled={updateMutation.isPending}>
                Save public profile
              </Button>
            )}
          >
            {(fields) => <YStack gap="$3">{Object.values(fields)}</YStack>}
          </SchemaForm>

          <Separator />
          <YStack gap="$3">
            <Paragraph fontWeight="600">Verification controls</Paragraph>
            {USER_VERIFICATION_FIELDS.map((meta) => (
              <VerificationToggle
                key={meta.id}
                meta={meta}
                checked={verifiedFields.has(meta.field)}
                disabled={isVerificationLoading}
                onCheckedChange={(value) => handleVerificationToggle(meta, Boolean(value))}
              />
            ))}
          </YStack>
        </YStack>

        <YStack gap="$4" borderWidth={1} borderColor="$color5" borderRadius="$6" padding="$4">
          <Paragraph fontWeight="700">Private contact details</Paragraph>
          <SchemaForm
            schema={PrivateSchema}
            defaultValues={{
              email: detail.privateData?.email ?? '',
              phone: detail.privateData?.phone ?? '',
              location: detail.privateData?.location ?? '',
              openToTravel: Boolean(detail.privateData?.openToTravel),
            }}
            onSubmit={(values) =>
              updateMutation.mutate({
                workerId,
                privateData: {
                  email: values.email.trim() || null,
                  phone: values.phone.trim() || null,
                  location: values.location.trim() || null,
                  openToTravel: values.openToTravel,
                },
              })
            }
            renderAfter={({ submit }) => (
              <Button onPress={() => submit()} disabled={updateMutation.isPending}>
                Save private details
              </Button>
            )}
          >
            {(fields) => <YStack gap="$3">{Object.values(fields)}</YStack>}
          </SchemaForm>

          <Separator />
          <YStack gap="$3">
            <Paragraph fontWeight="600">Verification controls</Paragraph>
            {PRIVATE_VERIFICATION_FIELDS.map((meta) => (
              <VerificationToggle
                key={meta.id}
                meta={meta}
                checked={verifiedFields.has(meta.field)}
                disabled={isVerificationLoading}
                onCheckedChange={(value) => handleVerificationToggle(meta, Boolean(value))}
              />
            ))}
          </YStack>
        </YStack>

        <YStack gap="$3" borderWidth={1} borderColor="$color5" borderRadius="$6" padding="$4">
          <Paragraph fontWeight="700">Verification activity</Paragraph>
          {detail.verification.history.length ? (
            <YStack gap="$3">
              {detail.verification.history.map((entry) => {
                const label = verificationFieldLabel.get(entry.field) ?? entry.field
                return (
                  <YStack key={entry.id} borderWidth={1} borderColor="$color4" borderRadius="$4" padding="$3" gap="$2">
                    <XStack ai="center" jc="space-between">
                      <Paragraph fontWeight="600">{label}</Paragraph>
                      <Paragraph color={entry.revokedAt ? '$red10' : '$green10'}>
                        {entry.revokedAt ? 'Revoked' : 'Verified'}
                      </Paragraph>
                    </XStack>
                    <Text size="$2">Verified at: {formatDate(entry.verifiedAt)}</Text>
                    <Text size="$2">Verified by: {entry.verifiedBy}</Text>
                    {entry.revokedAt ? <Text size="$2">Revoked at: {formatDate(entry.revokedAt)}</Text> : null}
                    {entry.notes ? <Text size="$2">Notes: {entry.notes}</Text> : null}
                  </YStack>
                )
              })}
            </YStack>
          ) : (
            <Paragraph color="$color11">No verification actions recorded yet.</Paragraph>
          )}
        </YStack>
      </YStack>
    </ScrollView>
  )
}
