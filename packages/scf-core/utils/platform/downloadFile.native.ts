import { Linking } from 'react-native'
import type { DownloadFile } from './downloadFile'

export const downloadFile: DownloadFile = async ({ url }) => {
  if (!url) return
  try {
    await Linking.openURL(url)
  } catch (error) {
    console.warn('[downloadFile] failed to open URL', url, error)
  }
}
