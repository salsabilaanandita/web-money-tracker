"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  ArrowUpRight,
  PiggyBank,
  Plus,
  Target,
  TrendingUp,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import SavingGoalCard from "@/components/savings/SavingGoalCard";
import SavingGoalForm from "@/components/savings/SavingGoalForm";

import {
  getSavingGoals,
  createSavingGoal,
} from "@/services/savingService";

import { SavingGoalFormValues } from "@/lib/validators/savingSchema";
import { SavingGoal } from "@/types/saving";

import { formatCurrency } from "@/lib/format";

export default function SavingsPage() {
  const [goals, setGoals] =
    useState<SavingGoal[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [open, setOpen] =
    useState(false);

  // =====================================================
  // LOAD SAVING GOALS
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setIsLoading(true);

        const response =
          await getSavingGoals();

        const goalArray =
          Array.isArray(response)
            ? response
            : [];

        if (mounted) {
          setGoals(goalArray);
        }
      } catch (error) {
        console.error(
          "Error loading saving goals:",
          error
        );

        if (mounted) {
          setGoals([]);

          toast.error(
            "Gagal memuat target tabungan."
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================================
  // CREATE
  // =====================================================

  const handleCreate = async (
    values: SavingGoalFormValues
  ) => {
    try {
      setIsSubmitting(true);

      await createSavingGoal(values);

      toast.success(
        "Target tabungan berhasil dibuat."
      );

      setOpen(false);

      const response =
        await getSavingGoals();

      const goalArray =
        Array.isArray(response)
          ? response
          : [];

      setGoals(goalArray);
    } catch (error) {
      console.error(
        "Error creating saving goal:",
        error
      );

      toast.error(
        "Gagal membuat target tabungan."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // SUMMARY
  // =====================================================

  const summary = useMemo(() => {
    const totalTarget =
      goals.reduce(
        (total, goal) =>
          total +
          Number(
            goal.target_amount ?? 0
          ),
        0
      );

    const totalCurrent =
      goals.reduce(
        (total, goal) =>
          total +
          Number(
            goal.current_amount ?? 0
          ),
        0
      );

    const progress =
      totalTarget > 0
        ? Math.min(
            (totalCurrent /
              totalTarget) *
              100,
            100
          )
        : 0;

    return {
      totalTarget,
      totalCurrent,
      progress,
    };
  }, [goals]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-7 pb-10">

      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        title="Target Tabungan"
        description="Rencanakan tujuan finansialmu."
      >
        <Button
          onClick={() =>
            setOpen(true)
          }
          className="gap-2 rounded-xl"
        >
          <Plus className="size-4" />
          Buat Target
        </Button>
      </PageHeader>

      {/* =================================================
          SUMMARY
      ================================================= */}

      {!isLoading &&
        goals.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* TOTAL TARGET */}

            <div className="relative overflow-hidden rounded-3xl border bg-card p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total Target
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
                    {formatCurrency(
                      summary.totalTarget
                    )}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Dari{" "}
                    {goals.length} target
                    tabungan
                  </p>

                </div>

                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="size-5 text-primary" />
                </div>

              </div>

              <div className="pointer-events-none absolute -bottom-8 -right-8 size-24 rounded-full bg-primary/[0.035]" />

            </div>

            {/* TOTAL TERKUMPUL */}

            <div className="relative overflow-hidden rounded-3xl border bg-card p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Sudah Terkumpul
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
                    {formatCurrency(
                      summary.totalCurrent
                    )}
                  </p>

                  <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                    <TrendingUp className="size-3" />
                    {Math.round(
                      summary.progress
                    )}
                    % dari target
                  </p>

                </div>

                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <PiggyBank className="size-5 text-primary" />
                </div>

              </div>

              <div className="pointer-events-none absolute -bottom-8 -right-8 size-24 rounded-full bg-primary/[0.035]" />

            </div>

            {/* PROGRESS */}

            <div className="relative overflow-hidden rounded-3xl border bg-card p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Progress Keseluruhan
                  </p>

                  <p className="mt-2 text-2xl font-bold tracking-tight">
                    {Math.round(
                      summary.progress
                    )}
                    %
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Terus semangat
                    menabung!
                  </p>

                </div>

                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <ArrowUpRight className="size-5 text-primary" />
                </div>

              </div>

              {/* MINI PROGRESS */}

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">

                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${summary.progress}%`,
                  }}
                />

              </div>

            </div>

          </div>
        )}

      {/* =================================================
          SECTION HEADER
      ================================================= */}

      {!isLoading &&
        goals.length > 0 && (
          <div className="flex items-end justify-between">

            <div>

              <h2 className="text-base font-semibold">
                Target Kamu
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Pantau perkembangan setiap
                target tabunganmu.
              </p>

            </div>

            <span className="hidden rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
              {goals.length} target
            </span>

          </div>
        )}

      {/* =================================================
          LOADING
      ================================================= */}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="h-[220px] animate-pulse rounded-3xl border bg-card p-6"
            >

              <div className="flex justify-between">

                <div className="size-11 rounded-2xl bg-muted" />

                <div className="h-8 w-8 rounded-lg bg-muted" />

              </div>

              <div className="mt-7 h-3 w-28 rounded bg-muted" />

              <div className="mt-3 h-7 w-40 rounded bg-muted" />

              <div className="mt-7 h-2 w-full rounded-full bg-muted" />

              <div className="mt-3 flex justify-between">

                <div className="h-3 w-16 rounded bg-muted" />

                <div className="h-3 w-20 rounded bg-muted" />

              </div>

            </div>
          ))}

        </div>
      ) : goals.length === 0 ? (

        /* =================================================
           EMPTY STATE
        ================================================= */

        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed bg-card px-6 py-12 text-center">

          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">

            <PiggyBank className="size-7 text-primary" />

          </div>

          <h2 className="mt-5 text-lg font-semibold">
            Belum ada target tabungan
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Buat target pertama kamu
            untuk mulai merencanakan
            tabungan dan memantau
            progresnya.
          </p>

          <Button
            onClick={() =>
              setOpen(true)
            }
            className="mt-6 gap-2 rounded-xl"
          >
            <Plus className="size-4" />
            Buat Target Pertama
          </Button>

        </div>

      ) : (

        /* =================================================
           GOALS
        ================================================= */

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

          {goals.map(
            (goal) => (
              <SavingGoalCard
                key={goal.id}
                goal={goal}
              />
            )
          )}

        </div>
      )}

      {/* =================================================
          CREATE DIALOG
      ================================================= */}

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >

        <DialogContent className="rounded-2xl sm:max-w-md">

          <DialogHeader>

            <DialogTitle>
              Buat Target Tabungan
            </DialogTitle>

          </DialogHeader>

          <div className="rounded-2xl border bg-muted/20 p-4">

            <SavingGoalForm
              isSubmitting={
                isSubmitting
              }
              onSubmit={
                handleCreate
              }
            />

          </div>

        </DialogContent>

      </Dialog>

    </div>
  );
}