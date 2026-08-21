"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  WalletCards,
  Tag,
  FileText,
  CircleAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  transactionSchema,
  TransactionFormValues,
} from "@/lib/validators/transactionSchema";

import { Wallet } from "@/types/wallet";
import { Category } from "@/types/category";
import { TransactionType } from "@/types/transaction";

import {
  formatCurrencyInput,
  parseCurrencyInput,
  toDateInputValue,
} from "@/lib/format";

import { toast } from "sonner";

export default function TransactionForm({
  type,
  wallets,
  categories,
  defaultValues,
  submitLabel = "Simpan",
  isSubmitting = false,
  onSubmit,
}: {
  type: TransactionType;
  wallets: Wallet[];
  categories: Category[];
  defaultValues?: Partial<TransactionFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: TransactionFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type,
      wallet_id: defaultValues?.wallet_id ?? "",
      category_id: defaultValues?.category_id ?? "",
      amount: defaultValues?.amount ?? undefined,
      description: defaultValues?.description ?? "",
      date: defaultValues?.date
        ? toDateInputValue(defaultValues.date)
        : toDateInputValue(new Date()),
    },
  });

  const walletId = watch("wallet_id");
  const categoryId = watch("category_id");
  const amount = watch("amount");

  const selectedWallet = wallets.find((wallet) => wallet.id === walletId);

  const isExpense = type === "expense";

  const transactionAmount = Number(amount) || 0;
  const walletBalance = Number(selectedWallet?.balance) || 0;

  const insufficientBalance =
    isExpense && selectedWallet && transactionAmount > walletBalance;

  useEffect(() => {
    console.log("========== TRANSACTION FORM ==========");
    console.log("TYPE:", type);
    console.log("WALLETS:", wallets);
    console.log("WALLETS LENGTH:", wallets?.length);
    console.log("CATEGORIES:", categories);
    console.log("CATEGORIES LENGTH:", categories?.length);
    console.log("SELECTED WALLET ID:", walletId);
    console.log("AMOUNT:", amount);
    console.log("======================================");
  }, [type, wallets, categories, walletId, amount]);

  const handleFormSubmit = (values: TransactionFormValues) => {
    // Income tidak membutuhkan pengecekan saldo
    if (type !== "expense") {
      onSubmit(values);
      return;
    }

    const wallet = wallets.find((item) => item.id === values.wallet_id);

    if (!wallet) {
      toast.error("Wallet belum dipilih", {
        description: "Silakan pilih wallet terlebih dahulu.",
      });

      return;
    }

    const transactionAmount = Number(values.amount) || 0;
    const walletBalance = Number(wallet.balance) || 0;

    // Cek saldo
    if (transactionAmount > walletBalance) {
      toast.error("Saldo tidak mencukupi", {
        description:
          `${wallet.name} hanya memiliki saldo ` +
          `${formatCurrency(walletBalance)}, ` +
          `sedangkan transaksi sebesar ` +
          `${formatCurrency(transactionAmount)}.`,
      });

      return;
    }

    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* =====================================================
          HEADER TRANSAKSI
      ====================================================== */}

      <div
        className={`relative overflow-hidden rounded-2xl border p-5 ${
          isExpense
            ? "bg-red-500/[0.04] border-red-500/10"
            : "bg-emerald-500/[0.04] border-emerald-500/10"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              isExpense
                ? "bg-red-500/10 text-red-500"
                : "bg-emerald-500/10 text-emerald-500"
            }`}
          >
            {isExpense ? (
              <ArrowDownCircle className="h-6 w-6" />
            ) : (
              <ArrowUpCircle className="h-6 w-6" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">
              {isExpense ? "Tambah Pengeluaran" : "Tambah Pemasukan"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {isExpense
                ? "Catat uang yang kamu keluarkan."
                : "Catat uang yang kamu terima."}
            </p>
          </div>
        </div>
      </div>

      {/* Hidden type */}
      <input type="hidden" {...register("type")} value={type} />

      {/* =====================================================
          DESKRIPSI
      ====================================================== */}

      <div className="space-y-2.5">
        <Label
          htmlFor="description"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <FileText className="h-4 w-4 text-muted-foreground" />
          Deskripsi
        </Label>

        <Input
          id="description"
          placeholder={
            isExpense
              ? "Contoh: Makan siang di warteg"
              : "Contoh: Gaji bulan Agustus"
          }
          className="h-11 rounded-xl bg-background"
          {...register("description")}
        />

        {errors.description && (
          <p className="text-xs font-medium text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* =====================================================
          NOMINAL
      ====================================================== */}

      <div className="space-y-2.5">
        <Label
          htmlFor="amount"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[9px] font-bold">
            Rp
          </span>
          Nominal
        </Label>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
            Rp
          </span>

          <Input
            id="amount"
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="h-12 rounded-xl pl-12 text-base font-semibold"
            defaultValue={
              defaultValues?.amount !== undefined &&
              defaultValues.amount !== null
                ? formatCurrencyInput(defaultValues.amount)
                : ""
            }
            {...register("amount", {
              setValueAs: (value) => parseCurrencyInput(value),

              onChange: (event) => {
                event.target.value = formatCurrencyInput(event.target.value);
              },
            })}
          />
        </div>

        {errors.amount && (
          <p className="text-xs font-medium text-destructive">
            {errors.amount.message}
          </p>
        )}

        {/* ===================================================
            INFO SALDO WALLET
        ==================================================== */}

        {isExpense && selectedWallet && (
          <div
            className={`rounded-xl border px-4 py-3 transition-colors ${
              insufficientBalance
                ? "border-destructive/20 bg-destructive/[0.05]"
                : "border-border bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WalletCards className="h-4 w-4 text-muted-foreground" />

                <span className="text-xs text-muted-foreground">
                  Saldo {selectedWallet.name}
                </span>
              </div>

              <span className="text-sm font-semibold">
                {formatCurrency(walletBalance)}
              </span>
            </div>

            {insufficientBalance && (
              <div className="mt-2 flex items-start gap-2 text-destructive">
                <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                <p className="text-xs font-medium">
                  Saldo tidak mencukupi untuk transaksi ini.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          WALLET + CATEGORY
      ====================================================== */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* WALLET */}

        <div className="space-y-2.5">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <WalletCards className="h-4 w-4 text-muted-foreground" />
            Wallet
          </Label>

          <Select
            value={walletId}
            onValueChange={(value) => {
              setValue("wallet_id", value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Pilih wallet" />
            </SelectTrigger>

            <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-0">
              {wallets && wallets.length > 0 ? (
                wallets.map((wallet) => (
                  <SelectItem
                    key={wallet.id}
                    value={wallet.id}
                    className="pr-3"
                  >
                    {wallet.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Belum ada wallet
                </div>
              )}
            </SelectContent>
          </Select>

          {errors.wallet_id && (
            <p className="text-xs font-medium text-destructive">
              {errors.wallet_id.message}
            </p>
          )}
        </div>

        {/* CATEGORY */}

        <div className="space-y-2.5">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Kategori
          </Label>

          <Select
            value={categoryId}
            onValueChange={(value) => {
              setValue("category_id", value, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>

            <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-0">
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}
                    className="pr-3"
                  >
                    {category.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Belum ada kategori
                </div>
              )}
            </SelectContent>
          </Select>

          {errors.category_id && (
            <p className="text-xs font-medium text-destructive">
              {errors.category_id.message}
            </p>
          )}
        </div>
      </div>

      {/* =====================================================
          TANGGAL
      ====================================================== */}

      <div className="space-y-2.5">
        <Label
          htmlFor="date"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Tanggal
        </Label>

        <Input
          id="date"
          type="date"
          className="h-11 rounded-xl"
          {...register("date")}
        />

        {errors.date && (
          <p className="text-xs font-medium text-destructive">
            {errors.date.message}
          </p>
        )}
      </div>

      {/* =====================================================
          SUMMARY
      ====================================================== */}

      {selectedWallet && transactionAmount > 0 && (
        <div className="rounded-2xl border bg-muted/20 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ringkasan
          </p>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Transaksi</span>

              <span className="text-sm font-semibold">
                {formatCurrency(transactionAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Wallet</span>

              <span className="max-w-[55%] truncate text-sm font-medium">
                {selectedWallet.name}
              </span>
            </div>

            {isExpense && (
              <>
                <div className="my-2 border-t" />

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">
                    Sisa saldo
                  </span>

                  <span
                    className={`text-sm font-bold ${
                      insufficientBalance
                        ? "text-destructive"
                        : "text-foreground"
                    }`}
                  >
                    {formatCurrency(walletBalance - transactionAmount)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          SUBMIT
      ====================================================== */}

      <Button
        type="submit"
        className={`h-11 w-full rounded-xl font-semibold shadow-sm transition-all ${
          isExpense
            ? "bg-red-500 hover:bg-red-600"
            : "bg-emerald-500 hover:bg-emerald-600"
        }`}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Menyimpan..." : submitLabel}
      </Button>
    </form>
  );
}

/* ============================================================
   FORMAT CURRENCY
============================================================ */

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}
