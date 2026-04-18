import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Separator,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { paymentService } from "../services/paymentService";

function statusColor(status) {
  if (status === "paid") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const rows = await paymentService.myOrders();
      setOrders(rows);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="space-y-5 px-4 py-5 md:px-7 md:py-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Orders</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pantau status order paket Anda.
          </p>
        </div>
        <Button color="primary" onPress={() => navigate("/plans")}>
          Pilih Paket
        </Button>
      </div>

      {loading ? (
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6 text-sm text-slate-500">
            Memuat order...
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card className="border border-slate-200 bg-white">
          <CardContent className="p-6 text-sm text-slate-500">
            Belum ada order.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="border border-slate-200 bg-white shadow-sm"
            >
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Order #{order.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {new Date(order.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
                <Chip color={statusColor(order.status)} size="sm">
                  {order.status}
                </Chip>
              </CardHeader>
              <Separator />
              <CardContent className="grid grid-cols-1 gap-2 p-5 text-sm text-slate-600 md:grid-cols-3">
                <p>
                  Plan: <strong>{order.plan?.name || "-"}</strong>
                </p>
                <p>
                  Amount:{" "}
                  <strong>
                    Rp {Number(order.amount || 0).toLocaleString("id-ID")}
                  </strong>
                </p>
                <p>
                  Kuota:{" "}
                  <strong>
                    {Number(order.plan?.message_limit || 0).toLocaleString(
                      "id-ID",
                    )}{" "}
                    pesan
                  </strong>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
