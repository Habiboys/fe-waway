import { Card, CardContent, CardHeader } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { adminService } from "../services/adminService";

export function AdminPage() {
  const [stats, setStats] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [dashboard, orgRows] = await Promise.all([
        adminService.dashboard(),
        adminService.listOrganizations(),
      ]);

      setStats(dashboard);
      setOrganizations(orgRows);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAll();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const pendingCount = useMemo(
    () => Number(stats?.pending_orders || 0),
    [stats?.pending_orders],
  );

  return (
    <section className="space-y-5 px-4 py-5 md:px-7 md:py-7">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">
          Menu Orders dan Users tersedia langsung di sidebar.
        </p>
      </div>

      {loading ? (
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6 text-sm text-slate-500">
            Memuat data admin...
          </CardContent>
        </Card>
      ) : null}

      {!loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Users</p>
              <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Organizations</p>
              <p className="text-2xl font-bold">
                {stats?.total_organizations || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Messages</p>
              <p className="text-2xl font-bold">
                {Number(stats?.total_messages || 0).toLocaleString("id-ID")}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Revenue</p>
              <p className="text-2xl font-bold">
                Rp {Number(stats?.revenue || 0).toLocaleString("id-ID")}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Pending Orders</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {!loading ? (
        <Card className="border border-slate-200 bg-white">
          <CardHeader>
            <h3 className="text-base font-semibold text-slate-900">
              Organizations
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {organizations.map((org) => (
                <div key={org.id} className="px-5 py-3 text-sm">
                  <p className="font-medium text-slate-800">{org.name}</p>
                  <p className="text-xs text-slate-500">
                    Subscription aktif:{" "}
                    {org.subscriptions?.find((s) => s.status === "active")?.plan
                      ?.name || "Tidak ada"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
