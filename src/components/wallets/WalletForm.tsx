"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Landmark,
  Smartphone,
  Banknote,
  Wallet as WalletIcon,
  CircleDollarSign,
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
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/format";

import {
  walletSchema,
  WalletFormValues,
} from "@/lib/validators/walletSchema";

const walletTypes = [
  {
    value: "bank",
    label: "Bank",
    description: "Rekening bank",
    icon: Landmark,
  },
  {
    value: "cash",
    label: "Cash",
    description: "Uang tunai",
    icon: Banknote,
  },
  {
    value: "e-wallet",
    label: "E-Wallet",
    description: "Dompet digital",
    icon: Smartphone,
  },
] as const;

type WalletFormProps = {
  defaultValues?: Partial<WalletFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: WalletFormValues) => void;
};

export default function WalletForm({
  defaultValues,
  submitLabel = "Tambah Wallet",
  isSubmitting = false,
  onSubmit,
}: WalletFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "cash",
      balance: defaultValues?.balance ?? 0,
    },
  });

  const selectedType = watch("type");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {/* HEADER INFO BANNER */}
      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-primary/[0.06] border border-primary/15">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <WalletIcon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-semibold text-foreground">
            {submitLabel.includes("Simpan") ? "Edit Wallet" : "Tambah Wallet"}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tambahkan wallet untuk menyimpan saldo dan mencatat transaksi kamu.
          </p>
        </div>
      </div>

      {/* NAMA WALLET */}
      <div className="space-y-2">
        <Label
          htmlFor="wallet-name"
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <WalletIcon className="h-4 w-4 text-muted-foreground" />
          Nama Wallet
        </Label>

        <Input
          id="wallet-name"
          placeholder="Contoh: BCA, GoPay, Dompet"
          autoComplete="off"
          disabled={isSubmitting}
          {...register("name")}
          className="h-11 bg-background border-border focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl text-foreground placeholder:text-muted-foreground text-sm"
        />

        {errors.name && (
          <p className="text-xs font-medium text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* JENIS WALLET */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          Jenis Wallet
        </Label>

        <Select
          value={selectedType}
          disabled={isSubmitting}
          onValueChange={(value) => {
            setValue(
              "type",
              value as WalletFormValues["type"],
              {
                shouldValidate: true,
                shouldDirty: true,
              }
            );
          }}
        >
          <SelectTrigger
            className="h-12 bg-background border-border focus:ring-2 focus:ring-primary/20 rounded-xl text-foreground text-sm"
          >
            <SelectValue placeholder="Pilih jenis wallet" />
          </SelectTrigger>

          <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
            {walletTypes.map((wallet) => {
              const Icon = wallet.icon;

              return (
                <SelectItem
                  key={wallet.value}
                  value={wallet.value}
                  className="rounded-lg py-2.5 cursor-pointer focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium text-foreground">
                        {wallet.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {wallet.description}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {errors.type && (
          <p className="text-xs font-medium text-destructive">
            {errors.type.message}
          </p>
        )}
      </div>

      {/* SALDO AWAL */}
      <div className="space-y-2">
        <Label
          htmlFor="wallet-balance"
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <span className="text-xs font-bold text-muted-foreground leading-none">
            Rp
          </span>
          Saldo Awal
        </Label>

        <div className="relative flex items-center">
          <span className="absolute left-4 text-sm font-medium text-muted-foreground pointer-events-none">
            Rp
          </span>

          <Input
            id="wallet-balance"
            type="text"
            inputMode="numeric"
            placeholder="0"
            disabled={isSubmitting}
            defaultValue={
              defaultValues?.balance !== undefined &&
              defaultValues.balance !== null
                ? formatCurrencyInput(defaultValues.balance)
                : ""
            }
            {...register("balance", {
              setValueAs: (value) =>
                parseCurrencyInput(value),

              onChange: (event) => {
                event.target.value =
                  formatCurrencyInput(event.target.value);
              },
            })}
            className="pl-11 pr-4 h-11 bg-background border-border focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl text-foreground text-left font-bold text-base tabular-nums"
          />
        </div>

        {errors.balance ? (
          <p className="text-xs font-medium text-destructive">
            {errors.balance.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Saldo yang tersedia saat wallet dibuat.
          </p>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 mt-2 font-semibold rounded-xl text-sm shadow-sm transition-all"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Menyimpan...
          </span>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}