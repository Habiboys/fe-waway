import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { authService } from "../services/authService";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const initialEmail = searchParams.get("email") || "";

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError("");
        setMessage(
          "Akun kamu belum aktif. Cek inbox/spam untuk link verifikasi email.",
        );
        setLoading(false);
        return;
      }

      try {
        const result = await authService.verifyEmail(token);
        setError("");
        setMessage(result?.message || "Email berhasil diverifikasi");
      } catch (err) {
        setMessage("");
        setError(err.message || "Gagal verifikasi email");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  const handleResend = async () => {
    const cleanedEmail = String(email || "")
      .trim()
      .toLowerCase();
    if (!cleanedEmail) {
      setError("Email wajib diisi untuk kirim ulang verifikasi");
      return;
    }

    setResending(true);
    setError("");
    try {
      const result = await authService.resendVerification({
        email: cleanedEmail,
      });
      setError("");
      setMessage(
        result?.message ||
          "Jika email terdaftar, link verifikasi sudah dikirim ulang.",
      );
    } catch (err) {
      setMessage("");
      setError(err.message || "Gagal mengirim ulang verifikasi email");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout title="Verifikasi Email" subtitle="Proses verifikasi akun.">
      <div className="auth-form">
        {loading ? (
          <p className="auth-helper-text">Memverifikasi email...</p>
        ) : null}
        {message && !error ? (
          <p className="auth-helper-text text-emerald-600">{message}</p>
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}

        {!token && !loading ? (
          <>
            <div className="auth-field-group">
              <label className="auth-label" htmlFor="resend-email">
                Email akun
              </label>
              <input
                id="resend-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@domain.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <Button
              color="secondary"
              variant="flat"
              fullWidth
              className="auth-submit-btn"
              isLoading={resending}
              onPress={handleResend}
            >
              Kirim Ulang Email Verifikasi
            </Button>
          </>
        ) : null}

        <Button
          color="primary"
          fullWidth
          className="auth-submit-btn"
          onPress={() => navigate("/login")}
        >
          Ke Halaman Login
        </Button>
      </div>
    </AuthLayout>
  );
}
