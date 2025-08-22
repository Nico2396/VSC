import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { dataSource } from "../utils/dataSource.js";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(safeGetSession());

  function safeGetSession() {
    try {
      return dataSource.auth.getSession();
    } catch {
      return null;
    }
  }

  useEffect(() => {
    // refresca la sesión al cambiar de ruta (login/logout, etc.)
    setSession(safeGetSession());
  }, [location.pathname]);

  const role = session?.role;
  const displayName =
    session?.nombre || (session?.email ? session.email.split("@")[0] : "Usuario");

  const handleLogout = () => {
    try {
      dataSource.auth.logout();
    } catch (e) {
      console.warn("logout error (safe to ignore in local mode):", e);
    }
    setSession(null);
    // si estás en una ruta protegida, aseguramos salir a Inicio
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
    } else {
      // fuerzo re-render por las dudas
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <div className="brand">
          <span className="dot" aria-hidden="true"></span>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            IPES · Residuos
          </Link>
        </div>

        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            Inicio
          </NavLink>
          <NavLink
            to="/precarga"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Precarga
          </NavLink>
          <NavLink
            to="/campanas"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Campañas
          </NavLink>

          {(role === "voluntario" || role === "admin") && (
            <>
              <NavLink
                to="/confirmar"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Confirmar
              </NavLink>
              <NavLink
                to="/recolectados"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Recolectados
              </NavLink>
            </>
          )}

          {role === "admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Admin
            </NavLink>
          )}

          {!session ? (
            <NavLink
              to="/login"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Login
            </NavLink>
          ) : (
            <button className="ghost" onClick={handleLogout} title="Cerrar sesión">
              Salir — {displayName}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
