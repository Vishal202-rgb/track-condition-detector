import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Component crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card">
          <div className="section-title">Something went wrong</div>
          <p style={{ color: "#f5f5f5" }}>
            {this.state.error?.message || "Unknown error"}
          </p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}