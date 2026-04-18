import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiExamplePanel } from "../components/devices/ApiExamplePanel";
import { BulkSendPanel } from "../components/devices/BulkSendPanel";
import { DevicePanel } from "../components/devices/DevicePanel";
import { SendMessagePanel } from "../components/devices/SendMessagePanel";
import { useSocket } from "../hooks/useSocket";
import { setCurrentOrganizationId } from "../lib/organization";
import { deviceService } from "../services/deviceService";
import { masterDataService } from "../services/masterDataService";

const TABS = [
  { key: "devices", label: "Devices" },
  { key: "send", label: "Kirim Pesan" },
  { key: "bulk", label: "Kirim Massal" },
  { key: "api", label: "Contoh API" },
];

export function DevicesPage() {
  const [activeTab, setActiveTab] = useState("devices");
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  // Organization filter (global)
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  const {
    isConnected: socketConnected,
    getDeviceStatus,
    getDeviceQR,
    getBulkProgress,
  } = useSocket();

  // Load organizations on mount
  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const orgRows = await masterDataService.listOrganizations();
        setOrganizations(orgRows);
        if (orgRows.length > 0) {
          setSelectedOrgId((prev) => {
            if (prev && orgRows.some((o) => Number(o.id) === Number(prev)))
              return prev;
            return Number(orgRows[0].id);
          });
        } else {
          setSelectedOrgId(null);
        }
      } catch (e) {
        toast.error(e.message || "Gagal memuat organization");
      }
    };
    loadOrgs();
  }, []);

  // Fetch devices when org changes
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      // Pass orgId to deviceService.list if supported, else filter manually
      const data = await deviceService.list(selectedOrgId);
      setDevices(data);
      if (!selectedDevice && data.length > 0) setSelectedDevice(data[0]);
    } catch (err) {
      toast.error(err.message || "Gagal memuat devices");
    } finally {
      setLoading(false);
    }
  }, [selectedDevice, selectedOrgId]);

  useEffect(() => {
    fetchDevices();
  }, [selectedOrgId]);

  const deviceId = selectedDevice?.id;
  const rtStatus = deviceId ? getDeviceStatus(deviceId) : { status: "offline" };
  const rtQR = deviceId ? getDeviceQR(deviceId) : null;
  const bulkProgress = deviceId ? getBulkProgress(deviceId) : null;
  const getRealtimeStatusForDevice = (id) => getDeviceStatus(id);

  return (
    <section className="flex-1 px-4 py-5 md:px-7 md:py-7">
      {/* Socket status */}
      <div className="mb-4 flex items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${socketConnected ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-red-400"}`}
        />
        <span className="text-xs text-slate-500">
          {socketConnected ? "Realtime Connected" : "Reconnecting..."}
        </span>
      </div>

      {/* Global Organization Selector */}
      <div className="mb-4 flex gap-2 items-center">
        <label className="text-xs font-semibold text-slate-600">
          Organization:
        </label>
        <select
          value={selectedOrgId ? String(selectedOrgId) : ""}
          onChange={(e) => {
            const next = e.target.value ? Number(e.target.value) : null;
            setSelectedOrgId(next);
            setCurrentOrganizationId(next);
          }}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
          style={{ minWidth: 180 }}
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
                ? "bg-linear-to-r from-indigo-500 to-violet-500 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "devices" && (
        <>
          <DevicePanel
            devices={devices}
            selectedDevice={selectedDevice}
            onSelect={setSelectedDevice}
            rtStatus={rtStatus}
            getRealtimeStatusForDevice={getRealtimeStatusForDevice}
            rtQR={rtQR}
            loading={loading}
            onRefresh={fetchDevices}
            onConnect={async (id) => {
              try {
                await deviceService.connect(id);
                toast.success("Connecting...");
              } catch (e) {
                toast.error(e.message);
              }
            }}
            onDisconnect={async (id) => {
              try {
                await deviceService.disconnect(id);
                toast.success("Disconnected");
                fetchDevices();
              } catch (e) {
                toast.error(e.message);
              }
            }}
            onCreate={async (payload) => {
              try {
                await deviceService.create(payload);
                toast.success("Device ditambahkan");
                fetchDevices();
              } catch (e) {
                toast.error(e.message);
              }
            }}
            onDelete={async (id) => {
              try {
                await deviceService.remove(id);
                toast.success("Device dihapus");
                setSelectedDevice(null);
                fetchDevices();
              } catch (e) {
                toast.error(e.message);
              }
            }}
          />
        </>
      )}
      {activeTab === "send" && (
        <SendMessagePanel
          devices={devices}
          selectedDevice={selectedDevice}
          onSelectDevice={setSelectedDevice}
          rtStatus={rtStatus}
          organizations={organizations}
          selectedOrgId={selectedOrgId}
          setSelectedOrgId={setSelectedOrgId}
        />
      )}
      {activeTab === "bulk" && (
        <BulkSendPanel
          devices={devices}
          selectedDevice={selectedDevice}
          onSelectDevice={setSelectedDevice}
          rtStatus={rtStatus}
          bulkProgress={bulkProgress}
          organizations={organizations}
          selectedOrgId={selectedOrgId}
          setSelectedOrgId={setSelectedOrgId}
        />
      )}
      {activeTab === "api" && <ApiExamplePanel />}
    </section>
  );
}
