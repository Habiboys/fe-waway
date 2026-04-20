import {
  Copy,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { otpSaasService } from "../../services/otpSaasService";
import { ConfirmModal } from "../common/ConfirmModal";

const DEFAULT_TEMPLATE =
  "Kode OTP Anda: {{code}}. Berlaku {{ttl}} menit. Jangan bagikan kode ini ke siapapun.";

export function OtpAppsPanel({ apps, devices, onRefreshApps, loadingApps }) {
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    environment: "sandbox",
    device_id: "",
    message_template: DEFAULT_TEMPLATE,
  });
  const [latestKey, setLatestKey] = useState("");

  // App detail states
  const [keys, setKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [rotatingKey, setRotatingKey] = useState(false);
  const [savingApp, setSavingApp] = useState(false);
  const [deletingApp, setDeletingApp] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const [editForm, setEditForm] = useState({
    device_id: "",
    message_template: DEFAULT_TEMPLATE,
  });
  const [policyForm, setPolicyForm] = useState({
    ttl_seconds: 300,
    code_length: 6,
    max_attempts: 5,
    resend_cooldown_seconds: 60,
    max_resend: 3,
    rate_limit_per_minute: 30,
  });

  const selectedApp = apps.find((a) => String(a.id) === String(selectedAppId));

  // Load keys when selected app changes
  useEffect(() => {
    if (!selectedAppId) {
      setKeys([]);
      return;
    }
    loadKeys();
  }, [selectedAppId]);

  // Sync edit form with selected app
  useEffect(() => {
    if (selectedApp) {
      setEditForm({
        device_id: selectedApp.device_id || "",
        message_template: selectedApp.message_template || DEFAULT_TEMPLATE,
      });
      if (selectedApp.policy) {
        setPolicyForm({
          ttl_seconds: Number(selectedApp.policy.ttl_seconds || 300),
          code_length: Number(selectedApp.policy.code_length || 6),
          max_attempts: Number(selectedApp.policy.max_attempts || 5),
          resend_cooldown_seconds: Number(
            selectedApp.policy.resend_cooldown_seconds || 60,
          ),
          max_resend: Number(selectedApp.policy.max_resend || 3),
          rate_limit_per_minute: Number(
            selectedApp.policy.rate_limit_per_minute || 30,
          ),
        });
      }
    }
  }, [selectedApp]);

  const loadKeys = async () => {
    if (!selectedAppId) return;
    try {
      setLoadingKeys(true);
      const rows = await otpSaasService.listKeys(selectedAppId);
      setKeys(rows || []);
    } catch (err) {
      toast.error(err.message || "Gagal memuat API keys");
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleCreate = async () => {
    const name = createForm.name.trim();
    if (!name) return toast.error("Nama app wajib diisi");

    try {
      setCreating(true);
      const result = await otpSaasService.createApp({
        name,
        environment: createForm.environment,
        device_id: createForm.device_id || null,
        message_template: createForm.message_template || DEFAULT_TEMPLATE,
      });

      toast.success("OTP App berhasil dibuat!");
      if (result?.api_key) {
        setLatestKey(result.api_key);
        toast.info("Simpan API key ini sekarang! Tidak akan ditampilkan lagi.");
      }

      setCreateForm({
        name: "",
        environment: "sandbox",
        device_id: "",
        message_template: DEFAULT_TEMPLATE,
      });
      setShowCreate(false);
      await onRefreshApps();
    } catch (err) {
      toast.error(err.message || "Gagal membuat OTP app");
    } finally {
      setCreating(false);
    }
  };

  const handleRotateKey = async () => {
    if (!selectedAppId) return;
    try {
      setRotatingKey(true);
      const result = await otpSaasService.rotateKey(selectedAppId);
      toast.success("API key berhasil di-rotate!");
      if (result?.api_key) {
        setLatestKey(result.api_key);
        toast.info("Simpan API key baru ini!");
      }
      await loadKeys();
      await onRefreshApps();
    } catch (err) {
      toast.error(err.message || "Gagal rotate API key");
    } finally {
      setRotatingKey(false);
    }
  };

  const handleSaveApp = async () => {
    if (!selectedAppId) return;
    try {
      setSavingApp(true);
      await otpSaasService.updateApp(selectedAppId, {
        device_id: editForm.device_id || null,
        message_template: editForm.message_template || DEFAULT_TEMPLATE,
      });
      toast.success("Pengaturan app berhasil disimpan!");
      await onRefreshApps();
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan pengaturan");
    } finally {
      setSavingApp(false);
    }
  };

  const handleSavePolicy = async () => {
    if (!selectedAppId) return;
    try {
      setSavingPolicy(true);
      await otpSaasService.updatePolicy(selectedAppId, policyForm);
      toast.success("Policy berhasil disimpan!");
      await onRefreshApps();
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan policy");
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleDeleteApp = async () => {
    if (!selectedAppId || !selectedApp) return;

    try {
      setDeletingApp(true);
      await otpSaasService.deleteApp(selectedAppId);
      toast.success("OTP app berhasil dihapus");
      setDeleteModalOpen(false);
      setSelectedAppId(null);
      setKeys([]);
      setLatestKey("");
      await onRefreshApps();
    } catch (err) {
      toast.error(err.message || "Gagal menghapus OTP app");
    } finally {
      setDeletingApp(false);
    }
  };

  const copyKey = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("API key disalin!");
  };

  return (
    <div className="space-y-5">
      {/* Latest key alert */}
      {latestKey && (
        <div className="rounded-2xl border border-emerald-200 bg-linear-to-r from-emerald-50 to-teal-50 p-5 animate-in fade-in">
          <p className="text-sm font-bold text-emerald-800">
            API Key Baru — Simpan Sekarang!
          </p>
          <p className="mt-1 text-xs text-emerald-600">
            Key ini hanya ditampilkan sekali. Simpan di tempat yang aman.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              readOnly
              value={latestKey}
              className="flex-1 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 font-mono text-xs text-slate-700"
            />
            <button
              onClick={() => copyKey(latestKey)}
              className="rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition flex items-center gap-1.5"
            >
              <Copy size={12} />
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Left — App List */}
        <div className="xl:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">OTP Apps</h3>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition"
              >
                <Plus size={12} />
                Baru
              </button>
            </div>

            {/* Create form */}
            {showCreate && (
              <div className="border-b border-slate-100 p-5 space-y-3 bg-slate-50/50">
                <input
                  type="text"
                  placeholder="Nama OTP App"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                />
                <select
                  value={createForm.environment}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      environment: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                >
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                </select>
                <select
                  value={createForm.device_id}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      device_id: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                >
                  <option value="">-- Pilih Device WA --</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.device_name}
                      {d.phone_number ? ` (${d.phone_number})` : ""}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Template pesan OTP"
                  value={createForm.message_template}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      message_template: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-mono focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                />
                <p className="text-[10px] text-slate-400">
                  Variabel: {"{{code}}"}, {"{{ttl}}"}, {"{{purpose}}"},{" "}
                  {"{{app_name}}"}
                </p>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:shadow-md disabled:opacity-50 transition-all"
                >
                  {creating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  {creating ? "Membuat..." : "Buat OTP App"}
                </button>
              </div>
            )}

            {/* App list */}
            <div className="divide-y divide-slate-100">
              {loadingApps ? (
                <div className="p-5 text-center">
                  <Loader2
                    size={16}
                    className="animate-spin mx-auto text-slate-400"
                  />
                  <p className="text-xs text-slate-500 mt-2">Memuat...</p>
                </div>
              ) : apps.length === 0 ? (
                <div className="p-5 text-center">
                  <p className="text-xs text-slate-500">Belum ada OTP App.</p>
                </div>
              ) : (
                apps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      setSelectedAppId(app.id);
                      setLatestKey("");
                    }}
                    className={`w-full text-left px-5 py-4 transition hover:bg-slate-50 ${
                      String(selectedAppId) === String(app.id)
                        ? "bg-indigo-50/70 border-l-4 border-indigo-500"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        {app.name}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          app.environment === "production"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {app.environment}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                      <Smartphone size={10} />
                      {app.device?.device_name || (
                        <span className="text-red-400">No device</span>
                      )}
                      {app.device?.phone_number && (
                        <span>• {app.device.phone_number}</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right — App Details */}
        <div className="xl:col-span-2 space-y-5">
          {!selectedApp ? (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-10 text-center">
              <Settings2 size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">
                Pilih OTP App dari daftar di sebelah kiri untuk melihat detail.
              </p>
            </div>
          ) : (
            <>
              {/* Device & Template Settings */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Smartphone size={14} className="text-indigo-500" />
                      Pengaturan App — {selectedApp.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Set device WhatsApp dan template pesan OTP
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteModalOpen(true)}
                    disabled={deletingApp}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                  >
                    {deletingApp ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                    {deletingApp ? "Menghapus..." : "Hapus App"}
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Device WhatsApp
                    </label>
                    <select
                      value={editForm.device_id}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          device_id: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    >
                      <option value="">-- Pilih Device WA --</option>
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.device_name}
                          {d.phone_number ? ` (${d.phone_number})` : ""} —{" "}
                          {d.status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                      Template Pesan OTP
                    </label>
                    <textarea
                      value={editForm.message_template}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          message_template: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-mono focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                    />
                    <p className="mt-1 text-[10px] text-slate-400">
                      Variabel: {"{{code}}"} = kode OTP, {"{{ttl}}"} = masa
                      berlaku (menit), {"{{purpose}}"} = tujuan,{" "}
                      {"{{app_name}}"} = nama app
                    </p>
                  </div>
                  <button
                    onClick={handleSaveApp}
                    disabled={savingApp}
                    className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:shadow-md disabled:opacity-50 transition-all"
                  >
                    {savingApp ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    {savingApp ? "Menyimpan..." : "Simpan Pengaturan"}
                  </button>
                </div>
              </div>

              {/* API Keys */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound size={14} className="text-amber-500" />
                    API Keys
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={loadKeys}
                      disabled={loadingKeys}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition"
                    >
                      <RefreshCw
                        size={12}
                        className={loadingKeys ? "animate-spin" : ""}
                      />
                    </button>
                    <button
                      onClick={handleRotateKey}
                      disabled={rotatingKey}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
                    >
                      {rotatingKey ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <RefreshCw size={12} />
                      )}
                      Rotate Key
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Key Preview</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Dibuat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingKeys ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-5 py-4 text-center text-slate-400"
                          >
                            Memuat...
                          </td>
                        </tr>
                      ) : keys.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-5 py-4 text-center text-slate-400"
                          >
                            Belum ada API key.
                          </td>
                        </tr>
                      ) : (
                        keys.map((key) => (
                          <tr key={key.id}>
                            <td className="px-5 py-3 font-mono text-slate-700">
                              {key.key_preview}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  key.is_active
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {key.is_active ? "Active" : "Revoked"}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-slate-500">
                              {key.created_at
                                ? new Date(key.created_at).toLocaleString(
                                    "id-ID",
                                  )
                                : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Policy */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Settings2 size={14} className="text-violet-500" />
                    Policy OTP
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Atur masa berlaku, panjang kode, percobaan, dan limit resend
                  </p>
                </div>
                <div className="p-6 grid gap-4 md:grid-cols-2">
                  <PolicyField
                    label="TTL OTP (detik)"
                    hint="60–900. Contoh: 300 = 5 menit"
                    value={policyForm.ttl_seconds}
                    min={60}
                    max={900}
                    onChange={(v) =>
                      setPolicyForm((p) => ({ ...p, ttl_seconds: v }))
                    }
                  />
                  <PolicyField
                    label="Panjang Kode"
                    hint="4–8 digit"
                    value={policyForm.code_length}
                    min={4}
                    max={8}
                    onChange={(v) =>
                      setPolicyForm((p) => ({ ...p, code_length: v }))
                    }
                  />
                  <PolicyField
                    label="Max Percobaan Verifikasi"
                    hint="1–15"
                    value={policyForm.max_attempts}
                    min={1}
                    max={15}
                    onChange={(v) =>
                      setPolicyForm((p) => ({ ...p, max_attempts: v }))
                    }
                  />
                  <PolicyField
                    label="Cooldown Resend (detik)"
                    hint="10–600"
                    value={policyForm.resend_cooldown_seconds}
                    min={10}
                    max={600}
                    onChange={(v) =>
                      setPolicyForm((p) => ({
                        ...p,
                        resend_cooldown_seconds: v,
                      }))
                    }
                  />
                  <PolicyField
                    label="Max Resend"
                    hint="0–20"
                    value={policyForm.max_resend}
                    min={0}
                    max={20}
                    onChange={(v) =>
                      setPolicyForm((p) => ({ ...p, max_resend: v }))
                    }
                  />
                  <PolicyField
                    label="Rate Limit per Menit"
                    hint="1–300"
                    value={policyForm.rate_limit_per_minute}
                    min={1}
                    max={300}
                    onChange={(v) =>
                      setPolicyForm((p) => ({
                        ...p,
                        rate_limit_per_minute: v,
                      }))
                    }
                  />
                  <div className="md:col-span-2">
                    <button
                      onClick={handleSavePolicy}
                      disabled={savingPolicy}
                      className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:shadow-md disabled:opacity-50 transition-all"
                    >
                      {savingPolicy ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      {savingPolicy ? "Menyimpan..." : "Simpan Policy"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Hapus OTP App"
        message={`Yakin hapus OTP app "${selectedApp?.name || ""}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmText="Hapus"
        isLoading={deletingApp}
        onCancel={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteApp}
      />
    </div>
  );
}

function PolicyField({ label, hint, value, min, max, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
      />
      <p className="mt-1 text-[10px] text-slate-400">{hint}</p>
    </div>
  );
}
