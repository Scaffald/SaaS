import { usePathname } from '@scf/core/utils/usePathname'
import { useEffect, useMemo, useState } from 'react'
import { Dimensions, Platform, useWindowDimensions } from 'react-native'
import UAParser from 'ua-parser-js'

export interface FeedbackContextPayload {
  pageUrl: string
  pageTitle?: string | null
  userAgent: string
  browserName?: string | null
  browserVersion?: string | null
  operatingSystem?: string | null
  screenResolution?: string | null
  viewportSize?: string | null
}

function getWebBrowserInfo(): Pick<
  FeedbackContextPayload,
  | 'userAgent'
  | 'browserName'
  | 'browserVersion'
  | 'operatingSystem'
  | 'screenResolution'
  | 'viewportSize'
> {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'unknown',
      browserName: null,
      browserVersion: null,
      operatingSystem: null,
      screenResolution: null,
      viewportSize: null,
    }
  }

  const userAgent = navigator.userAgent ?? 'unknown'
  const parser = new UAParser(userAgent)
  const browser = parser.getBrowser()
  const os = parser.getOS()

  const screenResolution =
    window.screen?.width && window.screen?.height
      ? `${window.screen.width}x${window.screen.height}`
      : null

  const viewportSize = `${window.innerWidth}x${window.innerHeight}`

  return {
    userAgent,
    browserName: browser.name ?? null,
    browserVersion: browser.version ?? null,
    operatingSystem: os.name ? `${os.name}${os.version ? ` ${os.version}` : ''}` : null,
    screenResolution,
    viewportSize,
  }
}

function getNativeDeviceInfo(): Pick<
  FeedbackContextPayload,
  | 'userAgent'
  | 'operatingSystem'
  | 'screenResolution'
  | 'viewportSize'
  | 'browserName'
  | 'browserVersion'
> {
  const screen = Dimensions.get('screen')
  const viewport = Dimensions.get('window')

  const screenResolution =
    screen?.width && screen?.height
      ? `${Math.round(screen.width)}x${Math.round(screen.height)}`
      : null

  const viewportSize =
    viewport?.width && viewport?.height
      ? `${Math.round(viewport.width)}x${Math.round(viewport.height)}`
      : null

  return {
    userAgent: `expo-${Platform.OS}`,
    operatingSystem: Platform.OS,
    screenResolution,
    viewportSize,
    browserName: 'in-app',
    browserVersion: null,
  }
}

export function useFeedbackContext(pageTitleOverride?: string): FeedbackContextPayload {
  const pathname = usePathname()
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions()
  const [pageTitle, setPageTitle] = useState<string | null>(null)

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      setPageTitle(document.title ?? null)
    } else {
      setPageTitle(null)
    }
  }, [])

  const deviceInfo = useMemo(() => {
    if (Platform.OS === 'web') {
      return getWebBrowserInfo()
    }

    const baseInfo = getNativeDeviceInfo()
    const viewportSize =
      viewportWidth && viewportHeight
        ? `${Math.round(viewportWidth)}x${Math.round(viewportHeight)}`
        : baseInfo.viewportSize

    return {
      ...baseInfo,
      viewportSize,
    }
  }, [viewportWidth, viewportHeight])

  return {
    pageUrl: pathname ?? '/',
    pageTitle: pageTitleOverride ?? pageTitle,
    ...deviceInfo,
  }
}
