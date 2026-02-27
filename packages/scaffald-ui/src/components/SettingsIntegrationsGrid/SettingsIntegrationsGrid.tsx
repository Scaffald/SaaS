/**
 * SettingsIntegrationsGrid component
 * Grid layout for integration cards
 *
 * @example
 * ```tsx
 * import { SettingsIntegrationsGrid } from '@scaffald/ui'
 *
 * <SettingsIntegrationsGrid
 *   integrations={integrations}
 *   onIntegrationChange={(id, enabled) => {
 *     // Update integration
 *   }}
 * />
 * ```
 */

import { View } from 'react-native'
import type { SettingsIntegrationsGridProps } from './SettingsIntegrationsGrid.types'
import { SettingsToggleCard } from '../SettingsToggleCard'
import { Row } from '../Layout'
import { spacing } from '../../tokens/spacing'

export function SettingsIntegrationsGrid({
  integrations,
  onIntegrationChange,
  style,
}: SettingsIntegrationsGridProps) {
  const handleToggleChange = (id: string, enabled: boolean) => {
    onIntegrationChange?.(id, enabled)
  }

  return (
    <View style={style}>
      <Row
        style={{
          flexWrap: 'wrap',
          gap: spacing[24],
        }}
      >
        {integrations.map((integration) => (
          <View
            key={integration.id}
            style={{
              minWidth: 280,
              flex: 1,
              maxWidth: 400,
            }}
          >
            <SettingsToggleCard
              icon={integration.icon}
              title={integration.title}
              description={integration.description}
              enabled={integration.enabled}
              onToggleChange={(enabled) => handleToggleChange(integration.id, enabled)}
            />
          </View>
        ))}
      </Row>
    </View>
  )
}
