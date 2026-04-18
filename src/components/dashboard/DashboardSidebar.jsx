import { Button } from "@heroui/react";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  List,
  MessageSquare,
  Receipt,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { usageService } from "../../services/usageService";

const menuItems = [
  { key: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    key: "/devices",
    label: "Kirim Pesan WA",
    icon: MessageSquare,
    highlight: true,
  },
  { key: "/template-messages", label: "Template Pesan", icon: List },
  { key: "/organizations", label: "Organizations", icon: Building2 },
  { key: "/contacts", label: "Contacts", icon: Users },
  { key: "/contact-lists", label: "Contact Lists", icon: List },
  { key: "/plans", label: "Plans", icon: CreditCard },
  { key: "/orders", label: "My Orders", icon: Receipt, memberOnly: true },
  { key: "/admin/orders", label: "Orders", icon: Receipt, adminOnly: true },
  { key: "/admin/users", label: "Users", icon: Users, adminOnly: true },
];

export function DashboardSidebar({
  isMobileOpen,
  isDesktopOpen,
  onCloseMobile,
  currentPath,
  onMenuSelect,
}) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  const loadSummary = useCallback(async () => {
    if (user?.role === "admin") {
      setSummary(null);
      return;
    }

    try {
      const data = await usageService.getSummary();
      setSummary(data);
    } catch {
      setSummary(null);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === "admin") {
      return;
    }

    const initialTimer = setTimeout(() => {
      loadSummary();
    }, 0);

    const intervalId = setInterval(loadSummary, 5000);
    const handleFocus = () => loadSummary();
    const handleUsageRefresh = () => loadSummary();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("usage:refresh", handleUsageRefresh);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("usage:refresh", handleUsageRefresh);
    };
  }, [currentPath, loadSummary, user?.role]);

  const visibleMenus = useMemo(() => {
    return menuItems.filter(
      (item) =>
        !(item.adminOnly && user?.role !== "admin") &&
        !(item.memberOnly && user?.role !== "member"),
    );
  }, [user?.role]);

  const remaining = Number(summary?.remaining || 0);
  const limit = Number(summary?.limit || 0);
  const used = Number(summary?.used || 0);
  const usagePercent =
    limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const SidebarContent = (
    <>
      <div className="mb-8">
        <h1 className="mt-2 text-xl font-bold text-slate-900">Control Panel</h1>
      </div>

      <nav className="space-y-1">
        {visibleMenus.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPath === item.key || currentPath?.startsWith(`${item.key}/`);
          return (
            <button
              key={item.key}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                isActive
                  ? "bg-indigo-50 font-semibold text-indigo-700"
                  : item.highlight
                    ? "text-emerald-600 hover:bg-emerald-50 font-medium"
                    : "text-slate-600 hover:bg-slate-100"
              }`}
              onClick={() => onMenuSelect(item.key)}
            >
              <Icon
                size={16}
                className={
                  isActive
                    ? "text-indigo-500"
                    : item.highlight
                      ? "text-emerald-500"
                      : "text-slate-400"
                }
              />
              {item.label}
              {item.highlight && !isActive && (
                <span className="ml-auto inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
        {user?.role === "admin" ? (
          <>
            <p className="text-sm font-semibold text-indigo-700">Admin Mode</p>
            <p className="mt-1 text-xs text-indigo-600">
              Kelola order semua organisasi dan paket dari panel admin.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-indigo-700">
              Plan: {summary?.plan?.name || "-"}
            </p>
            <p className="mt-1 text-xs text-indigo-600">
              {remaining.toLocaleString("id-ID")} sisa dari{" "}
              {limit.toLocaleString("id-ID")} pesan
            </p>
            <div className="mt-3 h-2 rounded-full bg-indigo-100">
              <div
                className="h-2 rounded-full bg-indigo-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      <aside
        className={`hidden shrink-0 min-h-dvh border-r border-slate-200 bg-white/95 px-5 py-6 shadow-sm backdrop-blur md:flex md:flex-col md:transition-all md:duration-200 ${
          isDesktopOpen
            ? "md:w-72 md:opacity-100"
            : "md:w-0 md:overflow-hidden md:px-0 md:py-0 md:opacity-0"
        }`}
      >
        {SidebarContent}
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-slate-900/35 transition-opacity md:hidden ${
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseMobile}
      >
        <aside
          className={`h-full w-72 border-r border-slate-200 bg-white px-5 py-6 shadow-xl transition-transform ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex justify-end">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={onCloseMobile}
            >
              <X size={16} />
            </Button>
          </div>
          <div className="flex h-[calc(100%-2.5rem)] flex-col">
            {SidebarContent}
          </div>
        </aside>
      </div>
    </>
  );
}
