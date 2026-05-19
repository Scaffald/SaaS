import * as DocumentPicker from 'expo-document-picker'
import type { PickFile, PickedFile } from './pickFile'

export const pickFile: PickFile = async ({ accept, multiple = false } = {}) => {
  const result = await DocumentPicker.getDocumentAsync({
    type: accept ? accept.split(',').map((s) => s.trim()) : '*/*',
    multiple,
    copyToCacheDirectory: true,
  })

  if (result.canceled) return []

  return result.assets.map<PickedFile>((asset) => ({
    name: asset.name,
    type: asset.mimeType ?? null,
    size: asset.size ?? null,
    file: null,
    uri: asset.uri,
  }))
}
