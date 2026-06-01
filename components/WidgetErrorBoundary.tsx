import React, { ErrorInfo, ReactNode } from 'react';
import { trackEvent } from '../services/weatherService';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class WidgetErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Widget Crash:", error, errorInfo);
    trackEvent('widget_crash', 'error', error.toString());
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
          Modül yüklenemedi.
        </div>
      );
    }
    return this.props.children ?? null;
  }
}

export default WidgetErrorBoundary;
