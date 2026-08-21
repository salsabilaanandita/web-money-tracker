"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { getToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Profile = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ProfileResponse = {
  data: Profile;
  message?: string;
};

function getAvatarUrl(avatarUrl?: string | null) {
  if (!avatarUrl) return null;

  // Kalau API sudah mengirim URL lengkap
  if (
    avatarUrl.startsWith("http://") ||
    avatarUrl.startsWith("https://")
  ) {
    return avatarUrl;
  }

  if (!API_URL) {
    return avatarUrl;
  }

  // NEXT_PUBLIC_API_URL:
  // http://localhost:8080/api
  //
  // Avatar:
  // /uploads/avatars/xxx.webp
  //
  // Hasil:
  // http://localhost:8080/uploads/avatars/xxx.webp

  const backendUrl = API_URL.replace(/\/api\/?$/, "");

  return `${backendUrl}${
    avatarUrl.startsWith("/") ? "" : "/"
  }${avatarUrl}`;
}

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    null
  );

  // ==========================================================
  // AVATAR URL
  // ==========================================================

  const avatarUrl = useMemo(() => {
    if (avatarPreview) {
      return avatarPreview;
    }

    return getAvatarUrl(profile?.avatar_url);
  }, [avatarPreview, profile?.avatar_url]);

  const initial = (profile?.name || name || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  // ==========================================================
  // GET PROFILE
  // GET /api/profile
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const token = getToken();

        // JANGAN langsung redirect kalau token belum kebaca
        // sebelum request selesai.
        if (!token) {
          toast.error("Session login tidak ditemukan");
          router.replace("/login");
          return;
        }

        if (!API_URL) {
          throw new Error(
            "NEXT_PUBLIC_API_URL belum tersedia"
          );
        }

        const response = await fetch(`${API_URL}/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error ||
              result?.message ||
              "Gagal mengambil data profile"
          );
        }

        const data: Profile = result?.data ?? result;

        if (!mounted) return;

        setProfile(data);
        setName(data.name ?? "");
      } catch (error) {
        console.error("Gagal mengambil profile:", error);

        if (mounted) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Gagal mengambil data profile"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ==========================================================
  // SAVE PROFILE
  // PUT /api/profile
  // ==========================================================

  async function handleSaveProfile(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("Nama tidak boleh kosong");
      return;
    }

    if (!API_URL) {
      toast.error("NEXT_PUBLIC_API_URL belum tersedia");
      return;
    }

    const token = getToken();

    if (!token) {
      toast.error("Session login tidak ditemukan");
      router.replace("/login");
      return;
    }

    try {
      setSavingProfile(true);

      const response = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Gagal menyimpan profile"
        );
      }

      const updatedProfile: Profile | undefined =
        result?.data;

      if (updatedProfile) {
        setProfile(updatedProfile);
        setName(updatedProfile.name ?? "");
      } else {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                name: trimmedName,
              }
            : prev
        );
      }

      toast.success("Profile berhasil diperbarui");
    } catch (error) {
      console.error("Gagal menyimpan profile:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan profile"
      );
    } finally {
      setSavingProfile(false);
    }
  }

  // ==========================================================
  // UPLOAD AVATAR
  // POST /api/profile/avatar
  // ==========================================================

  async function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    // Supaya file yang sama tetap bisa dipilih lagi
    event.target.value = "";

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5MB");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Format foto harus JPG, JPEG, PNG, atau WEBP"
      );
      return;
    }

    if (!API_URL) {
      toast.error("NEXT_PUBLIC_API_URL belum tersedia");
      return;
    }

    const token = getToken();

    if (!token) {
      toast.error("Session login tidak ditemukan");
      router.replace("/login");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setAvatarPreview(previewUrl);

    try {
      setUploadingAvatar(true);

      const formData = new FormData();

      // WAJIB "avatar"
      // karena backend menggunakan:
      // c.FormFile("avatar")
      formData.append("avatar", file);

      const response = await fetch(
        `${API_URL}/profile/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Gagal mengupload foto profile"
        );
      }

      const updatedProfile: Profile | undefined =
        result?.data;

      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      setAvatarPreview(null);

      URL.revokeObjectURL(previewUrl);

      toast.success("Foto profile berhasil diperbarui");
    } catch (error) {
      console.error("Gagal upload avatar:", error);

      setAvatarPreview(null);

      URL.revokeObjectURL(previewUrl);

      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengupload foto profile"
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  // ==========================================================
  // CHANGE PASSWORD
  // PUT /api/profile/password
  // ==========================================================

  async function handleChangePassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!currentPassword) {
      toast.error("Masukkan password lama");
      return;
    }

    if (!newPassword) {
      toast.error("Masukkan password baru");
      return;
    }

    if (newPassword.length < 6) {
      toast.error(
        "Password baru minimal 6 karakter"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        "Konfirmasi password tidak cocok"
      );
      return;
    }

    if (!API_URL) {
      toast.error("NEXT_PUBLIC_API_URL belum tersedia");
      return;
    }

    const token = getToken();

    if (!token) {
      toast.error("Session login tidak ditemukan");
      router.replace("/login");
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(
        `${API_URL}/profile/password`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Gagal mengganti password"
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password berhasil diubah");
    } catch (error) {
      console.error(
        "Gagal mengganti password:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengganti password"
      );
    } finally {
      setChangingPassword(false);
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Memuat profile...
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-7 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="
              flex size-10 shrink-0 items-center
              justify-center rounded-xl
              border border-border
              bg-background
              text-muted-foreground
              transition
              hover:bg-muted
              hover:text-foreground
            "
            aria-label="Kembali"
          >
            <ArrowLeft className="size-5" />
          </Link>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Pengaturan akun
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Profile
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Kelola informasi pribadi dan keamanan akun.
            </p>
          </div>
        </div>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* ==================================================
              PROFILE PHOTO
          ================================================== */}

          <section
            className="
              rounded-3xl
              border border-border
              bg-card
              p-6
              shadow-sm
            "
          >
            <div>
              <h2 className="text-base font-semibold">
                Foto profile
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Tambahkan foto agar akunmu lebih mudah dikenali.
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center">
              {/* AVATAR */}

              <div className="relative">
                <div
                  className="
                    flex size-36
                    items-center justify-center
                    overflow-hidden
                    rounded-full
                    border
                    border-border
                    bg-primary/10
                    text-4xl
                    font-bold
                    text-primary
                    shadow-sm
                  "
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Foto profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>

                {/* CAMERA BUTTON */}

                <label
                  className="
                    absolute
                    bottom-1
                    right-1
                    flex size-10
                    cursor-pointer
                    items-center justify-center
                    rounded-full
                    border-4 border-card
                    bg-primary
                    text-primary-foreground
                    shadow-md
                    transition
                    hover:scale-105
                  "
                  title="Ganti foto"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Camera className="size-4" />
                  )}

                  <input
                    type="file"
                    className="hidden"
                    accept="
                      image/jpeg,
                      image/png,
                      image/webp,
                      .jpg,
                      .jpeg,
                      .png,
                      .webp
                    "
                    disabled={uploadingAvatar}
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>

              {/* NAME */}

              <p className="mt-5 text-sm font-semibold">
                {profile?.name || "User"}
              </p>

              {/* EMAIL */}

              <p className="mt-1 text-xs text-muted-foreground">
                {profile?.email || "-"}
              </p>

              {/* CHANGE PHOTO */}

              <label
                className="
                  mt-5
                  inline-flex
                  cursor-pointer
                  items-center
                  gap-2
                  rounded-xl
                  border border-border
                  bg-background
                  px-4 py-2.5
                  text-sm font-medium
                  transition
                  hover:bg-muted
                "
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>
                    <Camera className="size-4" />
                    Ganti foto
                  </>
                )}

                <input
                  type="file"
                  className="hidden"
                  accept="
                    image/jpeg,
                    image/png,
                    image/webp,
                    .jpg,
                    .jpeg,
                    .png,
                    .webp
                  "
                  disabled={uploadingAvatar}
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            {/* INFO */}

            <div className="mt-7 border-t border-border pt-5">
              <div className="flex gap-3">
                <div
                  className="
                    flex size-9 shrink-0
                    items-center justify-center
                    rounded-xl
                    bg-muted
                  "
                >
                  <ShieldCheck className="size-4 text-muted-foreground" />
                </div>

                <div>
                  <p className="text-sm font-medium">
                    Akun pribadi
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Informasi profile hanya digunakan untuk akun
                    yang sedang login.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================
              RIGHT
          ================================================== */}

          <div className="space-y-6">
            {/* ==================================================
                PROFILE INFORMATION
            ================================================== */}

            <section
              className="
                rounded-3xl
                border border-border
                bg-card
                p-6
                shadow-sm
              "
            >
              <div className="mb-6">
                <h2 className="text-base font-semibold">
                  Informasi profile
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Perbarui nama yang digunakan di aplikasi.
                </p>
              </div>

              <form
                onSubmit={handleSaveProfile}
                className="space-y-5"
              >
                {/* NAME */}

                <div>
                  <label
                    htmlFor="profile-name"
                    className="mb-2 block text-sm font-medium"
                  >
                    Nama lengkap
                  </label>

                  <div className="relative">
                    <User
                      className="
                        pointer-events-none
                        absolute left-3 top-1/2
                        size-4
                        -translate-y-1/2
                        text-muted-foreground
                      "
                    />

                    <input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      placeholder="Masukkan nama lengkap"
                      className="
                        h-11 w-full
                        rounded-xl
                        border border-border
                        bg-background
                        pl-10 pr-4
                        text-sm
                        outline-none
                        transition
                        placeholder:text-muted-foreground
                        focus:border-primary
                        focus:ring-2
                        focus:ring-primary/10
                      "
                    />
                  </div>
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="profile-email"
                    className="mb-2 block text-sm font-medium"
                  >
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      className="
                        pointer-events-none
                        absolute left-3 top-1/2
                        size-4
                        -translate-y-1/2
                        text-muted-foreground
                      "
                    />

                    <input
                      id="profile-email"
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="
                        h-11 w-full
                        rounded-xl
                        border border-border
                        bg-muted/50
                        pl-10 pr-4
                        text-sm
                        text-muted-foreground
                        outline-none
                      "
                    />
                  </div>

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Email tidak dapat diubah dari halaman ini.
                  </p>
                </div>

                {/* SAVE */}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="
                      inline-flex
                      h-11
                      items-center
                      gap-2
                      rounded-xl
                      bg-primary
                      px-5
                      text-sm
                      font-semibold
                      text-primary-foreground
                      shadow-sm
                      transition
                      hover:opacity-90
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="size-4" />
                        Simpan profile
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* ==================================================
                PASSWORD
            ================================================== */}

            <section
              className="
                rounded-3xl
                border border-border
                bg-card
                p-6
                shadow-sm
              "
            >
              <div className="mb-6 flex gap-3">
                <div
                  className="
                    flex size-10 shrink-0
                    items-center justify-center
                    rounded-xl
                    bg-primary/10
                    text-primary
                  "
                >
                  <KeyRound className="size-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold">
                    Keamanan akun
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Ganti password akun kamu.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleChangePassword}
                className="space-y-4"
              >
                {/* CURRENT */}

                <div>
                  <label
                    htmlFor="current-password"
                    className="mb-2 block text-sm font-medium"
                  >
                    Password lama
                  </label>

                  <div className="relative">
                    <input
                      id="current-password"
                      type={
                        showCurrentPassword
                          ? "text"
                          : "password"
                      }
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(
                          event.target.value
                        )
                      }
                      placeholder="Masukkan password lama"
                      autoComplete="current-password"
                      className="
                        h-11 w-full
                        rounded-xl
                        border border-border
                        bg-background
                        px-4 pr-11
                        text-sm
                        outline-none
                        transition
                        placeholder:text-muted-foreground
                        focus:border-primary
                        focus:ring-2
                        focus:ring-primary/10
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(
                          (prev) => !prev
                        )
                      }
                      className="
                        absolute
                        right-2 top-1/2
                        flex size-8
                        -translate-y-1/2
                        items-center justify-center
                        rounded-lg
                        text-muted-foreground
                        hover:bg-muted
                        hover:text-foreground
                      "
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* NEW */}

                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-medium"
                  >
                    Password baru
                  </label>

                  <div className="relative">
                    <input
                      id="new-password"
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      value={newPassword}
                      onChange={(event) =>
                        setNewPassword(
                          event.target.value
                        )
                      }
                      placeholder="Minimal 6 karakter"
                      autoComplete="new-password"
                      className="
                        h-11 w-full
                        rounded-xl
                        border border-border
                        bg-background
                        px-4 pr-11
                        text-sm
                        outline-none
                        transition
                        placeholder:text-muted-foreground
                        focus:border-primary
                        focus:ring-2
                        focus:ring-primary/10
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowNewPassword(
                          (prev) => !prev
                        )
                      }
                      className="
                        absolute
                        right-2 top-1/2
                        flex size-8
                        -translate-y-1/2
                        items-center justify-center
                        rounded-lg
                        text-muted-foreground
                        hover:bg-muted
                        hover:text-foreground
                      "
                    >
                      {showNewPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* CONFIRM */}

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-medium"
                  >
                    Konfirmasi password baru
                  </label>

                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      placeholder="Ulangi password baru"
                      autoComplete="new-password"
                      className="
                        h-11 w-full
                        rounded-xl
                        border border-border
                        bg-background
                        px-4 pr-11
                        text-sm
                        outline-none
                        transition
                        placeholder:text-muted-foreground
                        focus:border-primary
                        focus:ring-2
                        focus:ring-primary/10
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (prev) => !prev
                        )
                      }
                      className="
                        absolute
                        right-2 top-1/2
                        flex size-8
                        -translate-y-1/2
                        items-center justify-center
                        rounded-lg
                        text-muted-foreground
                        hover:bg-muted
                        hover:text-foreground
                      "
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>

                  {confirmPassword &&
                    newPassword === confirmPassword && (
                      <p
                        className="
                          mt-2
                          flex items-center gap-1.5
                          text-xs
                          text-emerald-600
                          dark:text-emerald-400
                        "
                      >
                        <Check className="size-3.5" />
                        Password cocok
                      </p>
                    )}
                </div>

                {/* CHANGE PASSWORD */}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="
                      inline-flex
                      h-11
                      items-center
                      gap-2
                      rounded-xl
                      border border-border
                      bg-background
                      px-5
                      text-sm
                      font-semibold
                      transition
                      hover:bg-muted
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Mengubah...
                      </>
                    ) : (
                      <>
                        <KeyRound className="size-4" />
                        Ganti password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}