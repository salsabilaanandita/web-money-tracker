"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Sparkles,
} from "lucide-react";

import { toast } from "sonner";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import PageHeader from "@/components/layout/PageHeader";
import PeriodFilter from "@/components/dashboard/PeriodFilter";
import RecentTransactions from "@/components/dashboard/RecentTransactions";

import { getDashboardSummary } from "@/services/dashboardService";
import { getTransactions } from "@/services/transactionService";
import { getSavingGoals } from "@/services/savingService";

import { DashboardPeriod, DashboardSummary } from "@/types/dashboard";
import { Transaction } from "@/types/transaction";
import { SavingGoal } from "@/types/saving";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useHideBalance } from "@/store/usePreferenceStore";

// =====================================================
// CONSTANTS
// =====================================================

const UNCATEGORIZED_LABEL = "Lainnya";
const MASKED_VALUE = "••••••••";

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  daily: "Hari Ini",
  weekly: "Minggu Ini",
  monthly: "Bulan Ini",
};

// =====================================================
// TYPES
// =====================================================

interface DailyFlow {
  label: string;
  income: number;
  expense: number;
}

interface CategoryBreakdownItem {
  name: string;
  amount: number;
}

type CategoryTab = "expense" | "income";

// =====================================================
// CATEGORY HELPER
// =====================================================

function getCategoryName(transaction: Transaction): string {
  const t = transaction as Transaction & {
    category_name?: string | null;
    category?: {
      name?: string | null;
    } | null;
  };

  return t.category_name || t.category?.name || UNCATEGORIZED_LABEL;
}

// =====================================================
// DATE HELPERS
// =====================================================

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function startOfWeek(date: Date): Date {
  const result = startOfDay(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);

  return result;
}

function endOfWeek(date: Date): Date {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);

  return endOfDay(result);
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

// =====================================================
// GET PERIOD RANGE
// =====================================================

function getPeriodRange(period: DashboardPeriod) {
  const now = new Date();

  if (period === "daily") {
    return {
      start: startOfDay(now),
      end: endOfDay(now),
    };
  }

  if (period === "weekly") {
    return {
      start: startOfWeek(now),
      end: endOfWeek(now),
    };
  }

  return {
    start: startOfMonth(now),
    end: endOfMonth(now),
  };
}

// =====================================================
// FILTER TRANSACTIONS
// =====================================================

function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: DashboardPeriod,
): Transaction[] {
  const { start, end } = getPeriodRange(period);

  return transactions.filter((transaction) => {
    if (!transaction.date) return false;

    const date = new Date(transaction.date);

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return date >= start && date <= end;
  });
}

// =====================================================
// FORMAT AXIS
// =====================================================

function formatAxisTick(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}jt`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}rb`;
  }

  return String(value);
}

// =====================================================
// DAILY FLOW
// =====================================================

function toDailyFlows(transactions: Transaction[]): DailyFlow[] {
  const grouped = new Map<string, DailyFlow>();

  for (const transaction of transactions) {
    if (!transaction.date) continue;

    const date = new Date(transaction.date);

    if (Number.isNaN(date.getTime())) continue;

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    if (!grouped.has(key)) {
      grouped.set(key, {
        label: date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
        income: 0,
        expense: 0,
      });
    }

    const entry = grouped.get(key)!;
    const amount = Number(transaction.amount) || 0;

    if (transaction.type === "income") {
      entry.income += amount;
    }

    if (transaction.type === "expense") {
      entry.expense += amount;
    }
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);
}

// =====================================================
// CATEGORY BREAKDOWN
// =====================================================

function toCategoryBreakdown(
  transactions: Transaction[],
  type: "expense" | "income",
): CategoryBreakdownItem[] {
  const grouped = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== type) continue;

    const category = getCategoryName(transaction);
    const amount = Number(transaction.amount) || 0;

    grouped.set(category, (grouped.get(category) || 0) + amount);
  }

  return Array.from(grouped.entries())
    .map(([name, amount]) => ({
      name,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// =====================================================
// DASHBOARD PAGE
// =====================================================

export default function DashboardPage() {
  const hideBalance = useHideBalance();

  const [period, setPeriod] = useState<DashboardPeriod>("monthly");

  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [savings, setSavings] = useState<SavingGoal[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isSavingsLoading, setIsSavingsLoading] = useState(true);

  const requestIdRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      const requestId = ++requestIdRef.current;

      setIsLoading(true);
      setIsSavingsLoading(true);

      const [summaryResult, txResult, savingsResult] = await Promise.allSettled(
        [
          getDashboardSummary(period),
          getTransactions({ limit: 100 }),
          getSavingGoals(),
        ],
      );

      if (!mounted || requestId !== requestIdRef.current) {
        return;
      }

      if (summaryResult.status === "fulfilled") {
        const result = summaryResult.value;

        setSummary(result && typeof result === "object" ? result : null);
      } else {
        console.error("Dashboard summary error:", summaryResult.reason);

        setSummary(null);

        toast.error("Gagal memuat ringkasan dashboard.");
      }

      if (txResult.status === "fulfilled") {
        const result = txResult.value;

        const data = Array.isArray(result)
          ? result
          : (result as { data?: Transaction[] })?.data;

        setTransactions(Array.isArray(data) ? data : []);
      } else {
        console.error("Transactions error:", txResult.reason);

        setTransactions([]);

        toast.error("Gagal memuat data transaksi.");
      }

      if (savingsResult.status === "fulfilled") {
        const result = savingsResult.value;

        const data = Array.isArray(result)
          ? result
          : (result as { data?: SavingGoal[] })?.data;

        setSavings(Array.isArray(data) ? data : []);
      } else {
        console.error("Savings error:", savingsResult.reason);

        setSavings([]);
      }

      setIsLoading(false);
      setIsSavingsLoading(false);
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [period]);

  const periodTransactions = useMemo(
    () => filterTransactionsByPeriod(transactions, period),
    [transactions, period],
  );

  const totalBalance = Number(summary?.total_balance ?? 0);

  const totalIncome = useMemo(() => {
    return periodTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce(
        (total, transaction) => total + (Number(transaction.amount) || 0),
        0,
      );
  }, [periodTransactions]);

  const totalExpense = useMemo(() => {
    return periodTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce(
        (total, transaction) => total + (Number(transaction.amount) || 0),
        0,
      );
  }, [periodTransactions]);

  const netFlow = totalIncome - totalExpense;

  const chartData = useMemo(
    () => toDailyFlows(periodTransactions),
    [periodTransactions],
  );

  const expenseCategories = useMemo(
    () => toCategoryBreakdown(periodTransactions, "expense"),
    [periodTransactions],
  );

  const incomeCategories = useMemo(
    () => toCategoryBreakdown(periodTransactions, "income"),
    [periodTransactions],
  );

  const topSaving = savings[0];

  return (
    <div className="space-y-7">
      {/* HEADER */}
      <PageHeader
        title="Ringkasan"
        description={`Pantau arus kasmu ${PERIOD_LABELS[
          period
        ].toLowerCase()}.`}
      >
        <PeriodFilter value={period} onChange={setPeriod} />
      </PageHeader>

      {/* HERO */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.45fr_1fr]">
        <BalanceHeroCard
          totalBalance={totalBalance}
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          netFlow={netFlow}
          periodLabel={PERIOD_LABELS[period]}
          hideBalance={hideBalance}
        />

        <TopSavingCard
          goal={topSaving}
          isLoading={isSavingsLoading}
          hideBalance={hideBalance}
        />
      </div>

      {/* CHART + CATEGORY */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <CashFlowChart
          data={chartData}
          isLoading={isLoading}
          periodLabel={PERIOD_LABELS[period]}
          hideBalance={hideBalance}
        />

        <CategoryBreakdown
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          totalExpense={totalExpense}
          totalIncome={totalIncome}
          isLoading={isLoading}
          periodLabel={PERIOD_LABELS[period]}
          hideBalance={hideBalance}
        />
      </div>

      {/* SAVINGS */}
      <SavingsList
        goals={savings}
        isLoading={isSavingsLoading}
        hideBalance={hideBalance}
      />

      {/* TRANSACTIONS */}
      {isLoading ? (
        <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Memuat transaksi...</p>
        </div>
      ) : (
        <RecentTransactions transactions={transactions.slice(0, 5)} />
      )}
    </div>
  );
}

// =====================================================
// DISPLAY AMOUNT
// =====================================================

function displayAmount(value: number, hideBalance: boolean): string {
  return hideBalance ? MASKED_VALUE : formatCurrency(value);
}

// =====================================================
// BALANCE HERO CARD
// =====================================================

function BalanceHeroCard({
  totalBalance,
  totalIncome,
  totalExpense,
  netFlow,
  periodLabel,
  hideBalance,
}: {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  periodLabel: string;
  hideBalance: boolean;
}) {
  const isPositive = netFlow >= 0;

  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-border/70
        bg-card
        p-7
        shadow-sm
      "
    >
      {/* subtle background */}
      <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/[0.07] blur-3xl" />

      <div className="relative">
        {/* TOP */}
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Total Saldo
              </span>

              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                WALLET
              </span>
            </div>

            <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums sm:text-[42px]">
              {displayAmount(totalBalance, hideBalance)}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              Saldo keseluruhan wallet kamu
            </p>
          </div>

          <div
            className="
              flex
              size-12
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-primary/15
              bg-primary/10
              text-primary
            "
          >
            <Wallet className="size-5" />
          </div>
        </div>

        {/* NET FLOW */}
        <div className="mt-7">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold",
              isPositive
                ? "border-income/20 bg-income-soft text-income"
                : "border-expense/20 bg-expense-soft text-expense",
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}

            <span>{displayAmount(Math.abs(netFlow), hideBalance)}</span>

            <span className="font-medium opacity-70">
              bersih {periodLabel.toLowerCase()}
            </span>
          </div>
        </div>

        {/* STATS */}
        <div className="mt-7 grid grid-cols-2 gap-4 border-t border-border/60 pt-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex size-7 items-center justify-center rounded-lg bg-income-soft">
                <TrendingUp className="size-3.5 text-income" />
              </span>

              <span>Pemasukan</span>
            </div>

            <p className="mt-3 text-lg font-bold tabular-nums">
              {displayAmount(totalIncome, hideBalance)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex size-7 items-center justify-center rounded-lg bg-expense-soft">
                <TrendingDown className="size-3.5 text-expense" />
              </span>

              <span>Pengeluaran</span>
            </div>

            <p className="mt-3 text-lg font-bold tabular-nums">
              {displayAmount(totalExpense, hideBalance)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// TOP SAVING CARD
// =====================================================

function TopSavingCard({
  goal,
  isLoading,
  hideBalance,
}: {
  goal?: SavingGoal;
  isLoading: boolean;
  hideBalance: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-[28px] border border-border/70 bg-card p-7 shadow-sm">
        <p className="text-sm text-muted-foreground">Memuat tabungan...</p>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-card p-7 text-center shadow-sm">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <PiggyBank className="size-5" />
        </span>

        <p className="mt-4 text-sm font-semibold">Belum ada target tabungan</p>

        <p className="mt-1 max-w-[220px] text-xs leading-5 text-muted-foreground">
          Buat target tabungan pertamamu untuk mulai melacak progres.
        </p>
      </div>
    );
  }

  const current = Number(goal.current_amount ?? 0);

  const target = Number(goal.target_amount ?? 0);

  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card p-7 shadow-sm">
      <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-primary/[0.06] blur-2xl" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Target Teratas
              </p>

              <Sparkles className="size-3.5 text-primary" />
            </div>

            <p className="mt-2 truncate text-lg font-bold">{goal.name}</p>
          </div>

          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <PiggyBank className="size-5" />
          </span>
        </div>

        <div className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-bold tracking-tight tabular-nums">
                {displayAmount(current, hideBalance)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                dari target {displayAmount(target, hideBalance)}
              </p>
            </div>

            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              {percentage.toFixed(0)}%
            </span>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${percentage}%`,
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Progress tabungan
            </span>

            {goal.target_date && (
              <span className="text-[11px] text-muted-foreground">
                {new Date(goal.target_date).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// CASH FLOW CHART
// =====================================================

function CashFlowChart({
  data,
  isLoading,
  periodLabel,
  hideBalance,
}: {
  data: DailyFlow[];
  isLoading: boolean;
  periodLabel: string;
  hideBalance: boolean;
}) {
  return (
    <div className="rounded-[28px] border border-border/70 bg-card p-7 shadow-sm">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Overview
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight">Arus Kas</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Pemasukan dan pengeluaran berdasarkan tanggal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LegendDot toneClass="bg-income" label="Pemasukan" />

          <LegendDot toneClass="bg-expense" label="Pengeluaran" />

          <span className="rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
            {periodLabel}
          </span>
        </div>
      </div>

      {isLoading ? (
        <EmptyState message="Memuat chart..." />
      ) : data.length === 0 ? (
        <EmptyState
          message="Belum ada transaksi"
          hint="Tambahkan transaksi untuk melihat arus kas."
        />
      ) : hideBalance ? (
        <div className="flex h-[320px] items-center justify-center rounded-2xl bg-muted/30">
          <div className="text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-sm">
              <Wallet className="size-4" />
            </div>

            <p className="mt-3 text-sm font-semibold">Chart disembunyikan</p>

            <p className="mt-1 text-xs text-muted-foreground">
              Mode privasi sedang aktif
            </p>
          </div>
        </div>
      ) : (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 6"
                vertical={false}
                className="stroke-border"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                padding={{
                  left: 12,
                  right: 12,
                }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                width={55}
                tick={{ fontSize: 11 }}
                tickFormatter={formatAxisTick}
              />

              <Tooltip
                cursor={{
                  stroke: "hsl(var(--border))",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                content={<CashFlowTooltip />}
              />

              <Line
                type="monotone"
                dataKey="income"
                name="income"
                stroke="var(--income)"
                strokeWidth={3}
                dot={{
                  r: 3,
                  fill: "var(--income)",
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: "white",
                }}
              />

              <Line
                type="monotone"
                dataKey="expense"
                name="expense"
                stroke="var(--expense)"
                strokeWidth={3}
                dot={{
                  r: 3,
                  fill: "var(--expense)",
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 6,
                  strokeWidth: 2,
                  stroke: "white",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// =====================================================
// TOOLTIP
// =====================================================

interface CashFlowTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    dataKey?: string | number;
    value?: number | string;
  }>;
}

function CashFlowTooltip({ active, payload, label }: CashFlowTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="min-w-[190px] rounded-2xl border border-border/70 bg-card p-4 shadow-xl">
      <p className="mb-3 text-xs font-semibold text-muted-foreground">
        {label}
      </p>

      <div className="space-y-2.5">
        {payload.map((entry, index) => {
          const key = String(entry.dataKey);

          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  "size-2 rounded-full",
                  key === "income" ? "bg-income" : "bg-expense",
                )}
              />

              <span className="text-muted-foreground">
                {key === "income" ? "Pemasukan" : "Pengeluaran"}
              </span>

              <span className="ml-auto font-bold tabular-nums">
                {formatCurrency(Number(entry.value ?? 0))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================
// LEGEND
// =====================================================

function LegendDot({ toneClass, label }: { toneClass: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
      <span className={cn("size-2 rounded-full", toneClass)} />

      {label}
    </div>
  );
}

// =====================================================
// CATEGORY BREAKDOWN
// =====================================================

function CategoryBreakdown({
  expenseCategories,
  incomeCategories,
  totalExpense,
  totalIncome,
  isLoading,
  periodLabel,
  hideBalance,
}: {
  expenseCategories: CategoryBreakdownItem[];
  incomeCategories: CategoryBreakdownItem[];
  totalExpense: number;
  totalIncome: number;
  isLoading: boolean;
  periodLabel: string;
  hideBalance: boolean;
}) {
  const [tab, setTab] = useState<CategoryTab>("expense");

  const isExpense = tab === "expense";

  const categories = isExpense ? expenseCategories : incomeCategories;

  const total = isExpense ? totalExpense : totalIncome;

  const visibleCategories = categories.slice(0, 5);

  const toneText = isExpense ? "text-expense" : "text-income";

  const toneSoftBg = isExpense ? "bg-expense-soft" : "bg-income-soft";

  const ToneIcon = isExpense ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="flex flex-col overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-sm">
      {/* HEADER */}
      <div className="border-b border-border/60 p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {isExpense ? "Expense" : "Income"}
            </p>

            <h2 className="mt-1 text-xl font-bold tracking-tight">
              {isExpense ? "Pengeluaran" : "Pemasukan"}
            </h2>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Berdasarkan kategori {periodLabel.toLowerCase()}.
            </p>
          </div>

          <span className="shrink-0 rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
            {categories.length} kategori
          </span>
        </div>

        {/* TABS */}
        <div className="mt-5 grid grid-cols-2 rounded-xl bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setTab("expense")}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              tab === "expense"
                ? "bg-card text-expense shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Pengeluaran
          </button>

          <button
            type="button"
            onClick={() => setTab("income")}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              tab === "income"
                ? "bg-card text-income shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Pemasukan
          </button>
        </div>
      </div>

      {isLoading ? (
        <EmptyState message="Memuat data..." compact />
      ) : categories.length === 0 ? (
        <EmptyState
          message={isExpense ? "Belum ada pengeluaran" : "Belum ada pemasukan"}
          hint={`Belum ada ${
            isExpense ? "pengeluaran" : "pemasukan"
          } ${periodLabel.toLowerCase()}.`}
          compact
        />
      ) : (
        <div className="p-7">
          {/* TOTAL */}
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Total {isExpense ? "Pengeluaran" : "Pemasukan"}
                </p>

                <p className="mt-1 text-xl font-bold tabular-nums">
                  {displayAmount(total, hideBalance)}
                </p>
              </div>

              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  toneSoftBg,
                )}
              >
                <ToneIcon className={cn("size-5", toneText)} />
              </div>
            </div>
          </div>

          {/* LIST */}
          <div className="mt-5 space-y-2">
            {visibleCategories.map((category, index) => (
              <div
                key={category.name}
                className="
                    group
                    flex
                    items-center
                    justify-between
                    gap-3
                    rounded-2xl
                    border
                    border-transparent
                    p-3
                    transition
                    hover:border-border/60
                    hover:bg-muted/30
                  "
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-[11px] font-bold text-muted-foreground">
                    {index + 1}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {category.name}
                    </p>

                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {isExpense ? "Pengeluaran" : "Pemasukan"}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 text-sm font-bold tabular-nums">
                  {displayAmount(category.amount, hideBalance)}
                </p>
              </div>
            ))}
          </div>

          {categories.length > 5 && (
            <p className="mt-4 border-t border-border/60 pt-4 text-center text-[11px] text-muted-foreground">
              + {categories.length - 5} kategori lainnya
            </p>
          )}
        </div>
      )}

      {/* FOOTER */}
      {!isLoading && categories.length > 0 && (
        <div className="mt-auto border-t border-border/60 px-7 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg",
                  toneSoftBg,
                )}
              >
                <ToneIcon className={cn("size-3.5", toneText)} />
              </div>

              <span className="text-xs text-muted-foreground">Total</span>
            </div>

            <span className="text-sm font-bold tabular-nums">
              {displayAmount(total, hideBalance)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// SAVINGS LIST
// =====================================================

function SavingsList({
  goals,
  isLoading,
  hideBalance,
}: {
  goals: SavingGoal[];
  isLoading: boolean;
  hideBalance: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 p-7">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Savings
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight">
            Semua Target Tabungan
          </h2>
        </div>

        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <PiggyBank className="size-4" />
        </span>
      </div>

      {isLoading ? (
        <EmptyState message="Memuat tabungan..." compact />
      ) : goals.length === 0 ? (
        <EmptyState
          message="Belum ada target tabungan"
          hint="Buat target tabungan untuk mulai melacak progresnya."
          compact
        />
      ) : (
        <div className="divide-y divide-border/50">
          {goals.map((goal) => {
            const current = Number(goal.current_amount ?? 0);

            const target = Number(goal.target_amount ?? 0);

            const percentage =
              target > 0 ? Math.min((current / target) * 100, 100) : 0;

            return (
              <div
                key={goal.id}
                className="flex flex-col gap-4 p-5 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <PiggyBank className="size-4" />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {goal.name}
                    </p>

                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {displayAmount(current, hideBalance)} dari{" "}
                      {displayAmount(target, hideBalance)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:w-64">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <span className="w-12 shrink-0 rounded-full bg-primary/10 px-2 py-1.5 text-center text-[11px] font-bold text-primary">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =====================================================
// EMPTY STATE
// =====================================================

function EmptyState({
  message,
  hint,
  compact = false,
}: {
  message: string;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        compact ? "p-10" : "h-[320px]",
      )}
    >
      <div className="text-center">
        <p className="text-sm font-semibold">{message}</p>

        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
