import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { DashboardFooter } from "../components/dashboard/DashboardFooter";
import { DashboardNavbar } from "../components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "../components/dashboard/DashboardSidebar";
import { APP_NAME } from "../config/app";
import { useAuth } from "../hooks/useAuth";

const DASHBOARD_ROUTES = new Set([
  "/dashboard",
  "/organizations",
  "/plans",
  "/orders",
  "/admin",
  "/admin/orders",
  "/admin/users",
  "/devices",
  "/contacts",
  "/contact-lists",
  "/template-messages",
  "/otp-saas",
  "/profile",
]);

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const handleMenuSelect = (menuKey) => {
    if (DASHBOARD_ROUTES.has(menuKey)) {
      navigate(menuKey);
      setIsMobileSidebarOpen(false);
      return;
    }

    toast.info(`Menu ${menuKey} segera hadir`);
    setIsMobileSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logout berhasil");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Gagal logout");
    }
  };

  return (
    <main className="min-h-dvh bg-slate-100/70 text-slate-800">
      <div className="flex w-full">
        <DashboardSidebar
          isMobileOpen={isMobileSidebarOpen}
          isDesktopOpen={isDesktopSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          currentPath={location.pathname}
          onMenuSelect={handleMenuSelect}
        />

        <div className="flex min-h-dvh flex-1 flex-col">
          <DashboardNavbar
            user={user}
            isDesktopSidebarOpen={isDesktopSidebarOpen}
            onToggleMobileSidebar={() =>
              setIsMobileSidebarOpen((prev) => !prev)
            }
            onToggleDesktopSidebar={() =>
              setIsDesktopSidebarOpen((prev) => !prev)
            }
            onProfile={() => navigate("/profile")}
            onLogout={handleLogout}
          />

          <div className="flex-1">
            <Outlet />
          </div>

          <DashboardFooter appName={APP_NAME} />
        </div>
      </div>
    </main>
  );
}
