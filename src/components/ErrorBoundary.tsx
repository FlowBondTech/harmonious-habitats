import React from 'react';
import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw, Bug } from 'lucide-react';

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const getErrorMessage = () => {
    if (isRouteErrorResponse(error)) {
      return {
        title: `${error.status} Error`,
        message: error.statusText || error.data?.message || 'An error occurred',
        details: error.data
      };
    }

    if (error instanceof Error) {
      return {
        title: 'Application Error',
        message: error.message,
        details: error.stack
      };
    }

    return {
      title: 'Unknown Error',
      message: 'An unexpected error occurred',
      details: String(error)
    };
  };

  const { title, message, details } = getErrorMessage();
  const [showDetails, setShowDetails] = React.useState(false);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-8 py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{title}</h1>
                <p className="text-white/90 text-sm mt-1">Something went wrong</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            {/* Error Message */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6">
              <p className="text-red-800 font-medium">{message}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-6 py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors font-medium"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Refresh Page</span>
              </button>

              <button
                onClick={handleGoHome}
                className="flex items-center space-x-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-medium"
              >
                <Home className="h-5 w-5" />
                <span>Go Home</span>
              </button>
            </div>

            {/* Technical Details Toggle */}
            {details && (
              <div className="border-t border-gray-200 pt-6">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Bug className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {showDetails ? 'Hide' : 'Show'} Technical Details
                  </span>
                </button>

                {showDetails && (
                  <div className="mt-4 bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                      {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Help Text */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>What can you do?</strong>
              </p>
              <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Try refreshing the page - this often resolves temporary issues</li>
                <li>Go back to the home page and try again</li>
                <li>If the problem persists, please contact support with the error details</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Error ID: {Date.now().toString(36)} • Harmonik Space
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Class-based error boundary for catching errors in component tree
export class ErrorBoundaryClass extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Component Error</h1>
                <p className="text-gray-600">A component encountered an error</p>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6">
              <p className="text-red-800 font-medium">{this.state.error.message}</p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-6 py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors font-medium"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Refresh Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
