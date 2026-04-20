import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { templateMessageService } from "../../services/templateMessageService";
import { ConfirmModal } from "../common/ConfirmModal";

const QUICK_VARIABLES = [
  "{{nama}}",
  "{{produk}}",
  "{{invoice}}",
  "{{tanggal}}",
  "{{nominal}}",
  "{{link_pembayaran}}",
];

const VARIABLE_REGEX = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

function extractVariableKeys(content) {
  if (!content) return [];
  const keys = [];
  for (const match of content.matchAll(VARIABLE_REGEX)) {
    const key = match[1];
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys;
}

export function TemplateMessageManager({ selectedOrgId }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // {id, name, content}
  const [form, setForm] = useState({ name: "", content: "" });
  const [variableSamples, setVariableSamples] = useState({});
  const [deleteTemplateId, setDeleteTemplateId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const textareaRef = useRef(null);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const rows = await templateMessageService.list();
      setTemplates(rows);
    } catch (e) {
      toast.error(e.message || "Gagal memuat template");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTemplates();
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedOrgId]);

  const variableKeys = useMemo(
    () => extractVariableKeys(form.content),
    [form.content],
  );

  const previewText = useMemo(() => {
    if (!form.content?.trim()) {
      return "Halo {{nama}}, pesanan {{produk}} Anda sudah diproses ✅";
    }
    return form.content.replace(VARIABLE_REGEX, (_, key) => {
      return variableSamples[key] || `[${key}]`;
    });
  }, [form.content, variableSamples]);

  const insertVariable = (token) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setForm((prev) => ({ ...prev, content: `${prev.content}${token}` }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = form.content || "";
    const next = `${current.slice(0, start)}${token}${current.slice(end)}`;

    setForm((prev) => ({ ...prev, content: next }));

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + token.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await templateMessageService.update(editing.id, form);
        toast.success("Template diupdate");
      } else {
        await templateMessageService.create(form);
        toast.success("Template ditambahkan");
      }
      setEditing(null);
      setForm({ name: "", content: "" });
      loadTemplates();
    } catch (e) {
      toast.error(e.message || "Gagal simpan template");
    }
  };

  const handleEdit = (tpl) => {
    setEditing(tpl);
    setForm({ name: tpl.name, content: tpl.content });
  };

  const handleDelete = async () => {
    if (!deleteTemplateId) return;
    try {
      await templateMessageService.remove(deleteTemplateId);
      toast.success("Template dihapus");
      setDeleteModalOpen(false);
      setDeleteTemplateId(null);
      loadTemplates();
    } catch (e) {
      toast.error(e.message || "Gagal hapus template");
    }
  };

  const openDeleteModal = (id) => {
    setDeleteTemplateId(id);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Kelola Template Pesan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Template hanya untuk organisasi aktif. Gunakan format variabel
            dengan tanda kurung kurawal ganda: {"{{nama}}"}.
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <form
              onSubmit={handleSave}
              className="space-y-4 xl:col-span-7 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Nama Template
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                  placeholder="Contoh: Reminder Pembayaran"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Isi Pesan
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Pakai variabel seperti {"{{nama}}"}, {"{{invoice}}"}
                  </span>
                </div>
                <textarea
                  ref={textareaRef}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none resize-none"
                  rows={7}
                  value={form.content}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, content: e.target.value }))
                  }
                  placeholder="Halo {{nama}}, pesanan {{produk}} Anda sedang diproses."
                  required
                />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold text-slate-600">
                  Quick insert variabel
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_VARIABLES.map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => insertVariable(token)}
                      className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>

              {variableKeys.length > 0 && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                  <p className="text-[11px] font-semibold text-emerald-700 mb-2">
                    Nilai contoh untuk preview chat
                  </p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {variableKeys.map((key) => (
                      <label key={key} className="text-[11px] text-slate-600">
                        <span className="mb-1 block font-medium">{`{{${key}}}`}</span>
                        <input
                          value={variableSamples[key] ?? `[${key}]`}
                          onChange={(e) =>
                            setVariableSamples((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 focus:outline-none"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                >
                  {editing ? "Update" : "Tambah"}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setForm({ name: "", content: "" });
                    }}
                    className="rounded-lg px-4 py-2 text-xs text-slate-500 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>

            <div className="xl:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <h4 className="text-sm font-bold text-slate-900">
                  Preview Chat (Realtime)
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Simulasi tampilan pesan di WhatsApp. Variabel {"{{}}"} akan
                  diganti sesuai nilai contoh di kiri.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-3">
                <div className="rounded-xl bg-[#e5ddd5] p-3 min-h-60">
                  <div className="ml-auto max-w-[90%] rounded-xl bg-[#dcf8c6] px-3 py-2 shadow-sm">
                    <p className="whitespace-pre-line wrap-break-word text-sm text-slate-800 leading-relaxed">
                      {previewText}
                    </p>
                    <p className="mt-1 text-right text-[10px] text-slate-500">
                      Preview sekarang
                    </p>
                  </div>
                </div>
              </div>

              <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                <li>• Gunakan format variabel: {"{{nama_variabel}}"}</li>
                <li>• Variabel otomatis terdeteksi dari isi pesan.</li>
                <li>• Klik template di tabel bawah untuk edit cepat.</li>
              </ul>
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-120 text-left text-xs">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">Nama</th>
                  <th className="px-3 py-2 font-semibold">Isi</th>
                  <th className="px-3 py-2 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-slate-500">
                      Memuat...
                    </td>
                  </tr>
                ) : templates.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-slate-500">
                      Belum ada template.
                    </td>
                  </tr>
                ) : (
                  templates.map((tpl) => (
                    <tr key={tpl.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-semibold">{tpl.name}</td>
                      <td className="px-3 py-2 font-mono whitespace-pre-line">
                        {tpl.content}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleEdit(tpl)}
                          className="rounded-md border border-indigo-200 px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 mr-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(tpl.id)}
                          className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Hapus template"
        message="Template ini akan dihapus permanen. Lanjutkan?"
        confirmText="Hapus"
        cancelText="Batal"
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeleteTemplateId(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
