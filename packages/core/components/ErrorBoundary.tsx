import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

import { ErrorFallback } from './ErrorFallback'

type ErrorBoundaryContext = Record<string, unknown>

interface ErrorBoundaryProps {
  children: ReactNode
  context?: ErrorBoundaryContext
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary] Caught error', error, errorInfo)
    }

    this.props.onError?.(error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  override render(): ReactNode {
    const { children, fallback } = this.props
    const { hasError, error } = this.state

    if (!hasError) {
      return children
    }

    if (fallback) {
      return fallback
    }

    return <ErrorFallback error={error} onReset={this.handleReset} />
  }
}
