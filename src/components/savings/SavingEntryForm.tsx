"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  savingEntrySchema,
  SavingEntryFormValues,
} from "@/lib/validators/savingSchema";
import {
  formatCurrencyInput,
  parseCurrencyInput,
  toDateInputValue,
} from "@/lib/format";

export default function SavingEntryForm({
  isSubmitting = false,
  onSubmit,
}: {
  isSubmitting?: boolean;
  onSubmit: (values: SavingEntryFormValues) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SavingEntryFormValues>({
    resolver: zodResolver(savingEntrySchema),
    defaultValues: { amount: undefined, date: toDateInputValue(new Date()) },
  });

  const submit = handleSubmit((values) => {
    onSubmit(values);
    reset({ amount: undefined, date: toDateInputValue(new Date()) });
  });

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Field Setoran */}
      <div className="space-y-2">
        <Label htmlFor="entry_amount" className="flex items-center gap-2 text-sm font-medium text-white">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          Nominal Setoran
        </Label>
        
        <div className="relative flex items-center">
          <span className="absolute left-3 text-sm font-medium text-muted-foreground">
            Rp
          </span>
          <Input
            id="entry_amount"
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="pl-9 pr-3 py-6 bg-[#1f2220] border-zinc-800 focus-visible:ring-emerald-500 rounded-xl text-white text-right font-semibold"
            {...register("amount", {
              setValueAs: (value) => parseCurrencyInput(value),
              onChange: (event) => {
                event.target.value = formatCurrencyInput(event.target.value);
              },
            })}
          />
        </div>
        {errors.amount ? (
          <p className="text-xs text-destructive">{errors.amount.message}</p>
        ) : (
          <p className="text-xs text-zinc-400">
            Nominal yang akan ditambahkan ke tabungan kamu.
          </p>
        )}
      </div>

      {/* Field Tanggal */}
      <div className="space-y-2">
        <Label htmlFor="entry_date" className="flex items-center gap-2 text-sm font-medium text-white">
          <Calendar className="h-4 w-4 text-emerald-400" />
          Tanggal
        </Label>
        <Input
          id="entry_date"
          type="date"
          className="h-12 bg-[#1f2220] border-zinc-800 focus-visible:ring-emerald-500 rounded-xl text-white [color-scheme:dark]"
          {...register("date")}
        />
        {errors.date ? (
          <p className="text-xs text-destructive">{errors.date.message}</p>
        ) : null}
      </div>

      {/* Tombol Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 mt-2 bg-[#00c985] hover:bg-[#00b074] text-black font-semibold rounded-xl text-base transition-colors"
      >
        {isSubmitting ? "Menyimpan..." : "Setor Sekarang"}
      </Button>
    </form>
  );
}