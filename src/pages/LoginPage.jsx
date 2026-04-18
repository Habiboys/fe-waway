import { Button, Input, Label } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login({ email, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err?.code === "EMAIL_NOT_VERIFIED") {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
          replace: true,
        });
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Masuk ke WA Blast"
      subtitle="Lanjutkan ke dashboard untuk kelola campaign kamu."
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

        <div className="auth-field-group">
          <Label className="auth-label" htmlFor="login-email">
            Email
          </Label>
          <Input
            id="login-email"
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
          <Label className="auth-label" htmlFor="login-password">
            Password
          </Label>
          <div className="relative">
            <input
              id="login-password"
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

        <p className="auth-helper-text">
          <button
            type="button"
            className="auth-switch-btn"
            onClick={() => navigate("/forgot-password")}
          >
            Lupa password?
          </button>
        </p>

        {error ? <p className="error-text">{error}</p> : null}

        <Button
          color="primary"
          type="submit"
          isLoading={loading}
          fullWidth
          className="auth-submit-btn"
        >
          Masuk
        </Button>

        <p className="auth-switch-text">
          Belum punya akun?{" "}
          <button
            type="button"
            className="auth-switch-btn"
            onClick={() => navigate("/register")}
          >
            Daftar di sini
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
