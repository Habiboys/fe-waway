import { CheckCircle2, FileImage, Loader2, Send, Smartphone, Upload, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { deviceService } from "../../services/deviceService";
import { masterDataService } from "../../services/masterDataService";
import { templateMessageService } from "../../services/templateMessageService";

const INTERNATIONAL_PHONE_REGEX = /^[1-9]\d{7,14}$/;

const extractTemplateVariables = (text = "") => {
  const matches = String(text).match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/[{}\s]/g, "")))];
};

const applyTemplateVariables = (text = "", values = {}) => {
  return String(text).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => {
    const value = values[key];
    return value === undefined || value === null || value === ""
      ? `{{${key}}}`
      : String(value);
  });
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export function SendMessagePanel({
  devices,
  selectedDevice,
  onSelectDevice,
  rtStatus,
  selectedOrgId,
}) {
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

  const fileInputRef = useRef(null);
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
  const [variableValues, setVariableValues] = useState({});

  // Media state
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [sendMethod, setSendMethod] = useState("text"); // text | url | file

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
    if (tpl) {
      setMessage(tpl.content);
      setVariableValues({});
    }
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
      setVariableValues((prev) => ({
        ...prev,
        name: prev.name || selected.name || "",
        nama: prev.nama || selected.name || "",
        phone: prev.phone || String(selected.phone_number),
      }));
    }
  }, [selectedContactId, contacts]);

  const templateVariables = useMemo(
    () => extractTemplateVariables(message),
    [message],
  );

  const renderedMessage = useMemo(
    () => applyTemplateVariables(message, variableValues),
    [message, variableValues],
  );

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
    if (!phone.trim()) {
      toast.error("Isi nomor tujuan");
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
    if (sendMethod === "text" && !message.trim()) {
      toast.error("Isi pesan");
      return;
    }
    if (sendMethod === "url" && !mediaUrl.trim()) {
      toast.error("Isi URL media");
      return;
    }
    if (sendMethod === "file" && !mediaFile) {
      toast.error("Pilih file media");
      return;
    }

    setSending(true);
    setResult(null);

    try {
      let res;

      if (sendMethod === "file") {
        // Upload file via sendMedia
        res = await deviceService.sendMedia(
          selectedDevice.id,
          mediaFile,
          phone.trim(),
          caption || undefined,
        );
      } else if (sendMethod === "url") {
        // Send via mediaUrl
        res = await deviceService.send(selectedDevice.id, {
          phone: phone.trim(),
          message: (caption || renderedMessage || "").trim(),
          mediaUrl: mediaUrl.trim(),
          caption: caption || undefined,
        });
      } else {
        // Text only
        res = await deviceService.send(selectedDevice.id, {
          phone: phone.trim(),
          message: renderedMessage.trim(),
        });
      }

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setMediaFile(file);
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
            Kirim pesan teks / media ke satu nomor WhatsApp
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
                const d = devices.find(
                  (x) => String(x.id) === String(e.target.value),
                );
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

          {/* Send Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Jenis Kiriman
            </label>
            <div className="flex gap-2">
              {[
                { key: "text", label: "Teks" },
                { key: "url", label: "Media URL" },
                { key: "file", label: "Upload File" },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setSendMethod(m.key);
                    if (m.key === "text") {
                      setMediaFile(null);
                      setMediaUrl("");
                    }
                  }}
                  className={`rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                    sendMethod === m.key
                      ? "bg-indigo-500 text-white shadow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text message */}
          {(sendMethod === "text" || sendMethod === "url") && (
            <div>
              {sendMethod === "text" && (
                <>
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
                </>
              )}
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                {sendMethod === "url" ? "Caption / Pesan" : "Pesan"}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tulis pesan Anda di sini..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none resize-none"
              />
            </div>
          )}

          {/* Template variables */}
          {templateVariables.length > 0 && sendMethod === "text" && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
              <p className="mb-2 text-xs font-semibold text-indigo-700">
                Isi Variabel Template
              </p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {templateVariables.map((key) => (
                  <input
                    key={key}
                    value={variableValues[key] || ""}
                    onChange={(e) =>
                      setVariableValues((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    placeholder={`${key}`}
                    className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Media URL input */}
          {sendMethod === "url" && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                URL Media (gambar/video/audio/dokumen)
              </label>
              <input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                URL publik ke file gambar, video, audio, atau dokumen
              </p>
            </div>
          )}

          {/* File upload */}
          {sendMethod === "file" && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                File Media
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors"
              >
                {mediaFile ? (
                  <div className="space-y-1">
                    <FileImage size={32} className="mx-auto text-indigo-500" />
                    <p className="text-sm font-medium text-slate-700">
                      {mediaFile.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatFileSize(mediaFile.size)}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-xs text-red-500 hover:underline mt-1"
                    >
                      Hapus file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload size={32} className="mx-auto text-slate-400" />
                    <p className="text-sm text-slate-500">
                      Klik untuk pilih file
                    </p>
                    <p className="text-xs text-slate-400">
                      Gambar, video, audio, dokumen (max 50MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Caption (for media) */}
          {(sendMethod === "url" || sendMethod === "file") && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Caption (opsional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tulis caption untuk media..."
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none resize-none"
              />
            </div>
          )}

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
                    {renderedMessage || "Pesan Anda akan muncul di sini..."}
                  </p>
                  {(sendMethod === "url" || sendMethod === "file") && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                      <FileImage size={12} />
                      <span>
                        {sendMethod === "file" && mediaFile
                          ? mediaFile.name
                          : mediaUrl
                            ? "Media URL"
                            : "+ Media"}
                      </span>
                    </div>
                  )}
                  {caption && (
                    <p className="mt-1 text-[11px] text-slate-500 italic">
                      Caption: {caption}
                    </p>
                  )}
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