import { Button, Input, Label } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama");
      setLoading(false);
      return;
    }

    try {
      await register({
        name,
        email,
        phone_number: phoneNumber,
        address,
        password,
        confirm_password: confirmPassword,
      });
      navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Buat akun WA Blast"
      subtitle="Mulai trial dan langsung akses dashboard."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <Button
          type="button"
          variant="light"
          size="sm"
          className="auth-landing-btn"
          onClick={() => navigate("/")}
        >
          ← Kembali ke landing page
        </Button>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="auth-field-group md:col-span-2">
            <Label className="auth-label" htmlFor="register-name">
              Nama
            </Label>
            <Input
              id="register-name"
              fullWidth
              placeholder="Nama lengkap"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              variant="primary"
            />
          </div>

          <div className="auth-field-group">
            <Label className="auth-label" htmlFor="register-email">
              Email
            </Label>
            <Input
              id="register-email"
              fullWidth
              type="email"
              placeholder="email@domain.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              variant="primary"
            />
          </div>

          <div className="auth-field-group">
            <Label className="auth-label" htmlFor="register-phone">
              Nomor HP
            </Label>
            <Input
              id="register-phone"
              fullWidth
              placeholder="Contoh: 6281234567890"
              value={phoneNumber}
              onChange={(event) =>
                setPhoneNumber(event.target.value.replace(/\s+/g, ""))
              }
              required
              variant="primary"
            />
          </div>

          <div className="auth-field-group md:col-span-2">
            <Label className="auth-label" htmlFor="register-address">
              Alamat
            </Label>
            <Input
              id="register-address"
              fullWidth
              placeholder="Alamat lengkap"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
              variant="primary"
            />
          </div>

          <div className="auth-field-group">
            <Label className="auth-label" htmlFor="register-password">
              Password
            </Label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-11 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-field-group">
            <Label className="auth-label" htmlFor="register-confirm-password">
              Konfirmasi Password
            </Label>
            <div className="relative">
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-11 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <p className="auth-helper-text">
          Setelah daftar, verifikasi email dulu sebelum bisa masuk ke dashboard.
        </p>

        {error ? <p className="error-text">{error}</p> : null}

        <Button
          color="primary"
          type="submit"
          isLoading={loading}
          fullWidth
          className="auth-submit-btn"
        >
          Daftar
        </Button>

        <p className="auth-switch-text">
          Sudah punya akun?{" "}
          <button
            type="button"
            className="auth-switch-btn"
            onClick={() => navigate("/login")}
          >
            Masuk sekarang
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
