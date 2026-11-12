import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Pathlog UI ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/70 p-6 text-center m-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-base font-bold text-red-900">Something went wrong</h2>
          <p className="mt-1 text-xs text-red-700 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) {
                  this.props.onReset();
                } else {
                  window.location.reload();
                }
              }}
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition shadow-xs"
            >
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
