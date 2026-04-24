import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-dark text-white flex items-center justify-center p-6 text-center">
          <div className="glass-panel max-w-md w-full space-y-6 border-red-500/20 bg-red-500/5">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={40} className="text-red-400" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Oops! Something went wrong.</h1>
              <p className="text-sm opacity-60">
                MedicaTrack encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-black/20 rounded-xl text-[10px] font-mono text-left opacity-40 overflow-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={this.handleReset}
                className="btn w-full flex items-center justify-center gap-2"
              >
                <Home size={18} /> Back to Dashboard
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-secondary w-full flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} /> Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
