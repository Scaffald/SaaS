/**
 * iOS 26 Controls Stories
 * Demonstrates SegmentedControl, PageControl, ProgressBar (ios), Spinner (ios)
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View } from 'react-native'
import { useState } from 'react'
import { SegmentedControl } from '../../../components/SegmentedControl'
import { PageControl } from '../../../components/PageControl'
import { ProgressBarBase } from '../../../components/ProgressBar/ProgressBarBase'
import { Spinner } from '../../../components/Spinner/Spinner'
import { Stack, Row } from '../../../components/Layout'
import { Text, H4 } from '../../../components/Typography'

const meta: Meta = {
  title: 'Components/iOS 26 Controls',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'iOS 26 style controls: SegmentedControl, PageControl, ProgressBar, and Spinner variants.',
      },
    },
  },
}

export default meta

// ============================================================================
// Segmented Control
// ============================================================================

export const SegmentedControls: StoryObj = {
  name: 'Segmented Control',
  render: () => {
    const [selected2, setSelected2] = useState(0)
    const [selected3, setSelected3] = useState(1)
    const [selected4, setSelected4] = useState(2)
    const [selected5, setSelected5] = useState(0)

    return (
      <Stack gap={32} style={{ maxWidth: 400 }}>
        <Stack gap={8}>
          <Text size="sm" color="tertiary">2 Segments</Text>
          <SegmentedControl
            segments={['Label', 'Label']}
            selectedIndex={selected2}
            onSelectionChange={setSelected2}
          />
        </Stack>

        <Stack gap={8}>
          <Text size="sm" color="tertiary">3 Segments</Text>
          <SegmentedControl
            segments={['Label', 'Label', 'Label']}
            selectedIndex={selected3}
            onSelectionChange={setSelected3}
          />
        </Stack>

        <Stack gap={8}>
          <Text size="sm" color="tertiary">4 Segments</Text>
          <SegmentedControl
            segments={['Label', 'Label', 'Label', 'Label']}
            selectedIndex={selected4}
            onSelectionChange={setSelected4}
          />
        </Stack>

        <Stack gap={8}>
          <Text size="sm" color="tertiary">5 Segments</Text>
          <SegmentedControl
            segments={['Label', 'Label', 'Label', 'Label', 'Label']}
            selectedIndex={selected5}
            onSelectionChange={setSelected5}
          />
        </Stack>
      </Stack>
    )
  },
}

// ============================================================================
// Page Control
// ============================================================================

export const PageControls: StoryObj = {
  name: 'Page Control',
  render: () => {
    const [page2, setPage2] = useState(0)
    const [page3, setPage3] = useState(0)
    const [page5, setPage5] = useState(2)
    const [page7, setPage7] = useState(0)

    return (
      <Stack gap={24} style={{ alignItems: 'center' }}>
        <Stack gap={4} style={{ alignItems: 'center' }}>
          <Text size="sm" color="tertiary">2 Pages</Text>
          <PageControl totalPages={2} currentPage={page2} onPageChange={setPage2} />
        </Stack>

        <Stack gap={4} style={{ alignItems: 'center' }}>
          <Text size="sm" color="tertiary">3 Pages</Text>
          <PageControl totalPages={3} currentPage={page3} onPageChange={setPage3} />
        </Stack>

        <Stack gap={4} style={{ alignItems: 'center' }}>
          <Text size="sm" color="tertiary">5 Pages (page 3 selected)</Text>
          <PageControl totalPages={5} currentPage={page5} onPageChange={setPage5} />
        </Stack>

        <Stack gap={4} style={{ alignItems: 'center' }}>
          <Text size="sm" color="tertiary">7 Pages</Text>
          <PageControl totalPages={7} currentPage={page7} onPageChange={setPage7} />
        </Stack>
      </Stack>
    )
  },
}

// ============================================================================
// Progress Bar (iOS variant)
// ============================================================================

export const ProgressBars: StoryObj = {
  name: 'Progress Bar (iOS)',
  render: () => (
    <Stack gap={24} style={{ maxWidth: 400, paddingHorizontal: 16 }}>
      <Text weight="semibold">iOS 26 Progress Bars</Text>
      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
        <View key={value} style={{ height: 44, justifyContent: 'center' }}>
          <ProgressBarBase value={value} variant="ios" />
        </View>
      ))}
    </Stack>
  ),
}

// ============================================================================
// Spinner (iOS variant)
// ============================================================================

export const Spinners: StoryObj = {
  name: 'Spinner (iOS)',
  render: () => (
    <Stack gap={32}>
      <Text weight="semibold">iOS 26 Activity Indicators</Text>
      <Row gap={32} style={{ alignItems: 'center' }}>
        <Stack gap={8} style={{ alignItems: 'center' }}>
          <Spinner variant="ios" size="md" />
          <Text size="sm" color="tertiary">Regular (30px)</Text>
        </Stack>
        <Stack gap={8} style={{ alignItems: 'center' }}>
          <Spinner variant="ios" size="sm" />
          <Text size="sm" color="tertiary">Small (22px)</Text>
        </Stack>
      </Row>
      <Text weight="semibold" style={{ marginTop: 16 }}>Default Spinner</Text>
      <Row gap={32} style={{ alignItems: 'center' }}>
        <Spinner size="sm" />
        <Spinner size="md" />
      </Row>
    </Stack>
  ),
}
