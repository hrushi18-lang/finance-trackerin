import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Shield, Send } from 'lucide-react';
import { Button } from './Button';
import { logSecurityEvent } from '../../utils/security';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableReporting?: boolean;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  isReporting: boolean;
  reportSent: boolean;
  retryCount: number;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      isReporting: false,
      reportSent: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log security event
    logSecurityEvent('ERROR_BOUNDARY_TRIGGERED', {
      errorId,
      errorMessage: error.message,
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('EnhancedErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-report critical errors in production
    if (process.env.NODE_ENV === 'production' && this.isCriticalError(error)) {
      this.reportError(error, errorInfo, errorId);
    }
  }

  private isCriticalError(error: Error): boolean {
    const criticalPatterns = [
      /ChunkLoadError/i,
      /Loading chunk/i,
      /Network error/i,
      /Failed to fetch/i,
      /TypeError.*undefined/i
    ];
    
    return criticalPatterns.some(pattern => pattern.test(error.message));
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    if (this.state.isReporting || this.state.reportSent) return;

    this.setState({ isReporting: true });

    try {
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        context: this.props.context,
        retryCount: this.state.retryCount
      };

      // In production, send to error reporting service
      // For now, store in localStorage
      const reports = JSON.parse(localStorage.getItem('error_reports') || '[]');
      reports.push(errorReport);
      if (reports.length > 50) reports.shift(); // Keep only last 50 reports
      localStorage.setItem('error_reports', JSON.stringify(reports));

      this.setState({ reportSent: true, isReporting: false });
      
      logSecurityEvent('ERROR_REPORTED', { errorId, context: this.props.context });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      this.setState({ isReporting: false });
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));

    // Clear any existing timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    // Add a small delay before retry
    this.retryTimeout = setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId, isReporting, reportSent, retryCount } = this.state;
      const canRetry = retryCount < this.maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--background)' }}>
          <div className="max-w-md w-full">
            <div className="card-neumorphic p-8 text-center">
              {/* Error Icon */}
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={32} className="text-red-600" />
                </div>
                <h1 className="text-2xl font-heading text-red-600 mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
                  We're sorry, but something unexpected happened. Our team has been notified.
                </p>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && error && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                  <h3 className="text-sm font-body font-semibold text-red-800 mb-2">
                    Error Details:
                  </h3>
                  <p className="text-xs font-mono text-red-700 break-all">
                    {error.message}
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    Error ID: {errorId}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    variant="primary"
                    className="w-full"
                    disabled={isReporting}
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Try Again ({this.maxRetries - retryCount} attempts left)
                  </Button>
                )}

                <Button
                  onClick={this.handleReload}
                  variant="secondary"
                  className="w-full"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Reload Page
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="secondary"
                  className="w-full"
                >
                  <Home size={16} className="mr-2" />
                  Go to Home
                </Button>

                {/* Error Reporting */}
                {this.props.enableReporting && !reportSent && (
                  <Button
                    onClick={() => this.reportError(error!, this.state.errorInfo!, errorId)}
                    variant="secondary"
                    className="w-full"
                    disabled={isReporting}
                  >
                    {isReporting ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        Reporting...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="mr-2" />
                        Report Issue
                      </>
                    )}
                  </Button>
                )}

                {reportSent && (
                  <div className="flex items-center justify-center text-green-600 text-sm">
                    <Shield size={16} className="mr-2" />
                    Issue reported successfully
                  </div>
                )}
              </div>

              {/* Help Text */}
              <div className="mt-6 text-xs font-serif-light" style={{ color: 'var(--text-tertiary)' }}>
                If this problem persists, please contact support with Error ID: {errorId}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default EnhancedErrorBoundary;
