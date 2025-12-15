/**
 * Typography Component Tests - UNI-Construct @unicornlove/ui
 *
 * Migrated from FRS-Prototype packages/core
 * Tests for the Tamagui-based Heading component.
 *
 * NOTE: FRS-Prototype had multiple typography components (Heading1-6, BodyText, Label, etc.)
 * UNI-Construct has a unified Heading component with variant prop (h1-h4 only).
 * Tests have been adapted to the new API.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Heading } from '../components/typography/Heading'

// Mock Tamagui's styled and components for testing
vi.mock('tamagui', async () => {
  const React = await import('react')
  return {
    styled: (_component: unknown, config: Record<string, unknown>) => {
      const StyledComponent = ({ children, ...props }: Record<string, unknown>) =>
        React.createElement(
          'span',
          { 'data-name': config.name, ...props },
          children as React.ReactNode
        )
      return StyledComponent
    },
    Text: ({ children, tag = 'span', ...props }: Record<string, unknown>) =>
      React.createElement(tag as string, props, children as React.ReactNode),
    H1: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('h1', props, children as React.ReactNode),
    H2: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('h2', props, children as React.ReactNode),
    H3: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('h3', props, children as React.ReactNode),
    H4: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('h4', props, children as React.ReactNode),
    H5: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('h5', props, children as React.ReactNode),
    H6: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('h6', props, children as React.ReactNode),
    Paragraph: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('p', props, children as React.ReactNode),
  }
})

describe('Typography Components', () => {
  describe('Heading Component', () => {
    it('should render h1 variant', () => {
      const { container } = render(<Heading variant="h1">Main Title</Heading>)

      const heading = container.querySelector('h1')
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Main Title')
    })

    it('should render h2 variant', () => {
      const { container } = render(<Heading variant="h2">Section Title</Heading>)

      const heading = container.querySelector('h2')
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Section Title')
    })

    it('should render h3 variant', () => {
      const { container } = render(<Heading variant="h3">Subsection</Heading>)

      const heading = container.querySelector('h3')
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Subsection')
    })

    it('should render h4 variant', () => {
      const { container } = render(<Heading variant="h4">Small Heading</Heading>)

      const heading = container.querySelector('h4')
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Small Heading')
    })

    it('should default to h1 when no variant provided', () => {
      const { container } = render(<Heading>Default Heading</Heading>)

      const heading = container.querySelector('h1')
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Default Heading')
    })

    it('should accept additional props', () => {
      const { container } = render(
        <Heading variant="h2" color="$blue11">
          Styled Heading
        </Heading>
      )

      const heading = container.querySelector('h2')
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('Styled Heading')
    })
  })

  // TODO: Additional typography components
  // FRS-Prototype had these components which don't exist in UNI-Construct:
  // - Heading5, Heading6 (only h1-h4 supported in UNI-Construct)
  // - BodyText, BodyLarge, BodySmall
  // - Label, Caption, Muted
  // - Paragraph, Code, Link
  //
  // These would need to be implemented if required, or tests adapted to use
  // Tamagui's Text component with appropriate styling props instead.
})
