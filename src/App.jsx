import { lazy, Suspense } from "react";

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

const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Students = lazy(() => import("./pages/Student"));
const Users = lazy(() => import("./pages/Users"));
const Payments = lazy(() => import("./pages/Payment"));
const Notification = lazy(() => import("./pages/Notification"));
const Settings = lazy(() => import("./pages/Settings"));
const Invoices = lazy(() => import("./pages/Invoice"));
const PayFees = lazy(() => import("./pages/PayFees"));

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

      <Suspense fallback={<div className="route-loading">Loading...</div>}>
        <Routes>
        <Route
          path="/"
          element={<Login />}
        />

        
        <Route
          path="/pay-fees/:studentId"
          element={<PayFees />}
        />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute page="dashboard">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/students"
              element={
                <ProtectedRoute page="students">
                  <Students />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payments"
              element={
                <ProtectedRoute page="payments">
                  <Payments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices"
              element={
                <ProtectedRoute page="invoices">
                  <Invoices />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute page="notifications">
                  <Notification />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute page="users">
                  <Users />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute page="settings">
                  <Settings />
                </ProtectedRoute>
              }
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
      </Suspense>
    </BrowserRouter>
  );
};

export default App;