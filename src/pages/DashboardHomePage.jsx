import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Separator,
} from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { adminService } from "../services/adminService";
import { usageService } from "../services/usageService";

export function DashboardHomePage() {
  const { user } = useAuth();
  const [usageSummary, setUsageSummary] = useState(null);
  const [adminSummary, setAdminSummary] = useState(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        if (user?.role === "admin") {
          const summary = await adminService.dashboard();
          setAdminSummary(summary);
          setUsageSummary(null);
          return;
        }

        const summary = await usageService.getSummary();
        setUsageSummary(summary);
        setAdminSummary(null);
      } catch {
        setUsageSummary(null);
        setAdminSummary(null);
      }
    };

    const timer = setTimeout(() => {
      loadSummary();
    }, 0);

    const intervalId = setInterval(loadSummary, 5000);
    const handleFocus = () => loadSummary();
    const handleUsageRefresh = () => loadSummary();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("usage:refresh", handleUsageRefresh);

    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("usage:refresh", handleUsageRefresh);
    };
  }, [user?.role]);

  const stats =
    user?.role === "admin"
      ? [
          {
            label: "Total Users",
            value: Number(adminSummary?.total_users || 0).toLocaleString(
              "id-ID",
            ),
            trend: "Platform",
          },
          {
            label: "Total Organizations",
            value: Number(
              adminSummary?.total_organizations || 0,
            ).toLocaleString("id-ID"),
            trend: "Platform",
          },
          {
            label: "Total Messages",
            value: Number(adminSummary?.total_messages || 0).toLocaleString(
              "id-ID",
            ),
            trend: "Platform",
          },
          {
            label: "Pending Orders",
            value: Number(adminSummary?.pending_orders || 0).toLocaleString(
              "id-ID",
            ),
            trend: "Perlu aksi",
          },
        ]
      : [
          {
            label: "Total Pesan Tersedia",
            value: Number(usageSummary?.limit || 0).toLocaleString("id-ID"),
            trend: usageSummary?.plan?.name || "-",
          },
          {
            label: "Sisa Pesan",
            value: Number(usageSummary?.remaining || 0).toLocaleString("id-ID"),
            trend: usageSummary?.usage_percent
              ? `${usageSummary.usage_percent}% terpakai`
              : "-",
          },
          {
            label: "Pesan Hari Ini",
            value: Number(usageSummary?.used_today || 0).toLocaleString(
              "id-ID",
            ),
            trend: "Aktivitas harian",
          },
          {
            label: "Jatuh Tempo",
            value: usageSummary?.subscription?.end_date
              ? new Date(usageSummary.subscription.end_date).toLocaleDateString(
                  "id-ID",
                )
              : "-",
            trend: "Subscription",
          },
        ];

  const quotaInfoText = useMemo(() => {
    const remaining = Number(usageSummary?.remaining || 0);
    const limit = Number(usageSummary?.limit || 0);
    return `Sisa ${remaining.toLocaleString("id-ID")} dari ${limit.toLocaleString("id-ID")} pesan`;
  }, [usageSummary]);

  return (
    <section className="flex-1 px-4 py-5 md:px-7 md:py-7">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card
            key={item.label}
            className="border border-slate-200 bg-white shadow-sm"
          >
            <CardContent className="space-y-2 p-5">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="text-xs font-medium text-emerald-600">
                {item.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {user?.role === "admin" ? (
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
                  <span className="font-semibold text-slate-900">97.8%</span>
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
        ) : (
          <Card className="border border-slate-200 bg-white shadow-sm xl:col-span-2">
            <CardHeader className="pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Ringkasan Subscription
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
        )}

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
                <p className="font-semibold text-slate-900">{user?.name}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              User ID:{" "}
              <span className="font-semibold text-slate-900">
                {user?.uuid || user?.id}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {user?.role === "admin" ? (
        <Card className="mt-5 border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Platform Snapshot
            </h3>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-2 p-5 text-sm text-slate-600">
            <p>
              Revenue:{" "}
              <span className="font-semibold text-slate-900">
                Rp {Number(adminSummary?.revenue || 0).toLocaleString("id-ID")}
              </span>
            </p>
            <p>
              Pending order menunggu approval:{" "}
              <span className="font-semibold text-slate-900">
                {Number(adminSummary?.pending_orders || 0).toLocaleString(
                  "id-ID",
                )}
              </span>
            </p>
            <p className="text-xs text-slate-500">
              Gunakan menu Orders dan Users di sidebar untuk pengelolaan detail.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
