import React, { Component, type ReactNode } from 'react'

import { Button, Paragraph, YStack } from '@app/ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Dashboard widget error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <YStack gap="$3" p="$4" bg="$gray2" br="$4" borderWidth={1} borderColor="$gray6">
          <Paragraph size="$2" color="$red10">
            Something went wrong loading this widget.
          </Paragraph>
          <Button
            size="$2"
            onPress={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </Button>
        </YStack>
      )
    }

    return this.props.children
  }
}
