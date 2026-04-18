import { Button, Input, Label } from "@heroui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { authService } from "../services/authService";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await authService.forgotPassword({ email });
      setMessage(
        result?.message ||
          "Link reset password telah dikirim jika email terdaftar.",
      );
    } catch (err) {
      setError(err.message || "Gagal mengirim reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Lupa Password"
      subtitle="Masukkan email untuk menerima link reset password."
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
          <Label className="auth-label" htmlFor="forgot-email">
            Email
          </Label>
          <Input
            id="forgot-email"
            fullWidth
            type="email"
            placeholder="email@domain.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            variant="primary"
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
          Kirim Link Reset
        </Button>
      </form>
    </AuthLayout>
  );
}
