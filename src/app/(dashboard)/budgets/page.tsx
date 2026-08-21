"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  CalendarDays,
  WalletCards,
  TrendingDown,
  CircleDollarSign,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import BudgetForm from "@/components/budgets/BudgetForm";
import BudgetProgressBar from "@/components/budgets/BudgetProgressBar";

import {
  getBudgets,
  getBudgetSummary,
  createBudget,
  deleteBudget,
} from "@/services/budgetService";

import { getCategories } from "@/services/categoryService";

import { BudgetFormValues } from "@/lib/validators/budgetSchema";
import { BudgetWithSummary } from "@/types/budget";
import { Category } from "@/types/category";
import { formatCurrency } from "@/lib/format";

type BudgetPeriod = {
  key: string;
  month: number;
  year: number;
  budgets: BudgetWithSummary[];
};

const MONTH_NAMES = [
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

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadBudgets = async () => {
    try {
      setIsLoading(true);

      const [budgetList, summaryList] = await Promise.all([
        getBudgets(),
        getBudgetSummary(),
      ]);

      const merged: BudgetWithSummary[] = budgetList.map((budget) => {
        const summary = summaryList.find(
          (item) =>
            item.category_id === budget.category_id &&
            item.month === budget.month &&
            item.year === budget.year,
        );

        return {
          id: budget.id,
          category_id: budget.category_id,
          category_name: summary?.category_name ?? "-",
          amount_limit: budget.amount_limit,
          spent: summary?.spent ?? 0,
          remaining: summary?.remaining ?? budget.amount_limit,
          month: budget.month,
          year: budget.year,
        };
      });

      setBudgets(merged);
    } catch (error) {
      console.error("Error loading budget:", error);
      toast.error("Gagal memuat data budget.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBudgets();

    getCategories()
      .then((categoryResponse) => {
        const categoryArray = Array.isArray(categoryResponse)
          ? categoryResponse
          : [];

        setCategories(
          categoryArray.filter((category) => category.type === "expense"),
        );
      })
      .catch((error) => {
        console.error("Error loading categories:", error);
      });
  }, []);

  // =====================================================
  // CREATE
  // =====================================================

  const handleCreate = async (values: BudgetFormValues) => {
    try {
      setIsSubmitting(true);

      await createBudget(values);

      await loadBudgets();

      setOpen(false);

      toast.success("Budget berhasil dibuat.");
    } catch (error) {
      console.error("Error creating budget:", error);
      toast.error("Gagal membuat budget.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);

      await deleteBudget(id);

      await loadBudgets();

      toast.success("Budget berhasil dihapus.");
    } catch (error) {
      console.error("Error delete budget:", error);
      toast.error("Gagal menghapus budget.");
    } finally {
      setDeletingId(null);
    }
  };

  // =====================================================
  // GROUP BUDGET BY MONTH + YEAR
  // =====================================================

  const groupedPeriods = useMemo<BudgetPeriod[]>(() => {
    const groups = new Map<string, BudgetPeriod>();

    budgets.forEach((budget) => {
      const month = Number(budget.month);
      const year = Number(budget.year);

      const key = `${year}-${String(month).padStart(2, "0")}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          month,
          year,
          budgets: [],
        });
      }

      groups.get(key)!.budgets.push(budget);
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }

      return b.month - a.month;
    });
  }, [budgets]);

  // =====================================================
  // TOTAL KESELURUHAN
  // =====================================================

  const totalLimit = budgets.reduce(
    (total, item) => total + Number(item.amount_limit || 0),
    0,
  );

  const totalSpent = budgets.reduce(
    (total, item) => total + Number(item.spent || 0),
    0,
  );

  const totalRemaining = totalLimit - totalSpent;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget"
        description="Atur batas pengeluaran berdasarkan kategori dan periode."
      >
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Buat Budget
        </Button>
      </PageHeader>

      {/* =====================================================
          OVERALL SUMMARY
      ===================================================== */}

      {!isLoading && budgets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl border-border/60 bg-background p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>

                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {formatCurrency(totalLimit)}
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <WalletCards className="size-5 text-muted-foreground" />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-background p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sudah Terpakai</p>

                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {formatCurrency(totalSpent)}
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30">
                <TrendingDown className="size-5 text-red-500" />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-border/60 bg-background p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sisa Budget</p>

                <p
                  className={`mt-2 text-2xl font-semibold tracking-tight ${
                    totalRemaining < 0 ? "text-red-500" : "text-foreground"
                  }`}
                >
                  {formatCurrency(totalRemaining)}
                </p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <CircleDollarSign className="size-5 text-emerald-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {isLoading ? (
        <Card className="rounded-2xl p-10">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
              <WalletCards className="size-5 animate-pulse text-muted-foreground" />
            </div>

            <p className="text-sm font-medium">Memuat budget...</p>

            <p className="mt-1 text-xs text-muted-foreground">
              Mengambil data budget dari server.
            </p>
          </div>
        </Card>
      ) : budgets.length === 0 ? (
        /* =====================================================
           EMPTY STATE
        ===================================================== */

        <Card className="rounded-2xl border-dashed p-10">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted">
              <WalletCards className="size-6 text-muted-foreground" />
            </div>

            <h3 className="text-base font-semibold">Belum ada budget</h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Buat budget untuk mengontrol pengeluaran berdasarkan kategori dan
              periode.
            </p>

            <Button onClick={() => setOpen(true)} className="mt-5 gap-2">
              <Plus className="size-4" />
              Buat Budget
            </Button>
          </div>
        </Card>
      ) : (
        /* =====================================================
           BUDGET BY PERIOD
        ===================================================== */

        <div className="space-y-6">
          {groupedPeriods.map((period) => {
            const periodLimit = period.budgets.reduce(
              (total, item) => total + Number(item.amount_limit || 0),
              0,
            );

            const periodSpent = period.budgets.reduce(
              (total, item) => total + Number(item.spent || 0),
              0,
            );

            const periodRemaining = periodLimit - periodSpent;

            return (
              <section key={period.key} className="space-y-4">
                {/* PERIOD HEADER */}

                <Card className="overflow-hidden rounded-2xl border-border/60 bg-background shadow-sm">
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                        <CalendarDays className="size-5 text-emerald-600" />
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Periode Budget
                        </p>

                        <h2 className="mt-0.5 text-lg font-semibold">
                          {MONTH_NAMES[period.month - 1] ??
                            `Bulan ${period.month}`}{" "}
                          {period.year}
                        </h2>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs">
                        <span className="text-muted-foreground">
                          {period.budgets.length}
                        </span>{" "}
                        kategori
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Total Budget
                        </p>

                        <p className="text-sm font-semibold">
                          {formatCurrency(periodLimit)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PERIOD SUMMARY */}

                  <div className="grid grid-cols-1 divide-y border-t bg-muted/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground">Limit</p>

                      <p className="mt-1 text-sm font-semibold">
                        {formatCurrency(periodLimit)}
                      </p>
                    </div>

                    <div className="p-4">
                      <p className="text-xs text-muted-foreground">Terpakai</p>

                      <p className="mt-1 text-sm font-semibold">
                        {formatCurrency(periodSpent)}
                      </p>
                    </div>

                    <div className="p-4">
                      <p className="text-xs text-muted-foreground">Sisa</p>

                      <p
                        className={`mt-1 text-sm font-semibold ${
                          periodRemaining < 0
                            ? "text-red-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {formatCurrency(periodRemaining)}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* BUDGET LIST */}

                <Card className="overflow-hidden rounded-2xl border-border/60 p-0 shadow-sm">
                  <div className="divide-y">
                    {period.budgets.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-3 px-4 py-2 transition-colors hover:bg-muted/30 sm:px-5"
                      >
                        <div className="min-w-0 flex-1">
                          <BudgetProgressBar
                            categoryName={item.category_name}
                            limit={Number(item.amount_limit || 0)}
                            spent={Number(item.spent || 0)}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === item.id}
                          className="shrink-0 text-muted-foreground opacity-60 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/30"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>
            );
          })}
        </div>
      )}

      {/* =====================================================
          CREATE BUDGET DIALOG
      ===================================================== */}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Budget Baru</DialogTitle>
          </DialogHeader>

          <BudgetForm
            categories={categories}
            isSubmitting={isSubmitting}
            onSubmit={handleCreate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
