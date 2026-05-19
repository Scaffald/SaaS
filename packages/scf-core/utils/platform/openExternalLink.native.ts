import { Linking } from 'react-native'
import type { OpenExternalLink } from './openExternalLink'

let webBrowserModule: typeof import('expo-web-browser') | null | undefined

function loadWebBrowser() {
  if (webBrowserModule !== undefined) return webBrowserModule
  try {
    webBrowserModule = require('expo-web-browser') as typeof import('expo-web-browser')
  } catch {
    webBrowserModule = null
  }
  return webBrowserModule
}

export const openExternalLink: OpenExternalLink = (url, opts) => {
  if (!url) return

  if (opts?.inApp) {
    const wb = loadWebBrowser()
    if (wb) {
      void wb.openBrowserAsync(url).catch(() => {
        void Linking.openURL(url)
      })
      return
    }
  }

  void Linking.openURL(url).catch((error) => {
    console.warn('[openExternalLink] failed to open URL', url, error)
  })
}
