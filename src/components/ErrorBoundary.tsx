import React from 'react';

interface Props {
  children: React.ReactNode;
  /** Compact variant for route-level boundaries inside a shell */
  compact?: boolean;
  /** Changing this value resets the boundary (e.g. route pathname) */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-phase errors so a single broken screen/ad never blanks the
 * whole app. Without this, any thrown error unmounts the React tree and the
 * user is left with a white screen and no way back.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  private reset = () => this.setState({ error: null });

  private goHome = () => {
    this.setState({ error: null });
    window.history.pushState({}, '', '/hub');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        className={
          this.props.compact
            ? 'flex flex-col items-center justify-center text-center gap-3 p-6 min-h-[50vh]'
            : 'fixed inset-0 flex flex-col items-center justify-center text-center gap-3 p-6 bg-background'
        }
      >
        <p className="text-base font-bold text-foreground">Something went wrong</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          {this.state.error.message || 'An unexpected error occurred while loading this screen.'}
        </p>
        <div className="flex gap-2 pt-1">
          <button
            onClick={this.reset}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-primary-foreground"
          >
            Retry
          </button>
          <button
            onClick={this.goHome}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-muted text-foreground"
          >
            Back to Hub
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;