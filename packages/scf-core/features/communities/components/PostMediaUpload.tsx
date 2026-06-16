import { type ChangeEvent, useCallback, useRef, useState } from 'react'
import { Image, Platform } from 'react-native'
import { Button, Spinner, Text, Row, Stack, useFilePicker, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { AlertCircle, ImagePlus, Trash2 } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@scf/core/utils/supabase/client'
import { getStorageUrl } from '@scf/core/utils/supabase/storage'
import { useUser } from '@scf/core/provider/auth/useAuth'

const BUCKET = 'community-media'
const MAX_IMAGES = 6
const MAX_SIZE_MB = 10
// Note: the `community-media` bucket allowlist accepts `image/jpeg` (not the
// `image/jpg` some pickers report) — normalizeMime() below maps jpg → jpeg so
// the upload isn't rejected with a confusing 400 (SC-128 #6).
const ACCEPT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

/** Map picker-reported aliases to the canonical mime the storage bucket accepts. */
function normalizeMime(mimeType: string): string {
  const m = mimeType.toLowerCase()
  return m === 'image/jpg' ? 'image/jpeg' : m
}

export interface PostMediaUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  disabled?: boolean
}

interface NativeAsset {
  uri: string
  width?: number
  height?: number
  type?: string
}

export function PostMediaUpload({ value, onChange, disabled }: PostMediaUploadProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const user = useUser()
  const userId = user?.id
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const slotsRemaining = MAX_IMAGES - value.length
  const canUploadMore = slotsRemaining > 0 && !disabled

  const validateFile = useCallback((mimeType: string, sizeBytes: number): string | null => {
    if (!ACCEPT_TYPES.includes(mimeType.toLowerCase())) {
      return `Unsupported file type (${mimeType}). Use JPG, PNG, WEBP or GIF.`
    }
    const sizeMB = sizeBytes / (1024 * 1024)
    if (sizeMB > MAX_SIZE_MB) {
      return `File is ${sizeMB.toFixed(1)}MB; max is ${MAX_SIZE_MB}MB.`
    }
    return null
  }, [])

  const buildPath = useCallback(
    (extension: string) => {
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`
      return `${userId}/posts/${unique}`
    },
    [userId]
  )

  const uploadOne = useCallback(
    async (blob: Blob, mimeType: string, fileNameHint: string): Promise<string> => {
      const normalized = normalizeMime(mimeType)
      const validation = validateFile(normalized, blob.size)
      if (validation) throw new Error(validation)

      const ext = (normalized.split('/')[1] || fileNameHint.split('.').pop() || 'jpg').toLowerCase()
      const path = buildPath(ext)

      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: normalized, upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      const url = getStorageUrl(BUCKET, data.path)
      if (!url) throw new Error('Could not resolve uploaded file URL.')
      return url
    },
    [buildPath, validateFile]
  )

  const uploadFiles = useCallback(
    async (files: Array<{ blob: Blob; mimeType: string; fileName: string }>) => {
      if (!userId) {
        const msg = 'You must be signed in to upload media.'
        setError(msg)
        return
      }
      const limited = files.slice(0, slotsRemaining)
      setError(undefined)
      setIsUploading(true)
      try {
        const uploaded: string[] = []
        for (const f of limited) {
          const url = await uploadOne(f.blob, f.mimeType, f.fileName)
          uploaded.push(url)
        }
        onChange([...value, ...uploaded])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed.')
      } finally {
        setIsUploading(false)
      }
    },
    [onChange, slotsRemaining, uploadOne, userId, value]
  )

  const handleWebFiles = useCallback(
    async (files: File[]) => {
      const prepared = files.map((file) => ({
        blob: file,
        mimeType: file.type || 'image/jpeg',
        fileName: file.name,
      }))
      await uploadFiles(prepared)
    },
    [uploadFiles]
  )

  const handleNativeAssets = useCallback(
    async (assets: NativeAsset[]) => {
      const prepared = await Promise.all(
        assets.map(async (asset) => {
          const response = await fetch(asset.uri)
          const blob = await response.blob()
          const mimeType = asset.type || blob.type || 'image/jpeg'
          const ext = mimeType.split('/').pop() || 'jpg'
          return {
            blob,
            mimeType,
            fileName: `image-${Date.now()}.${ext}`,
          }
        })
      )
      await uploadFiles(prepared)
    },
    [uploadFiles]
  )

  const handlePicked = useCallback(
    async (param: {
      webFiles: File[] | null
      nativeFiles: NativeAsset[] | null
    }) => {
      if (param.webFiles?.length) await handleWebFiles(param.webFiles)
      else if (param.nativeFiles?.length) await handleNativeAssets(param.nativeFiles)
    },
    [handleWebFiles, handleNativeAssets]
  )

  const openNativePicker = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: slotsRemaining,
      allowsEditing: false,
    })
    if (result.canceled || !result.assets?.length) return
    await handleNativeAssets(
      result.assets.map((a) => ({
        uri: a.uri,
        width: a.width,
        height: a.height,
        type: a.mimeType ?? undefined,
      }))
    )
  }, [handleNativeAssets, slotsRemaining])

  const { open, getRootProps, dragStatus } = useFilePicker({
    onPick: handlePicked,
    onOpenNative: openNativePicker,
  })
  const isDragActive = dragStatus?.isDragActive

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (files?.length) {
        void handleWebFiles(Array.from(files))
      }
      if (event.target) event.target.value = ''
    },
    [handleWebFiles]
  )

  const triggerPicker = useCallback(() => {
    if (Platform.OS === 'web') fileInputRef.current?.click()
    else open()
  }, [open])

  const removeAt = useCallback(
    async (index: number) => {
      const removed = value[index]
      onChange(value.filter((_, i) => i !== index))
      // Best-effort delete from storage; ignore failures (RLS will prevent unauthorized deletes anyway)
      if (removed?.includes(`/${BUCKET}/`)) {
        const parts = removed.split(`/${BUCKET}/`)
        const path = parts[1]
        if (path) {
          await supabase.storage
            .from(BUCKET)
            .remove([path])
            .catch(() => undefined)
        }
      }
    },
    [onChange, value]
  )

  return (
    <Stack gap={8}>
      {value.length > 0 && (
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {value.map((url, idx) => (
            <Stack key={url} style={{ position: 'relative' }}>
              <Image
                source={{ uri: url }}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border[t].default,
                }}
                resizeMode="cover"
              />
              <Button
                size="sm"
                variant="filled"
                color="error"
                onPress={() => removeAt(idx)}
                disabled={disabled || isUploading}
                iconStart={Trash2}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  paddingHorizontal: 6,
                  minWidth: 24,
                  minHeight: 24,
                }}
              >
                {''}
              </Button>
            </Stack>
          ))}
        </Row>
      )}

      {canUploadMore && (
        <Stack
          align="center"
          justify="center"
          style={{
            height: 120,
            borderRadius: 12,
            borderWidth: 2,
            borderStyle: isDragActive ? 'solid' : 'dashed',
            borderColor: isDragActive
              ? colors.info[500]
              : error
                ? colors.error[500]
                : colors.border[t].default,
            opacity: disabled ? 0.5 : 1,
          }}
          gap={6}
          {...(Platform.OS === 'web' && getRootProps
            ? (getRootProps() as Record<string, unknown>)
            : {})}
        >
          {isUploading ? (
            <>
              <Spinner size="lg" />
              <Text style={{ color: colors.text[t].secondary, fontSize: 13 }}>Uploading…</Text>
            </>
          ) : (
            <>
              <ImagePlus size={28} color={colors.text[t].secondary} />
              <Text style={{ color: colors.text[t].secondary, fontSize: 13 }}>
                {isDragActive ? 'Drop images here' : 'Drag & drop images, or'}
              </Text>
              <Button size="sm" variant="outline" onPress={triggerPicker} disabled={disabled}>
                Choose Images
              </Button>
              <Text style={{ color: colors.text[t].tertiary, fontSize: 11 }}>
                {value.length}/{MAX_IMAGES} • JPG, PNG, WEBP, GIF (max {MAX_SIZE_MB}MB each)
              </Text>
            </>
          )}
        </Stack>
      )}

      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_TYPES.join(',')}
          multiple
          onChange={handleInputChange}
          style={{ display: 'none' }}
          disabled={disabled || isUploading || !canUploadMore}
        />
      )}

      {error && (
        <Row
          gap={6}
          align="center"
          style={{
            padding: 8,
            borderRadius: 8,
            backgroundColor: t === 'dark' ? colors.error[900] : colors.error[50],
          }}
        >
          <AlertCircle size={16} color={colors.error[500]} />
          <Text style={{ color: colors.error[500], flex: 1, fontSize: 13 }}>{error}</Text>
        </Row>
      )}
    </Stack>
  )
}
