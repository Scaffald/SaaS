/**
 * ErrorBoundary - React Error Boundary for handling component errors
 * Prevents full application crashes and provides user-friendly error messages
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { YStack, Text, Button } from '@unicornlove/ui';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          padding="$6"
          gap="$4"
          backgroundColor="$background"
        >
          <YStack
            maxWidth={600}
            padding="$6"
            borderRadius="$4"
            backgroundColor="$backgroundHover"
            borderWidth={1}
            borderColor="$borderColor"
            gap="$4"
          >
            <Text fontSize="$8" fontWeight="600" color="$red10">
              Something went wrong
            </Text>

            <Text fontSize="$4" color="$color11">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </Text>

            {this.state.error && (
              <YStack
                padding="$4"
                borderRadius="$2"
                backgroundColor="$red2"
                borderWidth={1}
                borderColor="$red6"
              >
                <Text fontSize="$3" fontFamily="$mono" color="$red11">
                  {this.state.error.message}
                </Text>
              </YStack>
            )}

            <Button
              onPress={this.handleReset}
              backgroundColor="$blue9"
              color="$color1"
              pressStyle={{ opacity: 0.8 }}
            >
              Try Again
            </Button>
          </YStack>
        </YStack>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
