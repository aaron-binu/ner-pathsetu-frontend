import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{padding:24, textAlign:'center', background:'var(--surface)', border:'1px solid var(--border-soft)', borderRadius:14, margin:16}}>
          <div style={{fontWeight:700, marginBottom:8}}>Something went wrong</div>
          <div style={{fontSize:12, color:'var(--text-dim)', marginBottom:12}}>{this.state.error?.message || 'Unexpected error'}</div>
          <button className="btn btn-primary" onClick={()=>this.setState({hasError:false})}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
