"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Eye,
  EyeOff,
  Monitor,
  Moon,
  Palette,
  Save,
  Shield,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { Card } from "@/components/ui/card";
import { getToken } from "@/lib/auth";
import { setPreferenceState } from "@/store/usePreferenceStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Preferences = {
  theme: "light" | "dark" | "system";
  budget_notification: boolean;
  transaction_notification: boolean;
  savings_notification: boolean;
  reminder_notification: boolean;
  private_mode: boolean;
  hide_balance: boolean;
};

const defaultPreferences: Preferences = {
  theme: "light",
  budget_notification: true,
  transaction_notification: true,
  savings_notification: true,
  reminder_notification: false,
  private_mode: false,
  hide_balance: false,
};

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border/60 py-5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>

          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>

        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  const router = useRouter();

  const { theme, setTheme } = useTheme();

  const [preferences, setPreferences] =
    useState<Preferences>(defaultPreferences);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  /*
   * ==========================================================
   * GET PREFERENCES
   * ==========================================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadPreferences() {
      try {
        const token = getToken();

        if (!API_URL) {
          throw new Error("NEXT_PUBLIC_API_URL belum dikonfigurasi");
        }

        if (!token) {
          throw new Error("Sesi login tidak ditemukan.");
        }

        const response = await fetch(`${API_URL}/preferences`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || data?.error || "Gagal mengambil preferensi",
          );
        }

        const result = data?.data ?? data;

        const loaded: Preferences = {
          theme:
            result?.theme === "light" ||
            result?.theme === "dark" ||
            result?.theme === "system"
              ? result.theme
              : "light",

          budget_notification: Boolean(result?.budget_notification ?? true),

          transaction_notification: Boolean(
            result?.transaction_notification ?? true,
          ),

          savings_notification: Boolean(result?.savings_notification ?? true),

          reminder_notification: Boolean(
            result?.reminder_notification ?? false,
          ),

          private_mode: Boolean(result?.private_mode ?? false),

          hide_balance: Boolean(result?.hide_balance ?? false),
        };

        if (!mounted) return;

        setPreferences(loaded);

        /*
         * INI PENTING.
         *
         * Simpan privacy state ke global store
         * supaya WalletCard / Dashboard ikut berubah.
         */
        setPreferenceState({
          private_mode: loaded.private_mode,
          hide_balance: loaded.hide_balance,
        });

        // Sengaja TIDAK memanggil setTheme() di sini.
        //
        // Tema yang lagi AKTIF di browser (hasil klik toggle di
        // sidebar, atau tema tersimpan di localStorage next-themes)
        // jangan dioverride otomatis cuma karena halaman Preferensi
        // ini dibuka. `loaded.theme` di sini cuma dipakai buat
        // nandain tombol mana yang "aktif" di UI (lihat `activeTheme`
        // di bawah), BUKAN buat maksa ganti tema beneran.
        //
        // Tema beneran cuma berubah kalau user:
        // 1. Klik salah satu tombol Light/Dark/System di halaman ini, atau
        // 2. Klik tombol "Simpan perubahan"
      } catch (error) {
        console.error("GET PREFERENCES ERROR:", error);

        toast.error(
          error instanceof Error ? error.message : "Gagal memuat preferensi",
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadPreferences();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * ==========================================================
   * NOTIFICATION
   * ==========================================================
   */

  function updateNotification(
    key:
      | "budget_notification"
      | "transaction_notification"
      | "savings_notification"
      | "reminder_notification",
  ) {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  /*
   * ==========================================================
   * PRIVACY
   * ==========================================================
   */

  function updatePrivacy(key: "private_mode" | "hide_balance") {
    setPreferences((prev) => {
      const next = {
        ...prev,
        [key]: !prev[key],
      };

      /*
       * LANGSUNG update global state.
       *
       * Jadi saat toggle OFF:
       * saldo langsung muncul.
       *
       * Saat toggle ON:
       * saldo langsung disembunyikan.
       */
      setPreferenceState({
        private_mode: next.private_mode,
        hide_balance: next.hide_balance,
      });

      return next;
    });
  }

  /*
   * ==========================================================
   * THEME — cuma berubah kalau user KLIK LANGSUNG di sini
   * ==========================================================
   */

  function handleThemeChange(newTheme: "light" | "dark" | "system") {
    // Update UI lokal (state form).
    setPreferences((prev) => ({
      ...prev,
      theme: newTheme,
    }));

    // Update next-themes — ini aksi eksplisit dari klik user,
    // jadi aman untuk langsung ganti tema beneran.
    setTheme(newTheme);
  }

  /*
   * ==========================================================
   * SAVE
   * ==========================================================
   */

  async function handleSave() {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const token = getToken();

      if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL belum dikonfigurasi");
      }

      if (!token) {
        throw new Error("Sesi login tidak ditemukan.");
      }

      const response = await fetch(`${API_URL}/preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Gagal menyimpan preferensi",
        );
      }

      /*
       * Update global privacy state
       * setelah API sukses.
       */
      setPreferenceState({
        private_mode: preferences.private_mode,
        hide_balance: preferences.hide_balance,
      });

      /*
       * Ini aksi eksplisit (user klik Simpan),
       * jadi aman untuk pastikan tema browser
       * sesuai preferensi yang baru disimpan.
       */
      setTheme(preferences.theme);

      toast.success("Preferensi berhasil disimpan");

      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error("SAVE PREFERENCES ERROR:", error);

      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan preferensi",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <div className="h-8 w-40 animate-pulse rounded bg-muted" />

          <div className="mt-8 space-y-5">
            <Card className="h-48 animate-pulse bg-muted/30" />
            <Card className="h-64 animate-pulse bg-muted/30" />
            <Card className="h-48 animate-pulse bg-muted/30" />
          </div>
        </div>
      </div>
    );
  }

  /*
   * `activeTheme` di sini cuma menentukan tombol mana yang
   * kelihatan "aktif" di UI, berdasarkan `theme` yang beneran
   * dipakai next-themes sekarang (bukan hasil fetch API).
   */
  const activeTheme = theme === "system" ? "system" : theme;

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="border-b border-border/60 bg-background">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </button>

          <div>
            <h1 className="text-lg font-semibold tracking-tight">Preferensi</h1>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Atur tampilan dan pengalaman Money Tracker kamu.
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {/* ================================================= */}
        {/* TAMPILAN */}
        {/* ================================================= */}

        <Card className="overflow-hidden border-border/60 bg-background shadow-sm">
          <SectionHeader
            icon={Palette}
            title="Tampilan"
            description="Atur tampilan aplikasi sesuai kebutuhanmu."
          />

          <div className="px-5">
            <SettingRow
              icon={Monitor}
              title="Tema aplikasi"
              description="Pilih tampilan terang, gelap, atau mengikuti sistem."
            >
              <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    activeTheme === "light"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sun className="size-3.5" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    activeTheme === "dark"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Moon className="size-3.5" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("system")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    activeTheme === "system"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Monitor className="size-3.5" />
                  <span>System</span>
                </button>
              </div>
            </SettingRow>
          </div>
        </Card>

        {/* ================================================= */}
        {/* NOTIFIKASI */}
        {/* ================================================= */}

        <Card className="overflow-hidden border-border/60 bg-background shadow-sm">
          <SectionHeader
            icon={Bell}
            title="Notifikasi"
            description="Pilih notifikasi yang ingin kamu terima."
          />

          <div className="px-5">
            <SettingRow
              icon={Bell}
              title="Budget hampir habis"
              description="Beritahu saat penggunaan budget mencapai batas tertentu."
            >
              <Toggle
                checked={preferences.budget_notification}
                onChange={() => updateNotification("budget_notification")}
              />
            </SettingRow>

            <SettingRow
              icon={Bell}
              title="Transaksi berhasil"
              description="Tampilkan notifikasi setelah transaksi berhasil dicatat."
            >
              <Toggle
                checked={preferences.transaction_notification}
                onChange={() => updateNotification("transaction_notification")}
              />
            </SettingRow>

            <SettingRow
              icon={Bell}
              title="Target tabungan"
              description="Beritahu saat progres target tabungan mengalami perubahan."
            >
              <Toggle
                checked={preferences.savings_notification}
                onChange={() => updateNotification("savings_notification")}
              />
            </SettingRow>

            <SettingRow
              icon={Bell}
              title="Pengingat budget"
              description="Dapatkan pengingat untuk memantau budget bulanan."
            >
              <Toggle
                checked={preferences.reminder_notification}
                onChange={() => updateNotification("reminder_notification")}
              />
            </SettingRow>
          </div>
        </Card>

        {/* ================================================= */}
        {/* PRIVASI */}
        {/* ================================================= */}

        <Card className="overflow-hidden border-border/60 bg-background shadow-sm">
          <SectionHeader
            icon={Shield}
            title="Privasi"
            description="Atur bagaimana informasi keuangan ditampilkan."
          />

          <div className="px-5">
            <SettingRow
              icon={preferences.private_mode ? EyeOff : Eye}
              title="Mode privasi"
              description="Sembunyikan nominal keuangan saat sedang melihat dashboard."
            >
              <Toggle
                checked={preferences.private_mode}
                onChange={() => updatePrivacy("private_mode")}
              />
            </SettingRow>

            <SettingRow
              icon={preferences.hide_balance ? EyeOff : Eye}
              title="Sembunyikan saldo"
              description="Sembunyikan saldo wallet dari tampilan utama."
            >
              <Toggle
                checked={preferences.hide_balance}
                onChange={() => updatePrivacy("hide_balance")}
              />
            </SettingRow>
          </div>
        </Card>

        {/* SAVE */}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="mr-2 size-4" />

            {isSaving ? "Menyimpan..." : "Simpan perubahan"}
          </button>
        </div>
      </main>
    </div>
  );
}
