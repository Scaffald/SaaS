import { Check, Edit3, Eye, EyeOff, Tag, Trash2, X } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { ResponsiveSelect } from '@scaffald/ui'
import {
  Button,
  Image,
  Input,
  Separator,
  Spinner,
  Text,
  View,
  Row,
  Stack,
} from '@scaffald/ui'

import type { ResolvedWorkLogPhoto, WorkLogPhotoType } from '../types/photos'

const PHOTO_TYPE_OPTIONS: Array<{
  value: Exclude<WorkLogPhotoType, null>
  label: string
}> = [
  { value: 'before', label: 'Before' },
  { value: 'progress', label: 'Progress' },
  { value: 'after', label: 'After' },
  { value: 'general', label: 'General' },
]

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes)) return '0 B'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

const formatDate = (iso: string | null): string | null => {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toLocaleString()
}

export interface PhotoCardProps {
  photo: ResolvedWorkLogPhoto
  disabled?: boolean
  onUpdateCaption?: (photoId: string, caption: string | null) => Promise<void> | void
  onUpdatePhotoType?: (photoId: string, photoType: WorkLogPhotoType) => Promise<void> | void
  onToggleVisibility?: (photoId: string, showOnProfile: boolean) => Promise<void> | void
  onDelete?: (photoId: string) => Promise<void> | void
}

export function PhotoCard({
  photo,
  disabled = false,
  onUpdateCaption,
  onUpdatePhotoType,
  onToggleVisibility,
  onDelete,
}: PhotoCardProps) {
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [captionDraft, setCaptionDraft] = useState(photo.caption ?? '')
  const [isSavingCaption, setIsSavingCaption] = useState(false)
  const [, setIsUpdatingType] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const canToggleVisibility = Boolean(onToggleVisibility)
  const canEditCaption = Boolean(onUpdateCaption)
  const canChangeType = Boolean(onUpdatePhotoType)
  const canDelete = Boolean(onDelete)

  useEffect(() => {
    setCaptionDraft(photo.caption ?? '')
  }, [photo.caption])

  const typeOption = useMemo(() => {
    if (!photo.photoType) return null
    return PHOTO_TYPE_OPTIONS.find((option) => option.value === photo.photoType) ?? null
  }, [photo.photoType])

  const handleSaveCaption = async () => {
    if (!onUpdateCaption) {
      setIsEditingCaption(false)
      return
    }
    setIsSavingCaption(true)
    try {
      const nextCaption = captionDraft.trim()
      await onUpdateCaption(photo.id, nextCaption.length ? nextCaption : null)
      setIsEditingCaption(false)
    } finally {
      setIsSavingCaption(false)
    }
  }

  const handleCancelCaption = () => {
    setCaptionDraft(photo.caption ?? '')
    setIsEditingCaption(false)
  }

  const handleUpdateType = async (nextValue: WorkLogPhotoType) => {
    if (!onUpdatePhotoType) {
      return
    }
    setIsUpdatingType(true)
    try {
      await onUpdatePhotoType(photo.id, nextValue)
    } finally {
      setIsUpdatingType(false)
    }
  }

  const handleToggleVisibility = async () => {
    if (!onToggleVisibility) {
      return
    }
    await onToggleVisibility(photo.id, !photo.showOnProfile)
  }

  const handleDelete = async () => {
    if (!onDelete) {
      return
    }
    setIsDeleting(true)
    try {
      await onDelete(photo.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Stack
      style={{ borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, overflow: 'hidden' }}
      width="100%"
    >
      <View position="relative" style={{ aspectRatio: 4 / 3 }}>
        {photo.signedUrl ? (
          <Image source={{ uri: photo.signedUrl }} width="100%" height="100%" resizeMode="cover" />
        ) : (
          <Stack
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            justify="center"
            align="center"
          >
            <Spinner color="gray" />
          </Stack>
        )}
        {(photo.isRefreshingUrl || isDeleting) && (
          <Stack
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.35)' }}
            align="center"
            justify="center"
            gap={8}
          >
            <Spinner size="lg" />
            <Text style={{ color: 'white' }}>
              {isDeleting ? 'Removing…' : 'Refreshing…'}
            </Text>
          </Stack>
        )}
      </View>

      <Stack gap={12} style={{ padding: 8 }}>
        <Row align="center" justify="space-between" gap={12}>
          <Row gap={8} align="center">
            <Tag size="md" color="#414e62" />
            <Text>{typeOption?.label ?? 'Uncategorized'}</Text>
          </Row>
          <Row gap={8}>
            {canToggleVisibility ? (
              <Button
                size="sm"
                variant="outline"
                iconStart={photo.showOnProfile ? Eye : EyeOff}
                disabled={disabled}
                onPress={handleToggleVisibility}
              >
                {photo.showOnProfile ? 'Public' : 'Private'}
              </Button>
            ) : (
              <Text style={{ color: '#414e62' }}>
                {photo.showOnProfile ? 'Visible on profile' : 'Hidden from profile'}
              </Text>
            )}
            {canDelete ? (
              <Button
                size="sm"
                variant="outline"
                iconStart={Trash2}
                disabled={disabled || isDeleting}
                onPress={handleDelete}
              >
                Delete
              </Button>
            ) : null}
          </Row>
        </Row>

        <Stack gap={8}>
          <Text>Caption</Text>
          {canEditCaption && isEditingCaption ? (
            <Stack gap={8}>
              <Input
                value={captionDraft}
                onChangeText={setCaptionDraft}
                placeholder="Add an optional caption"
                multiline
                numberOfLines={Platform.select({ web: undefined, default: 3 })}
              />
              <Row gap={8}>
                <Button
                  size="sm"
                  iconStart={Check}
                  disabled={isSavingCaption}
                  onPress={handleSaveCaption}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  iconStart={X}
                  variant="outline"
                  disabled={isSavingCaption}
                  onPress={handleCancelCaption}
                >
                  Cancel
                </Button>
              </Row>
            </Stack>
          ) : canEditCaption ? (
            <Row gap={8} align="center">
              <Text style={{ flex: 1, color: photo.caption ? undefined : '#414e62' }}>
                {photo.caption ?? 'No caption provided.'}
              </Text>
              <Button
                size="sm"
                iconStart={Edit3}
                variant="outline"
                disabled={disabled}
                onPress={() => setIsEditingCaption(true)}
              >
                Edit
              </Button>
            </Row>
          ) : (
            <Text style={{ flex: 1, color: photo.caption ? undefined : '#414e62' }}>
              {photo.caption ?? 'No caption provided.'}
            </Text>
          )}
        </Stack>

        <Separator />

        <Stack gap={8}>
          <Text>Photo Type</Text>
          {canChangeType ? (
            <ResponsiveSelect
              value={(photo.photoType ?? 'general') as Exclude<WorkLogPhotoType, null>}
              onValueChange={(value) => handleUpdateType(value as WorkLogPhotoType)}
              placeholder="Choose category"
              disabled={disabled}
              options={PHOTO_TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              triggerProps={{ width: '100%' }}
            />
          ) : (
            <Text style={{ color: '#414e62' }}>{typeOption?.label ?? 'Uncategorized'}</Text>
          )}
        </Stack>

        <Separator />

        <Stack gap={4}>
          <Text>Details</Text>
          <Text style={{ color: '#414e62' }}>Size: {formatBytes(photo.fileSizeBytes)}</Text>
          {photo.takenAt ? (
            <Text style={{ color: '#414e62' }}>Taken: {formatDate(photo.takenAt) ?? 'Unknown'}</Text>
          ) : null}
          {photo.createdAt ? (
            <Text style={{ color: '#414e62' }}>Uploaded: {formatDate(photo.createdAt) ?? 'Unknown'}</Text>
          ) : null}
        </Stack>
      </Stack>
    </Stack>
  )
}
