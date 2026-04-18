import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Separator,
} from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { masterDataService } from "../services/masterDataService";
import { paymentService } from "../services/paymentService";

export function PlansPricingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buyingPlanId, setBuyingPlanId] = useState(null);
  const [confirmPlan, setConfirmPlan] = useState(null);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        setLoading(true);
        const rows = await masterDataService.listPlans();
        setPlans(rows);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const sortedPlans = useMemo(
    () =>
      [...plans].sort((a, b) => Number(a.price || 0) - Number(b.price || 0)),
    [plans],
  );

  const createOrder = async (plan) => {
    try {
      setBuyingPlanId(plan.id);
      await paymentService.createInvoice(plan.id);
      toast.success("Order berhasil dibuat. Menunggu konfirmasi admin.");
      setConfirmPlan(null);
      navigate("/orders");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBuyingPlanId(null);
    }
  };

  return (
    <>
      <section className="space-y-5 px-4 py-5 md:px-7 md:py-7">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pilih Paket</h2>
          <p className="mt-1 text-sm text-slate-600">
            Pilih paket, buat order, lalu tunggu approval admin.
          </p>
        </div>

        {loading ? (
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-6 text-sm text-slate-500">
              Memuat paket...
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {sortedPlans.map((plan) => (
              <Card
                key={plan.id}
                className="border border-slate-200 bg-white shadow-sm"
              >
                <CardHeader className="flex items-center justify-between pb-0">
                  <h3 className="text-lg font-bold text-slate-900">
                    {plan.name}
                  </h3>
                  {Number(plan.price || 0) === 0 ? (
                    <Chip color="success" size="sm">
                      Trial
                    </Chip>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-3 p-5">
                  <p className="text-2xl font-bold text-indigo-700">
                    Rp {Number(plan.price || 0).toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm text-slate-600">
                    {plan.description || "-"}
                  </p>
                  <Separator />
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>
                      Kuota pesan:{" "}
                      <strong>
                        {Number(plan.message_limit || 0).toLocaleString(
                          "id-ID",
                        )}
                      </strong>
                    </li>
                    <li>
                      Batas device: <strong>{plan.device_limit}</strong>
                    </li>
                    <li>
                      Durasi: <strong>{plan.duration_days} hari</strong>
                    </li>
                  </ul>
                  <Button
                    color="primary"
                    className="w-full"
                    isLoading={buyingPlanId === plan.id}
                    onPress={() => setConfirmPlan(plan)}
                  >
                    Pilih Paket
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {confirmPlan ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h4 className="text-base font-bold text-slate-900">
                Konfirmasi Pilih Paket
              </h4>
            </div>
            <div className="space-y-4 p-5 text-sm text-slate-600">
              <p>
                Yakin ingin membuat order untuk paket{" "}
                <span className="font-semibold text-slate-900">
                  {confirmPlan.name}
                </span>
                ?
              </p>
              <p>
                Harga:{" "}
                <span className="font-semibold text-slate-900">
                  Rp {Number(confirmPlan.price || 0).toLocaleString("id-ID")}
                </span>
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="flat"
                  onPress={() => setConfirmPlan(null)}
                  isDisabled={buyingPlanId === confirmPlan.id}
                >
                  Batal
                </Button>
                <Button
                  color="primary"
                  isLoading={buyingPlanId === confirmPlan.id}
                  onPress={() => createOrder(confirmPlan)}
                >
                  Ya, Buat Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
