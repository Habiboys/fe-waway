import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Separator,
} from "@heroui/react";
import {
  Check,
  Plus,
  SquarePen,
  Trash2,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { masterDataService } from "../services/masterDataService";

const emptyForm = { name: "" };

export function OrganizationsPage() {
  const { user } = useAuth();

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
  const [invitationRows, setInvitationRows] = useState([]);
  const [membersModalOrg, setMembersModalOrg] = useState(null);
  const [orgMembers, setOrgMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [respondingInviteId, setRespondingInviteId] = useState(null);

  const loadData = async () => {
    try {
      const data = await masterDataService.listOrganizations();
      setRows(data);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const loadMyInvitations = async () => {
    try {
      const rows = await masterDataService.listMyOrganizationInvitations();
      setInvitationRows(rows || []);
    } catch (error) {
      toast.error(error.message || "Gagal memuat invitation");
    }
  };

  const loadOrgMembers = async (orgId) => {
    try {
      setLoadingMembers(true);
      const rows = await masterDataService.listOrganizationMembers(orgId);
      setOrgMembers(rows || []);
    } catch (error) {
      toast.error(error.message || "Gagal memuat member organization");
      setOrgMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadData();
    loadMyInvitations();
  }, []);

  const canManageMembers = (row) => {
    if (user?.role === "admin") return true;
    return String(row?.owner_id) === String(user?.id);
  };

  const openCreate = () => {
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
    if (!form.name.trim()) {
      toast.error("Nama organization wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await masterDataService.updateOrganization(editingId, form);
        toast.success("Organization berhasil diupdate");
      } else {
        await masterDataService.createOrganization({
          ...form,
          owner_id: user?.id,
        });
        toast.success("Organization berhasil ditambahkan");
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
      await masterDataService.deleteOrganization(deleteTarget.id);
      toast.success("Organization berhasil dihapus");
      await loadData();
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openMembersModal = async (row) => {
    setMembersModalOrg(row);
    setInviteEmail("");
    setInviteRole("member");
    await loadOrgMembers(row.id);
  };

  const closeMembersModal = () => {
    setMembersModalOrg(null);
    setOrgMembers([]);
    setInviteEmail("");
    setInviteRole("member");
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    if (!membersModalOrg?.id) return;
    if (!inviteEmail.trim()) {
      toast.error("Email user wajib diisi");
      return;
    }

    setIsInviting(true);
    try {
      await masterDataService.inviteOrganizationMember(membersModalOrg.id, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      toast.success("Invite berhasil dikirim");
      setInviteEmail("");
      setInviteRole("member");
      await loadOrgMembers(membersModalOrg.id);
    } catch (error) {
      toast.error(error.message || "Gagal mengirim invite");
    } finally {
      setIsInviting(false);
    }
  };

  const respondInvitation = async (invitationId, action) => {
    setRespondingInviteId(invitationId);
    try {
      if (action === "accept") {
        await masterDataService.acceptOrganizationInvitation(invitationId);
        toast.success("Invitation diterima");
      } else {
        await masterDataService.rejectOrganizationInvitation(invitationId);
        toast.success("Invitation ditolak");
      }
      await Promise.all([loadMyInvitations(), loadData()]);
    } catch (error) {
      toast.error(error.message || "Gagal merespons invitation");
    } finally {
      setRespondingInviteId(null);
    }
  };

  const filteredRows = rows.filter((row) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const ownerName = String(row.owner?.name || "").toLowerCase();
    const ownerEmail = String(row.owner?.email || "").toLowerCase();
    const memberText = (row.memberships || [])
      .map((m) => `${m?.user?.name || ""} ${m?.user?.email || ""}`.trim())
      .join(" ")
      .toLowerCase();

    return (
      String(row.id).toLowerCase().includes(q) ||
      String(row.name || "")
        .toLowerCase()
        .includes(q) ||
      ownerName.includes(q) ||
      ownerEmail.includes(q) ||
      memberText.includes(q)
    );
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
        {invitationRows.length > 0 ? (
          <Card className="border border-amber-200 bg-amber-50/60">
            <CardHeader className="pb-3">
              <h3 className="text-base font-bold text-amber-900">
                Invitation Organization Pending
              </h3>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-3 p-5">
              {invitationRows.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-xl border border-amber-200 bg-white p-3"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {inv.organization?.name ||
                      `Organization #${inv.organization_id}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Role: {inv.role} • Dari:{" "}
                    {inv.inviter?.name || inv.inviter?.email || "-"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      color="success"
                      onPress={() => respondInvitation(inv.id, "accept")}
                      isLoading={respondingInviteId === inv.id}
                      startContent={<Check size={14} />}
                    >
                      Terima
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onPress={() => respondInvitation(inv.id, "reject")}
                      isLoading={respondingInviteId === inv.id}
                      startContent={<XCircle size={14} />}
                    >
                      Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card className="border border-slate-200 bg-white">
          <CardHeader className="w-full flex-row items-center justify-between gap-3 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Organizations
            </h3>
            <Button
              className="ml-auto"
              color="primary"
              onPress={openCreate}
              startContent={<Plus size={16} />}
            >
              Tambah Organization
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="w-full md:max-w-sm">
                <label
                  htmlFor="organization-search"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Search
                </label>
                <input
                  id="organization-search"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Cari ID / nama organization"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>

              <div className="w-full md:w-40">
                <label
                  htmlFor="organization-per-page"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  View per page
                </label>
                <select
                  id="organization-per-page"
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
              <table className="w-full min-w-180 text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-3 py-2 font-semibold">No</th>
                    <th className="px-3 py-2 font-semibold">Nama</th>
                    {user?.role === "admin" ? (
                      <>
                        <th className="px-3 py-2 font-semibold">Owner</th>
                        <th className="px-3 py-2 font-semibold">Users</th>
                      </>
                    ) : null}
                    <th className="px-3 py-2 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td
                        className="px-3 py-3 text-slate-500"
                        colSpan={user?.role === "admin" ? 5 : 3}
                      >
                        Tidak ada data
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, index) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{startIndex + index + 1}</td>
                        <td className="px-3 py-2">{row.name}</td>
                        {user?.role === "admin" ? (
                          <>
                            <td className="px-3 py-2">
                              <div className="min-w-40">
                                <p className="font-medium text-slate-800">
                                  {row.owner?.name || "-"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {row.owner?.email ||
                                    (row.owner_id
                                      ? `owner_id: ${row.owner_id}`
                                      : "-")}
                                </p>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              {Array.isArray(row.memberships) &&
                              row.memberships.length > 0 ? (
                                <div className="space-y-1">
                                  {row.memberships.slice(0, 3).map((m) => (
                                    <div key={m.id} className="text-xs">
                                      <span className="font-medium text-slate-700">
                                        {m?.user?.name || `User ${m.user_id}`}
                                      </span>
                                      <span className="text-slate-500">
                                        {m?.user?.email
                                          ? ` (${m.user.email})`
                                          : ""}
                                        {m?.role ? ` • ${m.role}` : ""}
                                      </span>
                                    </div>
                                  ))}
                                  {row.memberships.length > 3 ? (
                                    <p className="text-[11px] text-slate-500">
                                      +{row.memberships.length - 3} user lain
                                    </p>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-500">
                                  -
                                </span>
                              )}
                            </td>
                          </>
                        ) : null}
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            {canManageMembers(row) ? (
                              <Button
                                size="sm"
                                variant="flat"
                                onPress={() => openMembersModal(row)}
                                startContent={<Users size={14} />}
                              >
                                Users
                              </Button>
                            ) : null}
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
                {editingId ? "Edit Organization" : "Tambah Organization"}
              </h4>
              <Button isIconOnly size="sm" variant="light" onPress={closeModal}>
                <X size={16} />
              </Button>
            </div>

            <form className="space-y-4 p-5" onSubmit={submitForm}>
              <div className="space-y-1">
                <label
                  htmlFor="organization-name"
                  className="text-sm font-medium text-slate-700"
                >
                  Nama Organization
                </label>
                <input
                  id="organization-name"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(event) => setForm({ name: event.target.value })}
                  placeholder="Contoh: PT Waway Indonesia"
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
                Yakin hapus organization{" "}
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

      {membersModalOrg ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">
                Kelola Users • {membersModalOrg.name}
              </h4>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={closeMembersModal}
              >
                <X size={16} />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-5">
              <form onSubmit={handleInvite} className="space-y-3 lg:col-span-2">
                <h5 className="text-sm font-semibold text-slate-800">
                  Invite User
                </h5>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Email User</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@email.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-600">Role</label>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="member">member</option>
                    <option value="owner">owner</option>
                  </select>
                </div>
                <Button
                  type="submit"
                  color="primary"
                  isLoading={isInviting}
                  startContent={<UserPlus size={14} />}
                >
                  Kirim Invite
                </Button>
              </form>

              <div className="lg:col-span-3">
                <h5 className="mb-2 text-sm font-semibold text-slate-800">
                  Daftar Users
                </h5>
                <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-3 py-2 font-semibold">User</th>
                        <th className="px-3 py-2 font-semibold">Role</th>
                        <th className="px-3 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingMembers ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-3 text-slate-500">
                            Memuat users...
                          </td>
                        </tr>
                      ) : orgMembers.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-3 text-slate-500">
                            Belum ada users
                          </td>
                        </tr>
                      ) : (
                        orgMembers.map((m) => (
                          <tr key={m.id} className="border-t border-slate-100">
                            <td className="px-3 py-2">
                              <p className="font-medium text-slate-800">
                                {m.user?.name || `User ${m.user_id}`}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {m.user?.email || "-"}
                              </p>
                            </td>
                            <td className="px-3 py-2">{m.role}</td>
                            <td className="px-3 py-2">
                              {m.invitation_status || "accepted"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
