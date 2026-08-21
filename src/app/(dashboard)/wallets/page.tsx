"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Wallet as WalletIcon,
  Plus,
  RefreshCw,
  Search,
  CreditCard,
  ChevronRight,
} from "lucide-react";

import { toast } from "sonner";

import PageHeader from "@/components/layout/PageHeader";

import {
  Button,
} from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import WalletCard, {
  Wallet,
  WalletType,
} from "@/components/wallets/WalletCard";

import WalletForm from "@/components/wallets/WalletForm";

import { WalletFormValues } from "@/lib/validators/walletSchema";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const match = document.cookie.match(
      /(?:^|;\s*)token=([^;]*)(?:;|$)/
    );

    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }

    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [hideBalance, setHideBalance] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] =
    useState(false);

  const [editingWallet, setEditingWallet] =
    useState<Wallet | null>(null);

  const [deletingWallet, setDeletingWallet] =
    useState<Wallet | null>(null);

  const [search, setSearch] = useState("");

  const [activeFilter, setActiveFilter] = useState<
    "all" | WalletType
  >("all");

  /* =========================================================
     PRIVACY
  ========================================================= */

  const loadPrivacyPreference = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const saved = localStorage.getItem(
        "money-tracker-preferences"
      );

      if (saved) {
        const parsed = JSON.parse(saved);

        setHideBalance(
          Boolean(parsed?.hide_balance)
        );

        return;
      }

      const directValue =
        localStorage.getItem("hide_balance");

      if (directValue !== null) {
        setHideBalance(directValue === "true");
      }
    } catch (error) {
      console.error(
        "LOAD PRIVACY PREFERENCE ERROR:",
        error
      );
    }
  }, []);

  /* =========================================================
     GET WALLETS
  ========================================================= */

  const loadWallets = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!API_URL) {
        throw new Error(
          "NEXT_PUBLIC_API_URL belum dikonfigurasi"
        );
      }

      const token = getToken();

      if (!token) {
        throw new Error(
          "Sesi login tidak ditemukan. Silakan login kembali."
        );
      }

      const response = await fetch(
        `${API_URL}/wallets`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Gagal mengambil wallet"
        );
      }

      const result = data?.data ?? data;

      const walletList: Wallet[] = Array.isArray(result)
        ? result.filter(Boolean)
        : [];

      setWallets(walletList);
    } catch (error) {
      console.error(
        "GET WALLETS ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal mengambil wallet"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallets();
    loadPrivacyPreference();
  }, [
    loadWallets,
    loadPrivacyPreference,
  ]);

  /* =========================================================
     LISTEN PRIVACY CHANGES
  ========================================================= */

  useEffect(() => {
    const handleStorage = () => {
      loadPrivacyPreference();
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [loadPrivacyPreference]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredWallets = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return wallets.filter((wallet) => {
      const matchesSearch =
        !normalizedSearch ||
        wallet.name
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesType =
        activeFilter === "all" ||
        wallet.type === activeFilter;

      return (
        matchesSearch &&
        matchesType
      );
    });
  }, [
    wallets,
    search,
    activeFilter,
  ]);

  /* =========================================================
     ADD
  ========================================================= */

  const handleAdd = () => {
    setEditingWallet(null);
    setIsDialogOpen(true);
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const handleEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setIsDialogOpen(true);
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSave = async (
    values: WalletFormValues
  ) => {
    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      if (!API_URL) {
        throw new Error(
          "NEXT_PUBLIC_API_URL belum dikonfigurasi"
        );
      }

      const token = getToken();

      if (!token) {
        throw new Error(
          "Sesi login tidak ditemukan"
        );
      }

      const payload = {
        name: values.name.trim(),
        type: values.type,
        balance: Number(values.balance),
      };

      const isEdit = Boolean(editingWallet);

      const url = isEdit
        ? `${API_URL}/wallets/${editingWallet?.id}`
        : `${API_URL}/wallets`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEdit
              ? "Gagal mengubah wallet"
              : "Gagal menambahkan wallet")
        );
      }

      toast.success(
        isEdit
          ? "Wallet berhasil diubah"
          : "Wallet berhasil ditambahkan"
      );

      setIsDialogOpen(false);
      setEditingWallet(null);

      await loadWallets();
    } catch (error) {
      console.error(
        "SAVE WALLET ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan wallet"
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = (wallet: Wallet) => {
    setDeletingWallet(wallet);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingWallet) {
      return;
    }

    try {
      if (!API_URL) {
        throw new Error(
          "NEXT_PUBLIC_API_URL belum dikonfigurasi"
        );
      }

      const token = getToken();

      if (!token) {
        throw new Error(
          "Sesi login tidak ditemukan"
        );
      }

      const response = await fetch(
        `${API_URL}/wallets/${deletingWallet.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Gagal menghapus wallet"
        );
      }

      toast.success(
        "Wallet berhasil dihapus"
      );

      setIsDeleteDialogOpen(false);
      setDeletingWallet(null);

      await loadWallets();
    } catch (error) {
      console.error(
        "DELETE WALLET ERROR:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal menghapus wallet"
      );
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (isLoading) {
    return (
      <div className="w-full">
        <PageHeader
          title="Wallet"
          description="Kelola semua sumber keuanganmu."
        />

        <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-24 animate-pulse rounded-3xl bg-muted/50" />

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="
                    h-[250px]
                    animate-pulse
                    rounded-[22px]
                    border
                    border-border/60
                    bg-muted/40
                  "
                />
              )
            )}
          </div>
        </main>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="w-full">
      <PageHeader
        title="Wallet"
        description="Kelola semua sumber keuanganmu."
      />

      <main className="space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        {/* HERO */}
        <section
          className="
            relative
            overflow-hidden
            rounded-[28px]
            border
            border-border/70
            bg-card
            p-6
            shadow-sm
            sm:p-7
          "
        >
          <div
            className="
              relative
              z-10
              flex
              flex-col
              gap-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div className="max-w-xl">
              <div
                className="
                  mb-3
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-border/70
                  bg-muted/50
                  px-3
                  py-1.5
                "
              >
                <WalletIcon className="size-3.5 text-muted-foreground" />

                <span className="text-xs font-medium text-muted-foreground">
                  Financial wallets
                </span>
              </div>

              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Semua wallet kamu,
                <br />

                <span className="text-muted-foreground">
                  dalam satu tempat.
                </span>
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                Kelola rekening bank, e-wallet, dan
                uang cash dengan lebih rapi. Saldo akan
                mengikuti transaksi yang kamu catat.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={loadWallets}
                title="Refresh wallet"
                className="size-11 rounded-xl"
              >
                <RefreshCw className="size-4" />
              </Button>

              <Button
                type="button"
                onClick={handleAdd}
                className="h-11 rounded-xl px-5"
              >
                <Plus className="mr-2 size-4" />
                Tambah Wallet
              </Button>
            </div>
          </div>

          <div
            className="
              pointer-events-none
              absolute
              -right-16
              -top-20
              size-64
              rounded-full
              bg-primary/5
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-28
              right-24
              size-52
              rounded-full
              bg-muted
              blur-3xl
            "
          />
        </section>

        {/* TOOLBAR */}
        {wallets.length > 0 && (
          <section className="space-y-4">
            <div
              className="
                flex
                flex-col
                gap-4
                lg:flex-row
                lg:items-center
                lg:justify-between
              "
            >
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  Wallet kamu
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {wallets.length} wallet tersimpan
                </p>
              </div>

              <div className="relative w-full lg:w-[300px]">
                <Search
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    size-4
                    -translate-y-1/2
                    text-muted-foreground
                  "
                />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Cari wallet..."
                  className="
                    h-11
                    rounded-xl
                    pl-10
                    pr-4
                  "
                />
              </div>
            </div>

            {/* FILTER */}
            <div className="flex flex-wrap gap-2">
              {[
                {
                  value: "all" as const,
                  label: "Semua",
                },
                {
                  value: "bank" as const,
                  label: "Bank",
                },
                {
                  value: "e-wallet" as const,
                  label: "E-Wallet",
                },
                {
                  value: "cash" as const,
                  label: "Cash",
                },
              ].map((filter) => {
                const active =
                  activeFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() =>
                      setActiveFilter(filter.value)
                    }
                    className={`
                      rounded-full
                      border
                      px-4
                      py-2
                      text-xs
                      font-medium
                      transition-all
                      ${
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border/70 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* WALLET LIST */}
        {wallets.length === 0 ? (
          <div
            className="
              flex
              min-h-[390px]
              flex-col
              items-center
              justify-center
              rounded-[28px]
              border
              border-dashed
              border-border
              bg-card
              px-6
              text-center
            "
          >
            <div
              className="
                flex
                size-16
                items-center
                justify-center
                rounded-2xl
                border
                border-border
                bg-muted/40
                text-muted-foreground
              "
            >
              <WalletIcon className="size-7" />
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              Belum ada wallet
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Tambahkan rekening bank, e-wallet, atau
              cash untuk mulai mengelola saldo kamu.
            </p>

            <Button
              type="button"
              className="mt-6 rounded-xl"
              onClick={handleAdd}
            >
              <Plus className="mr-2 size-4" />
              Tambah Wallet
            </Button>
          </div>
        ) : filteredWallets.length === 0 ? (
          <div
            className="
              flex
              min-h-[280px]
              flex-col
              items-center
              justify-center
              rounded-[28px]
              border
              border-border/70
              bg-card
              px-6
              text-center
            "
          >
            <div
              className="
                flex
                size-14
                items-center
                justify-center
                rounded-2xl
                border
                border-border
                bg-muted/40
              "
            >
              <Search className="size-6 text-muted-foreground" />
            </div>

            <h3 className="mt-4 font-semibold">
              Wallet tidak ditemukan
            </h3>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Coba ubah kata pencarian atau filter.
            </p>

            <Button
              variant="ghost"
              className="mt-3"
              onClick={() => {
                setSearch("");
                setActiveFilter("all");
              }}
            >
              Reset filter
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredWallets.map((wallet) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                onEdit={handleEdit}
                onDelete={handleDelete}
                hideBalance={hideBalance}
              />
            ))}
          </div>
        )}

        {/* TIP */}
        {wallets.length > 0 && (
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              rounded-2xl
              border
              border-border/60
              bg-muted/30
              px-5
              py-4
            "
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="
                  flex
                  size-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-border/70
                  bg-background
                "
              >
                <CreditCard className="size-4 text-muted-foreground" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium">
                  Jaga saldo tetap terkontrol
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  Transaksi akan memengaruhi saldo wallet
                  terkait.
                </p>
              </div>
            </div>

            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </div>
        )}
      </main>

      {/* =====================================================
          ADD / EDIT DIALOG
      ===================================================== */}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);

          if (!open) {
            setEditingWallet(null);
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingWallet
                ? "Edit Wallet"
                : "Tambah Wallet"}
            </DialogTitle>
          </DialogHeader>

          <WalletForm
            key={editingWallet?.id ?? "new"}
            defaultValues={
              editingWallet
                ? {
                    name: editingWallet.name,
                    type: editingWallet.type,
                    balance: Number(
                      editingWallet.balance ?? 0
                    ),
                  }
                : {
                    name: "",
                    type: "cash",
                    balance: 0,
                  }
            }
            submitLabel={
              editingWallet
                ? "Simpan Perubahan"
                : "Tambah Wallet"
            }
            isSubmitting={isSaving}
            onSubmit={handleSave}
          />
        </DialogContent>
      </Dialog>

      {/* =====================================================
          DELETE DIALOG
      ===================================================== */}

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);

          if (!open) {
            setDeletingWallet(null);
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Hapus Wallet?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div
              className="
                rounded-xl
                border
                border-destructive/20
                bg-destructive/5
                p-4
              "
            >
              <p className="text-sm leading-6 text-muted-foreground">
                Kamu akan menghapus wallet{" "}
                <span className="font-semibold text-foreground">
                  {deletingWallet?.name}
                </span>
                . Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setIsDeleteDialogOpen(false)
                }
                className="rounded-xl"
              >
                Batal
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
                className="rounded-xl"
              >
                Hapus Wallet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}