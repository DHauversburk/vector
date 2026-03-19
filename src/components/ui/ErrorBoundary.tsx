import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from './Button';
import { logger } from '../../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Captures runtime errors in child components
 * 
 * Provides a "Tactical Failure" UI when a component crashes,
 * allowing the user to retry or return home instead of seeing a blank screen.
 * 
 * @component
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary:${this.props.name || 'Global'}', 'Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-slate-950/50 backdrop-blur-md rounded-3xl border border-red-900/30">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 animate-pulse" />
              <div className="relative w-20 h-20 mx-auto bg-red-950/50 rounded-2xl border border-red-500/50 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
                Component Failure
              </h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                A non-critical module has encountered a runtime exception. 
                Internal diagnostics have been captured.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-left overflow-auto max-h-40">
                    <code className="text-[10px] text-red-400 font-mono italic">
                        {this.state.error.message}
                        <br />
                        {this.state.error.stack}
                    </code>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="flex-1 border-slate-700 text-slate-400"
                onClick={this.handleGoHome}
              >
                <Home className="w-4 h-4 mr-2" />
                Return Base
              </Button>
              <Button 
                variant="default" 
                className="flex-1 bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20"
                onClick={this.handleReset}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Retry Module
              </Button>
            </div>

            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600">
               Error Reference: {Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
