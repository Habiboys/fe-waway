/*
import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Separator,
} from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
    const [adminSummary, setAdminSummary] = useState(null);
import { DashboardNavbar } from "../components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "../components/dashboard/DashboardSidebar";
import { APP_NAME } from "../config/app";
import { useAuth } from "../hooks/useAuth";
          if (user?.role === "admin") {
            const summary = await adminService.dashboard();
            setAdminSummary(summary);
            setUsageSummary(null);
            return;
          }
          const summary = await usageService.getSummary();
          setUsageSummary(summary);
          setAdminSummary(null);

export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [usageSummary, setUsageSummary] = useState(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const summary = await usageService.getSummary();
        setUsageSummary(summary);
      } catch {
        setUsageSummary(null);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logout berhasil");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Gagal logout");
    }
  };

  const handleMenuSelect = (menuKey) => {
    const availableRoutes = new Set([
      "/dashboard",
    import { adminService } from "../services/adminService";
      "/organizations",
      "/plans",
      "/orders",
      import { adminService } from "../services/adminService";
      "/admin",
      "/admin/orders",
      "/admin/users",
      "/devices",
      "/contacts",
      const [adminSummary, setAdminSummary] = useState(null);
      "/contact-lists",
    ]);

        const [adminSummary, setAdminSummary] = useState(null);
    if (availableRoutes.has(menuKey)) {
            if (user?.role === "admin") {
              const summary = await adminService.dashboard();
              setAdminSummary(summary);
              if (user?.role === "admin") {
                const summary = await adminService.dashboard();
                setAdminSummary(summary);
                setUsageSummary(null);
                return;
              }
              return;
            }

              setAdminSummary(null);
            const summary = await usageService.getSummary();
            setUsageSummary(summary);
              setAdminSummary(null);
      return;
    }
            setAdminSummary(null);

        }, [user?.role]);
    setIsMobileSidebarOpen(false);
  };
      }, [user?.role]);
  const stats = [
    { label: "Campaign Aktif", value: "12", trend: "+8%" },
        ...(user?.role === "admin"
          ? [
              {
                label: "Total Users",
                value: Number(adminSummary?.total_users || 0).toLocaleString("id-ID"),
                trend: "Platform",
              },
              {
                label: "Total Organizations",
                value: Number(adminSummary?.total_organizations || 0).toLocaleString("id-ID"),
                trend: "Platform",
              },
              {
                label: "Total Messages",
                value: Number(adminSummary?.total_messages || 0).toLocaleString("id-ID"),
                trend: "Platform",
              },
              {
                label: "Pending Orders",
                value: Number(adminSummary?.pending_orders || 0).toLocaleString("id-ID"),
                trend: "Perlu aksi",
              },
            ]
          : [
              { label: "Campaign Aktif", value: "12", trend: "+8%" },
              { label: "Device Online", value: "7", trend: "+2" },
              {
                label: "Pesan Hari Ini",
                value: Number(usageSummary?.used_today || 0).toLocaleString("id-ID"),
                trend: usageSummary?.usage_percent
                  ? `${usageSummary.usage_percent}% terpakai`
                  : "-",
              },
              { label: "Delivery Rate", value: "97.8%", trend: "Stabil" },
            ]),

  const quotaInfoText = useMemo(() => {
    const remaining = Number(usageSummary?.remaining || 0);
    const limit = Number(usageSummary?.limit || 0);
    return `Sisa ${remaining.toLocaleString("id-ID")} dari ${limit.toLocaleString("id-ID")} pesan`;
  }, [usageSummary]);

  return (
    <main className="min-h-dvh bg-slate-100/70 text-slate-800">
      <div className="flex w-full">
        <DashboardSidebar
          appName={APP_NAME}
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
          const stats = user?.role === "admin"
            ? [
                {
                  label: "Total Users",
                  value: Number(adminSummary?.total_users || 0).toLocaleString("id-ID"),
                  trend: "Platform",
                },
                {
                  label: "Total Organizations",
                  value: Number(adminSummary?.total_organizations || 0).toLocaleString("id-ID"),
                  trend: "Platform",
                },
                {
                  label: "Total Messages",
                  value: Number(adminSummary?.total_messages || 0).toLocaleString("id-ID"),
                  trend: "Platform",
                },
                {
                  label: "Pending Orders",
                  value: Number(adminSummary?.pending_orders || 0).toLocaleString("id-ID"),
                  trend: "Perlu aksi",
                },
              ]
            : [
                { label: "Campaign Aktif", value: "12", trend: "+8%" },
                { label: "Device Online", value: "7", trend: "+2" },
                {
                  label: "Pesan Hari Ini",
                  value: Number(usageSummary?.used_today || 0).toLocaleString("id-ID"),
                  trend: usageSummary?.usage_percent
                    ? `${usageSummary.usage_percent}% terpakai`
                    : "-",
                },
                { label: "Delivery Rate", value: "97.8%", trend: "Stabil" },
              ];
                    <p className="text-2xl font-bold text-slate-900">
                      {item.value}
                    </p>
                    <p className="text-xs font-medium text-emerald-600">
                      {item.trend}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
              <Card className="border border-slate-200 bg-white shadow-sm xl:col-span-2">
                <CardHeader className="pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Performa Pengiriman
                  </h3>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-4 p-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-600">Delivery Success</span>
                      <span className="font-semibold text-slate-900">
                        97.8%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-2 w-[97.8%] rounded-full bg-emerald-500" />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-600">Queue Processed</span>
                      <span className="font-semibold text-slate-900">82%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-2 w-[82%] rounded-full bg-indigo-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Profil Pengguna
                  </h3>
                </CardHeader>
                <Separator />
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={user?.name || "U"}
                      className="bg-indigo-100 text-indigo-700"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {user?.name}
                      </p>
                      <p className="text-sm text-slate-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    User ID:{" "}
                    <span className="font-semibold text-slate-900">
                      {user?.id}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-5 border border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Subscription & Kuota
                </h3>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-2 p-5 text-sm text-slate-600">
                <p>
                  Paket aktif:{" "}
                  <span className="font-semibold text-slate-900">
                    {usageSummary?.plan?.name || "-"}
                  </span>
                </p>
                <p>{quotaInfoText}</p>
                <p>
                  Berakhir:{" "}
                  <span className="font-semibold text-slate-900">
                    {usageSummary?.subscription?.end_date
                      ? new Date(
                          usageSummary.subscription.end_date,
                        ).toLocaleDateString("id-ID")
                      : "-"}
                  </span>
                </p>
                {Number(usageSummary?.remaining || 0) <= 100 ? (
                  <p className="font-semibold text-amber-600">
                    Kuota hampir habis. Segera upgrade paket Anda.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <DashboardFooter appName={APP_NAME} />
        </div>
      </div>
    </main>
  );
}

*/
import DashboardHomePage from "./DashboardHomePage";

export default function DashboardPage() {
  return <DashboardHomePage />;
}
