import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
          <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Telemetry Visualization Error
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>
            {this.state.error?.message || "An unexpected rendering error occurred."}
          </p>
          <button className="btn-primary" onClick={this.handleReset}>
            <RefreshCw size={16} /> Reset Telemetry Stream
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
