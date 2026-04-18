import { Button, Input, Label } from "@heroui/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { authService } from "../services/authService";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (!token) {
      setError("Token reset tidak ditemukan");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama");
      setLoading(false);
      return;
    }

    try {
      const result = await authService.resetPassword({
        token,
        password,
        confirm_password: confirmPassword,
      });
      setMessage(result?.message || "Password berhasil direset");
    } catch (err) {
      setError(err.message || "Gagal reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Masukkan password baru untuk akun Anda."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <Button
          variant="light"
          size="sm"
          className="auth-landing-btn"
          onPress={() => navigate("/login")}
        >
          ← Kembali ke login
        </Button>

        <div className="auth-field-group">
          <Label className="auth-label" htmlFor="reset-password">
            Password Baru
          </Label>
          <Input
            id="reset-password"
            fullWidth
            type={showPassword ? "text" : "password"}
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            variant="primary"
            endContent={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-500"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </div>

        <div className="auth-field-group">
          <Label className="auth-label" htmlFor="reset-confirm-password">
            Konfirmasi Password
          </Label>
          <Input
            id="reset-confirm-password"
            fullWidth
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Ulangi password baru"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            variant="primary"
            endContent={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="text-slate-500"
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
        </div>

        {message ? (
          <p className="auth-helper-text text-emerald-600">{message}</p>
        ) : null}
        {error ? <p className="error-text">{error}</p> : null}

        <Button
          color="primary"
          type="submit"
          isLoading={loading}
          fullWidth
          className="auth-submit-btn"
        >
          Simpan Password Baru
        </Button>
      </form>
    </AuthLayout>
  );
}
