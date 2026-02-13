/**
 * Slider component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Slider } from '../../../components/Slider'
import { ThemeComparison } from '../../../playground'
import { colors } from '../../../tokens/colors'
import { spacing } from '../../../tokens/spacing'
import { typography, fontSize, lineHeight } from '../../../tokens/typography'

const meta = {
  title: 'Components/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

// Basic slider (uncontrolled)
export const Default: Story = {
  args: {
    color: 'primary',
    indicatorPosition: 'top',
    min: 0,
    max: 100,
    step: 1,
  },
}

// Controlled slider
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState(50)

    return (
      <View style={styles.container}>
        <Text style={styles.label}>Value: {value}</Text>
        <Slider value={value} onValueChange={setValue} />
      </View>
    )
  },
}

// Color variants
export const Colors: Story = {
  render: () => {
    const [grayValue, setGrayValue] = useState(50)
    const [primaryValue, setPrimaryValue] = useState(50)

    return (
      <View style={styles.variantsContainer}>
        <Text style={styles.sectionTitle}>Color Variants</Text>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Gray - Value: {grayValue}</Text>
          <Slider color="gray" value={grayValue} onValueChange={setGrayValue} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Primary - Value: {primaryValue}</Text>
          <Slider color="primary" value={primaryValue} onValueChange={setPrimaryValue} />
        </View>
      </View>
    )
  },
}

// Indicator positions
export const IndicatorPositions: Story = {
  render: () => {
    const [topValue, setTopValue] = useState(50)
    const [bottomValue, setBottomValue] = useState(50)
    const [noneValue, setNoneValue] = useState(50)

    return (
      <View style={styles.variantsContainer}>
        <Text style={styles.sectionTitle}>Indicator Positions</Text>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Top - Value: {topValue}</Text>
          <Slider indicatorPosition="top" value={topValue} onValueChange={setTopValue} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Bottom - Value: {bottomValue}</Text>
          <Slider indicatorPosition="bottom" value={bottomValue} onValueChange={setBottomValue} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>None - Value: {noneValue}</Text>
          <Slider indicatorPosition="none" value={noneValue} onValueChange={setNoneValue} />
        </View>
      </View>
    )
  },
}

// Different values
export const Values: Story = {
  render: () => {
    const [value1, setValue1] = useState(0)
    const [value2, setValue2] = useState(25)
    const [value3, setValue3] = useState(50)
    const [value4, setValue4] = useState(75)
    const [value5, setValue5] = useState(100)

    return (
      <View style={styles.variantsContainer}>
        <Text style={styles.sectionTitle}>Different Values</Text>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Value: {value1}</Text>
          <Slider value={value1} onValueChange={setValue1} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Value: {value2}</Text>
          <Slider value={value2} onValueChange={setValue2} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Value: {value3}</Text>
          <Slider value={value3} onValueChange={setValue3} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Value: {value4}</Text>
          <Slider value={value4} onValueChange={setValue4} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Value: {value5}</Text>
          <Slider value={value5} onValueChange={setValue5} />
        </View>
      </View>
    )
  },
}

// Range slider
export const Range: Story = {
  render: () => {
    const [range, setRange] = useState<[number, number]>([20, 80])

    return (
      <View style={styles.container}>
        <Text style={styles.label}>Range: {range[0]}-{range[1]}</Text>
        <Slider range={range} onRangeChange={setRange} />
      </View>
    )
  },
}

// Range examples
export const RangeExamples: Story = {
  render: () => {
    const [range1, setRange1] = useState<[number, number]>([0, 20])
    const [range2, setRange2] = useState<[number, number]>([20, 40])
    const [range3, setRange3] = useState<[number, number]>([40, 60])
    const [range4, setRange4] = useState<[number, number]>([60, 80])
    const [range5, setRange5] = useState<[number, number]>([80, 100])
    const [range6, setRange6] = useState<[number, number]>([0, 100])

    return (
      <View style={styles.variantsContainer}>
        <Text style={styles.sectionTitle}>Range Examples</Text>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Range: {range1[0]}-{range1[1]}</Text>
          <Slider range={range1} onRangeChange={setRange1} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Range: {range2[0]}-{range2[1]}</Text>
          <Slider range={range2} onRangeChange={setRange2} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Range: {range3[0]}-{range3[1]}</Text>
          <Slider range={range3} onRangeChange={setRange3} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Range: {range4[0]}-{range4[1]}</Text>
          <Slider range={range4} onRangeChange={setRange4} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Range: {range5[0]}-{range5[1]}</Text>
          <Slider range={range5} onRangeChange={setRange5} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>Range: {range6[0]}-{range6[1]}</Text>
          <Slider range={range6} onRangeChange={setRange6} />
        </View>
      </View>
    )
  },
}

// Different min/max/step
export const MinMaxStep: Story = {
  render: () => {
    const [value1, setValue1] = useState(5)
    const [value2, setValue2] = useState(50)
    const [value3, setValue3] = useState(75)

    return (
      <View style={styles.variantsContainer}>
        <Text style={styles.sectionTitle}>Custom Min/Max/Step</Text>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>0-10, step 1 - Value: {value1}</Text>
          <Slider min={0} max={10} step={1} value={value1} onValueChange={setValue1} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>0-100, step 10 - Value: {value2}</Text>
          <Slider min={0} max={100} step={10} value={value2} onValueChange={setValue2} />
        </View>
        <View style={styles.sliderItem}>
          <Text style={styles.sliderLabel}>50-100, step 5 - Value: {value3}</Text>
          <Slider min={50} max={100} step={5} value={value3} onValueChange={setValue3} />
        </View>
      </View>
    )
  },
}

// Disabled state
export const Disabled: Story = {
  render: () => (
    <View style={styles.variantsContainer}>
      <Text style={styles.sectionTitle}>Disabled State</Text>
      <View style={styles.sliderItem}>
        <Text style={styles.sliderLabel}>Disabled (Gray)</Text>
        <Slider disabled value={50} color="gray" />
      </View>
      <View style={styles.sliderItem}>
        <Text style={styles.sliderLabel}>Disabled (Primary)</Text>
        <Slider disabled value={50} color="primary" />
      </View>
    </View>
  ),
}

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState(0)

    return (
      <View style={styles.container}>
        <Text style={styles.label}>Interactive Slider</Text>
        <Text style={styles.value}>Current Value: {value}</Text>
        <Slider value={value} onValueChange={setValue} />
        <Text style={styles.helperText}>Drag the handle or click on the track</Text>
      </View>
    )
  },
}

// Theme comparison
export const ThemeVariants: Story = {
  render: () => {
    const [grayValue, setGrayValue] = useState(50)
    const [primaryValue, setPrimaryValue] = useState(50)

    return (
      <ThemeComparison>
        {() => (
          <View style={styles.variantsContainer}>
            <View style={styles.sliderItem}>
              <Text style={styles.sliderLabel}>Gray - Value: {grayValue}</Text>
              <Slider color="gray" value={grayValue} onValueChange={setGrayValue} />
            </View>
            <View style={styles.sliderItem}>
              <Text style={styles.sliderLabel}>Primary - Value: {primaryValue}</Text>
              <Slider color="primary" value={primaryValue} onValueChange={setPrimaryValue} />
            </View>
          </View>
        )}
      </ThemeComparison>
    )
  },
}

const styles = StyleSheet.create({
  container: {
    width: 400,
    padding: spacing[16],
    gap: spacing[16],
  },
  variantsContainer: {
    width: 400,
    gap: spacing[24],
    padding: spacing[16],
  },
  sectionTitle: {
    fontFamily: typography.h6.fontFamily,
    fontSize: typography.h6.fontSize,
    fontWeight: typography.h6.fontWeight,
    lineHeight: typography.h6.lineHeight,
    color: colors.text.light.primary,
    marginBottom: spacing[8],
  },
  sliderItem: {
    gap: spacing[8],
  },
  sliderLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: fontSize.md,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: lineHeight.md,
    color: colors.text.light.secondary,
  },
  label: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: fontSize.md,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: lineHeight.md,
    color: colors.text.light.primary,
  },
  value: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: fontSize.lg,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: lineHeight.lg,
    color: colors.primary[500],
  },
  helperText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    lineHeight: typography.caption.lineHeight,
    color: colors.text.light.tertiary,
  },
})

