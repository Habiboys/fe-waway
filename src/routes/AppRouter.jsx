import { Spinner } from "@heroui/react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from "../hooks/useAuth";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { AdminOrdersListPage } from "../pages/AdminOrdersListPage";
import { AdminPage } from "../pages/AdminPage";
import { AdminUsersPage } from "../pages/AdminUsersPage";
import { ContactListsPage } from "../pages/ContactListsPage";
import { ContactsPage } from "../pages/ContactsPage";
import { DashboardHomePage } from "../pages/DashboardHomePage";
import { DevicesPage } from "../pages/DevicesPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { OrdersPage } from "../pages/OrdersPage";
import { OrganizationsPage } from "../pages/OrganizationsPage";
import { PlansPage } from "../pages/PlansPage";
import { PlansPricingPage } from "../pages/PlansPricingPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import TemplateMessagesPage from "../pages/TemplateMessagesPage";
import { VerifyEmailPage } from "../pages/VerifyEmailPage";

export function AppRouter() {
  const { isAuthenticated, isBootLoading, user } = useAuth();

  if (isBootLoading) {
    return (
      <main className="loading-wrap">
        <Spinner label="Memuat sesi..." />
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <RegisterPage />
          )
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardHomePage />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route
          path="/plans"
          element={
            user?.role === "admin" ? <PlansPage /> : <PlansPricingPage />
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute roles={["member"]}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminOrdersListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/contact-lists" element={<ContactListsPage />} />
        <Route path="/template-messages" element={<TemplateMessagesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />}
      />
    </Routes>
  );
}
