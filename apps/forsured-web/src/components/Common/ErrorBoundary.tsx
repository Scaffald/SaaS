/**
 * ErrorBoundary - React Error Boundary for handling component errors
 * Prevents full application crashes and provides user-friendly error messages

 */
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Stack, Text, Button } from '@unicornlove/beyond-ui'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Stack
          flex={1}
          alignItems="center"
          justifyContent="center"
          padding={24}
          gap={16}
          style={{ backgroundColor: 'var(--color-background)' }}
        >
          <Stack
            padding={24}
            gap={16}
            style={{
              maxWidth: 600,
              borderRadius: 16,
              backgroundColor: 'var(--color-background-hover)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Text size="xl" weight="semibold" style={{ color: 'var(--color-red-10)' }}>
              Something went wrong
            </Text>

            <Text>
              We encountered an unexpected error. Please try refreshing the page or contact support
              if the problem persists.
            </Text>

            {this.state.error && (
              <Stack
                padding={16}
                style={{
                  borderRadius: 8,
                  backgroundColor: 'var(--color-red-2)',
                  border: '1px solid var(--color-red-6)',
                }}
              >
                <Text
                  size="sm"
                  style={{
                    fontFamily: 'monospace',
                    color: 'var(--color-red-11)',
                  }}
                >
                  {this.state.error.message}
                </Text>
              </Stack>
            )}

            <Button onPress={this.handleReset} variant="primary">
              Try Again
            </Button>
          </Stack>
        </Stack>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
