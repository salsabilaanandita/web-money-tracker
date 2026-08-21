"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Tags,
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
  budgetSchema,
  BudgetFormValues,
} from "@/lib/validators/budgetSchema";

import { Category } from "@/types/category";
import {
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/format";

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function BudgetForm({
  categories,
  defaultValues,
  submitLabel = "Simpan",
  isSubmitting = false,
  onSubmit,
}: {
  categories: Category[];
  defaultValues?: Partial<BudgetFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (values: BudgetFormValues) => void;
}) {
  const now = new Date();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),

    defaultValues: {
      category_id: defaultValues?.category_id ?? "",
      amount_limit: defaultValues?.amount_limit ?? undefined,
      month: defaultValues?.month ?? now.getMonth() + 1,
      year: defaultValues?.year ?? now.getFullYear(),
    },
  });

  const categoryId = watch("category_id");
  const month = watch("month");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      {/* ============================= */}
      {/* FORM HEADER */}
      {/* ============================= */}

      <div className="rounded-2xl border bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <CircleDollarSign className="size-5 text-primary" />
          </div>

          <div>
            <h3 className="text-sm font-semibold">
              Atur Budget Pengeluaran
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Tentukan batas pengeluaran untuk kategori dan periode tertentu.
            </p>
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* CATEGORY */}
      {/* ============================= */}

      <div className="space-y-2.5">
        <Label
          htmlFor="category"
          className="text-sm font-medium"
        >
          Kategori
        </Label>

        <Select
          value={categoryId}
          onValueChange={(value) =>
            setValue("category_id", value, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger
            id="category"
            className="h-12 rounded-xl border-border/70 bg-background px-4 shadow-sm transition-all hover:border-primary/40 focus:ring-2 focus:ring-primary/20"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-7 items-center justify-center rounded-lg bg-muted">
                <Tags className="size-4 text-muted-foreground" />
              </div>

              <SelectValue placeholder="Pilih kategori pengeluaran" />
            </div>
          </SelectTrigger>

          <SelectContent className="rounded-xl">
            {categories && categories.length > 0 ? (
              categories.map((category) => (
                <SelectItem
                  key={category.id}
                  value={category.id}
                  className="rounded-lg py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span>{category.name}</span>

                    {categoryId === category.id && (
                      <Check className="ml-auto size-4 text-primary" />
                    )}
                  </div>
                </SelectItem>
              ))
            ) : (
              <SelectItem
                value="no-category"
                disabled
              >
                Tidak ada kategori
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {errors.category_id && (
          <p className="flex items-center gap-1 text-xs font-medium text-destructive">
            {errors.category_id.message}
          </p>
        )}
      </div>

      {/* ============================= */}
      {/* AMOUNT */}
      {/* ============================= */}

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="amount_limit"
            className="text-sm font-medium"
          >
            Limit Bulanan
          </Label>

          <span className="text-[11px] font-medium text-muted-foreground">
            Dalam Rupiah
          </span>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <span className="text-sm font-semibold text-muted-foreground">
              Rp
            </span>
          </div>

          <Input
            id="amount_limit"
            type="text"
            inputMode="numeric"
            placeholder="0"
            className="h-14 rounded-xl border-border/70 bg-background pl-12 pr-4 text-lg font-semibold tabular-nums shadow-sm transition-all placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            defaultValue={
              defaultValues?.amount_limit !== undefined &&
              defaultValues.amount_limit !== null
                ? formatCurrencyInput(defaultValues.amount_limit)
                : ""
            }
            {...register("amount_limit", {
              setValueAs: (value) => parseCurrencyInput(value),

              onChange: (event) => {
                event.target.value = formatCurrencyInput(
                  event.target.value,
                );
              },
            })}
          />
        </div>

        <p className="text-[11px] text-muted-foreground">
          Contoh: 1.500.000 untuk limit Rp1,5 juta.
        </p>

        {errors.amount_limit && (
          <p className="text-xs font-medium text-destructive">
            {errors.amount_limit.message}
          </p>
        )}
      </div>

      {/* ============================= */}
      {/* PERIOD */}
      {/* ============================= */}

      <div className="rounded-2xl border bg-muted/20 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
            <CalendarDays className="size-4.5 text-primary" />
          </div>

          <div>
            <p className="text-sm font-semibold">
              Periode Budget
            </p>

            <p className="text-xs text-muted-foreground">
              Tentukan bulan dan tahun budget.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* MONTH */}

          <div className="space-y-2">
            <Label
              htmlFor="month"
              className="text-xs font-medium text-muted-foreground"
            >
              Bulan
            </Label>

            <Select
              value={String(month)}
              onValueChange={(value) =>
                setValue("month", Number(value), {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger
                id="month"
                className="h-11 rounded-xl bg-background shadow-sm"
              >
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>

              <SelectContent className="rounded-xl">
                {monthNames.map((monthName, index) => (
                  <SelectItem
                    key={monthName}
                    value={String(index + 1)}
                    className="rounded-lg"
                  >
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.month && (
              <p className="text-xs font-medium text-destructive">
                {errors.month.message}
              </p>
            )}
          </div>

          {/* YEAR */}

          <div className="space-y-2">
            <Label
              htmlFor="year"
              className="text-xs font-medium text-muted-foreground"
            >
              Tahun
            </Label>

            <Input
              id="year"
              type="number"
              min={2000}
              max={2100}
              className="h-11 rounded-xl bg-background shadow-sm"
              {...register("year", {
                valueAsNumber: true,
              })}
            />

            {errors.year && (
              <p className="text-xs font-medium text-destructive">
                {errors.year.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* SUMMARY */}
      {/* ============================= */}

      {categoryId && (
        <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Check className="size-4 text-primary" />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Budget siap disimpan
              </p>

              <p className="mt-0.5 text-sm font-semibold">
                {categories.find(
                  (category) => category.id === categoryId,
                )?.name ?? "Kategori terpilih"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================= */}
      {/* SUBMIT */}
      {/* ============================= */}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
      >
        {isSubmitting ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Menyimpan...
          </>
        ) : (
          <>
            <Check className="size-4" />
            {submitLabel}
          </>
        )}
      </Button>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        Budget ini akan digunakan untuk memantau batas pengeluaran
        berdasarkan kategori dan periode yang dipilih.
      </p>
    </form>
  );
}