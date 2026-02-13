/**
 * Layout utilities
 * Common layout patterns and wrappers for the app
 */

import type React from 'react'
import {
  Stack,
  Row,
  Card,
  type StackProps,
  type RowProps,
  type CardProps,
} from '@scaffald/ui'

/**
 * PageContainer - Standard page layout container
 * Provides consistent padding and max-width for pages
 */
export interface PageContainerProps extends StackProps {
  children: React.ReactNode
  maxWidth?: number | string
}

export function PageContainer({ children, maxWidth = 1400, style, ...props }: PageContainerProps) {
  return (
    <Stack
      padding={{ base: 16, md: 24, lg: 32 }}
      gap={{ base: 16, md: 20, lg: 24 }}
      style={[{ maxWidth, width: '100%' }, style]}
      {...props}
    >
      {children}
    </Stack>
  )
}

/**
 * PageHeader - Standard page header layout
 * Typically contains title and actions
 */
export interface PageHeaderProps extends RowProps {
  children: React.ReactNode
}

export function PageHeader({ children, style, ...props }: PageHeaderProps) {
  return (
    <Row
      justify="space-between"
      align="center"
      gap={16}
      style={[{ flexWrap: 'wrap' }, style]}
      {...props}
    >
      {children}
    </Row>
  )
}

/**
 * CardGrid - Grid layout for cards
 * Responsive grid that adjusts columns based on screen size
 */
export interface CardGridProps extends StackProps {
  children: React.ReactNode
  columns?: { base?: number; sm?: number; md?: number; lg?: number; xl?: number }
}

export function CardGrid({
  children,
  columns = { base: 1, sm: 2, lg: 3 },
  gap = { base: 12, md: 16, lg: 20 },
  style,
  ...props
}: CardGridProps) {
  return (
    <Stack
      direction={{ base: 'column', sm: 'row' }}
      gap={gap}
      style={[
        {
          flexWrap: 'wrap',
          // Note: Once Grid component is available (Option D), this should be refactored to use proper Grid
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Stack>
  )
}

/**
 * SectionCard - Card with consistent section styling
 */
export interface SectionCardProps extends CardProps {
  children: React.ReactNode
}

export function SectionCard({
  children,
  padding = { base: 16, md: 20, lg: 24 },
  ...props
}: SectionCardProps) {
  return (
    <Card padding={padding} {...props}>
      {children}
    </Card>
  )
}

/**
 * ContentSection - Section with consistent spacing
 */
export interface ContentSectionProps extends StackProps {
  children: React.ReactNode
  title?: string
}

export function ContentSection({
  children,
  title,
  gap = { base: 12, md: 16 },
  ...props
}: ContentSectionProps) {
  return (
    <Stack gap={gap} {...props}>
      {title && (
        <Stack gap={4}>
          <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</span>
        </Stack>
      )}
      {children}
    </Stack>
  )
}

/**
 * LoadingContainer - Centered loading state container
 */
export interface LoadingContainerProps {
  children: React.ReactNode
  minHeight?: number | string
}

export function LoadingContainer({ children, minHeight = 400 }: LoadingContainerProps) {
  return (
    <Stack align="center" justify="center" style={{ minHeight }}>
      <Stack align="center" gap={16}>
        {children}
      </Stack>
    </Stack>
  )
}

/**
 * ErrorContainer - Centered error state container
 */
export interface ErrorContainerProps {
  children: React.ReactNode
  minHeight?: number | string
}

export function ErrorContainer({ children, minHeight = 400 }: ErrorContainerProps) {
  return (
    <Stack align="center" justify="center" style={{ minHeight }}>
      <Stack align="center" gap={12}>
        {children}
      </Stack>
    </Stack>
  )
}

/**
 * FormSection - Section for form fields with consistent spacing
 */
export interface FormSectionProps extends StackProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function FormSection({
  children,
  title,
  description,
  gap = { base: 12, md: 16 },
  ...props
}: FormSectionProps) {
  return (
    <Stack gap={gap} {...props}>
      {(title || description) && (
        <Stack gap={4}>
          {title && <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{title}</span>}
          {description && (
            <span style={{ fontSize: '0.875rem', color: 'var(--color-gray-11)' }}>
              {description}
            </span>
          )}
        </Stack>
      )}
      {children}
    </Stack>
  )
}
