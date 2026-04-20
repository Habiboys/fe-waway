import {
  CheckCircle2,
  Loader2,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { otpSaasService } from "../../services/otpSaasService";

export function OtpSendPanel({ apps, devices, selectedOrgId, otpQuota, onQuotaChange }) {
  const [selectedAppId, setSelectedAppId] = useState("");
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("login");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  const selectedApp = apps.find((a) => String(a.id) === String(selectedAppId));
  const deviceForApp = selectedApp?.device;

  const handleSend = async () => {
    if (!selectedAppId) return toast.error("Pilih OTP App dulu");
    if (!destination.trim()) return toast.error("Masukkan nomor tujuan");

    try {
      setSending(true);
      setResult(null);
      setVerifyResult(null);
      setVerifyCode("");

      const res = await otpSaasService.testSend(selectedAppId, {
        destination: destination.trim(),
        purpose,
      });

      if (!res.success) {
        throw new Error(res.message || "Gagal kirim OTP");
      }

      setResult(res.data);
      toast.success("OTP berhasil dikirim!");
      if (onQuotaChange) onQuotaChange();
    } catch (err) {
      toast.error(err.message || "Gagal kirim OTP");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!result?.transaction_id) return toast.error("Kirim OTP dulu");
    if (!verifyCode.trim()) return toast.error("Masukkan kode OTP");

    try {
      setVerifying(true);
      setVerifyResult(null);

      const res = await otpSaasService.testVerify(selectedAppId, {
        transaction_id: result.transaction_id,
        code: verifyCode.trim(),
      });

      if (!res.success) {
        throw new Error(res.message || "Verifikasi gagal");
      }

      setVerifyResult(res.data);
      toast.success("OTP berhasil diverifikasi!");
    } catch (err) {
      toast.error(err.message || "Verifikasi gagal");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Info box */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 p-5">
        <p className="text-sm font-semibold text-indigo-800">
          Panel Test OTP
        </p>
        <p className="mt-1 text-xs text-indigo-700">
          Test kirim dan verifikasi OTP dari dashboard. OTP dikirim via device
          WhatsApp yang sudah di-set pada OTP App. Untuk integrasi dari sistem
          lain, lihat tab <strong>Dokumentasi API</strong>.
        </p>
      </div>

      {/* Quota warning */}
      {otpQuota && !otpQuota.allowed && otpQuota.hasActiveSubscription && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-800">
            Kuota OTP Habis
          </p>
          <p className="mt-1 text-xs text-red-600">
            {otpQuota.limit === 0
              ? "Plan Anda belum termasuk OTP. Upgrade untuk menggunakan fitur ini."
              : "Kuota OTP Anda sudah habis untuk periode ini. Upgrade plan atau tunggu reset kuota."}
          </p>
        </div>
      )}

      {/* Send OTP Form */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Send size={16} />
            Kirim OTP via WhatsApp
          </h3>
          <p className="text-indigo-200 text-xs mt-1">
            Test kirim OTP langsung ke nomor WhatsApp
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* App selector */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              OTP App
            </label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
            >
              <option value="">-- Pilih OTP App --</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.environment})
                </option>
              ))}
            </select>
          </div>

          {/* Device info */}
          {selectedApp && (
            <div
              className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs ${
                deviceForApp
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <Phone size={14} />
              {deviceForApp ? (
                <span>
                  Device: <strong>{deviceForApp.device_name}</strong>
                  {deviceForApp.phone_number &&
                    ` (${deviceForApp.phone_number})`}
                  {" — "}
                  Status: <strong>{deviceForApp.status}</strong>
                </span>
              ) : (
                <span>
                  Belum ada device WA yang di-set untuk app ini. Set di tab{" "}
                  <strong>OTP Apps</strong>.
                </span>
              )}
            </div>
          )}

          {/* Form fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Nomor Tujuan
              </label>
              <input
                type="text"
                placeholder="6281234567890"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Format: 62xxxx (tanpa +)
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Purpose
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
              >
                <option value="login">Login</option>
                <option value="register">Register</option>
                <option value="payment">Payment</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !selectedAppId || (otpQuota && !otpQuota.allowed)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {sending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {sending ? "Mengirim..." : "Kirim OTP"}
          </button>
        </div>
      </div>

      {/* Result panel */}
      {result && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 size={16} />
              Hasil Kirim OTP
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <InfoRow label="Transaction ID" value={result.transaction_id} mono />
              <InfoRow label="Status" value={result.status} badge />
              <InfoRow label="Channel" value={result.channel} />
              <InfoRow label="Purpose" value={result.purpose} />
              <InfoRow label="Tujuan" value={result.destination_masked} />
              <InfoRow
                label="Expires"
                value={
                  result.expires_at
                    ? new Date(result.expires_at).toLocaleString("id-ID")
                    : "-"
                }
              />
              {result.otp_code && (
                <InfoRow
                  label="OTP Code (Sandbox)"
                  value={result.otp_code}
                  mono
                  highlight
                />
              )}
            </div>

            {/* Verify section */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <ShieldCheck size={14} className="text-indigo-500" />
                Verifikasi OTP
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Masukkan kode OTP"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  maxLength={8}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-mono tracking-widest text-center focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
                />
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:shadow-md disabled:opacity-50 transition-all"
                >
                  {verifying ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ShieldCheck size={14} />
                  )}
                  Verify
                </button>
              </div>
              {verifyResult && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm font-semibold text-emerald-700">
                    OTP Verified!
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Status: {verifyResult.status} — Verified at:{" "}
                    {verifyResult.verified_at
                      ? new Date(verifyResult.verified_at).toLocaleString(
                          "id-ID"
                        )
                      : "-"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono, badge, highlight }) {
  return (
    <div
      className={`rounded-xl px-4 py-2.5 ${highlight ? "border border-amber-200 bg-amber-50" : "bg-slate-50"}`}
    >
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      {badge ? (
        <span
          className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(value)}`}
        >
          {value}
        </span>
      ) : (
        <p
          className={`mt-0.5 text-sm text-slate-800 ${mono ? "font-mono text-xs break-all" : ""}`}
        >
          {value || "-"}
        </p>
      )}
    </div>
  );
}

function statusColor(status) {
  const map = {
    sent: "bg-blue-100 text-blue-700",
    verified: "bg-emerald-100 text-emerald-700",
    expired: "bg-amber-100 text-amber-700",
    blocked: "bg-red-100 text-red-700",
    cancelled: "bg-slate-100 text-slate-600",
    failed: "bg-red-100 text-red-700",
    created: "bg-slate-100 text-slate-600",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}
