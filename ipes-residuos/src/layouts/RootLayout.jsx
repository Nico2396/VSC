import React from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import Navbar from "../ui/Navbar.jsx";

// Error boundary para evitar "pantalla en blanco"
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, err: error };
  }
  componentDidCatch(error, info) {
    // opcional: loguear en un backend
    console.error("[ErrorBoundary]", error, info);
  }
  handleReset = () => {
    this.setState({ hasError: false, err: null });
    // intento suave de recargar la ruta actual
    if (typeof window !== "undefined") {
      // forzar re-render
      window.requestAnimationFrame(() => this.forceUpdate());
    }
  };
  render() {
    if (this.state.hasError) {
      return (
        <section className="card" style={{ marginTop: "1rem" }}>
          <h2 className="mt-0">Ocurrió un problema</h2>
          <p className="small">
            Algo falló al renderizar esta vista. No perdiste datos de campaña ni
            precargas. Podés intentar de nuevo.
          </p>
          <div className="actions end">
            <button className="ghost" onClick={this.handleReset}>Reintentar</button>
            <button onClick={() => (window.location.href = "/")}>Ir al inicio</button>
          </div>
          <details style={{ marginTop: ".8rem" }}>
            <summary className="small">Ver detalle técnico</summary>
            <pre className="small" style={{ whiteSpace: "pre-wrap" }}>
{String(this.state.err)}
            </pre>
          </details>
        </section>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";

  return (
    <>
      {!isLogin && <Navbar />}
      <main className="container" style={{ paddingTop: isLogin ? "1rem" : "1.1rem" }}>
        <AppErrorBoundary key={location.key}>
          <Outlet />
        </AppErrorBoundary>
      </main>
      <ScrollRestoration />
    </>
  );
}
