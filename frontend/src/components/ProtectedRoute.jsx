import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();
  const { isAuthenticated, isCheckingSession, user } = useAuth();

  if (isCheckingSession) {
    return (
      <main className="session-screen">
        <div className="loader" />
        <p>Duke kontrolluar sesionin...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
