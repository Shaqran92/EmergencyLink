import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Phone } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error trapped by EmergencyLink ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '24px',
            color: '#0f172a',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
              border: '1px solid #fee2e2',
            }}
          >
            {/* Top Alert */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={26} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#991b1b' }}>
                  {this.props.fallbackTitle || 'EmergencyLink View Recovery'}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                  A display component encountered a temporary render interruption.
                </p>
              </div>
            </div>

            {/* Helpline Banner */}
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: 700, fontSize: '13px' }}>
                <Phone size={16} /> Urgent Helpline:
              </div>
              <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '14px' }}>
                Rescue 1122 | Edhi 115
              </div>
            </div>

            {/* Error Message Details */}
            {this.state.error && (
              <div
                style={{
                  background: '#f8fafc',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  color: '#475569',
                  fontFamily: 'monospace',
                  marginBottom: '24px',
                  overflowX: 'auto',
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(2,132,199,0.3)',
                }}
              >
                <RefreshCw size={16} /> Reload Page
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Home size={16} /> Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
