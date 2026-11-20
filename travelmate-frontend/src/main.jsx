import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./style.css";
import App from "./App.jsx";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("TravelMate page rendering failed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f4f1eb", color: "#171717", fontFamily: "system-ui, sans-serif" }}>
          <section style={{ width: "min(620px, 100%)", padding: 28, background: "#fffdf9", border: "1px solid #d8d1c6", borderRadius: 12 }}>
            <p style={{ color: "#a4123f", fontWeight: 800, letterSpacing: 1 }}>TRAVELMATE / PAGE ERROR</p>
            <h1 style={{ marginBottom: 8 }}>This page could not be displayed.</h1>
            <p style={{ lineHeight: 1.6 }}>A page component encountered an error. Reload the page. If the problem continues, open the browser console and share the error details.</p>
            <pre style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap", padding: 12, background: "#f4f1eb", borderRadius: 8, fontSize: 12 }}>{String(this.state.error?.message || this.state.error)}</pre>
            <button onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 8, padding: "12px 18px", background: "#a4123f", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Reload TravelMate</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </BrowserRouter>
);
