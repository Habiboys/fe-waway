import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Separator,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { adminService } from "../services/adminService";

function statusColor(status) {
  if (status === "paid") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

export function AdminOrdersListPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.listOrders(
        statusFilter === "all" ? undefined : statusFilter,
      );
      setRows(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) => {
      return [
        row.id,
        row.organization_name,
        row.status,
        row.amount,
        row.plan?.plan_name,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .some((value) => value.includes(q));
    });
  }, [rows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));
  const startIndex = (currentPage - 1) * perPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + perPage);
  const viewFrom = filteredRows.length === 0 ? 0 : startIndex + 1;
  const viewTo = Math.min(startIndex + perPage, filteredRows.length);

  const onApprove = async (orderId) => {
    try {
      setProcessingId(orderId);
      await adminService.approveOrder(orderId);
      toast.success("Order berhasil di-approve");
      await loadOrders();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const onReject = async (orderId) => {
    try {
      setProcessingId(orderId);
      await adminService.rejectOrder(orderId);
      toast.success("Order berhasil di-reject");
      await loadOrders();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="space-y-5 px-4 py-5 md:px-7 md:py-7">
      <Card className="border border-slate-200 bg-white">
        <CardHeader className="w-full flex-row items-center justify-between gap-3 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            All Orders (Admin)
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
                placeholder="Cari order / organization / plan"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
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

          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">No</th>
                  <th className="px-3 py-2 font-semibold">Organization</th>
                  <th className="px-3 py-2 font-semibold">Plan</th>
                  <th className="px-3 py-2 font-semibold">Amount</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Tanggal</th>
                  <th className="px-3 py-2 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={7}>
                      Memuat data...
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={7}>
                      Tidak ada data order.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((order, index) => (
                    <tr key={order.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{startIndex + index + 1}</td>
                      <td className="px-3 py-2">
                        {order.organization_name || "-"}
                      </td>
                      <td className="px-3 py-2">
                        {order.plan?.plan_name || "-"}
                      </td>
                      <td className="px-3 py-2">
                        Rp {Number(order.amount || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-3 py-2">
                        <Chip color={statusColor(order.status)} size="sm">
                          {order.status}
                        </Chip>
                      </td>
                      <td className="px-3 py-2">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString("id-ID")
                          : "-"}
                      </td>
                      <td className="px-3 py-2">
                        {order.status === "pending" ? (
                          <div className="flex gap-2">
                            <Button
                              color="success"
                              size="sm"
                              isLoading={processingId === order.id}
                              onPress={() => onApprove(order.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              color="danger"
                              size="sm"
                              isLoading={processingId === order.id}
                              onPress={() => onReject(order.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
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
                onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
  );
}
