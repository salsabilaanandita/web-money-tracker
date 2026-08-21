"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet, Calendar, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  savingGoalSchema,
  SavingGoalFormValues,
} from "@/lib/validators/savingSchema";
import {
  formatCurrencyInput,
  parseCurrencyInput,
  toDateInputValue,
} from "@/lib/format";

export default function SavingGoalForm({
  defaultValues,
  submitLabel = "Tambah Target",
  isSubmitting = false,
  onSubmit,
}: {
  defaultValues?: Partial<SavingGoalFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: SavingGoalFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SavingGoalFormValues>({
    resolver: zodResolver(savingGoalSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      target_amount: defaultValues?.target_amount ?? undefined,
      target_date: defaultValues?.target_date
        ? toDateInputValue(defaultValues.target_date)
        : "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-zinc-100">
      {/* Header Info Banner */}
      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#14231d] border border-[#1b3d2f]">
        <div className="p-2.5 rounded-xl bg-[#1d4735] text-[#00e599] shrink-0">
          <Target className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-semibold text-white">Target Tabungan</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Tambahkan target finansial baru untuk membantu melacak impian kamu.
          </p>
        </div>
      </div>

      {/* Field: Nama Target */}
      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="flex items-center gap-2 text-sm font-semibold text-zinc-200"
        >
          <Wallet className="h-4 w-4 text-zinc-400" />
          Nama Target
        </Label>
        <Input
          id="name"
          placeholder="Contoh: BCA, GoPay, Dompet"
          className="h-12 bg-[#202422] border-emerald-600 focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-xl text-white placeholder:text-zinc-500 text-sm"
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      {/* Field: Target Nominal (Rata Kiri) */}
      <div className="space-y-2">
        <Label
          htmlFor="target_amount"
          className="flex items-center gap-2 text-sm font-semibold text-zinc-200"
        >
          <span className="text-xs font-bold text-zinc-400 leading-none">Rp</span>
          Target Nominal
        </Label>
        <div className="relative flex items-center">
          <span className="absolute left-4 text-sm font-medium text-zinc-400 pointer-events-none">
            Rp
          </span>
          <Input
            id="target_amount"
            type="text"
            inputMode="numeric"
            placeholder="0"
            defaultValue={
              defaultValues?.target_amount !== undefined &&
              defaultValues.target_amount !== null
                ? formatCurrencyInput(defaultValues.target_amount)
                : ""
            }
            className="pl-11 pr-4 h-12 bg-[#202422] border-transparent focus-visible:border-emerald-600 focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-xl text-white text-left font-bold text-base"
            {...register("target_amount", {
              setValueAs: (value) => parseCurrencyInput(value),
              onChange: (event) => {
                event.target.value = formatCurrencyInput(event.target.value);
              },
            })}
          />
        </div>
        {errors.target_amount ? (
          <p className="text-xs text-destructive">
            {errors.target_amount.message}
          </p>
        ) : (
          <p className="text-xs text-zinc-400">
            Target saldo yang ingin dicapai.
          </p>
        )}
      </div>

      {/* Field: Target Tanggal */}
      <div className="space-y-2">
        <Label
          htmlFor="target_date"
          className="flex items-center gap-2 text-sm font-semibold text-zinc-200"
        >
          <Calendar className="h-4 w-4 text-zinc-400" />
          Target Tanggal
        </Label>
        <Input
          id="target_date"
          type="date"
          className="h-12 bg-[#202422] border-transparent focus-visible:border-emerald-600 focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-xl text-white [color-scheme:dark] text-sm"
          {...register("target_date")}
        />
        {errors.target_date ? (
          <p className="text-xs text-destructive">
            {errors.target_date.message}
          </p>
        ) : null}
      </div>

      {/* Tombol Action Solid Green */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 mt-4 bg-[#00c978] hover:bg-[#00b36a] text-black font-semibold rounded-2xl text-sm transition-colors"
      >
        {isSubmitting ? "Menyimpan..." : submitLabel}
      </Button>
    </form>
  );
}