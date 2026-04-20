import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { OtpAppsPanel } from "../components/otp/OtpAppsPanel";
import { OtpDocsPanel } from "../components/otp/OtpDocsPanel";
import { OtpSendPanel } from "../components/otp/OtpSendPanel";
import { OtpTransactionsPanel } from "../components/otp/OtpTransactionsPanel";
import {
  getCurrentOrganizationId,
  setCurrentOrganizationId,
} from "../lib/organization";
import { deviceService } from "../services/deviceService";
import { masterDataService } from "../services/masterDataService";
import { otpSaasService } from "../services/otpSaasService";
import { usageService } from "../services/usageService";

const TABS = [
  { key: "send", label: "Kirim OTP" },
  { key: "apps", label: "OTP Apps" },
  { key: "transactions", label: "Transaksi" },
  { key: "docs", label: "Dokumentasi API" },
];

export function OtpSaasPage() {
  const [activeTab, setActiveTab] = useState("send");

  // Organization
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(
    getCurrentOrganizationId()
  );

  // Apps & Devices
  const [apps, setApps] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // OTP Quota
  const [otpQuota, setOtpQuota] = useState(null);

  // Load organizations
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const rows = await masterDataService.listOrganizations();
        setOrganizations(rows);
        if (rows.length > 0) {
          const stored = getCurrentOrganizationId();
          const matched = rows.find(
            (o) => String(o.id) === String(stored || selectedOrgId)
          );
          const next = matched ? String(matched.id) : String(rows[0].id);
          setSelectedOrgId(next);
          setCurrentOrganizationId(next);
        } else {
          setSelectedOrgId(null);
          setCurrentOrganizationId(null);
        }
      } catch (err) {
        toast.error(err.message || "Gagal memuat organization");
      }
    };
    loadOrgs();
  }, []);

  // Load apps
  const loadApps = useCallback(async () => {
    if (!selectedOrgId) {
      setApps([]);
      return;
    }
    try {
      setLoadingApps(true);
      const rows = await otpSaasService.listApps();
      setApps(rows);
    } catch (err) {
      toast.error(err.message || "Gagal memuat OTP apps");
      setApps([]);
    } finally {
      setLoadingApps(false);
    }
  }, [selectedOrgId]);

  // Load devices
  const loadDevices = useCallback(async () => {
    if (!selectedOrgId) {
      setDevices([]);
      return;
    }
    try {
      setLoadingDevices(true);
      const rows = await deviceService.list(selectedOrgId);
      setDevices(rows || []);
    } catch (err) {
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  }, [selectedOrgId]);

  // Load OTP quota
  const loadOtpQuota = useCallback(async () => {
    if (!selectedOrgId) {
      setOtpQuota(null);
      return;
    }
    try {
      const data = await usageService.getOtpQuota();
      setOtpQuota(data);
    } catch {
      setOtpQuota(null);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    loadApps();
    loadDevices();
    loadOtpQuota();
  }, [loadApps, loadDevices, loadOtpQuota]);

  // Quota display helpers
  const quotaLabel = () => {
    if (!otpQuota || !otpQuota.hasActiveSubscription) return null;
    if (otpQuota.limit === -1) return "Unlimited";
    if (otpQuota.limit === 0) return "Tidak tersedia";
    return `${otpQuota.used} / ${otpQuota.limit}`;
  };

  const quotaPercent = () => {
    if (!otpQuota || otpQuota.limit <= 0) return 0;
    return Math.min(100, Math.round((otpQuota.used / otpQuota.limit) * 100));
  };

  const quotaColor = () => {
    const pct = quotaPercent();
    if (pct >= 90) return "from-red-500 to-rose-500";
    if (pct >= 70) return "from-amber-500 to-orange-500";
    return "from-indigo-500 to-violet-500";
  };

  return (
    <section className="flex-1 px-4 py-5 md:px-7 md:py-7">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">OTP SaaS</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Layanan OTP via WhatsApp — kirim, verifikasi, dan kelola OTP apps
          </p>
        </div>

        {/* OTP Quota Card */}
        {otpQuota?.hasActiveSubscription && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-3 min-w-[220px]">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Kuota OTP
              </p>
              {otpQuota.plan?.name && (
                <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                  {otpQuota.plan.name}
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-slate-900">
              {quotaLabel()}
            </p>
            {otpQuota.limit > 0 && (
              <>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${quotaColor()} transition-all`}
                    style={{ width: `${quotaPercent()}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  Sisa: {otpQuota.remaining} OTP • {quotaPercent()}% terpakai
                </p>
              </>
            )}
            {otpQuota.limit === 0 && (
              <p className="mt-1 text-[10px] text-red-400">
                Plan Anda belum termasuk OTP. Upgrade untuk menggunakan fitur OTP.
              </p>
            )}
          </div>
        )}

        {/* No subscription warning */}
        {otpQuota && !otpQuota.hasActiveSubscription && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 min-w-[220px]">
            <p className="text-xs font-semibold text-red-700">
              Tidak ada subscription aktif
            </p>
            <p className="text-[10px] text-red-600 mt-0.5">
              Aktifkan plan untuk menggunakan layanan OTP.
            </p>
          </div>
        )}
      </div>

      {/* Organization Selector */}
      <div className="mb-5 flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-600">
          Organization:
        </label>
        <select
          value={selectedOrgId ? String(selectedOrgId) : ""}
          onChange={(e) => {
            const next = e.target.value ? String(e.target.value) : null;
            setSelectedOrgId(next);
            setCurrentOrganizationId(next);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
          style={{ minWidth: 200 }}
        >
          <option value="">-- Pilih Organization --</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-2xl bg-white/80 p-1.5 shadow-sm border border-slate-200 backdrop-blur w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === t.key
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "send" && (
        <OtpSendPanel
          apps={apps}
          devices={devices}
          selectedOrgId={selectedOrgId}
          otpQuota={otpQuota}
          onQuotaChange={loadOtpQuota}
        />
      )}
      {activeTab === "apps" && (
        <OtpAppsPanel
          apps={apps}
          devices={devices}
          onRefreshApps={loadApps}
          loadingApps={loadingApps}
        />
      )}
      {activeTab === "transactions" && <OtpTransactionsPanel apps={apps} />}
      {activeTab === "docs" && <OtpDocsPanel />}
    </section>
  );
}
