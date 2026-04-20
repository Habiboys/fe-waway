import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { otpSaasService } from "../../services/otpSaasService";

const STATUS_OPTIONS = [
  { key: "", label: "Semua" },
  { key: "sent", label: "Sent" },
  { key: "verified", label: "Verified" },
  { key: "expired", label: "Expired" },
  { key: "blocked", label: "Blocked" },
  { key: "cancelled", label: "Cancelled" },
  { key: "failed", label: "Failed" },
];

const statusColor = (status) => {
  const map = {
    sent: "bg-blue-100 text-blue-700 border-blue-200",
    verified: "bg-emerald-100 text-emerald-700 border-emerald-200",
    expired: "bg-amber-100 text-amber-700 border-amber-200",
    blocked: "bg-red-100 text-red-700 border-red-200",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200",
    failed: "bg-red-100 text-red-700 border-red-200",
    created: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return map[status] || "bg-slate-100 text-slate-600 border-slate-200";
};

export function OtpTransactionsPanel({ apps }) {
  const [selectedAppId, setSelectedAppId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });
  const [usage, setUsage] = useState(null);

  const loadTransactions = useCallback(async () => {
    if (!selectedAppId) {
      setTransactions([]);
      setUsage(null);
      setPagination({ page: 1, limit: 15, total: 0, totalPages: 0 });
      return;
    }
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;

      const [txResult, usageSummary] = await Promise.all([
        otpSaasService.listTransactions(selectedAppId, params),
        page === 1
          ? otpSaasService.getUsage(selectedAppId, { days: 30 })
          : Promise.resolve(usage),
      ]);

      setTransactions(txResult.data);
      setPagination(txResult.pagination);
      if (page === 1 && usageSummary) setUsage(usageSummary);
    } catch (err) {
      toast.error(err.message || "Gagal memuat transaksi");
    } finally {
      setLoading(false);
    }
  }, [selectedAppId, statusFilter, page]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedAppId, statusFilter]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const goToPage = (p) => {
    if (p < 1 || p > pagination.totalPages) return;
    setPage(p);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const total = pagination.totalPages;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = [];
    pages.push(1);
    if (page > 3) pages.push("...");

    const start = Math.max(2, page - 1);
    const end = Math.min(total - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (page < total - 2) pages.push("...");
    if (total > 1) pages.push(total);
    return pages;
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition"
            >
              <option value="">-- Pilih OTP App --</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.environment})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusFilter === opt.key
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadTransactions}
            disabled={loading || !selectedAppId}
            className="ml-auto rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Usage Summary */}
        {usage?.items?.length > 0 && (
          <div className="px-6 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100 flex flex-wrap gap-3 items-center">
            <span className="text-xs font-semibold text-indigo-700">
              30 hari terakhir:
            </span>
            {usage.items.map((item, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColor(item.status)}`}
              >
                {item.channel}/{item.status}: {item.count}
              </span>
            ))}
          </div>
        )}

        {/* Table */}
        {!selectedAppId ? (
          <div className="p-10 text-center">
            <Clock size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">
              Pilih OTP App untuk melihat transaksi.
            </p>
          </div>
        ) : loading ? (
          <div className="p-10 text-center">
            <Loader2
              size={20}
              className="animate-spin mx-auto text-indigo-400"
            />
            <p className="text-xs text-slate-500 mt-2">Memuat transaksi...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">
              Belum ada transaksi OTP
              {statusFilter ? ` dengan status "${statusFilter}"` : ""}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 font-semibold">Waktu</th>
                  <th className="px-5 py-3 font-semibold">Tujuan</th>
                  <th className="px-5 py-3 font-semibold">Purpose</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Percobaan</th>
                  <th className="px-5 py-3 font-semibold">Resend</th>
                  <th className="px-5 py-3 font-semibold">Expire</th>
                  <th className="px-5 py-3 font-semibold">Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-700">
                      {tx.destination_masked}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{tx.purpose}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusColor(tx.status)}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {tx.attempt_count}/{tx.max_attempts}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {tx.resend_count}/{tx.max_resend || 0}
                    </td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {tx.expires_at
                        ? new Date(tx.expires_at).toLocaleString("id-ID")
                        : "-"}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {tx.reference_id || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Menampilkan{" "}
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              dari {pagination.total} transaksi
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={14} />
              </button>

              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 text-xs text-slate-400"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`min-w-[32px] rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                      page === p
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
