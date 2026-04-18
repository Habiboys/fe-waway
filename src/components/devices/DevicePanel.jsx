import {
  Loader2,
  Plus,
  RefreshCw,
  Smartphone,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";

const STATUS_MAP = {
  offline: { color: "bg-slate-400", text: "Offline", glow: "" },
  connecting: {
    color: "bg-amber-400",
    text: "Connecting...",
    glow: "shadow-[0_0_8px_rgba(251,191,36,0.5)]",
  },
  qr_pending: {
    color: "bg-blue-400",
    text: "Scan QR",
    glow: "shadow-[0_0_8px_rgba(96,165,250,0.5)]",
  },
  authenticated: {
    color: "bg-violet-400",
    text: "Authenticated",
    glow: "shadow-[0_0_8px_rgba(167,139,250,0.5)]",
  },
  ready: {
    color: "bg-emerald-500",
    text: "Online",
    glow: "shadow-[0_0_8px_rgba(16,185,129,0.6)]",
  },
  disconnected: { color: "bg-red-400", text: "Disconnected", glow: "" },
  auth_failure: { color: "bg-red-500", text: "Auth Failed", glow: "" },
  error: { color: "bg-red-500", text: "Error", glow: "" },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.offline;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={`h-2 w-2 rounded-full ${s.color} ${s.glow}`} />
      {s.text}
    </span>
  );
}

const TIMELINE_STEPS = ["connecting", "qr_pending", "authenticated", "ready"];
const TIMELINE_LABELS = ["Connecting", "QR Code", "Authenticated", "Ready"];

function StatusTimeline({ currentStatus }) {
  const currentIdx = TIMELINE_STEPS.indexOf(currentStatus);
  return (
    <div className="flex items-center gap-1 mt-4">
      {TIMELINE_STEPS.map((step, i) => {
        const done = currentIdx >= i;
        const active = currentIdx === i;
        return (
          <div key={step} className="flex items-center gap-1 flex-1">
            <div className={`flex flex-col items-center flex-1`}>
              <div
                className={`h-2 w-full rounded-full transition-all duration-500 ${done ? "bg-gradient-to-r from-indigo-500 to-violet-500" : "bg-slate-200"} ${active ? "animate-pulse" : ""}`}
              />
              <span
                className={`text-[10px] mt-1 ${done ? "text-indigo-600 font-semibold" : "text-slate-400"}`}
              >
                {TIMELINE_LABELS[i]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DevicePanel({
  devices,
  selectedDevice,
  onSelect,
  rtStatus,
  getRealtimeStatusForDevice,
  rtQR,
  loading,
  onRefresh,
  onConnect,
  onDisconnect,
  onCreate,
  onDelete,
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await onCreate({ device_name: newName.trim() });
    setNewName("");
    setShowAdd(false);
  };

  const handleConnect = async (id) => {
    setConnecting(true);
    try {
      await onConnect(id);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* Device List */}
      <div className="xl:col-span-1">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Daftar Device</h3>
            <div className="flex gap-1">
              <button
                onClick={onRefresh}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition"
                title="Refresh"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                title="Tambah Device"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {showAdd && (
            <div className="px-5 py-3 border-b border-slate-100 bg-indigo-50/50">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama device..."
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 transition"
                >
                  Tambah
                </button>
                <button
                  onClick={() => {
                    setShowAdd(false);
                    setNewName("");
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {devices.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-slate-400">
                <Smartphone size={32} className="mx-auto mb-2 text-slate-300" />
                Belum ada device. Klik + untuk menambahkan.
              </div>
            )}
            {devices.map((d) => {
              const rowStatus = getRealtimeStatusForDevice
                ? getRealtimeStatusForDevice(d.id)
                : null;

              return (
                <button
                  key={d.id}
                  onClick={() => onSelect(d)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50 ${selectedDevice?.id === d.id ? "bg-indigo-50/60 border-l-[3px] border-indigo-500" : ""}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600">
                    <Smartphone size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {d.device_name}
                    </p>
                    <p className="text-xs text-slate-300">ID: {d.id}</p>
                    <p className="text-xs text-slate-400">
                      {d.phone_number || "Belum terhubung"}
                    </p>
                  </div>
                  <StatusBadge status={rowStatus?.status || d.status} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Device Detail & QR */}
      <div className="xl:col-span-2 space-y-5">
        {!selectedDevice ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-10 text-center">
            <Smartphone size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-400">
              Pilih device dari daftar di samping
            </p>
          </div>
        ) : (
          <>
            {/* Device Info Card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {selectedDevice.device_name}
                    </h2>
                    <p className="text-indigo-100 text-sm mt-0.5">
                      {selectedDevice.phone_number || "Belum terhubung"}
                    </p>
                  </div>
                  <StatusBadge status={rtStatus.status} />
                </div>
                <StatusTimeline currentStatus={rtStatus.status} />
              </div>

              <div className="px-6 py-5 flex flex-wrap gap-3">
                {(rtStatus.status === "offline" ||
                  rtStatus.status === "disconnected" ||
                  rtStatus.status === "auth_failure" ||
                  rtStatus.status === "error") && (
                  <button
                    onClick={() => handleConnect(selectedDevice.id)}
                    disabled={connecting}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:opacity-50 transition"
                  >
                    {connecting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Wifi size={14} />
                    )}{" "}
                    Connect WhatsApp
                  </button>
                )}
                {(rtStatus.status === "ready" ||
                  rtStatus.status === "authenticated" ||
                  rtStatus.status === "qr_pending" ||
                  rtStatus.status === "connecting") && (
                  <button
                    onClick={() => onDisconnect(selectedDevice.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-600 transition"
                  >
                    <WifiOff size={14} /> Disconnect
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm("Hapus device ini?"))
                      onDelete(selectedDevice.id);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition"
                >
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </div>

            {/* QR Code */}
            {(rtStatus.status === "qr_pending" || rtQR) && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-8 text-center">
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Scan QR Code
                </h3>
                <p className="text-sm text-slate-500 mb-5">
                  Buka WhatsApp di HP → Settings → Linked Devices → Link a
                  Device
                </p>
                <div className="inline-block rounded-2xl border-4 border-indigo-100 p-3 bg-white shadow-lg">
                  <img
                    src={rtQR}
                    alt="QR Code"
                    className="w-64 h-64 object-contain"
                  />
                </div>
                <p className="mt-4 text-xs text-slate-400 animate-pulse">
                  QR akan diperbarui otomatis setiap 30 detik...
                </p>
              </div>
            )}

            {/* Connected Info */}
            {rtStatus.status === "ready" && rtStatus.info && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-sm p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <Wifi size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800">
                      WhatsApp Terhubung! ✅
                    </p>
                    <p className="text-sm text-emerald-600">
                      Nomor: +
                      {rtStatus.info?.wid?.user || selectedDevice.phone_number}
                    </p>
                    <p className="text-xs text-emerald-500 mt-0.5">
                      Platform: {rtStatus.info?.platform || "WhatsApp Web"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
