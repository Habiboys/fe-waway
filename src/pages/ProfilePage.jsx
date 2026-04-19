import { Button, Card, CardContent, CardHeader } from "@heroui/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    address: user?.address || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const isProfileChanged = useMemo(() => {
    return (
      String(profileForm.name || "") !== String(user?.name || "") ||
      String(profileForm.email || "") !== String(user?.email || "") ||
      String(profileForm.phone_number || "") !==
        String(user?.phone_number || "") ||
      String(profileForm.address || "") !== String(user?.address || "")
    );
  }, [profileForm, user]);

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (!profileForm.name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }

    if (!profileForm.email.trim()) {
      toast.error("Email wajib diisi");
      return;
    }

    setSavingProfile(true);
    try {
      const result = await authService.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        phone_number: profileForm.phone_number,
        address: profileForm.address,
      });

      if (result?.requires_reverification) {
        toast.success(
          "Email berubah. Silakan verifikasi email baru, lalu login kembali.",
        );
        await logout();
        navigate("/login", { replace: true });
        return;
      }

      await refreshUser();
      toast.success("Profil berhasil diperbarui");
    } catch (error) {
      toast.error(error.message || "Gagal memperbarui profil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast.error("Password lama dan password baru wajib diisi");
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Konfirmasi password baru tidak sama");
      return;
    }

    setSavingPassword(true);
    try {
      await authService.changePassword(passwordForm);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      toast.success("Password berhasil diubah");
    } catch (error) {
      toast.error(error.message || "Gagal mengubah password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <section className="space-y-5 px-4 py-5 md:px-7 md:py-7">
      <Card className="border border-slate-200 bg-white">
        <CardHeader className="pb-2">
          <h3 className="text-base font-bold text-slate-900">Profil Akun</h3>
        </CardHeader>
        <CardContent>
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            onSubmit={handleSaveProfile}
          >
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Nama</label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={profileForm.email}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
              />
              <p className="text-xs text-slate-500">
                Jika email diubah, kamu harus verifikasi email baru terlebih
                dahulu.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Nomor HP
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={profileForm.phone_number}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    phone_number: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Alamat
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={profileForm.address}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    address: event.target.value,
                  }))
                }
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button
                color="primary"
                type="submit"
                isLoading={savingProfile}
                isDisabled={!isProfileChanged || savingProfile}
              >
                Simpan Perubahan Profil
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white">
        <CardHeader className="pb-2">
          <h3 className="text-base font-bold text-slate-900">Ubah Password</h3>
        </CardHeader>
        <CardContent>
          <form
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            onSubmit={handleChangePassword}
          >
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Password Lama
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    current_password: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Password Baru
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={passwordForm.new_password}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    new_password: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={passwordForm.confirm_password}
                onChange={(event) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirm_password: event.target.value,
                  }))
                }
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button color="primary" type="submit" isLoading={savingPassword}>
                Ubah Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
