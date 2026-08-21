"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Pencil,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import SavingGoalForm from "@/components/savings/SavingGoalForm";
import SavingEntryForm from "@/components/savings/SavingEntryForm";

import DeleteConfirmModal from "@/components/transactions/DeleteConfirmModal";

import {
  getSavingGoalById,
  updateSavingGoal,
  deleteSavingGoal,
  getSavingEntries,
  addSavingEntry,
} from "@/services/savingService";

import {
  SavingGoalFormValues,
  SavingEntryFormValues,
} from "@/lib/validators/savingSchema";

import { SavingGoal, SavingEntry } from "@/types/saving";

import { formatCurrency, formatDate } from "@/lib/format";

export default function SavingGoalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [goal, setGoal] = useState<SavingGoal | null>(null);

  const [entries, setEntries] = useState<SavingEntry[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);

  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // =====================================================
  // LOAD DATA
  // =====================================================

  const load = useCallback(async () => {
    setIsLoading(true);

    try {
      const [goalRes, entriesRes] = await Promise.all([
        getSavingGoalById(params.id),
        getSavingEntries(params.id),
      ]);

      setGoal(goalRes);

      setEntries(Array.isArray(entriesRes) ? entriesRes : []);
    } catch (error) {
      console.error(error);

      toast.error("Gagal memuat target tabungan.");
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // =====================================================
  // UPDATE GOAL
  // =====================================================

  const handleUpdateGoal = async (values: SavingGoalFormValues) => {
    if (!goal) return;

    setIsSubmittingGoal(true);

    try {
      await updateSavingGoal(goal.id, values);

      toast.success("Target tabungan diperbarui.");

      await load();
    } catch (error) {
      console.error(error);

      toast.error("Gagal memperbarui target.");
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  // =====================================================
  // ADD ENTRY
  // =====================================================

  const handleAddEntry = async (values: SavingEntryFormValues) => {
    if (!goal) return;

    setIsSubmittingEntry(true);

    try {
      await addSavingEntry(goal.id, values);

      toast.success("Setoran berhasil dicatat.");

      await load();
    } catch (error) {
      console.error(error);

      toast.error("Gagal mencatat setoran.");
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async () => {
    if (!goal) return;

    setIsDeleting(true);

    try {
      await deleteSavingGoal(goal.id);

      toast.success("Target tabungan dihapus.");

      router.push("/savings");
    } catch (error) {
      console.error(error);

      toast.error("Gagal menghapus target.");
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />

        <div className="h-52 animate-pulse rounded-3xl bg-muted" />

        <div className="grid gap-5 md:grid-cols-2">
          <div className="h-72 animate-pulse rounded-3xl bg-muted" />
          <div className="h-72 animate-pulse rounded-3xl bg-muted" />
        </div>
      </div>
    );
  }

  // =====================================================
  // NOT FOUND
  // =====================================================

  if (!goal) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
          <PiggyBank className="size-6 text-muted-foreground" />
        </div>

        <h2 className="mt-4 text-lg font-semibold">
          Target tabungan tidak ditemukan
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Target yang kamu cari mungkin sudah dihapus.
        </p>

        <Button
          variant="outline"
          className="mt-5 gap-2 rounded-xl"
          onClick={() => router.push("/savings")}
        >
          <ArrowLeft className="size-4" />
          Kembali ke Tabungan
        </Button>
      </div>
    );
  }

  // =====================================================
  // CALCULATION
  // =====================================================

  const targetAmount = Number(goal.target_amount ?? 0);

  const currentAmount = Number(goal.current_amount ?? 0);

  const percentage =
    targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;

  const remaining = Math.max(targetAmount - currentAmount, 0);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-6 pb-10">
      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        title={goal.name}
        description={`Jatuh tempo ${formatDate(goal.target_date)}`}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={() => router.push("/savings")}
          >
            <ArrowLeft className="size-4" />
            Kembali
          </Button>

          <Button
            variant="destructive"
            className="gap-2 rounded-xl"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-4" />
            Hapus
          </Button>
        </div>
      </PageHeader>

      {/* =================================================
          MAIN PROGRESS CARD
      ================================================= */}

      <Card className="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
        {/* Decorative background */}

        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/[0.04]" />

        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-48 rounded-full bg-primary/[0.025]" />

        <div className="relative p-6 sm:p-8">
          {/* TOP */}

          <div className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Target className="size-6 text-primary" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Target Tabungan
                </p>

                <h2 className="mt-1 truncate text-xl font-bold tracking-tight">
                  {goal.name}
                </h2>

                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" />

                  <span>Jatuh tempo {formatDate(goal.target_date)}</span>
                </div>
              </div>
            </div>

            {/* PERCENTAGE */}

            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">Progress</p>

              <p className="mt-1 text-2xl font-bold text-primary">
                {Math.round(percentage)}%
              </p>
            </div>
          </div>

          {/* AMOUNT */}

          <div className="mt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sudah terkumpul</p>

                <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
                  {formatCurrency(currentAmount)}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                dari{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(targetAmount)}
                </span>
              </p>
            </div>

            <Progress value={percentage} className="mt-5 h-3" />

            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(percentage)}%</span>

              <span>Target 100%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<TrendingUp className="size-4" />}
          label="Terkumpul"
          value={formatCurrency(currentAmount)}
        />

        <SummaryCard
          icon={<Target className="size-4" />}
          label="Masih Dibutuhkan"
          value={formatCurrency(remaining)}
        />

        <SummaryCard
          icon={<Plus className="size-4" />}
          label="Total Setoran"
          value={`${entries.length} setoran`}
        />
      </div>

      {/* =================================================
          HISTORY + ADD ENTRY
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* =================================================
            HISTORY
        ================================================= */}

        <Card className="overflow-hidden rounded-3xl border p-0 shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h3 className="font-semibold">Histori Setoran</h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Riwayat uang yang sudah kamu tabungkan.
              </p>
            </div>

            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <TrendingUp className="size-4 text-primary" />
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                <PiggyBank className="size-5 text-muted-foreground" />
              </div>

              <p className="mt-4 text-sm font-medium">Belum ada setoran</p>

              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Setoran yang kamu tambahkan akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 border-b px-6 py-4 transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle2 className="size-4 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      Setoran {entries.length - index}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(entry.date)}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-primary tabular-nums">
                    +{formatCurrency(entry.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* =================================================
            ADD ENTRY
        ================================================= */}

        <Card className="rounded-3xl border p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Plus className="size-5 text-primary" />
            </div>

            <div>
              <h3 className="font-semibold">Tambah Setoran</h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Catat uang yang baru kamu masukkan ke target ini.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/20 p-4">
            <SavingEntryForm
              isSubmitting={isSubmittingEntry}
              onSubmit={handleAddEntry}
            />
          </div>
        </Card>
      </div>

      {/* =================================================
          EDIT TARGET
      ================================================= */}

      <Card className="overflow-hidden rounded-3xl border p-0 shadow-sm">
        <div className="flex items-center gap-4 border-b px-6 py-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <Pencil className="size-5 text-muted-foreground" />
          </div>

          <div>
            <h3 className="font-semibold">Pengaturan Target</h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Ubah nama, nominal target, atau tanggal target.
            </p>
          </div>
        </div>

        <div className="p-6">
          <SavingGoalForm
            defaultValues={goal}
            submitLabel="Simpan Perubahan"
            isSubmitting={isSubmittingGoal}
            onSubmit={handleUpdateGoal}
          />
        </div>
      </Card>

      {/* =================================================
          DELETE MODAL
      ================================================= */}

      <DeleteConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title={`Hapus target "${goal.name}"?`}
        description="Target tabungan ini akan dihapus."
      />
    </div>
  );
}

// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-2xl border p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>

          <p className="mt-1 truncate font-semibold tabular-nums">{value}</p>
        </div>
      </div>
    </Card>
  );
}
