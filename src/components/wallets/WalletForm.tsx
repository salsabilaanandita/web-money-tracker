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
      className="space-y-5 text-zinc-100"
    >
      {/* HEADER INFO BANNER */}
      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#14231d] border border-[#1b3d2f]">
        <div className="p-2.5 rounded-xl bg-[#1d4735] text-[#00e599] shrink-0">
          <WalletIcon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-semibold text-white">Tambah Wallet</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Tambahkan wallet untuk menyimpan saldo kamu.
          </p>
        </div>
      </div>

      {/* NAMA WALLET */}
      <div className="space-y-2">
        <Label
          htmlFor="wallet-name"
          className="flex items-center gap-2 text-sm font-semibold text-zinc-200"
        >
          <WalletIcon className="h-4 w-4 text-zinc-400" />
          Nama Wallet
        </Label>

        <Input
          id="wallet-name"
          placeholder="Contoh: BCA, GoPay, Dompet"
          autoComplete="off"
          disabled={isSubmitting}
          {...register("name")}
          className="h-12 bg-[#202422] border-emerald-600 focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-xl text-white placeholder:text-zinc-500 text-sm"
        />

        {errors.name && (
          <p className="text-xs text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* JENIS WALLET */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <CircleDollarSign className="h-4 w-4 text-zinc-400" />
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
            className="h-14 bg-[#202422] border-transparent focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white text-sm"
          >
            <SelectValue placeholder="Pilih jenis wallet" />
          </SelectTrigger>

          <SelectContent className="rounded-xl bg-[#1a1d1b] border-zinc-800 text-white">
            {walletTypes.map((wallet) => {
              const Icon = wallet.icon;

              return (
                <SelectItem
                  key={wallet.value}
                  value={wallet.value}
                  className="rounded-lg py-2.5 focus:bg-emerald-950/40 focus:text-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-300">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium">
                        {wallet.label}
                      </span>
                      <span className="text-xs text-zinc-400">
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
          <p className="text-xs text-destructive">
            {errors.type.message}
          </p>
        )}
      </div>

      {/* SALDO AWAL (RATA KIRI) */}
      <div className="space-y-2">
        <Label
          htmlFor="wallet-balance"
          className="flex items-center gap-2 text-sm font-semibold text-zinc-200"
        >
          <span className="text-xs font-bold text-zinc-400 leading-none">
            Rp
          </span>
          Saldo Awal
        </Label>

        <div className="relative flex items-center">
          <span className="absolute left-4 text-sm font-medium text-zinc-400 pointer-events-none">
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
            className="pl-11 pr-4 h-12 bg-[#202422] border-transparent focus-visible:border-emerald-600 focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-xl text-white text-left font-bold text-base tabular-nums"
          />
        </div>

        {errors.balance ? (
          <p className="text-xs text-destructive">
            {errors.balance.message}
          </p>
        ) : (
          <p className="text-xs text-zinc-400">
            Saldo yang tersedia saat wallet dibuat.
          </p>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 mt-4 bg-[#00c978] hover:bg-[#00b36a] text-black font-semibold rounded-2xl text-sm transition-colors"
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