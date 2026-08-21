import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";

import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import PopupKeyboardController from "./components/PopupKeyboardController";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Student";
import Users from "./pages/Users";
import Payments from "./pages/Payment";
import Notification from "./pages/Notification";
import Settings from "./pages/Settings";
import Invoices from "./pages/Invoice";
import PayFees from "./pages/PayFees";

const App = () => {
  return (
    <BrowserRouter>
      <PopupKeyboardController />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "13px",
            borderRadius: "10px",
          },
          success: {
            duration: 3000,
          },
          error: {
            duration: 4000,
          },
        }}
      />

      <Routes>
        <Route
          path="/"
          element={<Login />}
        />

        {/* PUBLIC STUDENT PAYMENT PAGE - NO ADMIN AUTH */}
        <Route
          path="/pay-fees/:studentId"
          element={<PayFees />}
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/students"
              element={<Students />}
            />

            <Route
              path="/payments"
              element={<Payments />}
            />

            <Route
              path="/invoices"
              element={<Invoices />}
            />

            <Route
              path="/notifications"
              element={<Notification />}
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "admin",
                  ]}
                >
                  <Users />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={<Settings />}
            />
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;