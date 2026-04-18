import { CheckCircle2, Loader2, Send, Smartphone, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { deviceService } from "../../services/deviceService";
import { masterDataService } from "../../services/masterDataService";
import { templateMessageService } from "../../services/templateMessageService";

const INTERNATIONAL_PHONE_REGEX = /^[1-9]\d{7,14}$/;

export function SendMessagePanel({
  devices,
  selectedDevice,
  onSelectDevice,
  rtStatus,
  organizations,
  selectedOrgId,
  setSelectedOrgId,
}) {
  // Reset selected device when org changes (optional: or reload device list if needed)
  useEffect(() => {
    if (
      devices.length > 0 &&
      selectedDevice &&
      !devices.some((d) => d.id === selectedDevice.id)
    ) {
      onSelectDevice(devices[0]);
    }
    if (devices.length === 0) {
      onSelectDevice(null);
    }
  }, [devices, selectedOrgId]);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [contactLists, setContactLists] = useState([]);
  const [selectedContactListId, setSelectedContactListId] = useState("");
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  // Load templates when org changes
  useEffect(() => {
    async function loadTemplates() {
      try {
        const rows = await templateMessageService.list();
        setTemplates(rows);
      } catch {
        setTemplates([]);
      }
    }
    loadTemplates();
    setSelectedTemplateId("");
  }, [selectedOrgId]);
  // When template is selected, fill message
  useEffect(() => {
    if (!selectedTemplateId) return;
    const tpl = templates.find(
      (t) => String(t.id) === String(selectedTemplateId),
    );
    if (tpl) setMessage(tpl.content);
  }, [selectedTemplateId, templates]);

  useEffect(() => {
    const loadContactLists = async () => {
      try {
        const rows = await masterDataService.listContactLists();
        setContactLists(rows || []);
      } catch {
        setContactLists([]);
      }
    };
    loadContactLists();
    setSelectedContactListId("");
    setSelectedContactId("");
  }, [selectedOrgId]);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        let rows = [];
        if (selectedContactListId) {
          const listRows = await masterDataService.listContactsByList(
            selectedContactListId,
          );
          rows = (listRows || [])
            .map((item) => item.contact)
            .filter(Boolean)
            .map((row) => ({
              id: row.id,
              name: row.name,
              phone_number: row.phone_number || row.phone,
            }));
        } else {
          rows = await masterDataService.listContacts();
        }
        setContacts(rows || []);
      } catch {
        setContacts([]);
      }
    };
    loadContacts();
    setSelectedContactId("");
  }, [selectedOrgId, selectedContactListId]);

  useEffect(() => {
    if (!selectedContactId) return;
    const selected = contacts.find(
      (c) => String(c.id) === String(selectedContactId),
    );
    if (selected?.phone_number) {
      setPhone(String(selected.phone_number));
    }
  }, [selectedContactId, contacts]);

  const isReady = rtStatus?.status === "ready";
  const phoneError = useMemo(() => {
    const value = phone.trim();
    if (!value) return "";
    if (/^\+/.test(value)) {
      return "Gunakan format tanpa +. Contoh: 6281234567890";
    }
    if (/^0/.test(value)) {
      return "Nomor harus diawali kode negara (contoh: 62...), bukan 0";
    }
    if (!/^\d+$/.test(value)) {
      return "Nomor hanya boleh berisi angka";
    }
    if (!INTERNATIONAL_PHONE_REGEX.test(value)) {
      return "Panjang nomor tidak valid (8-15 digit)";
    }
    return "";
  }, [phone]);

  const handleSend = async () => {
    if (!selectedDevice) {
      toast.error("Pilih device dulu");
      return;
    }
    if (!phone.trim() || !message.trim()) {
      toast.error("Isi nomor dan pesan");
      return;
    }
    if (phoneError) {
      toast.error(phoneError);
      return;
    }
    if (!isReady) {
      toast.error("Device belum terhubung ke WhatsApp");
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const res = await deviceService.sendTest(selectedDevice.id, {
        phone: phone.trim(),
        message: message.trim(),
      });
      setResult({ success: true, ...res });
      window.dispatchEvent(new Event("usage:refresh"));
      toast.success("Pesan terkirim!");
    } catch (err) {
      setResult({ success: false, message: err.message });
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {/* Form */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-emerald-500 to-teal-500 px-6 py-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Send size={16} /> Kirim Pesan Test
          </h3>
          <p className="text-emerald-100 text-xs mt-1">
            Kirim pesan ke satu nomor WhatsApp untuk testing
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Device selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Device
            </label>
            <select
              value={selectedDevice?.id || ""}
              onChange={(e) => {
                const d = devices.find((x) => x.id === Number(e.target.value));
                if (d) onSelectDevice(d);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
            >
              <option value="">-- Pilih Device --</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.device_name} {d.phone_number ? `(${d.phone_number})` : ""}
                </option>
              ))}
            </select>
            {selectedDevice && !isReady && (
              <p className="text-xs text-amber-500 mt-1">
                ⚠️ Device belum terhubung. Connect dulu di tab Devices.
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nomor Tujuan
            </label>

            <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              <select
                value={selectedContactListId}
                onChange={(e) => setSelectedContactListId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              >
                <option value="">Semua Contact List</option>
                {contactLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              >
                <option value="">Pilih Contact (opsional)</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} ({contact.phone_number})
                  </option>
                ))}
              </select>
            </div>

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\s+/g, ""))}
              placeholder="contoh: 6281234567890"
              className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:ring-2 focus:outline-none ${phoneError ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100" : "border-slate-200 bg-slate-50 focus:border-indigo-400 focus:ring-indigo-100"}`}
            />
            <p className="text-xs text-slate-400 mt-1">
              Format: kode negara + nomor, tanpa + atau spasi
            </p>
            {phoneError ? (
              <p className="text-xs text-red-500 mt-1">⚠️ {phoneError}</p>
            ) : phone.trim() ? (
              <p className="text-xs text-emerald-600 mt-1">
                ✅ Format nomor valid
              </p>
            ) : null}
          </div>

          {/* Template selector and Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Template Pesan
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm mb-2 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              <option value="">-- Pilih Template --</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Pesan
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis pesan Anda di sini..."
              rows={5}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none resize-none"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={sending || !isReady}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {sending ? "Mengirim..." : "Kirim Pesan"}
          </button>
        </div>
      </div>

      {/* Result & Preview */}
      <div className="space-y-5">
        {/* Chat preview */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Preview Chat (Realtime)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tampilan preview disamakan dengan editor template pesan.
            </p>
          </div>
          <div className="p-6">
            <div className="rounded-2xl bg-slate-900 p-3">
              <div className="rounded-xl bg-[#e5ddd5] p-3 min-h-60">
                <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-600">
                  <Smartphone size={13} />
                  <span className="font-semibold">
                    {phone || "6281234567890"}
                  </span>
                </div>
                <div className="ml-auto max-w-[90%] rounded-xl bg-[#dcf8c6] px-3 py-2 shadow-sm">
                  <p className="whitespace-pre-line wrap-break-word text-sm text-slate-800 leading-relaxed">
                    {message || "Pesan Anda akan muncul di sini..."}
                  </p>
                  <p className="mt-1 text-right text-[10px] text-slate-500">
                    Preview sekarang
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`rounded-2xl border shadow-sm p-5 ${result.success ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle2 size={20} className="text-emerald-500 mt-0.5" />
              ) : (
                <XCircle size={20} className="text-red-500 mt-0.5" />
              )}
              <div>
                <p
                  className={`font-semibold text-sm ${result.success ? "text-emerald-800" : "text-red-800"}`}
                >
                  {result.success
                    ? "Pesan Berhasil Terkirim! ✅"
                    : "Gagal Mengirim ❌"}
                </p>
                {result.success && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ID: {result.id}
                  </p>
                )}
                {!result.success && (
                  <p className="text-xs text-red-600 mt-1">{result.message}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
