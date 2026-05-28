import React from 'react';

interface Props {
    children: React.ReactNode;
    widgetName: string;
}

interface State {
    hasError: boolean;
}

/**
 * Error Boundary for Island Widgets
 * Prevents cascading failures and maintains layout stability
 */
class WidgetErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error(`[${this.props.widgetName}] Widget Error:`, error);
        console.error('Error Info:', info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center"
                    style={{ minHeight: 'var(--sinan-slot-height, 200px)' }}
                >
                    <div className="text-center p-6">
                        <div className="text-4xl mb-3">⚠️</div>
                        <p className="text-slate-600 dark:text-slate-300 mb-3">
                            Veriler şu an yüklenemiyor.
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default WidgetErrorBoundary;
