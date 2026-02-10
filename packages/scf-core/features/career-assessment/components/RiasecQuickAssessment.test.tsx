import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { RiasecQuickAssessment } from './RiasecQuickAssessment'
import { careerAssessmentDefaults, type RiasecScores } from '../config/career-assessment-schema'
import { renderWithProviders } from '@test-helpers/test-utils'

// Legacy UI mock (tamagui)
vi.mock('@unicornlove/beyond-ui', async () => {
  const React = await import('react')
  return {
    Slider: {
      Track: ({ children }: { children: React.ReactNode }) => <div data-testid="slider-track">{children}</div>,
      TrackActive: () => <div data-testid="slider-track-active" />,
      Thumb: ({ onValueChange, value, disabled }: { onValueChange?: (value: number[]) => void; value: number[]; disabled?: boolean }) => (
        <input
          type="range"
          role="slider"
          data-testid={`slider-thumb-${value[0]}`}
          min={1}
          max={5}
          value={value[0]}
          disabled={disabled}
          onChange={(e) => onValueChange?.([Number(e.target.value)])}
        />
      ),
    },
    Text: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <span {...props}>{children}</span>
    ),
    Row: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    Stack: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  }
})

describe('RiasecQuickAssessment', () => {
  const defaultScores: RiasecScores = careerAssessmentDefaults.riasec_scores

  it('should render all 6 RIASEC dimension sliders', () => {
    const handleChange = vi.fn()
    renderWithProviders(
      <RiasecQuickAssessment value={defaultScores} onChange={handleChange} />
    )

    // Check that all 6 dimensions are rendered
    expect(screen.getByText('Realistic')).toBeInTheDocument()
    expect(screen.getByText('Investigative')).toBeInTheDocument()
    expect(screen.getByText('Artistic')).toBeInTheDocument()
    expect(screen.getByText('Social')).toBeInTheDocument()
    expect(screen.getByText('Enterprising')).toBeInTheDocument()
    expect(screen.getByText('Conventional')).toBeInTheDocument()
  })

  it('should display current score values for each dimension', () => {
    const scores: RiasecScores = {
      realistic: 1,
      investigative: 2,
      artistic: 3,
      social: 4,
      enterprising: 5,
      conventional: 3,
    }
    const handleChange = vi.fn()

    renderWithProviders(
      <RiasecQuickAssessment value={scores} onChange={handleChange} />
    )

    // Check that score values are displayed
    expect(screen.getByText('1')).toBeInTheDocument() // realistic
    expect(screen.getByText('2')).toBeInTheDocument() // investigative
    expect(screen.getByText('3')).toBeInTheDocument() // artistic and conventional
    expect(screen.getByText('4')).toBeInTheDocument() // social
    expect(screen.getByText('5')).toBeInTheDocument() // enterprising
  })

  it('should call onChange when slider value changes', () => {
    const handleChange = vi.fn()
    renderWithProviders(
      <RiasecQuickAssessment value={defaultScores} onChange={handleChange} />
    )

    // Find and interact with the realistic slider
    const sliders = screen.getAllByRole('slider')
    const realisticSlider = sliders[0] // First slider is realistic

    fireEvent.change(realisticSlider, { target: { value: '4' } })

    expect(handleChange).toHaveBeenCalledWith({
      ...defaultScores,
      realistic: 4,
    })
  })

  it('should update all dimensions independently', () => {
    const handleChange = vi.fn()
    renderWithProviders(
      <RiasecQuickAssessment value={defaultScores} onChange={handleChange} />
    )

    const sliders = screen.getAllByRole('slider')

    // Update realistic to 5
    fireEvent.change(sliders[0], { target: { value: '5' } })
    expect(handleChange).toHaveBeenCalledWith({
      ...defaultScores,
      realistic: 5,
    })

    // Update investigative to 1
    fireEvent.change(sliders[1], { target: { value: '1' } })
    expect(handleChange).toHaveBeenCalledWith({
      ...defaultScores,
      investigative: 1,
    })
  })

  it('should respect disabled state', () => {
    const handleChange = vi.fn()
    renderWithProviders(
      <RiasecQuickAssessment value={defaultScores} onChange={handleChange} disabled />
    )

    const sliders = screen.getAllByRole('slider')
    sliders.forEach((slider) => {
      expect(slider).toBeDisabled()
    })
  })

  it('should not call onChange when disabled', () => {
    const handleChange = vi.fn()
    renderWithProviders(
      <RiasecQuickAssessment value={defaultScores} onChange={handleChange} disabled />
    )

    const sliders = screen.getAllByRole('slider')
    fireEvent.change(sliders[0], { target: { value: '4' } })

    // onChange should not be called when disabled
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('should display dimension descriptions', () => {
    const handleChange = vi.fn()
    renderWithProviders(
      <RiasecQuickAssessment value={defaultScores} onChange={handleChange} />
    )

    // Check that descriptions are displayed
    expect(screen.getByText(/I enjoy working with tools, machines, or building things/i)).toBeInTheDocument()
    expect(screen.getByText(/I like solving puzzles and analyzing complex problems/i)).toBeInTheDocument()
  })

  it('should display RIASEC explanation', () => {
    const handleChange = vi.fn()
    renderWithProviders(
      <RiasecQuickAssessment value={defaultScores} onChange={handleChange} />
    )

    expect(screen.getByText(/What is RIASEC/i)).toBeInTheDocument()
    expect(screen.getByText(/Holland Codes/i)).toBeInTheDocument()
  })

  it('should display instruction text', () => {
    const handleChange = vi.fn()
    renderWithProviders(
      <RiasecQuickAssessment value={defaultScores} onChange={handleChange} />
    )

    expect(screen.getByText(/Rate Your Interests/i)).toBeInTheDocument()
    expect(screen.getByText(/Move the sliders/i)).toBeInTheDocument()
  })

  it('should constrain slider values to 1-5 range', () => {
    const handleChange = vi.fn()
    renderWithProviders(
      <RiasecQuickAssessment value={defaultScores} onChange={handleChange} />
    )

    const sliders = screen.getAllByRole('slider')
    const slider = sliders[0] as HTMLInputElement

    // Check min and max attributes
    expect(slider.min).toBe('1')
    expect(slider.max).toBe('5')
  })
})

