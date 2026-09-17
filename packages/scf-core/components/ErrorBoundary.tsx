import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

import { ErrorFallback } from './ErrorFallback'
import { logger } from '../utils/logger'

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
    // Unconditional, not `if (__DEV__)`. It used to log in development and
    // rely on Sentry everywhere else; with Sentry removed (#791) that branch
    // would have made every caught error in production silent.
    logger.error('ErrorBoundary caught error', error, {
      componentStack: errorInfo.componentStack,
      ...('digest' in errorInfo && { digest: (errorInfo as { digest?: string }).digest }),
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
