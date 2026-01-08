/**
 * Buttons Playground Story
 * Interactive playground matching Figma design with all button group examples
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Playground } from '../../playground/Playground'
import { PlaygroundSection } from '../../playground/PlaygroundSection'
import { ThemeComparison } from '../../playground/ThemeComparison'
import { ThemedButtonGroup } from '../../playground/ThemedButtonGroup'
import {
  CloudDownloadIcon,
  HeartIcon,
  AlignTopIcon,
  AlignCenterIcon,
  AlignBottomIcon,
  MinusIcon,
  PlusIcon,
  ArrowSeparateVerticalIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '../../playground/icons'
import { spacing } from '../../tokens/spacing'

const meta: Meta<typeof ButtonsPlayground> = {
  title: 'Playground/Buttons',
  component: ButtonsPlayground,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Interactive button group playground showcasing various button group patterns from the Figma design system.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof ButtonsPlayground>

export function ButtonsPlayground({ theme }: { theme?: 'light' | 'dark' }) {
  const [downloadValue, setDownloadValue] = useState('')
  const [likeValue, setLikeValue] = useState('')
  const [timePeriodValue, setTimePeriodValue] = useState('week')
  const [fileTypeValue, setFileTypeValue] = useState('pdf')
  const [alignmentValue, setAlignmentValue] = useState('top')
  const [fontSizeValue, setFontSizeValue] = useState('16pt')
  const [zoomValue, setZoomValue] = useState('')

  const contentProps = {
    downloadValue,
    setDownloadValue,
    likeValue,
    setLikeValue,
    timePeriodValue,
    setTimePeriodValue,
    fileTypeValue,
    setFileTypeValue,
    alignmentValue,
    setAlignmentValue,
    fontSizeValue,
    setFontSizeValue,
    zoomValue,
    setZoomValue,
  }

  if (theme) {
    // Single theme view
    return (
      <View style={styles.singleTheme}>
        <ButtonsContent {...contentProps} />
      </View>
    )
  }

  // Side-by-side view (default)
  return (
    <ThemeComparison>
      {() => (
        <View style={styles.container}>
          <ButtonsContent {...contentProps} />
        </View>
      )}
    </ThemeComparison>
  )
}

interface ButtonsContentProps {
  downloadValue: string
  setDownloadValue: (value: string) => void
  likeValue: string
  setLikeValue: (value: string) => void
  timePeriodValue: string
  setTimePeriodValue: (value: string) => void
  fileTypeValue: string
  setFileTypeValue: (value: string) => void
  alignmentValue: string
  setAlignmentValue: (value: string) => void
  fontSizeValue: string
  setFontSizeValue: (value: string) => void
  zoomValue: string
  setZoomValue: (value: string) => void
}

function ButtonsContent({
  downloadValue,
  setDownloadValue,
  likeValue,
  setLikeValue,
  timePeriodValue,
  setTimePeriodValue,
  fileTypeValue,
  setFileTypeValue,
  alignmentValue,
  setAlignmentValue,
  fontSizeValue,
  setFontSizeValue,
  zoomValue,
  setZoomValue,
}: ButtonsContentProps) {
  return (
    <Playground>
      <PlaygroundSection>
        {/* 1. Download button group with count */}
        <ThemedButtonGroup
          items={[
            {
              id: 'download',
              label: 'Download',
              icon: CloudDownloadIcon,
              iconPosition: 'start',
            },
            {
              id: 'count',
              label: '105K',
            },
          ]}
          value={downloadValue}
          onChange={(value) => setDownloadValue(value as string)}
          size="sm"
        />

        {/* 2. Like button group with count and heart icon */}
        <ThemedButtonGroup
          items={[
            {
              id: 'like',
              label: 'Like',
              icon: HeartIcon,
              iconPosition: 'start',
            },
            {
              id: 'count',
              label: '46',
            },
          ]}
          value={likeValue}
          onChange={(value) => setLikeValue(value as string)}
          size="sm"
        />

        {/* 3. Time period selector */}
        <ThemedButtonGroup
          items={[
            { id: 'day', label: 'Day' },
            { id: 'week', label: 'Week' },
            { id: 'month', label: 'Month' },
            { id: 'year', label: 'Year' },
            { id: 'custom', label: 'Custom' },
          ]}
          value={timePeriodValue}
          onChange={(value) => setTimePeriodValue(value as string)}
          size="md"
          fullWidth
        />

        {/* 4. File type filter */}
        <ThemedButtonGroup
          items={[
            { id: 'all', label: 'All' },
            { id: 'jpg', label: '.jpg' },
            { id: 'pdf', label: '.pdf' },
            { id: 'png', label: '.png' },
            { id: 'fig', label: '.fig' },
            { id: 'psd', label: '.psd' },
            { id: 'doc', label: '.doc' },
          ]}
          value={fileTypeValue}
          onChange={(value) => setFileTypeValue(value as string)}
          size="sm"
        />

        {/* 5. Alignment buttons with icons */}
        <ThemedButtonGroup
          items={[
            {
              id: 'top',
              label: 'Top',
              icon: AlignTopIcon,
              iconPosition: 'start',
            },
            {
              id: 'center',
              label: 'Center',
              icon: AlignCenterIcon,
              iconPosition: 'start',
            },
            {
              id: 'bottom',
              label: 'Bottom',
              icon: AlignBottomIcon,
              iconPosition: 'start',
            },
          ]}
          value={alignmentValue}
          onChange={(value) => setAlignmentValue(value as string)}
          size="md"
        />

        {/* 6. Font size control */}
        <ThemedButtonGroup
          items={[
            {
              id: 'decrease',
              icon: MinusIcon,
            },
            {
              id: 'size',
              label: '16pt',
              icon: ArrowSeparateVerticalIcon,
              iconPosition: 'end',
            },
            {
              id: 'increase',
              icon: PlusIcon,
            },
          ]}
          value={fontSizeValue}
          onChange={(value) => setFontSizeValue(value as string)}
          size="md"
        />

        {/* 7. Zoom controls */}
        <ThemedButtonGroup
          items={[
            {
              id: 'zoom-in',
              icon: ZoomInIcon,
            },
            {
              id: 'zoom-out',
              icon: ZoomOutIcon,
            },
          ]}
          value={zoomValue}
          onChange={(value) => setZoomValue(value as string)}
          size="md"
        />
      </PlaygroundSection>
    </Playground>
  )
}

export const Default: Story = {
  render: () => <ButtonsPlayground />,
}

export const LightMode: Story = {
  render: () => <ButtonsPlayground theme="light" />,
  parameters: {
    backgrounds: { default: 'light' },
  },
}

export const DarkMode: Story = {
  render: () => <ButtonsPlayground theme="dark" />,
  parameters: {
    backgrounds: { default: 'dark' },
  },
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  singleTheme: {
    flex: 1,
    padding: spacing[80],
  },
})
