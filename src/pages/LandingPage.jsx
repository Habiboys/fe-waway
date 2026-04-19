import { Button, Card, CardContent } from "@heroui/react";
import { Rocket, ShieldCheck, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_NAME } from "../config/app";
import { masterDataService } from "../services/masterDataService";

const LOGO_SRC = "/images/logo-only.png";

const features = [
  {
    icon: Rocket,
    title: "Blast Cepat",
    desc: "Kirim campaign WhatsApp terjadwal ke ribuan kontak dengan queue worker.",
  },
  {
    icon: ShieldCheck,
    title: "Multi Tenant",
    desc: "Pisahkan data antar organisasi secara aman dengan role berbasis akses.",
  },
  {
    icon: Zap,
    title: "Payment Ready",
    desc: "Integrasi pembayaran subscription siap dipakai untuk SaaS plan kamu.",
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState(false);

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      setPlansError(false);
      const rows = await masterDataService.listPublicPlans();
      setPlans(rows);
    } catch {
      setPlans([]);
      setPlansError(true);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPlans();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const sortedPlans = useMemo(
    () =>
      [...plans].sort((a, b) => Number(a.price || 0) - Number(b.price || 0)),
    [plans],
  );

  return (
    <main className="min-h-dvh bg-white text-slate-800">
      <header className="sticky top-0 z-20 bg-transparent px-4 py-3 md:px-7">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl border border-white/70 bg-white/70 px-4 py-2.5 shadow-lg shadow-slate-200/60 backdrop-blur-xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
          >
            <img
              src={LOGO_SRC}
              alt={APP_NAME}
              className="h-8 w-auto object-contain"
            />
            <span className="hidden sm:inline">{APP_NAME}</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a
              href="#home"
              className="rounded-full px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900"
            >
              Home
            </a>
            <a
              href="#features"
              className="rounded-full px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900"
            >
              Fitur
            </a>
            <a
              href="#pricing"
              className="rounded-full px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900"
            >
              Harga
            </a>
            <a
              href="#contact"
              className="rounded-full px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900"
            >
              Kontak
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="bordered"
              size="sm"
              className="border-slate-300 text-slate-700"
              onPress={() => navigate("/login")}
            >
              Login
            </Button>
            <Button
              color="primary"
              size="sm"
              onPress={() => navigate("/register")}
            >
              Coba Gratis
            </Button>
          </div>
        </div>
      </header>

      <section
        id="home"
        className="mx-auto grid w-full max-w-360 gap-8 px-4 py-16 md:grid-cols-2 md:px-7 md:py-24"
      >
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            WhatsApp Blast SaaS
          </p>
          <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
            Bangun mesin broadcast WhatsApp untuk bisnis kamu.
          </h1>
          <p className="text-slate-600">
            Kelola device, kontak, campaign, dan billing dalam satu dashboard
            modern.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button color="primary" onPress={() => navigate("/register")}>
              Mulai Sekarang
            </Button>
            <Button
              variant="bordered"
              className="border-slate-300 text-slate-700"
              onPress={() => navigate("/login")}
            >
              Masuk
            </Button>
          </div>
        </div>

        <Card className="border border-slate-200 bg-white shadow-xl">
          <CardContent className="space-y-4 p-5 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Realtime Summary</p>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-slate-500">Messages sent today</p>
              <p className="text-3xl font-bold text-slate-900">12.845</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-500">Delivery Rate</p>
                <p className="font-semibold text-emerald-500">98.1%</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-slate-500">Device Online</p>
                <p className="font-semibold text-indigo-600">18</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section
        id="features"
        className="mx-auto w-full max-w-360 px-4 py-10 md:px-7 md:py-14"
      >
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Fitur Utama
        </h2>
        <p className="mt-2 text-slate-600">
          Semua yang kamu butuhkan untuk launch WA Blast sebagai SaaS.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const FeatureIcon = feature.icon;

            return (
              <Card
                key={feature.title}
                className="border border-slate-200 bg-white"
              >
                <CardContent className="space-y-3 p-5">
                  <div className="inline-flex rounded-lg bg-indigo-100 p-2 text-indigo-600">
                    <FeatureIcon size={18} />
                  </div>
                  <p className="font-semibold text-slate-900">
                    {feature.title}
                  </p>
                  <p className="text-sm text-slate-600">{feature.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section
        id="pricing"
        className="mx-auto w-full max-w-360 px-4 py-10 md:px-7 md:py-14"
      >
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-slate-900">Paket Harga</h3>
          <p className="text-slate-600">Data plan langsung dari server.</p>
        </div>

        {loadingPlans ? (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={`plan-skeleton-${index}`}
                className="border border-slate-200 bg-white"
              >
                <CardContent className="space-y-3 p-5">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-indigo-100" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {plansError ? (
              <Card className="border border-amber-200 bg-amber-50 md:col-span-3">
                <CardContent className="space-y-3 p-6 text-sm text-amber-800">
                  <p>Gagal memuat paket dari server.</p>
                  <div>
                    <Button size="sm" color="warning" onPress={loadPlans}>
                      Coba lagi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : sortedPlans.length === 0 ? (
              <Card className="border border-slate-200 bg-white md:col-span-3">
                <CardContent className="p-6 text-sm text-slate-500">
                  Belum ada plan aktif.
                </CardContent>
              </Card>
            ) : (
              sortedPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className="border border-slate-200 bg-white"
                >
                  <CardContent className="space-y-3 p-5">
                    <p className="text-sm uppercase tracking-[0.2em] text-indigo-600">
                      {plan.name}
                    </p>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Rp {Number(plan.price || 0).toLocaleString("id-ID")}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {plan.description || "-"}
                    </p>
                    <p className="text-sm text-slate-600">
                      Kuota:{" "}
                      {Number(plan.message_limit || 0).toLocaleString("id-ID")}{" "}
                      pesan / {plan.duration_days} hari
                    </p>
                    <Button
                      color="primary"
                      className="w-full"
                      onPress={() => navigate("/register")}
                    >
                      Pilih Plan
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </section>

      <section
        id="contact"
        className="mx-auto w-full max-w-360 px-4 py-10 md:px-7 md:py-14"
      >
        <Card className="border border-slate-200 bg-white">
          <CardContent className="space-y-3 p-6">
            <h3 className="text-xl font-semibold text-slate-900">
              Butuh demo cepat?
            </h3>
            <p className="text-slate-600">
              Hubungi kontak berikut untuk tanya fitur, demo, atau kerja sama.
            </p>

            <div className="space-y-1 text-sm text-slate-700">
              <p>
                WhatsApp:{" "}
                <a
                  className="text-indigo-600 hover:underline"
                  href="https://wa.me/6285142247464"
                  target="_blank"
                  rel="noreferrer"
                >
                  6285142247464
                </a>
              </p>
              <p>
                Instagram:{" "}
                <a
                  className="text-indigo-600 hover:underline"
                  href="https://instagram.com/nuval18_"
                  target="_blank"
                  rel="noreferrer"
                >
                  @nuval18_
                </a>
              </p>
              <p>
                Email:{" "}
                <a
                  className="text-indigo-600 hover:underline"
                  href="mailto:nouvalhabibie18@gmail.com"
                >
                  nouvalhabibie18@gmail.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
