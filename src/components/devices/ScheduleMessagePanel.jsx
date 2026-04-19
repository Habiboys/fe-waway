import { Loader2, PauseCircle, PlayCircle, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { deviceService } from "../../services/deviceService";
import { masterDataService } from "../../services/masterDataService";
import { templateMessageService } from "../../services/templateMessageService";

const INTERNATIONAL_PHONE_REGEX = /^[1-9]\d{7,14}$/;

function statusBadgeClass(status) {
  if (status === "completed") return "bg-emerald-100 text-emerald-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  if (status === "processing") return "bg-indigo-100 text-indigo-700";
  if (status === "cancelled") return "bg-slate-200 text-slate-600";
  return "bg-amber-100 text-amber-700";
}

function scheduleLabel(item) {
  const recurring = item?.recurring || {};
  if (!recurring.enabled) return "Sekali kirim";
  return `Setiap ${recurring.interval_value || 1} ${recurring.interval_unit || "hour"}`;
}

export function ScheduleMessagePanel({
  devices,
  selectedDevice,
  onSelectDevice,
  selectedOrgId,
}) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [contactLists, setContactLists] = useState([]);
  const [selectedContactListId, setSelectedContactListId] = useState("");
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState("");

  const [scheduleType, setScheduleType] = useState("once");
  const [scheduleAt, setScheduleAt] = useState("");
  const [customIntervalValue, setCustomIntervalValue] = useState(1);
  const [customIntervalUnit, setCustomIntervalUnit] = useState("hour");

  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);

  const phoneError = useMemo(() => {
    const value = phone.trim();
    if (!value) return "";
    if (/^\+/.test(value)) return "Gunakan format tanpa +";
    if (/^0/.test(value))
      return "Nomor harus diawali kode negara (contoh: 62...)";
    if (!/^\d+$/.test(value)) return "Nomor hanya boleh angka";
    if (!INTERNATIONAL_PHONE_REGEX.test(value))
      return "Panjang nomor tidak valid (8-15 digit)";
    return "";
  }, [phone]);

  const loadSchedules = async () => {
    if (!selectedDevice?.id) {
      setSchedules([]);
      return;
    }
    try {
      setLoadingSchedules(true);
      const rows = await deviceService.listSchedules(selectedDevice.id);
      setSchedules(rows || []);
    } catch (error) {
      toast.error(error.message || "Gagal memuat jadwal pesan");
      setSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const rows = await templateMessageService.list();
        setTemplates(rows || []);
      } catch {
        setTemplates([]);
      }
      setSelectedTemplateId("");
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedOrgId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const rows = await masterDataService.listContactLists();
        setContactLists(rows || []);
      } catch {
        setContactLists([]);
      }
      setSelectedContactListId("");
      setSelectedContactId("");
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedOrgId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        let rows = [];
        if (selectedContactListId) {
          const listRows = await masterDataService.listContactsByList(
            selectedContactListId,
          );
          rows = (listRows || []).map((item) => item.contact).filter(Boolean);
        } else {
          rows = await masterDataService.listContacts();
        }
        const normalized = (rows || []).map((row) => ({
          id: row.id,
          name: row.name,
          phone_number: row.phone_number || row.phone,
        }));
        setContacts(normalized);
      } catch {
        setContacts([]);
      }
      setSelectedContactId("");
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedOrgId, selectedContactListId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!selectedDevice?.id) {
        setSchedules([]);
        return;
      }

      try {
        setLoadingSchedules(true);
        const rows = await deviceService.listSchedules(selectedDevice.id);
        setSchedules(rows || []);
      } catch (error) {
        toast.error(error.message || "Gagal memuat jadwal pesan");
        setSchedules([]);
      } finally {
        setLoadingSchedules(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedDevice?.id, selectedOrgId]);

  const handleCreateSchedule = async () => {
    if (!selectedDevice?.id) return toast.error("Pilih device dulu");
    if (!phone.trim() || !message.trim())
      return toast.error("Isi nomor dan pesan");
    if (phoneError) return toast.error(phoneError);
    if (scheduleType === "once" && !scheduleAt)
      return toast.error("Pilih tanggal kirim");
    if (scheduleType === "custom" && Number(customIntervalValue) <= 0) {
      return toast.error("Interval custom harus lebih dari 0");
    }

    try {
      setSaving(true);
      const payload = {
        phone: phone.trim(),
        message: message.trim(),
        schedule_type: scheduleType,
        ...(scheduleAt ? { run_at: new Date(scheduleAt).toISOString() } : {}),
        ...(scheduleType === "custom"
          ? {
              interval_value: Number(customIntervalValue),
              interval_unit: customIntervalUnit,
            }
          : {}),
      };

      const res = await deviceService.scheduleSend(selectedDevice.id, payload);
      toast.success(`Jadwal tersimpan (Job #${res.job_id})`);
      await loadSchedules();
    } catch (error) {
      toast.error(error.message || "Gagal menyimpan jadwal");
    } finally {
      setSaving(false);
    }
  };

  const handleStop = async (id) => {
    try {
      setActingId(id);
      await deviceService.stopSchedule(selectedDevice.id, id);
      toast.success("Jadwal dihentikan");
      await loadSchedules();
    } catch (error) {
      toast.error(error.message || "Gagal menghentikan jadwal");
    } finally {
      setActingId(null);
    }
  };

  const handleResume = async (id) => {
    try {
      setActingId(id);
      await deviceService.resumeSchedule(selectedDevice.id, id);
      toast.success("Jadwal diaktifkan kembali");
      await loadSchedules();
    } catch (error) {
      toast.error(error.message || "Gagal melanjutkan jadwal");
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setActingId(id);
      await deviceService.deleteSchedule(selectedDevice.id, id);
      toast.success("Jadwal dihapus");
      await loadSchedules();
    } catch (error) {
      toast.error(error.message || "Gagal menghapus jadwal");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Buat Jadwal Pesan</h3>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
            Device
          </label>
          <select
            value={selectedDevice?.id || ""}
            onChange={(e) => {
              const d = devices.find((x) => x.id === Number(e.target.value));
              if (d) onSelectDevice(d);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
          >
            <option value="">-- Pilih Device --</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.device_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <select
            value={selectedContactListId}
            onChange={(e) => setSelectedContactListId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
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
            onChange={(e) => {
              const value = e.target.value;
              setSelectedContactId(value);
              const selected = contacts.find(
                (c) => String(c.id) === String(value),
              );
              if (selected?.phone_number) {
                setPhone(String(selected.phone_number));
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
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
          placeholder="Nomor tujuan, contoh: 6281234567890"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
        />

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">
            Template Pesan
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedTemplateId(value);
              const tpl = templates.find((t) => String(t.id) === String(value));
              if (tpl?.content) {
                setMessage(tpl.content);
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
          >
            <option value="">-- Pilih Template --</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Isi pesan"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
        />

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            >
              <option value="once">Sekali kirim</option>
              <option value="hourly">Setiap 1 jam</option>
              <option value="daily">Setiap 1 hari</option>
              <option value="weekly">Setiap 1 minggu</option>
              <option value="custom">Custom interval</option>
            </select>

            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
            />
          </div>

          {scheduleType === "custom" ? (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={1}
                value={customIntervalValue}
                onChange={(e) => setCustomIntervalValue(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
              />
              <select
                value={customIntervalUnit}
                onChange={(e) => setCustomIntervalUnit(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
              >
                <option value="hour">Jam</option>
                <option value="day">Hari</option>
                <option value="week">Minggu</option>
              </select>
            </div>
          ) : null}
        </div>

        <button
          onClick={handleCreateSchedule}
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          {saving ? "Menyimpan..." : "Simpan Jadwal"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-900">
          Daftar Jadwal Pesan
        </h3>

        {loadingSchedules ? (
          <p className="text-xs text-slate-500">Memuat jadwal...</p>
        ) : schedules.length === 0 ? (
          <p className="text-xs text-slate-500">Belum ada jadwal tersimpan.</p>
        ) : (
          <div className="space-y-3">
            {schedules.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700">
                    Job #{item.id}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600">Ke: {item.phone}</p>
                <p className="text-xs text-slate-500">{scheduleLabel(item)}</p>
                <p className="text-xs text-slate-500">
                  Run at:{" "}
                  {item.run_at
                    ? new Date(item.run_at).toLocaleString("id-ID")
                    : "-"}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                  {item.message}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {item.status !== "cancelled" ? (
                    <button
                      onClick={() => handleStop(item.id)}
                      disabled={
                        actingId === item.id || item.status === "processing"
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-2.5 py-1 text-[11px] font-semibold text-amber-700 disabled:opacity-50"
                    >
                      <PauseCircle size={12} /> Hentikan
                    </button>
                  ) : (
                    <button
                      onClick={() => handleResume(item.id)}
                      disabled={actingId === item.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 disabled:opacity-50"
                    >
                      <PlayCircle size={12} /> Lanjutkan
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={
                      actingId === item.id || item.status === "processing"
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1 text-[11px] font-semibold text-red-700 disabled:opacity-50"
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
