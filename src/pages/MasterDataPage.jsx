import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Separator,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmModal } from "../components/common/ConfirmModal";
import { DashboardFooter } from "../components/dashboard/DashboardFooter";
import { DashboardNavbar } from "../components/dashboard/DashboardNavbar";
import { DashboardSidebar } from "../components/dashboard/DashboardSidebar";
import { APP_NAME } from "../config/app";
import { useAuth } from "../hooks/useAuth";
import {
  getCurrentOrganizationId,
  setCurrentOrganizationId,
} from "../lib/organization";
import { masterDataService } from "../services/masterDataService";

const emptyOrganizationForm = { name: "" };
const emptyPlanForm = {
  name: "",
  price: "0",
  message_limit: "0",
  device_limit: "1",
  duration_days: "30",
};
const emptyDeviceForm = {
  device_name: "",
  phone_number: "",
  status: "offline",
};
const emptyContactForm = { name: "", phone_number: "" };
const emptyContactListForm = { name: "" };

const FEATURE_CONFIG = {
  organizations: { title: "Organizations" },
  plans: { title: "Plans" },
  devices: { title: "Devices" },
  contacts: { title: "Contacts" },
  "contact-lists": { title: "Contact Lists" },
};

const SCOPED_ENTITIES = new Set(["devices", "contacts", "contact-lists"]);

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

export function MasterDataPage({ entity = "organizations" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const activeEntity = FEATURE_CONFIG[entity] ? entity : "organizations";
  const isScopedEntity = SCOPED_ENTITIES.has(activeEntity);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const [organizations, setOrganizations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [devices, setDevices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [contactLists, setContactLists] = useState([]);

  const [selectedOrgId, setSelectedOrgId] = useState(
    getCurrentOrganizationId(),
  );

  const [organizationForm, setOrganizationForm] = useState(
    emptyOrganizationForm,
  );
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [deviceForm, setDeviceForm] = useState(emptyDeviceForm);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [contactListForm, setContactListForm] = useState(emptyContactListForm);

  const [editingOrganizationId, setEditingOrganizationId] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingDeviceId, setEditingDeviceId] = useState(null);
  const [editingContactId, setEditingContactId] = useState(null);
  const [editingContactListId, setEditingContactListId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const loadBaseData = useCallback(async () => {
    const [orgRows, planRows] = await Promise.all([
      masterDataService.listOrganizations(),
      masterDataService.listPlans(),
    ]);

    setOrganizations(orgRows);
    setPlans(planRows);

    if (orgRows.length > 0) {
      const stored = getCurrentOrganizationId();
      const preferredOrgId = selectedOrgId || stored;
      const nextOrgId =
        preferredOrgId &&
        orgRows.some((o) => String(o.id) === String(preferredOrgId))
          ? String(preferredOrgId)
          : String(orgRows[0].id);
      setSelectedOrgId(nextOrgId);
      setCurrentOrganizationId(nextOrgId);
    } else {
      setSelectedOrgId(null);
      setCurrentOrganizationId(null);
    }
  }, [selectedOrgId]);

  const loadScopedData = useCallback(async () => {
    if (!selectedOrgId) {
      setDevices([]);
      setContacts([]);
      setContactLists([]);
      return;
    }

    setCurrentOrganizationId(selectedOrgId);
    const [deviceRows, contactRows, contactListRows] = await Promise.all([
      masterDataService.listDevices(),
      masterDataService.listContacts(),
      masterDataService.listContactLists(),
    ]);

    setDevices(deviceRows);
    setContacts(contactRows);
    setContactLists(contactListRows);
  }, [selectedOrgId]);

  useEffect(() => {
    const boot = async () => {
      try {
        await loadBaseData();
      } catch (error) {
        toast.error(error.message);
      }
    };

    boot();
  }, [loadBaseData]);

  useEffect(() => {
    const fetchScoped = async () => {
      try {
        await loadScopedData();
      } catch (error) {
        toast.error(error.message);
      }
    };

    fetchScoped();
  }, [loadScopedData]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logout berhasil");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Gagal logout");
    }
  };

  const handleMenuSelect = (menuKey) => {
    const availableRoutes = new Set([
      "/dashboard",
      "/organizations",
      "/plans",
      "/orders",
      "/admin",
      "/admin/orders",
      "/admin/users",
      "/devices",
      "/contacts",
      "/contact-lists",
    ]);

    if (availableRoutes.has(menuKey)) {
      navigate(menuKey);
      setIsMobileSidebarOpen(false);
      return;
    }

    toast.info(`Menu ${menuKey} segera hadir`);
    setIsMobileSidebarOpen(false);
  };

  const handleDelete = async () => {
    if (!pendingDelete?.action) return;

    try {
      await pendingDelete.action();
      toast.success("Data berhasil dihapus");
      setPendingDelete(null);
      await Promise.all([loadBaseData(), loadScopedData()]);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openDeleteModal = (message, action) => {
    setPendingDelete({ message, action });
  };

  const submitOrganization = async (event) => {
    event.preventDefault();
    try {
      if (editingOrganizationId) {
        await masterDataService.updateOrganization(
          editingOrganizationId,
          organizationForm,
        );
        toast.success("Organization berhasil diupdate");
      } else {
        await masterDataService.createOrganization({
          ...organizationForm,
          owner_id: user?.id,
        });
        toast.success("Organization berhasil ditambahkan");
      }

      setOrganizationForm(emptyOrganizationForm);
      setEditingOrganizationId(null);
      await loadBaseData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const submitPlan = async (event) => {
    event.preventDefault();
    const payload = {
      ...planForm,
      price: toNumber(planForm.price),
      message_limit: toNumber(planForm.message_limit),
      device_limit: toNumber(planForm.device_limit, 1),
      duration_days: toNumber(planForm.duration_days, 30),
    };

    try {
      if (editingPlanId) {
        await masterDataService.updatePlan(editingPlanId, payload);
        toast.success("Plan berhasil diupdate");
      } else {
        await masterDataService.createPlan(payload);
        toast.success("Plan berhasil ditambahkan");
      }

      setPlanForm(emptyPlanForm);
      setEditingPlanId(null);
      await loadBaseData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const submitDevice = async (event) => {
    event.preventDefault();
    if (!selectedOrgId)
      return toast.error("Pilih organization terlebih dahulu");

    try {
      if (editingDeviceId) {
        await masterDataService.updateDevice(editingDeviceId, deviceForm);
        toast.success("Device berhasil diupdate");
      } else {
        await masterDataService.createDevice(deviceForm);
        toast.success("Device berhasil ditambahkan");
      }

      setDeviceForm(emptyDeviceForm);
      setEditingDeviceId(null);
      await loadScopedData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const submitContact = async (event) => {
    event.preventDefault();
    if (!selectedOrgId)
      return toast.error("Pilih organization terlebih dahulu");

    try {
      if (editingContactId) {
        await masterDataService.updateContact(editingContactId, contactForm);
        toast.success("Contact berhasil diupdate");
      } else {
        await masterDataService.createContact(contactForm);
        toast.success("Contact berhasil ditambahkan");
      }

      setContactForm(emptyContactForm);
      setEditingContactId(null);
      await loadScopedData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const submitContactList = async (event) => {
    event.preventDefault();
    if (!selectedOrgId)
      return toast.error("Pilih organization terlebih dahulu");

    try {
      if (editingContactListId) {
        await masterDataService.updateContactList(
          editingContactListId,
          contactListForm,
        );
        toast.success("Contact list berhasil diupdate");
      } else {
        await masterDataService.createContactList(contactListForm);
        toast.success("Contact list berhasil ditambahkan");
      }

      setContactListForm(emptyContactListForm);
      setEditingContactListId(null);
      await loadScopedData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <main className="min-h-dvh bg-slate-100/70 text-slate-800">
      <div className="flex w-full">
        <DashboardSidebar
          appName={APP_NAME}
          isMobileOpen={isMobileSidebarOpen}
          isDesktopOpen={isDesktopSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          currentPath={location.pathname}
          onMenuSelect={handleMenuSelect}
        />

        <div className="flex min-h-dvh flex-1 flex-col">
          <DashboardNavbar
            user={user}
            isDesktopSidebarOpen={isDesktopSidebarOpen}
            onToggleMobileSidebar={() =>
              setIsMobileSidebarOpen((prev) => !prev)
            }
            onToggleDesktopSidebar={() =>
              setIsDesktopSidebarOpen((prev) => !prev)
            }
            onLogout={handleLogout}
          />

          <section className="space-y-5 px-4 py-5 md:px-7 md:py-7">
            <Card className="border border-slate-200 bg-white">
              <CardHeader className="pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  {FEATURE_CONFIG[activeEntity].title}
                </h3>
              </CardHeader>
              <Separator />
              <CardContent className="space-y-4 p-5">
                {isScopedEntity ? (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Organization aktif untuk data tenant
                    </p>
                    <select
                      value={selectedOrgId ? String(selectedOrgId) : ""}
                      onChange={(event) => {
                        const next = event.target.value
                          ? String(event.target.value)
                          : null;
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
                ) : (
                  <p className="text-sm text-slate-600">
                    Kelola data untuk fitur{" "}
                    {FEATURE_CONFIG[activeEntity].title.toLowerCase()}.
                  </p>
                )}
              </CardContent>
            </Card>

            {activeEntity === "organizations" ? (
              <MasterSection
                title="Organizations"
                form={
                  <form
                    className="grid gap-2 md:grid-cols-3"
                    onSubmit={submitOrganization}
                  >
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      placeholder="Nama organization"
                      value={organizationForm.name}
                      onChange={(event) =>
                        setOrganizationForm({ name: event.target.value })
                      }
                      required
                    />
                    <div className="md:col-span-2 flex gap-2">
                      <Button color="primary" type="submit">
                        {editingOrganizationId ? "Update" : "Tambah"}
                      </Button>
                      {editingOrganizationId ? (
                        <Button
                          type="button"
                          variant="flat"
                          onPress={() => {
                            setEditingOrganizationId(null);
                            setOrganizationForm(emptyOrganizationForm);
                          }}
                        >
                          Batal
                        </Button>
                      ) : null}
                    </div>
                  </form>
                }
                rows={organizations}
                columns={["No", "Nama", "Aksi"]}
                renderRow={(row, index) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => {
                            setEditingOrganizationId(row.id);
                            setOrganizationForm({ name: row.name });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() =>
                            openDeleteModal("Hapus organization ini?", () =>
                              masterDataService.deleteOrganization(row.id),
                            )
                          }
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            ) : null}

            {activeEntity === "plans" ? (
              <MasterSection
                title="Plans"
                form={
                  <form
                    className="grid gap-2 md:grid-cols-5"
                    onSubmit={submitPlan}
                  >
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      placeholder="Nama plan"
                      value={planForm.name}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, name: e.target.value })
                      }
                      required
                    />
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      type="number"
                      placeholder="Harga"
                      value={planForm.price}
                      onChange={(e) =>
                        setPlanForm({ ...planForm, price: e.target.value })
                      }
                      required
                    />
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      type="number"
                      placeholder="Limit pesan"
                      value={planForm.message_limit}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          message_limit: e.target.value,
                        })
                      }
                      required
                    />
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      type="number"
                      placeholder="Limit device"
                      value={planForm.device_limit}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          device_limit: e.target.value,
                        })
                      }
                      required
                    />
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      type="number"
                      placeholder="Durasi hari"
                      value={planForm.duration_days}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          duration_days: e.target.value,
                        })
                      }
                      required
                    />
                    <div className="md:col-span-5 flex gap-2">
                      <Button color="primary" type="submit">
                        {editingPlanId ? "Update" : "Tambah"}
                      </Button>
                      {editingPlanId ? (
                        <Button
                          type="button"
                          variant="flat"
                          onPress={() => {
                            setEditingPlanId(null);
                            setPlanForm(emptyPlanForm);
                          }}
                        >
                          Batal
                        </Button>
                      ) : null}
                    </div>
                  </form>
                }
                rows={plans}
                columns={[
                  "No",
                  "Nama",
                  "Harga",
                  "Msg",
                  "Device",
                  "Durasi",
                  "Aksi",
                ]}
                renderRow={(row, index) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.price}</td>
                    <td className="px-3 py-2">{row.message_limit}</td>
                    <td className="px-3 py-2">{row.device_limit}</td>
                    <td className="px-3 py-2">{row.duration_days}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => {
                            setEditingPlanId(row.id);
                            setPlanForm({
                              name: row.name,
                              price: String(row.price),
                              message_limit: String(row.message_limit),
                              device_limit: String(row.device_limit),
                              duration_days: String(row.duration_days),
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() =>
                            openDeleteModal("Hapus plan ini?", () =>
                              masterDataService.deletePlan(row.id),
                            )
                          }
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            ) : null}

            {activeEntity === "devices" ? (
              <MasterSection
                title="Devices"
                form={
                  <form
                    className="grid gap-2 md:grid-cols-3"
                    onSubmit={submitDevice}
                  >
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      placeholder="Nama device"
                      value={deviceForm.device_name}
                      onChange={(e) =>
                        setDeviceForm({
                          ...deviceForm,
                          device_name: e.target.value,
                        })
                      }
                      required
                    />
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      placeholder="No HP"
                      value={deviceForm.phone_number}
                      onChange={(e) =>
                        setDeviceForm({
                          ...deviceForm,
                          phone_number: e.target.value,
                        })
                      }
                    />
                    <select
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      value={deviceForm.status}
                      onChange={(e) =>
                        setDeviceForm({ ...deviceForm, status: e.target.value })
                      }
                    >
                      <option value="offline">offline</option>
                      <option value="online">online</option>
                      <option value="connecting">connecting</option>
                    </select>
                    <div className="md:col-span-3 flex gap-2">
                      <Button color="primary" type="submit">
                        {editingDeviceId ? "Update" : "Tambah"}
                      </Button>
                      {editingDeviceId ? (
                        <Button
                          type="button"
                          variant="flat"
                          onPress={() => {
                            setEditingDeviceId(null);
                            setDeviceForm(emptyDeviceForm);
                          }}
                        >
                          Batal
                        </Button>
                      ) : null}
                    </div>
                  </form>
                }
                rows={devices}
                columns={["No", "Nama", "No HP", "Status", "Aksi"]}
                renderRow={(row, index) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">{row.device_name}</td>
                    <td className="px-3 py-2">{row.phone_number || "-"}</td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => {
                            setEditingDeviceId(row.id);
                            setDeviceForm({
                              device_name: row.device_name,
                              phone_number: row.phone_number || "",
                              status: row.status || "offline",
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() =>
                            openDeleteModal("Hapus device ini?", () =>
                              masterDataService.deleteDevice(row.id),
                            )
                          }
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            ) : null}

            {activeEntity === "contacts" ? (
              <MasterSection
                title="Contacts"
                form={
                  <form
                    className="grid gap-2 md:grid-cols-2"
                    onSubmit={submitContact}
                  >
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      placeholder="Nama contact"
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, name: e.target.value })
                      }
                      required
                    />
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      placeholder="No HP"
                      value={contactForm.phone_number}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          phone_number: e.target.value,
                        })
                      }
                      required
                    />
                    <div className="md:col-span-2 flex gap-2">
                      <Button color="primary" type="submit">
                        {editingContactId ? "Update" : "Tambah"}
                      </Button>
                      {editingContactId ? (
                        <Button
                          type="button"
                          variant="flat"
                          onPress={() => {
                            setEditingContactId(null);
                            setContactForm(emptyContactForm);
                          }}
                        >
                          Batal
                        </Button>
                      ) : null}
                    </div>
                  </form>
                }
                rows={contacts}
                columns={["No", "Nama", "No HP", "Aksi"]}
                renderRow={(row, index) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.phone_number}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => {
                            setEditingContactId(row.id);
                            setContactForm({
                              name: row.name,
                              phone_number: row.phone_number,
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() =>
                            openDeleteModal("Hapus contact ini?", () =>
                              masterDataService.deleteContact(row.id),
                            )
                          }
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            ) : null}

            {activeEntity === "contact-lists" ? (
              <MasterSection
                title="Contact Lists"
                form={
                  <form
                    className="grid gap-2 md:grid-cols-2"
                    onSubmit={submitContactList}
                  >
                    <input
                      className="rounded-lg border border-slate-300 px-3 py-2"
                      placeholder="Nama list"
                      value={contactListForm.name}
                      onChange={(e) =>
                        setContactListForm({ name: e.target.value })
                      }
                      required
                    />
                    <div className="flex gap-2">
                      <Button color="primary" type="submit">
                        {editingContactListId ? "Update" : "Tambah"}
                      </Button>
                      {editingContactListId ? (
                        <Button
                          type="button"
                          variant="flat"
                          onPress={() => {
                            setEditingContactListId(null);
                            setContactListForm(emptyContactListForm);
                          }}
                        >
                          Batal
                        </Button>
                      ) : null}
                    </div>
                  </form>
                }
                rows={contactLists}
                columns={["No", "Nama", "Aksi"]}
                renderRow={(row, index) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => {
                            setEditingContactListId(row.id);
                            setContactListForm({ name: row.name });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() =>
                            openDeleteModal("Hapus contact list ini?", () =>
                              masterDataService.deleteContactList(row.id),
                            )
                          }
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            ) : null}

            <ConfirmModal
              isOpen={Boolean(pendingDelete)}
              title="Konfirmasi hapus"
              message={
                pendingDelete?.message ||
                "Data ini akan dihapus permanen. Lanjutkan?"
              }
              confirmText="Hapus"
              cancelText="Batal"
              onCancel={() => setPendingDelete(null)}
              onConfirm={handleDelete}
            />
          </section>

          <DashboardFooter appName={APP_NAME} />
        </div>
      </div>
    </main>
  );
}

function MasterSection({ title, form, rows, columns, renderRow }) {
  return (
    <Card className="border border-slate-200 bg-white">
      <CardHeader className="pb-3">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4 p-5">
        {form}

        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-3 text-slate-500"
                    colSpan={columns.length}
                  >
                    Belum ada data
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => renderRow(row, index))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
