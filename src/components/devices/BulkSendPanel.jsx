import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Send,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { deviceService } from "../../services/deviceService";
import { masterDataService } from "../../services/masterDataService";
import { templateMessageService } from "../../services/templateMessageService";

export function BulkSendPanel({
  devices,
  selectedDevice,
  onSelectDevice,
  rtStatus,
  bulkProgress,
  organizations,
  selectedOrgId,
  setSelectedOrgId,
}) {
  const [mode, setMode] = useState("excel"); // 'excel' | 'manual'
  const [contacts, setContacts] = useState([]);
  const [loadingOrgContacts, setLoadingOrgContacts] = useState(false);
  const [contactLists, setContactLists] = useState([]);
  const [selectedContactListId, setSelectedContactListId] = useState("");
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
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
  const [manualText, setManualText] = useState("");
  const [fileName, setFileName] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);
  const isReady = rtStatus?.status === "ready";

  useEffect(() => {
    const loadLists = async () => {
      try {
        const rows = await masterDataService.listContactLists();
        setContactLists(rows || []);
      } catch {
        setContactLists([]);
      }
    };

    loadLists();
    setSelectedContactListId("");
  }, [selectedOrgId]);

  // Load contacts when org changes
  useEffect(() => {
    if (!selectedOrgId) {
      setContacts([]);
      return;
    }
    const loadContactsFromOrganization = async () => {
      const orgId = Number(selectedOrgId);
      if (!orgId) {
        setContacts([]);
        return;
      }
      try {
        setLoadingOrgContacts(true);
        let rows = [];
        if (selectedContactListId) {
          const listRows = await masterDataService.listContactsByList(
            selectedContactListId,
          );
          rows = (listRows || []).map((item) => item.contact).filter(Boolean);
        } else {
          rows = await masterDataService.listContacts();
        }
        const mapped = rows
          .map((row) => ({
            phone: String(row.phone_number || row.phone || "").trim(),
            name: String(row.name || "").trim(),
          }))
          .filter((c) => c.phone);
        setContacts(mapped);
      } catch (error) {
        toast.error(error.message || "Gagal memuat kontak organization");
      } finally {
        setLoadingOrgContacts(false);
      }
    };
    const timer = setTimeout(() => {
      loadContactsFromOrganization();
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedOrgId, selectedContactListId]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        const parsed = data
          .map((r) => ({
            phone: String(
              r.phone ||
                r.phone_number ||
                r.nomor ||
                r.no_hp ||
                r.hp ||
                r.Phone ||
                r["Phone Number"] ||
                r.Nomor ||
                r["No HP"] ||
                "",
            ).trim(),
            name: String(r.name || r.nama || r.Name || r.Nama || "").trim(),
          }))
          .filter((c) => c.phone);
        setContacts(parsed);
        toast.success(`${parsed.length} kontak berhasil dimuat`);
      } catch {
        toast.error("Gagal membaca file Excel");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleManualParse = () => {
    const lines = manualText.split("\n").filter((l) => l.trim());
    const parsed = lines
      .map((l) => {
        const parts = l.split(/[,;\t]/).map((s) => s.trim());
        return { phone: parts[0] || "", name: parts[1] || "" };
      })
      .filter((c) => c.phone);
    setContacts(parsed);
    toast.success(`${parsed.length} kontak ditambahkan`);
  };

  const handleSend = async () => {
    if (!selectedDevice || !isReady) {
      toast.error("Device belum terhubung");
      return;
    }
    if (contacts.length === 0) {
      toast.error("Tidak ada kontak");
      return;
    }
    if (!message.trim()) {
      toast.error("Pesan wajib diisi");
      return;
    }
    setSending(true);
    try {
      const res = await deviceService.sendBulk(selectedDevice.id, {
        contacts,
        message: message.trim(),
      });
      window.dispatchEvent(new Event("usage:refresh"));
      toast.success(res.message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { phone: "6281234567890", name: "Budi" },
      { phone: "6289876543210", name: "Ani" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contacts");
    XLSX.writeFile(wb, "template_kontak.xlsx");
  };

  const prog = bulkProgress;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* Left: Input */}
      <div className="xl:col-span-2 space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-linear-to-r from-violet-500 to-purple-500 px-6 py-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={16} /> Kirim Pesan Massal
            </h3>
            <p className="text-violet-100 text-xs mt-1">
              Upload Excel atau input manual, kirim ke banyak nomor sekaligus
            </p>
          </div>
          <div className="p-6 space-y-5">
            {/* Organization select removed: now global in DevicesPage */}

            {/* Device select */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Device
              </label>
              <select
                value={selectedDevice?.id || ""}
                onChange={(e) => {
                  const d = devices.find(
                    (x) => x.id === Number(e.target.value),
                  );
                  if (d) onSelectDevice(d);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              >
                <option value="">-- Pilih Device --</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.device_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Filter Contact List
              </label>
              <select
                value={selectedContactListId}
                onChange={(e) => setSelectedContactListId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
              >
                <option value="">Semua Contact (organization)</option>
                {contactLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400">
                Pilih contact list agar kontak lebih terfilter dan tidak terlalu
                banyak.
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode("excel")}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${mode === "excel" ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
              >
                <FileSpreadsheet size={14} className="inline mr-1.5" /> Upload
                Excel
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${mode === "manual" ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
              >
                ✏️ Input Manual
              </button>
            </div>

            {/* Excel Upload */}
            {mode === "excel" && (
              <div>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition"
                  >
                    <Download size={12} /> Download Template
                  </button>
                </div>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition"
                >
                  <Upload size={28} className="mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-500">
                    {fileName ||
                      "Klik untuk upload file Excel (.xlsx, .xls, .csv)"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Kolom wajib: phone/nomor/no_hp | Opsional: name/nama
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {/* Manual Input */}
            {mode === "manual" && (
              <div>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  rows={6}
                  placeholder={
                    "6281234567890,Budi\n6289876543210,Ani\n\nFormat: nomor,nama (satu per baris)"
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none resize-none"
                />
                <button
                  onClick={handleManualParse}
                  className="mt-2 rounded-lg bg-violet-100 px-4 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-200 transition"
                >
                  Parse Kontak
                </button>
              </div>
            )}

            {/* Message template */}
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
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder={
                  "Halo {{nama}}, ini pesan dari WAWAY. Terima kasih!\n\nGunakan {{nama}} untuk personalisasi"
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                Variable: {"{{nama}}"} = nama kontak, {"{{phone}}"} = nomor
                kontak
              </p>
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !isReady || contacts.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-500 to-purple-500 px-5 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {sending ? "Mengirim..." : `Kirim ke ${contacts.length} Kontak`}
            </button>
          </div>
        </div>
      </div>

      {/* Right: Contacts preview + Progress */}
      <div className="space-y-5">
        {/* Contacts preview */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Kontak ({contacts.length})
            </h3>
            <div className="flex items-center gap-3">
              {loadingOrgContacts && (
                <span className="text-[11px] text-slate-400">Memuat...</span>
              )}
              {contacts.length > 0 && (
                <button
                  onClick={() => setContacts([])}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="max-h-75 overflow-y-auto divide-y divide-slate-50">
            {contacts.length === 0 && (
              <p className="px-5 py-8 text-center text-xs text-slate-400">
                Belum ada kontak dimuat
              </p>
            )}
            {contacts.slice(0, 50).map((c, i) => (
              <div key={i} className="px-5 py-2.5 flex items-center gap-3">
                <span className="text-[10px] text-slate-400 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {c.name || "-"}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {c.phone}
                  </p>
                </div>
              </div>
            ))}
            {contacts.length > 50 && (
              <p className="px-5 py-3 text-xs text-slate-400 text-center">
                ...dan {contacts.length - 50} kontak lainnya
              </p>
            )}
          </div>
        </div>

        {/* Bulk progress */}
        {prog && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Progress Pengiriman
            </h3>
            {prog.completed ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={16} />{" "}
                  <span className="text-sm font-semibold">Selesai!</span>
                </div>
                <p className="text-xs text-slate-500">
                  Terkirim: {prog.sent} | Gagal: {prog.failed} | Total:{" "}
                  {prog.total}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-violet-500 to-purple-500 transition-all duration-300"
                    style={{
                      width: `${prog.total ? (prog.current / prog.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {prog.current || 0} / {prog.total || "?"} kontak
                </p>
                {prog.pausing && (
                  <p className="text-xs text-amber-500 animate-pulse">
                    ⏸ Batch pause...
                  </p>
                )}
                {prog.lastSent && (
                  <p className="text-xs text-slate-400">
                    {prog.status === "sent" ? "✅" : "❌"} {prog.lastSent}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
