import {
  Button,
  Checkbox,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Send,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { deviceService } from "../../services/deviceService";
import { masterDataService } from "../../services/masterDataService";
import { templateMessageService } from "../../services/templateMessageService";

const extractTemplateVariables = (text = "") => {
  const matches = String(text).match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || [];
  return [...new Set(matches.map((m) => m.replace(/[{}\s]/g, "").trim()))];
};

const applyTemplateVariablesExact = (text = "", values = {}) => {
  return String(text).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (m, key) => {
    const value = values[key];
    return value === undefined || value === null || value === ""
      ? m
      : String(value);
  });
};

export function BulkSendPanel({
  devices,
  selectedDevice,
  onSelectDevice,
  rtStatus,
  bulkProgress,
  selectedOrgId,
}) {
  const [contactSource, setContactSource] = useState("system"); // 'system' | 'excel' | 'manual'
  const [contacts, setContacts] = useState([]);
  const [loadingOrgContacts, setLoadingOrgContacts] = useState(false);
  const [contactLists, setContactLists] = useState([]);
  const [selectedContactListIds, setSelectedContactListIds] = useState([]);
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [variableDefaults, setVariableDefaults] = useState({});
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
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

  const templateVariables = useMemo(
    () => extractTemplateVariables(message),
    [message],
  );

  const dynamicVariables = useMemo(
    () => templateVariables.filter((key) => key !== "phone" && key !== "name"),
    [templateVariables],
  );

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
    setSelectedContactListIds([]);
  }, [selectedOrgId]);

  useEffect(() => {
    setContacts([]);
    setLoadingOrgContacts(false);
    setFileName("");
    setManualText("");
    setVariableDefaults((prev) => ({ ...prev }));
  }, [contactSource]);

  // Load contacts from system list only when source = system
  useEffect(() => {
    if (contactSource !== "system") {
      return;
    }

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
        if (selectedContactListIds.length > 0) {
          const allListRows = await Promise.all(
            selectedContactListIds.map((listId) =>
              masterDataService.listContactsByList(listId),
            ),
          );
          rows = allListRows
            .flatMap((items) => items || [])
            .map((item) => item.contact)
            .filter(Boolean);
        } else {
          rows = await masterDataService.listContacts();
        }
        const mapped = rows
          .map((row) => ({
            phone: String(row.phone_number || row.phone || "").trim(),
            name: String(row.name || "").trim(),
          }))
          .filter((c) => c.phone);
        const deduped = Array.from(
          new Map(mapped.map((item) => [item.phone, item])).values(),
        );
        setContacts(deduped);
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
  }, [selectedOrgId, selectedContactListIds, contactSource]);

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
          .map((row) => {
            const phone = String(row?.phone || "").trim();
            const name = String(row?.name || "").trim();

            const extraVars = {};
            Object.entries(row || {}).forEach(([key, value]) => {
              if (!key) return;
              if (key === "phone" || key === "name") return;
              if (value === null || value === undefined || value === "") return;
              extraVars[key] = String(value).trim();
            });

            return {
              phone,
              name,
              ...extraVars,
            };
          })
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
        const phone = parts[0] || "";
        const name = parts[1] || "";

        const extraVars = {};
        dynamicVariables.forEach((key, index) => {
          const inlineValue = parts[index + 2] || "";
          const defaultValue = variableDefaults[key] || "";
          if (inlineValue) {
            extraVars[key] = inlineValue;
          } else if (defaultValue) {
            extraVars[key] = defaultValue;
          }
        });

        return { phone, name, ...extraVars };
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

    const mergedContacts = contacts.map((contact) => ({
      ...variableDefaults,
      ...contact,
    }));

    const missingVariables = [];
    for (const key of dynamicVariables) {
      const hasMissing = mergedContacts.some((contact) => {
        const value = contact[key];
        return (
          value === undefined || value === null || String(value).trim() === ""
        );
      });
      if (hasMissing) missingVariables.push(key);
    }

    if (missingVariables.length > 0) {
      toast.error(`Variabel belum lengkap: ${missingVariables.join(", ")}`);
      return;
    }

    setSending(true);
    try {
      const res = await deviceService.sendBulk(selectedDevice.id, {
        contacts: mergedContacts,
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
    const dynamicVariableColumns = (templateVariables || []).filter(
      (key) => !["name", "phone"].includes(String(key)),
    );

    const rows = [
      {
        phone: "6281234567890",
        name: "Budi",
        ...Object.fromEntries(
          dynamicVariableColumns.map((key) => [key, `contoh_${key}`]),
        ),
      },
      {
        phone: "6289876543210",
        name: "Ani",
        ...Object.fromEntries(
          dynamicVariableColumns.map((key) => [key, `contoh_${key}`]),
        ),
      },
    ];

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contacts");
    XLSX.writeFile(
      wb,
      dynamicVariableColumns.length > 0
        ? "template_kontak_template_pesan.xlsx"
        : "template_kontak.xlsx",
    );
  };

  const prog = bulkProgress;

  const previewContact = {
    ...(variableDefaults || {}),
    ...(contacts[0] || {}),
  };
  const previewMessage = applyTemplateVariablesExact(String(message || ""), {
    ...(previewContact || {}),
    phone: previewContact?.phone || "6281234567890",
    name: previewContact?.name || "Nama",
  });

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-linear-to-r from-violet-500 to-purple-500 px-6 py-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-white">
              <Users size={16} /> Kirim Pesan Massal
            </h3>
            <p className="mt-1 text-xs text-violet-100">
              Upload Excel atau input manual, kirim ke banyak nomor sekaligus
            </p>
          </div>

          <div className="space-y-5 p-6">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">-- Pilih Device --</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.device_name}
                  </option>
                ))}
              </select>
              {selectedDevice && !isReady && (
                <p className="mt-1 text-xs text-amber-500">
                  Device belum terhubung. Connect dulu di tab Devices.
                </p>
              )}
            </div>

            <div>
              <p className="mb-1 text-[11px] font-semibold text-violet-700">
                Langkah 1 • Pesan Template
              </p>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Template Pesan
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <p className="mt-1 text-xs text-slate-400">
                Variable: {"{{nama}}"} = nama kontak, {"{{phone}}"} = nomor
                kontak
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Langkah 1: pilih template/isi pesan dulu, lalu upload atau
                download template Excel.
              </p>
            </div>

            {dynamicVariables.length > 0 && (
              <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50 p-3">
                <p className="text-[11px] font-semibold text-violet-700">
                  Langkah 2 • Default Variabel
                </p>
                <p className="text-[11px] font-semibold text-violet-700">
                  Variabel Template
                </p>
                <p className="text-[11px] text-violet-600">
                  Berlaku untuk semua sumber kontak. Untuk Excel/manual, nilai
                  per kontak bisa override nilai default di bawah.
                </p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {dynamicVariables.map((key) => (
                    <input
                      key={key}
                      value={variableDefaults[key] || ""}
                      onChange={(e) =>
                        setVariableDefaults((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      placeholder={`Default ${key}`}
                      className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-[11px] font-semibold text-violet-700">
                Langkah 3 • Pilih Sumber Kontak
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setContactSource("system");
                    setFileName("");
                  }}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${contactSource === "system" ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                >
                  Kontak Sistem
                </button>
                <button
                  onClick={() => setContactSource("excel")}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${contactSource === "excel" ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                >
                  <FileSpreadsheet size={14} className="mr-1.5 inline" /> Upload
                  Excel
                </button>
                <button
                  onClick={() => setContactSource("manual")}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${contactSource === "manual" ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
                >
                  Input Manual
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Sumber kontak aktif:{" "}
              <span className="font-semibold">{contactSource}</span>. Kontak
              tidak dicampur antar sumber agar tidak bentrok.
            </p>

            {contactSource === "system" && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Contact List
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-600">
                      {selectedContactListIds.length > 0
                        ? `${selectedContactListIds.length} list terpilih`
                        : "Semua Contact (tanpa filter list)"}
                    </p>
                    <Button
                      size="sm"
                      color="secondary"
                      variant="flat"
                      onPress={() => setIsContactPickerOpen(true)}
                    >
                      Pilih Contact List
                    </Button>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Total kontak termuat: {contacts.length}
                    {loadingOrgContacts ? " • memuat..." : ""}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Pilih list lewat modal. Kosongkan pilihan untuk ambil semua
                  kontak organization.
                </p>
              </div>
            )}

            {contactSource === "excel" && (
              <div>
                <div className="mb-3 flex gap-2">
                  <Button
                    onClick={downloadTemplate}
                    size="sm"
                    variant="flat"
                    className="text-xs"
                  >
                    <Download size={12} /> Download Template Excel
                  </Button>
                </div>
                <p className="mb-3 text-[11px] text-slate-500">
                  {templateVariables.length > 0
                    ? `Template Excel menyesuaikan pesan saat ini (${templateVariables.length} variabel terdeteksi).`
                    : "Jika tidak pakai variable template, file Excel akan berisi kolom standar (phone, name)."}
                </p>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer rounded-xl border-2 border-dashed border-slate-200 p-8 text-center transition hover:border-violet-300 hover:bg-violet-50/30"
                >
                  <Upload size={28} className="mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-500">
                    {fileName ||
                      "Klik untuk upload file Excel (.xlsx, .xls, .csv)"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
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

            {contactSource === "manual" && (
              <div>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  rows={6}
                  placeholder={
                    dynamicVariables.length > 0
                      ? `6281234567890,Budi,${dynamicVariables.map(() => "nilai").join(",")}\n\nFormat: phone,name,${dynamicVariables.join(",")}`
                      : "6281234567890,Budi\n6289876543210,Ani\n\nFormat: phone,name (satu per baris)"
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <Button
                  onClick={handleManualParse}
                  size="sm"
                  color="secondary"
                  variant="flat"
                  className="mt-2 text-xs"
                >
                  Parse Kontak
                </Button>
              </div>
            )}

            <p className="text-[11px] font-semibold text-violet-700">
              Langkah 4 • Review & Kirim
            </p>
            <button
              onClick={handleSend}
              disabled={sending || !isReady || contacts.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-500 to-purple-500 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
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

      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-bold text-slate-900">Preview Pesan</h3>
            <p className="mt-1 text-xs text-slate-500">
              Preview berdasarkan kontak pertama yang dimuat.
            </p>
          </div>
          <div className="p-5">
            <div className="rounded-xl bg-slate-900 p-3">
              <div className="min-h-36 rounded-lg bg-[#e5ddd5] p-3">
                <div className="mb-2 text-[11px] text-slate-600">
                  Ke: {previewContact?.phone || "6281234567890"}
                </div>
                <div className="ml-auto max-w-[92%] rounded-xl bg-[#dcf8c6] px-3 py-2 shadow-sm">
                  <p className="whitespace-pre-line wrap-break-word text-sm text-slate-800">
                    {previewMessage || "Pesan Anda akan muncul di sini..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {prog && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              Progress Pengiriman
            </h3>
            {prog.completed ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-semibold">Selesai!</span>
                </div>
                <p className="text-xs text-slate-500">
                  Terkirim: {prog.sent} | Gagal: {prog.failed} | Total:{" "}
                  {prog.total}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
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
                  <p className="animate-pulse text-xs text-amber-500">
                    Batch pause...
                  </p>
                )}
                {prog.lastSent && (
                  <p className="text-xs text-slate-400">
                    {prog.status === "sent" ? "Terkirim" : "Gagal"}:{" "}
                    {prog.lastSent}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={isContactPickerOpen} onOpenChange={setIsContactPickerOpen}>
        <ModalBackdrop>
          <ModalContainer size="md" scroll="inside">
            <ModalDialog>
              <ModalHeader>Pilih Contact List</ModalHeader>
              <ModalBody>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() =>
                      setSelectedContactListIds(contactLists.map((x) => x.id))
                    }
                  >
                    Pilih Semua List
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setSelectedContactListIds([])}
                  >
                    Semua Contact (tanpa filter)
                  </Button>
                </div>

                <div className="max-h-80 space-y-1 overflow-auto rounded-xl border border-slate-200 p-3">
                  {contactLists.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Belum ada contact list
                    </p>
                  ) : (
                    contactLists.map((list) => {
                      const checked = selectedContactListIds.includes(list.id);
                      return (
                        <Checkbox
                          key={list.id}
                          size="sm"
                          isSelected={checked}
                          onValueChange={(isSelected) => {
                            setSelectedContactListIds((prev) => {
                              if (isSelected) {
                                return [...prev, list.id];
                              }
                              return prev.filter((id) => id !== list.id);
                            });
                          }}
                        >
                          <span className="text-sm text-slate-700">
                            {list.name}
                          </span>
                        </Checkbox>
                      );
                    })
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => setIsContactPickerOpen(false)}
                >
                  Selesai
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </ModalBackdrop>
      </Modal>
    </div>
  );
}
