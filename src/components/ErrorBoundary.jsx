import React, { Component } from 'react';
import { toast } from 'react-toastify';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // You can also log to an error reporting service like Sentry here
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Show a toast notification
    toast.error('Something went wrong. Please refresh the page or contact support.');
  }

  handleRetry = () => {
    // Reset the error state and try again
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Refresh the page to get a clean state
    window.location.reload();
  };

  handleGoHome = () => {
    // Navigate to the home page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
              <p className="text-slate-600 mb-6">We apologize for the inconvenience. Please try refreshing the page or navigate back to the home page.</p>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Refresh Page
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                  Go to Home
                </button>
              </div>

              {/* Error details (collapsed by default) */}
              {this.state.error && (
                <details className="mt-6 text-left bg-slate-50 p-4 rounded-lg">
                  <summary className="text-sm text-slate-600 cursor-pointer">Technical Details</summary>
                  <div className="mt-2">
                    <p className="text-xs font-mono text-slate-700 break-all">
                      {this.state.error.toString()}
                    </p>
                    <p className="text-xs font-mono text-slate-600 mt-2 break-all">
                      {this.state.errorInfo.componentStack}
                    </p>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 