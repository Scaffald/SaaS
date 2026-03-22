/**
 * Liquid Glass Components Stories
 * Demonstrates the Apple iOS 26 Liquid Glass material system
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View } from 'react-native'
import { useState } from 'react'
import { GlassSurface } from '../../../components/GlassSurface'
import { GlassPanel } from '../../../components/GlassPanel'
import { GlassIconButton } from '../../../components/GlassIconButton'
import { GlassGroup } from '../../../components/GlassGroup'
import { GlassSlider } from '../../../components/GlassSlider'
import { GlassWidget } from '../../../components/GlassWidget'
import { Text, H4 } from '../../../components/Typography'
import { Stack, Row } from '../../../components/Layout'
import { Button } from '../../../components/Button'
import type { GlassMaterial } from '../../../tokens/glass'

/**
 * Colorful wallpaper background for demonstrating glass transparency
 */
function WallpaperBackground({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        padding: 32,
        minHeight: 500,
        borderRadius: 20,
        overflow: 'hidden',
        background:
          'linear-gradient(135deg, #1a1a2e 0%, #16213e 20%, #0f3460 40%, #533483 60%, #e94560 80%, #f38181 100%)',
      } as Record<string, unknown> as import('react-native').ViewStyle}
    >
      {children}
    </View>
  )
}

const meta: Meta = {
  title: 'Components/Liquid Glass',
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        component:
          'Apple iOS 26 Liquid Glass material system. Supports 5 material densities (ultrathin → chrome) with multi-layer backdrop-blur and blend modes on web.',
      },
    },
  },
}

export default meta

// ============================================================================
// Material Densities
// ============================================================================

export const MaterialDensities: StoryObj = {
  name: 'Material Densities',
  render: () => {
    const materials: GlassMaterial[] = ['ultrathin', 'thin', 'regular', 'thick', 'chrome']
    return (
      <WallpaperBackground>
        <Text style={{ color: 'white', marginBottom: 24, fontWeight: '600', fontSize: 18 }}>
          Glass Material Densities
        </Text>
        <Row gap={16} style={{ flexWrap: 'wrap' }}>
          {materials.map((material) => (
            <GlassSurface
              key={material}
              material={material}
              radius="xl"
              padding="lg"
              specularBorder
              style={{ width: 160, height: 120 }}
            >
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>
                {material}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>
                Glass surface
              </Text>
            </GlassSurface>
          ))}
        </Row>
      </WallpaperBackground>
    )
  },
}

// ============================================================================
// Control Center
// ============================================================================

export const ControlCenter: StoryObj = {
  name: 'Control Center Demo',
  render: () => {
    const [brightness, setBrightness] = useState(0.6)
    const [volume, setVolume] = useState(0.4)

    const CircleIcon = ({ char }: { char: string }) => (
      <Text style={{ color: 'white', fontSize: 19, fontWeight: 'bold' }}>{char}</Text>
    )

    return (
      <WallpaperBackground>
        <Text style={{ color: 'white', marginBottom: 24, fontWeight: '600', fontSize: 18 }}>
          Control Center
        </Text>
        <Row gap={16} style={{ alignItems: 'flex-start' }}>
          {/* Connectivity group */}
          <GlassGroup radius="2xl" gap={8}>
            <GlassIconButton
              icon={<CircleIcon char="✈" />}
              onPress={() => {}}
              accessibilityLabel="Airplane Mode"
            />
            <GlassIconButton
              icon={<CircleIcon char="📶" />}
              onPress={() => {}}
              active
              activeColor="rgba(0, 136, 255, 0.95)"
              accessibilityLabel="Wi-Fi"
            />
            <GlassIconButton
              icon={<CircleIcon char="📱" />}
              onPress={() => {}}
              active
              activeColor="rgba(52, 199, 89, 1)"
              size="sm"
              accessibilityLabel="Cellular"
            />
            <GlassIconButton
              icon={<CircleIcon char="🔵" />}
              onPress={() => {}}
              size="sm"
              accessibilityLabel="Bluetooth"
            />
          </GlassGroup>

          {/* Brightness & Volume sliders */}
          <GlassSlider
            value={brightness}
            onValueChange={setBrightness}
            vertical
            icon={<Text style={{ color: 'white', fontSize: 20 }}>☀️</Text>}
            accessibilityLabel="Brightness"
          />
          <GlassSlider
            value={volume}
            onValueChange={setVolume}
            vertical
            icon={<Text style={{ color: 'white', fontSize: 20 }}>🔊</Text>}
            accessibilityLabel="Volume"
          />

          {/* Standalone icon buttons */}
          <Stack gap={12}>
            <GlassIconButton
              icon={<CircleIcon char="📷" />}
              onPress={() => {}}
              accessibilityLabel="Camera"
            />
            <GlassIconButton
              icon={<CircleIcon char="🔇" />}
              onPress={() => {}}
              accessibilityLabel="Silent Mode"
            />
          </Stack>
        </Row>

        {/* Widgets row */}
        <Row gap={16} style={{ marginTop: 16 }}>
          <GlassWidget
            title="Focus"
            subtitle="Do Not Disturb"
            icon={<Text style={{ color: 'white', fontSize: 15 }}>🌙</Text>}
            size="md"
          />
          <GlassWidget
            title="Floor Lamp"
            subtitle="Living Room"
            icon={<Text style={{ color: 'white', fontSize: 15 }}>💡</Text>}
            size="lg"
          />
        </Row>
      </WallpaperBackground>
    )
  },
}

// ============================================================================
// Glass Panel
// ============================================================================

export const GlassPanels: StoryObj = {
  name: 'Glass Panels',
  render: () => (
    <WallpaperBackground>
      <Stack gap={16}>
        <GlassPanel
          material="thick"
          padding="xl"
          radius="xl"
          header={
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 17 }}>
              Now Playing
            </Text>
          }
        >
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>
            Track Name — Artist
          </Text>
        </GlassPanel>

        <GlassPanel material="regular" padding="lg">
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 15, marginBottom: 8 }}>
            Settings Group
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
            Content rendered inside a glass panel with regular density.
          </Text>
        </GlassPanel>

        <GlassPanel material="ultrathin" padding="lg">
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 15, marginBottom: 8 }}>
            Ultrathin Panel
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
            Maximum wallpaper bleed-through for subtle separation.
          </Text>
        </GlassPanel>
      </Stack>
    </WallpaperBackground>
  ),
}

// ============================================================================
// Glass Button Variant
// ============================================================================

export const GlassButtons: StoryObj = {
  name: 'Glass Button Variant',
  render: () => (
    <WallpaperBackground>
      <Stack gap={12}>
        <Row gap={12}>
          <Button variant="glass" size="md">Glass Button</Button>
          <Button variant="glass" size="sm">Small</Button>
          <Button variant="glass" size="lg">Large</Button>
        </Row>
        <Row gap={12}>
          <Button variant="glass" color="primary">Primary Glass</Button>
          <Button variant="glass" disabled>Disabled</Button>
        </Row>
      </Stack>
    </WallpaperBackground>
  ),
}
