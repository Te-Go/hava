import React, { ErrorInfo, ReactNode } from 'react';
import { trackEvent } from '../services/weatherService';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Widget Crash:", error, errorInfo);
    trackEvent('widget_crash', 'error', error.toString());
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-left text-red-700 bg-red-50 border border-red-500 rounded-lg font-mono text-xs overflow-auto">
          <strong>CRASH DETECTED (WidgetErrorBoundary):</strong><br/>
          <pre className="text-xs text-left overflow-auto mt-2">
            {this.state.error?.stack || this.state.error?.message}
          </pre>
        </div>
      );
    }
    return this.props.children ?? null;
  }
}

export default WidgetErrorBoundary;
