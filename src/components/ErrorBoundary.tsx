import React, { Component } from 'react';
import type { ErrorInfo } from 'react';
import { ServerCrash, RefreshCw, Database } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    window.location.reload();
  };

  private handleUseDemoData = () => {
    // If it was a network error, they can fallback to mock data by reloading (if mock mode was dynamically switchable).
    // In our prototype, MOCK_MODE is static true, so we just reload.
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <ServerCrash className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-100 mb-2">API unavailable</h1>
          <p className="text-slate-400 max-w-md mb-8">
            NETRA-Guard could not reach the local assurance service. Verify that the core engine is running on <span className="font-mono text-xs bg-slate-900 px-1 py-0.5 rounded">localhost:8000</span>.
          </p>
          <div className="flex gap-4">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Retry Connection
            </button>
            <button
              onClick={this.handleUseDemoData}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-sm font-medium transition-colors border border-slate-700"
            >
              <Database className="w-4 h-4 text-emerald-400" /> Use Demo Data
            </button>
          </div>
          <div className="mt-12 text-xs font-mono text-slate-600 max-w-xl text-left bg-slate-900 p-4 rounded overflow-auto border border-slate-800">
            {this.state.error?.message}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
