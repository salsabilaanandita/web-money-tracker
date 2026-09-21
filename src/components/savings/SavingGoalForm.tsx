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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Header Info Banner */}
      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-primary/[0.06] border border-primary/15">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Target className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-semibold text-foreground">Target Tabungan</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tambahkan target finansial baru untuk membantu melacak impian kamu.
          </p>
        </div>
      </div>

      {/* Field: Nama Target */}
      <div className="space-y-2">
        <Label
          htmlFor="name"
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <Wallet className="h-4 w-4 text-muted-foreground" />
          Nama Target
        </Label>
        <Input
          id="name"
          placeholder="Contoh: Beli Laptop, Liburan"
          className="h-11 bg-background border-border focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl text-foreground placeholder:text-muted-foreground text-sm"
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      {/* Field: Target Nominal */}
      <div className="space-y-2">
        <Label
          htmlFor="target_amount"
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <span className="text-xs font-bold text-muted-foreground leading-none">Rp</span>
          Target Nominal
        </Label>
        <div className="relative flex items-center">
          <span className="absolute left-4 text-sm font-medium text-muted-foreground pointer-events-none">
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
            className="pl-11 pr-4 h-11 bg-background border-border focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl text-foreground text-left font-bold text-base tabular-nums"
            {...register("target_amount", {
              setValueAs: (value) => parseCurrencyInput(value),
              onChange: (event) => {
                event.target.value = formatCurrencyInput(event.target.value);
              },
            })}
          />
        </div>
        {errors.target_amount ? (
          <p className="text-xs font-medium text-destructive">
            {errors.target_amount.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Target saldo yang ingin dicapai.
          </p>
        )}
      </div>

      {/* Field: Target Tanggal */}
      <div className="space-y-2">
        <Label
          htmlFor="target_date"
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Target Tanggal
        </Label>
        <Input
          id="target_date"
          type="date"
          className="h-11 bg-background border-border focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl text-foreground text-sm"
          {...register("target_date")}
        />
        {errors.target_date ? (
          <p className="text-xs font-medium text-destructive">
            {errors.target_date.message}
          </p>
        ) : null}
      </div>

      {/* Tombol Action */}
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