import { Component } from 'react'
import { ErrorState } from './ui'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error, info) {
    console.error('EVOLVE crashed:', error, info)
    if (window.Sentry) window.Sentry.captureException(error)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--base-950)' }}>
          <ErrorState
            title="Something broke"
            description="EVOLVE hit an unexpected error. Refresh the page — your data is safe."
            onRetry={() => window.location.reload()}
          />
        </div>
      )
    }
    return this.props.children
  }
}