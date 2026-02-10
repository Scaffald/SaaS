import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

import { ErrorFallback } from './ErrorFallback'
import { logger } from '../utils/logger'
import { captureException, setContext } from '../utils/sentry'

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
    // Log to console in development
    if (__DEV__) {
      logger.error('ErrorBoundary caught error', error, errorInfo)
    }

    // Set error context for Sentry
    if (this.props.context) {
      setContext('errorBoundary', this.props.context)
    }

    // Capture exception in Sentry with component stack
    captureException(error, {
      componentStack: errorInfo.componentStack,
      ...this.props.context,
    })

    // Call custom error handler if provided
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
