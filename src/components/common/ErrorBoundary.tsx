import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, MessageCircle } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // In a real app, you would send this to your error reporting service
    console.log('Error Report:', errorReport);
    
    // For now, we'll just show a success message
    alert('Thank you for reporting this issue. We\'ll look into it right away!');
  };

  getErrorSuggestions = (error: Error) => {
    const suggestions = [];

    if (error.message.includes('network') || error.message.includes('fetch')) {
      suggestions.push({
        title: 'Check your internet connection',
        description: 'Make sure you\'re connected to the internet and try again.',
        action: 'retry'
      });
    }

    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      suggestions.push({
        title: 'Refresh your session',
        description: 'Your session may have expired. Try refreshing the page.',
        action: 'refresh'
      });
    }

    if (error.message.includes('validation') || error.message.includes('required')) {
      suggestions.push({
        title: 'Check your input',
        description: 'Please make sure all required fields are filled correctly.',
        action: 'retry'
      });
    }

    if (error.message.includes('not found') || error.message.includes('404')) {
      suggestions.push({
        title: 'Go to dashboard',
        description: 'The page you\'re looking for might not exist. Return to the main dashboard.',
        action: 'home'
      });
    }

    // Default suggestions
    if (suggestions.length === 0) {
      suggestions.push(
        {
          title: 'Try refreshing the page',
          description: 'Sometimes a simple refresh can resolve the issue.',
          action: 'refresh'
        },
        {
          title: 'Go back to dashboard',
          description: 'Return to the main dashboard and try again.',
          action: 'home'
        }
      );
    }

    return suggestions;
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const suggestions = error ? this.getErrorSuggestions(error) : [];

      return (
        <div className="min-h-screen bg-forest-900 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="bg-forest-800/80 backdrop-blur-md rounded-2xl p-8 border border-forest-600/30 shadow-2xl">
              {/* Error Icon */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-error-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={40} className="text-error-400" />
                </div>
                <h1 className="text-2xl font-heading font-bold text-white mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-300 font-body">
                  We encountered an unexpected error. Don't worry, we're here to help you get back on track.
                </p>
              </div>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                  <h3 className="text-red-400 font-semibold mb-2">Error Details (Development)</h3>
                  <p className="text-red-300 text-sm font-mono break-all">{error.message}</p>
                  {error.stack && (
                    <details className="mt-2">
                      <summary className="text-red-400 text-sm cursor-pointer">Stack Trace</summary>
                      <pre className="text-red-300 text-xs mt-2 overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Error ID */}
              <div className="bg-gray-700/30 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-400">
                  Error ID: <span className="font-mono text-gray-300">{this.state.errorId}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Please include this ID if you contact support.
                </p>
              </div>

              {/* Suggestions */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-white">What you can try:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="bg-forest-700/30 border border-forest-600/30 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">{suggestion.title}</h4>
                      <p className="text-gray-300 text-sm mb-3">{suggestion.description}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          switch (suggestion.action) {
                            case 'retry':
                              this.handleRetry();
                              break;
                            case 'refresh':
                              window.location.reload();
                              break;
                            case 'home':
                              this.handleGoHome();
                              break;
                          }
                        }}
                        className="border-forest-500/30 text-forest-300 hover:bg-forest-600/10"
                      >
                        {suggestion.action === 'retry' && <RefreshCw size={14} className="mr-2" />}
                        {suggestion.action === 'refresh' && <RefreshCw size={14} className="mr-2" />}
                        {suggestion.action === 'home' && <Home size={14} className="mr-2" />}
                        {suggestion.action === 'retry' ? 'Try Again' : 
                         suggestion.action === 'refresh' ? 'Refresh Page' : 'Go to Dashboard'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 border-forest-500/30 text-forest-300 hover:bg-forest-600/10"
                >
                  <Home size={16} className="mr-2" />
                  Go to Dashboard
                </Button>
                <Button
                  onClick={this.handleReportBug}
                  variant="outline"
                  className="flex-1 border-forest-500/30 text-forest-300 hover:bg-forest-600/10"
                >
                  <Bug size={16} className="mr-2" />
                  Report Bug
                </Button>
              </div>

              {/* Support Contact */}
              <div className="mt-6 pt-6 border-t border-forest-600/30 text-center">
                <p className="text-sm text-gray-400 mb-2">
                  Still having trouble? We're here to help!
                </p>
                <div className="flex justify-center space-x-4">
                  <button className="flex items-center text-primary-400 hover:text-primary-300 transition-colors">
                    <MessageCircle size={16} className="mr-1" />
                    <span className="text-sm">Contact Support</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
