/**
 * SettingsIntegrationsGrid component types
 */

import type { ViewStyle } from 'react-native'
import type { IconComponent } from '../types'

export interface Integration {
  /**
   * Unique identifier for the integration
   */
  id: string

  /**
   * Integration icon component
   */
  icon: IconComponent

  /**
   * Integration title
   */
  title: string

  /**
   * Integration description
   */
  description: string

  /**
   * Whether the integration is enabled
   */
  enabled: boolean
}

export interface SettingsIntegrationsGridProps {
  /**
   * Integrations data
   */
  integrations: Integration[]

  /**
   * Callback when an integration's toggle changes
   */
  onIntegrationChange?: (id: string, enabled: boolean) => void

  /**
   * Custom container style
   */
  style?: ViewStyle
}
