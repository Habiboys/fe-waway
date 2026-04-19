import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Separator,
} from "@heroui/react";
import { Plus, SquarePen, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { masterDataService } from "../services/masterDataService";

const emptyForm = {
  name: "",
  description: "",
  price: "0",
  message_limit: "0",
  device_limit: "1",
  duration_days: "30",
};

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

export function PlansPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await masterDataService.listPlans();
      setRows(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || "",
      description: row.description || "",
      price: String(row.price ?? 0),
      message_limit: String(row.message_limit ?? 0),
      device_limit: String(row.device_limit ?? 1),
      duration_days: String(row.duration_days ?? 30),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nama plan wajib diisi");
      return;
    }

    const payload = {
      ...form,
      price: toNumber(form.price),
      message_limit: toNumber(form.message_limit),
      device_limit: toNumber(form.device_limit, 1),
      duration_days: toNumber(form.duration_days, 30),
    };

    setIsSubmitting(true);
    try {
      if (editingId) {
        await masterDataService.updatePlan(editingId, payload);
        toast.success("Plan berhasil diupdate");
      } else {
        await masterDataService.createPlan(payload);
        toast.success("Plan berhasil ditambahkan");
      }

      closeModal();
      await loadData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      await masterDataService.deletePlan(deleteTarget.id);
      toast.success("Plan berhasil dihapus");
      await loadData();
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRows = rows.filter((row) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    return [
      row.id,
      row.name,
      row.description,
      row.price,
      row.message_limit,
      row.device_limit,
      row.duration_days,
    ]
      .map((value) => String(value ?? "").toLowerCase())
      .some((value) => value.includes(q));
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, perPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * perPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + perPage);
  const viewFrom = filteredRows.length === 0 ? 0 : startIndex + 1;
  const viewTo = Math.min(startIndex + perPage, filteredRows.length);

  return (
    <>
      <section className="space-y-5 px-4 py-5 md:px-7 md:py-7">
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="w-full flex-row items-center justify-between gap-3 pb-3">
            <h3 className="text-base font-bold text-slate-900">Plans</h3>
            <Button
              className="ml-auto"
              color="primary"
              onPress={openCreate}
              startContent={<Plus size={16} />}
            >
              Tambah Plan
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="w-full md:max-w-sm">
                <label
                  htmlFor="plan-search"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Search
                </label>
                <input
                  id="plan-search"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Cari plan"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>

              <div className="w-full md:w-40">
                <label
                  htmlFor="plan-per-page"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  View per page
                </label>
                <select
                  id="plan-per-page"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={String(perPage)}
                  onChange={(event) => setPerPage(Number(event.target.value))}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>

            <div className="overflow-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-160 text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 font-semibold">No</th>
                    <th className="px-3 py-2 font-semibold">Nama</th>
                    <th className="px-3 py-2 font-semibold">Deskripsi</th>
                    <th className="px-3 py-2 font-semibold">Harga</th>
                    <th className="px-3 py-2 font-semibold">Msg</th>
                    <th className="px-3 py-2 font-semibold">Device</th>
                    <th className="px-3 py-2 font-semibold">Durasi</th>
                    <th className="px-3 py-2 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-slate-500" colSpan={8}>
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, index) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{startIndex + index + 1}</td>
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.description || "-"}</td>
                        <td className="px-3 py-2">{row.price}</td>
                        <td className="px-3 py-2">{row.message_limit}</td>
                        <td className="px-3 py-2">{row.device_limit}</td>
                        <td className="px-3 py-2">{row.duration_days}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              onPress={() => openEdit(row)}
                            >
                              <SquarePen size={15} />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              color="danger"
                              variant="flat"
                              onPress={() => handleDelete(row)}
                            >
                              <Trash2 size={15} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-slate-600">
                Menampilkan {viewFrom}-{viewTo} dari {filteredRows.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={currentPage <= 1}
                  onPress={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                >
                  Prev
                </Button>
                <span className="text-sm text-slate-600">
                  Page {currentPage} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={currentPage >= totalPages}
                  onPress={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">
                {editingId ? "Edit Plan" : "Tambah Plan"}
              </h4>
              <Button isIconOnly size="sm" variant="light" onPress={closeModal}>
                <X size={16} />
              </Button>
            </div>

            <form
              className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2"
              onSubmit={submitForm}
            >
              <div className="space-y-1 md:col-span-2">
                <label
                  htmlFor="plan-name"
                  className="text-sm font-medium text-slate-700"
                >
                  Nama Plan
                </label>
                <input
                  id="plan-name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label
                  htmlFor="plan-description"
                  className="text-sm font-medium text-slate-700"
                >
                  Deskripsi
                </label>
                <textarea
                  id="plan-description"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Deskripsi singkat tentang paket"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="plan-price"
                  className="text-sm font-medium text-slate-700"
                >
                  Harga
                </label>
                <input
                  id="plan-price"
                  type="number"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.price}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, price: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="plan-message-limit"
                  className="text-sm font-medium text-slate-700"
                >
                  Limit Pesan
                </label>
                <input
                  id="plan-message-limit"
                  type="number"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.message_limit}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      message_limit: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="plan-device-limit"
                  className="text-sm font-medium text-slate-700"
                >
                  Limit Device
                </label>
                <input
                  id="plan-device-limit"
                  type="number"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.device_limit}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      device_limit: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="plan-duration"
                  className="text-sm font-medium text-slate-700"
                >
                  Durasi (Hari)
                </label>
                <input
                  id="plan-duration"
                  type="number"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.duration_days}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      duration_days: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2 md:col-span-2">
                <Button type="button" variant="flat" onPress={closeModal}>
                  Batal
                </Button>
                <Button color="primary" type="submit" isLoading={isSubmitting}>
                  Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">
                Konfirmasi Hapus
              </h4>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm text-slate-600">
                Yakin hapus plan{" "}
                <span className="font-semibold">{deleteTarget.name}</span>?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="flat" onPress={() => setDeleteTarget(null)}>
                  Batal
                </Button>
                <Button
                  color="danger"
                  isLoading={isDeleting}
                  onPress={confirmDelete}
                >
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
