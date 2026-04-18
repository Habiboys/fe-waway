import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Separator,
} from "@heroui/react";
import { Plus, SquarePen, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getCurrentOrganizationId,
  setCurrentOrganizationId,
} from "../lib/organization";
import { masterDataService } from "../services/masterDataService";

const emptyForm = { name: "" };

export function ContactListsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(
    getCurrentOrganizationId(),
  );
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
  const loadSeqRef = useRef(0);

  const loadOrganizations = async () => {
    try {
      const orgRows = await masterDataService.listOrganizations();
      setOrganizations(orgRows);

      if (orgRows.length === 0) {
        setSelectedOrgId(null);
        setCurrentOrganizationId(null);
        return;
      }

      const currentExists = selectedOrgId
        ? orgRows.some((org) => Number(org.id) === Number(selectedOrgId))
        : false;

      if (!currentExists) {
        const next = Number(orgRows[0].id);
        setSelectedOrgId(next);
        setCurrentOrganizationId(next);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const loadData = async (orgIdOverride = selectedOrgId) => {
    const targetOrgId = orgIdOverride ? Number(orgIdOverride) : null;
    if (!targetOrgId) {
      setRows([]);
      return;
    }

    const seq = ++loadSeqRef.current;

    try {
      setCurrentOrganizationId(targetOrgId);
      const data = await masterDataService.listContactLists();
      if (seq !== loadSeqRef.current) return;
      setRows(data);
    } catch (error) {
      if (seq !== loadSeqRef.current) return;
      toast.error(error.message);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(selectedOrgId);
    }, 0);

    return () => clearTimeout(timer);
  }, [selectedOrgId]);

  const openCreate = () => {
    if (!selectedOrgId) {
      toast.error("Pilih organization terlebih dahulu");
      return;
    }
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name || "" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!selectedOrgId)
      return toast.error("Pilih organization terlebih dahulu");
    if (!form.name.trim()) {
      toast.error("Nama list wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await masterDataService.updateContactList(editingId, form);
        toast.success("Contact list berhasil diupdate");
      } else {
        await masterDataService.createContactList(form);
        toast.success("Contact list berhasil ditambahkan");
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
      await masterDataService.deleteContactList(deleteTarget.id);
      toast.success("Contact list berhasil dihapus");
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

    return [row.id, row.name]
      .map((value) => String(value ?? "").toLowerCase())
      .some((value) => value.includes(q));
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, perPage, selectedOrgId]);

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
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900">
                Contact Lists
              </h3>
              <Button
                color="primary"
                onPress={openCreate}
                startContent={<Plus size={16} />}
              >
                Tambah Contact List
              </Button>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="organization-filter-contact-list"
                className="text-sm font-medium text-slate-700"
              >
                Organization
              </label>
              <select
                id="organization-filter-contact-list"
                value={selectedOrgId ? String(selectedOrgId) : ""}
                onChange={(event) => {
                  const next = event.target.value
                    ? Number(event.target.value)
                    : null;
                  setRows([]);
                  setSelectedOrgId(next);
                  setCurrentOrganizationId(next);
                }}
                className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Pilih organization</option>
                {organizations.map((org) => (
                  <option key={String(org.id)} value={String(org.id)}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="w-full md:max-w-sm">
                <label
                  htmlFor="contact-list-search"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Search
                </label>
                <input
                  id="contact-list-search"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Cari contact list"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>

              <div className="w-full md:w-40">
                <label
                  htmlFor="contact-list-per-page"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  View per page
                </label>
                <select
                  id="contact-list-per-page"
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
                    <th className="px-3 py-2 font-semibold">ID</th>
                    <th className="px-3 py-2 font-semibold">Nama</th>
                    <th className="px-3 py-2 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-slate-500" colSpan={3}>
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{row.id}</td>
                        <td className="px-3 py-2">{row.name}</td>
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
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">
                {editingId ? "Edit Contact List" : "Tambah Contact List"}
              </h4>
              <Button isIconOnly size="sm" variant="light" onPress={closeModal}>
                <X size={16} />
              </Button>
            </div>

            <form className="space-y-4 p-5" onSubmit={submitForm}>
              <div className="space-y-1">
                <label
                  htmlFor="contact-list-name"
                  className="text-sm font-medium text-slate-700"
                >
                  Nama List
                </label>
                <input
                  id="contact-list-name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(event) => setForm({ name: event.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
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
                Yakin hapus contact list{" "}
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
