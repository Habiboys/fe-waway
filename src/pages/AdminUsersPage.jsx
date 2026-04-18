import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Separator,
} from "@heroui/react";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { adminService } from "../services/adminService";

const USERS_TABLE_PREFS_KEY = "admin-users-table-prefs-v1";

const getInitialPrefs = () => {
  if (typeof window === "undefined") {
    return {
      searchQuery: "",
      roleFilter: "all",
      sortBy: "id",
      sortDirection: "desc",
      perPage: 10,
    };
  }

  try {
    const raw = window.localStorage.getItem(USERS_TABLE_PREFS_KEY);
    if (!raw) {
      return {
        searchQuery: "",
        roleFilter: "all",
        sortBy: "id",
        sortDirection: "desc",
        perPage: 10,
      };
    }

    const parsed = JSON.parse(raw);
    const validRoleFilter = ["all", "admin", "member"].includes(
      parsed?.roleFilter,
    )
      ? parsed.roleFilter
      : "all";
    const validSortBy = ["id", "name", "email", "role"].includes(parsed?.sortBy)
      ? parsed.sortBy
      : "id";
    const validSortDirection = ["asc", "desc"].includes(parsed?.sortDirection)
      ? parsed.sortDirection
      : "desc";
    const validPerPage = [10, 25, 50].includes(Number(parsed?.perPage))
      ? Number(parsed.perPage)
      : 10;

    return {
      searchQuery:
        typeof parsed?.searchQuery === "string" ? parsed.searchQuery : "",
      roleFilter: validRoleFilter,
      sortBy: validSortBy,
      sortDirection: validSortDirection,
      perPage: validPerPage,
    };
  } catch {
    return {
      searchQuery: "",
      roleFilter: "all",
      sortBy: "id",
      sortDirection: "desc",
      perPage: 10,
    };
  }
};

export function AdminUsersPage() {
  const initialPrefs = getInitialPrefs();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialPrefs.searchQuery);
  const [roleFilter, setRoleFilter] = useState(initialPrefs.roleFilter);
  const [sortBy, setSortBy] = useState(initialPrefs.sortBy);
  const [sortDirection, setSortDirection] = useState(
    initialPrefs.sortDirection,
  );
  const [perPage, setPerPage] = useState(initialPrefs.perPage);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });

  const roleChipColor = (role) => {
    if (role === "admin") return "primary";
    return "success";
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.listUsers();
      setRows(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        USERS_TABLE_PREFS_KEY,
        JSON.stringify({
          searchQuery,
          roleFilter,
          sortBy,
          sortDirection,
          perPage,
        }),
      );
    } catch {
      // ignore storage failure
    }
  }, [searchQuery, roleFilter, sortBy, sortDirection, perPage]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return rows.filter((row) => {
      const roleMatches = roleFilter === "all" || row.role === roleFilter;
      if (!roleMatches) return false;
      if (!q) return true;

      return [row.id, row.name, row.email, row.role]
        .map((value) => String(value ?? "").toLowerCase())
        .some((value) => value.includes(q));
    });
  }, [rows, searchQuery, roleFilter]);

  const sortedRows = useMemo(() => {
    const list = [...filteredRows];

    list.sort((a, b) => {
      if (sortBy === "id") {
        return Number(a.id || 0) - Number(b.id || 0);
      }

      const aValue = String(a?.[sortBy] ?? "").toLowerCase();
      const bValue = String(b?.[sortBy] ?? "").toLowerCase();

      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });

    return sortDirection === "asc" ? list : list.reverse();
  }, [filteredRows, sortBy, sortDirection]);

  const handleSort = (field) => {
    setCurrentPage(1);
    if (sortBy === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(field);
    setSortDirection(field === "id" ? "desc" : "asc");
  };

  const sortIndicator = (field) => {
    if (sortBy !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / perPage));
  const startIndex = (currentPage - 1) * perPage;
  const paginatedRows = sortedRows.slice(startIndex, startIndex + perPage);
  const viewFrom = sortedRows.length === 0 ? 0 : startIndex + 1;
  const viewTo = Math.min(startIndex + perPage, sortedRows.length);

  const openEdit = (row) => {
    setEditTarget(row);
    setEditForm({
      name: row.name || "",
      email: row.email || "",
      password: "",
      role: row.role || "member",
    });
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditForm({ name: "", email: "", password: "", role: "member" });
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    if (!editTarget?.id) return;

    setIsSaving(true);
    try {
      await adminService.updateUser(editTarget.id, {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        password: editForm.password,
      });
      toast.success("User berhasil diupdate");
      closeEdit();
      await loadUsers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmSoftDelete = async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      await adminService.softDeleteUser(deleteTarget.id);
      toast.success("User berhasil di-soft delete");
      setDeleteTarget(null);
      await loadUsers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <section className="space-y-5 px-4 py-5 md:px-7 md:py-7">
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="w-full flex-row items-center justify-between gap-3 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              All Users (Admin)
            </h3>
          </CardHeader>
          <Separator />
          <CardContent className="p-5">
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Search
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Cari user"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Role
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={roleFilter}
                  onChange={(event) => {
                    setRoleFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  View per page
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={String(perPage)}
                  onChange={(event) => {
                    setPerPage(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-160 text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2 font-semibold">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                        onClick={() => handleSort("id")}
                      >
                        ID{" "}
                        <span className="text-xs">{sortIndicator("id")}</span>
                      </button>
                    </th>
                    <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2 font-semibold">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                        onClick={() => handleSort("name")}
                      >
                        Name{" "}
                        <span className="text-xs">{sortIndicator("name")}</span>
                      </button>
                    </th>
                    <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2 font-semibold">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                        onClick={() => handleSort("email")}
                      >
                        Email{" "}
                        <span className="text-xs">
                          {sortIndicator("email")}
                        </span>
                      </button>
                    </th>
                    <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2 font-semibold">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-slate-900"
                        onClick={() => handleSort("role")}
                      >
                        Role{" "}
                        <span className="text-xs">{sortIndicator("role")}</span>
                      </button>
                    </th>
                    <th className="sticky top-0 z-10 bg-slate-50 px-3 py-2 font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-3 py-3 text-slate-500" colSpan={5}>
                        Memuat data...
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center" colSpan={5}>
                        <p className="text-sm text-slate-600">
                          Tidak ada data user.
                        </p>
                        {searchQuery || roleFilter !== "all" ? (
                          <Button
                            size="sm"
                            variant="flat"
                            className="mt-3"
                            onPress={() => {
                              setSearchQuery("");
                              setRoleFilter("all");
                              setCurrentPage(1);
                            }}
                          >
                            Reset filter
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-3 py-2">{row.id}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {row.name}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {row.email}
                        </td>
                        <td className="px-3 py-2">
                          <Chip
                            size="sm"
                            variant="flat"
                            color={
                              row.deleted_at
                                ? "danger"
                                : roleChipColor(row.role)
                            }
                          >
                            {row.deleted_at ? "deleted" : row.role}
                          </Chip>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              aria-label="Edit user"
                              title="Edit user"
                              onPress={() => openEdit(row)}
                            >
                              <Pencil size={16} />
                            </Button>
                            <Button
                              isIconOnly
                              size="sm"
                              color="danger"
                              variant="flat"
                              aria-label="Soft delete user"
                              title={
                                row.role === "admin" || row.deleted_at
                                  ? "User ini tidak bisa dihapus"
                                  : "Soft delete user"
                              }
                              isDisabled={
                                row.role === "admin" || row.deleted_at
                              }
                              onPress={() => setDeleteTarget(row)}
                            >
                              <Trash2 size={16} />
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
                Menampilkan {viewFrom}-{viewTo} dari {sortedRows.length}
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

      {editTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">Edit User</h4>
            </div>
            <form className="space-y-4 p-5" onSubmit={submitEdit}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.email}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Password Baru (opsional)
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={editForm.password}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Kosongkan jika tidak ganti"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Role
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={editForm.role}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      role: event.target.value,
                    }))
                  }
                >
                  <option value="admin">admin</option>
                  <option value="member">member</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="flat" onPress={closeEdit}>
                  Batal
                </Button>
                <Button type="submit" color="primary" isLoading={isSaving}>
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
                Konfirmasi Soft Delete
              </h4>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm text-slate-600">
                Soft delete user{" "}
                <span className="font-semibold">{deleteTarget.name}</span>? User
                tidak bisa login lagi.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="flat" onPress={() => setDeleteTarget(null)}>
                  Batal
                </Button>
                <Button
                  color="danger"
                  isLoading={isDeleting}
                  onPress={confirmSoftDelete}
                >
                  Soft Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
