import { Navigate, Outlet, useLocation } from "react-router-dom";
import { dataSource } from "../utils/dataSource.js";

/**
 * Protected
 * - role="voluntario": permite voluntario o admin
 * - role="admin": solo admin
 */
export default function Protected({ role = "voluntario" }) {
  const location = useLocation();
  const session = (() => {
    try {
      return dataSource.auth.getSession();
    } catch {
      return null;
    }
  })();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const currentRole = session.role;
  const ok =
    role === "voluntario"
      ? currentRole === "voluntario" || currentRole === "admin"
      : currentRole === "admin";

  if (!ok) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
