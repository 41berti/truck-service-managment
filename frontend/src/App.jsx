import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppointmentsPage from "./pages/AppointmentsPage.jsx";
import AttendancePage from "./pages/AttendancePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import FinancePage from "./pages/FinancePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import StockPage from "./pages/StockPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="stock"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <StockPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="finance"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <FinancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="attendance"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MECHANIC", "GUARD"]}>
              <AttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
