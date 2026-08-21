"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "sonner";

import {
  Plus,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  CalendarDays,
  Wallet as WalletIcon,
  Receipt,
  CircleDollarSign,
  Tag,
  WalletCards,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import TransactionForm from "@/components/transactions/TransactionForm";
import TransactionTable from "@/components/transactions/TransactionTable";

import {
  getTransactions,
  createTransaction,
  deleteTransaction,
} from "@/services/transactionService";

import { getWallets } from "@/services/walletService";
import { getCategories } from "@/services/categoryService";

import { TransactionFormValues } from "@/lib/validators/transactionSchema";

import { Transaction, TransactionType } from "@/types/transaction";

import { Wallet } from "@/types/wallet";
import { Category } from "@/types/category";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

// =====================================================
// TYPES
// =====================================================

type SortOption = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

type DateFilter = "all" | "today" | "week" | "month";

type AmountFilter = "all" | "under_50" | "50_200" | "above_200";

const SORT_LABELS: Record<SortOption, string> = {
  date_desc: "Tanggal Terbaru",
  date_asc: "Tanggal Terlama",
  amount_desc: "Nominal Tertinggi",
  amount_asc: "Nominal Terendah",
};

const DATE_LABELS: Record<DateFilter, string> = {
  all: "Semua Periode",
  today: "Hari Ini",
  week: "7 Hari Terakhir",
  month: "Bulan Ini",
};

const AMOUNT_LABELS: Record<AmountFilter, string> = {
  all: "Semua Nominal",
  under_50: "< Rp50.000",
  "50_200": "Rp50.000 - Rp200.000",
  above_200: "> Rp200.000",
};

// =====================================================
// PAGE
// =====================================================

export default function TransactionListPage({
  type,
}: {
  type: TransactionType;
}) {
  const isExpense = type === "expense";

  // ===================================================
  // STATE
  // ===================================================

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [wallets, setWallets] = useState<Wallet[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [open, setOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===================================================
  // FILTER
  // ===================================================

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [walletFilter, setWalletFilter] = useState<string>("all");

  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const [amountFilter, setAmountFilter] = useState<AmountFilter>("all");

  const [sort, setSort] = useState<SortOption>("date_desc");

  // ===================================================
  // LOAD DATA
  // ===================================================

  const load = useCallback(async () => {
    setIsLoading(true);

    try {
      const [txRes, walletRes, categoryRes] = await Promise.all([
        getTransactions({ type }),
        getWallets(),
        getCategories(),
      ]);

      setTransactions(Array.isArray(txRes) ? txRes : []);

      setWallets(Array.isArray(walletRes) ? walletRes : []);

      const filteredCategories = Array.isArray(categoryRes)
        ? categoryRes.filter((category) => category.type === type)
        : [];

      setCategories(filteredCategories);
    } catch (error) {
      console.error("Gagal memuat data transaksi:", error);

      toast.error("Gagal memuat data transaksi.");
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  // ===================================================
  // CREATE
  // ===================================================

  const handleCreate = async (values: TransactionFormValues) => {
    setIsSubmitting(true);

    try {
      await createTransaction({
        ...values,
        type,
      });

      toast.success(
        isExpense ? "Pengeluaran ditambahkan." : "Pemasukan ditambahkan.",
      );

      setOpen(false);

      await load();
    } catch (error) {
      console.error("Gagal menyimpan transaksi:", error);

      toast.error("Gagal menyimpan transaksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);

      toast.success("Transaksi berhasil dihapus.");

      await load();
    } catch (error) {
      console.error("Gagal menghapus transaksi:", error);

      toast.error("Gagal menghapus transaksi.");
    }
  };

  // ===================================================
  // FILTER + SEARCH + SORT
  // ===================================================

  const visibleTransactions = useMemo(() => {
    let result = [...transactions];

    // -----------------------------------------------
    // SEARCH
    // -----------------------------------------------

    if (search.trim()) {
      const keyword = search.trim().toLowerCase();

      result = result.filter((tx) =>
        tx.description?.toLowerCase().includes(keyword),
      );
    }

    // -----------------------------------------------
    // CATEGORY
    // -----------------------------------------------

    if (categoryFilter !== "all") {
      result = result.filter((tx) => tx.category_id === categoryFilter);
    }

    // -----------------------------------------------
    // WALLET
    // -----------------------------------------------

    if (walletFilter !== "all") {
      result = result.filter((tx) => tx.wallet_id === walletFilter);
    }

    // -----------------------------------------------
    // DATE
    // -----------------------------------------------

    if (dateFilter !== "all") {
      const now = new Date();

      const startDate = new Date(now);

      startDate.setHours(0, 0, 0, 0);

      if (dateFilter === "today") {
        result = result.filter((tx) => {
          const date = new Date(tx.date);

          return date >= startDate && date <= now;
        });
      }

      if (dateFilter === "week") {
        const weekAgo = new Date(now);

        weekAgo.setDate(weekAgo.getDate() - 7);

        result = result.filter((tx) => new Date(tx.date) >= weekAgo);
      }

      if (dateFilter === "month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        result = result.filter((tx) => new Date(tx.date) >= monthStart);
      }
    }

    // -----------------------------------------------
    // AMOUNT
    // -----------------------------------------------

    if (amountFilter !== "all") {
      result = result.filter((tx) => {
        const amount = Number(tx.amount) || 0;

        if (amountFilter === "under_50") {
          return amount < 50_000;
        }

        if (amountFilter === "50_200") {
          return amount >= 50_000 && amount <= 200_000;
        }

        if (amountFilter === "above_200") {
          return amount > 200_000;
        }

        return true;
      });
    }

    // -----------------------------------------------
    // SORT
    // -----------------------------------------------

    result.sort((a, b) => {
      switch (sort) {
        case "date_asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();

        case "amount_desc":
          return Number(b.amount) - Number(a.amount);

        case "amount_asc":
          return Number(a.amount) - Number(b.amount);

        case "date_desc":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [
    transactions,
    search,
    categoryFilter,
    walletFilter,
    dateFilter,
    amountFilter,
    sort,
  ]);

  // ===================================================
  // SUMMARY
  // ===================================================

  const totalAmount = useMemo(() => {
    return visibleTransactions.reduce(
      (total, tx) => total + (Number(tx.amount) || 0),
      0,
    );
  }, [visibleTransactions]);

  const activeFilterCount = [
    categoryFilter !== "all",
    walletFilter !== "all",
    dateFilter !== "all",
    amountFilter !== "all",
  ].filter(Boolean).length;

  // ===================================================
  // RESET
  // ===================================================

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setWalletFilter("all");
    setDateFilter("all");
    setAmountFilter("all");
    setSort("date_desc");
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6 pb-8">
      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        title={isExpense ? "Pengeluaran" : "Pemasukan"}
        description={
          isExpense
            ? "Kelola dan pantau semua pengeluaran kamu."
            : "Kelola dan pantau semua pemasukan kamu."
        }
      >
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Tambah {isExpense ? "Pengeluaran" : "Pemasukan"}
        </Button>
      </PageHeader>

      {/* =================================================
          MINI SUMMARY
      ================================================= */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat
          icon={Receipt}
          label="Total Transaksi"
          value={`${visibleTransactions.length} transaksi`}
        />

        <MiniStat
          icon={CircleDollarSign}
          label={isExpense ? "Total Pengeluaran" : "Total Pemasukan"}
          value={formatCurrency(totalAmount)}
          accent={isExpense ? "expense" : "income"}
        />

        <MiniStat
          icon={WalletIcon}
          label="Wallet"
          value={`${wallets.length} wallet`}
        />
      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <Card className="overflow-hidden rounded-xl border shadow-none">
        <div className="border-b bg-muted/20 p-4">
          {/* TOP TOOLBAR */}

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            {/* SEARCH */}

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

              <Input
                placeholder="Cari transaksi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 border bg-background pl-9 text-xs shadow-none"
              />
            </div>

            {/* CATEGORY */}

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-full gap-2 bg-background px-2.5 text-xs shadow-none sm:w-[175px]">
                <Tag className="size-3.5 shrink-0 text-muted-foreground" />

                <SelectValue placeholder="Kategori" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>

                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* WALLET */}

            <Select value={walletFilter} onValueChange={setWalletFilter}>
              <SelectTrigger className="h-8 w-full gap-2 bg-background px-2.5 text-xs shadow-none sm:w-[165px]">
                <WalletCards className="size-3.5 shrink-0 text-muted-foreground" />

                <SelectValue placeholder="Wallet" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Semua Wallet</SelectItem>

                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* DATE */}

            <Select
              value={dateFilter}
              onValueChange={(value) => setDateFilter(value as DateFilter)}
            >
              <SelectTrigger className="h-8 w-full gap-2 bg-background px-2.5 text-xs shadow-none sm:w-[155px]">
                <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />

                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {Object.entries(DATE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SECOND ROW */}

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {/* AMOUNT */}

              <Select
                value={amountFilter}
                onValueChange={(value) =>
                  setAmountFilter(value as AmountFilter)
                }
              >
                <SelectTrigger className="h-8 w-[155px] gap-2 bg-background px-2.5 text-xs shadow-none">
                  <CircleDollarSign className="size-3.5 shrink-0 text-muted-foreground" />

                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {Object.entries(AMOUNT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* SORT */}

              <Select
                value={sort}
                onValueChange={(value) => setSort(value as SortOption)}
              >
                <SelectTrigger className="h-8 w-[165px] gap-2 bg-background px-2.5 text-xs shadow-none">
                  <ArrowUpDown className="size-3.5 shrink-0 text-muted-foreground" />

                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {Object.entries(SORT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* ACTIVE FILTER */}

              {activeFilterCount > 0 && (
                <div className="flex h-8 items-center gap-1.5 rounded-md border bg-background px-2.5 text-xs text-muted-foreground">
                  <SlidersHorizontal className="size-3.5" />
                  {activeFilterCount} filter aktif
                </div>
              )}
            </div>

            {/* RESET */}

            {(search || activeFilterCount > 0 || sort !== "date_desc") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* =================================================
            TABLE HEADER
        ================================================= */}

        <div className="flex flex-col gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Daftar Transaksi</h2>

            <p className="text-xs text-muted-foreground">
              {visibleTransactions.length} dari {transactions.length} transaksi
            </p>
          </div>

          {search && (
            <p className="text-xs text-muted-foreground">
              Hasil pencarian untuk{" "}
              <span className="font-medium text-foreground">"{search}"</span>
            </p>
          )}
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        {isLoading ? (
          <TransactionLoading />
        ) : visibleTransactions.length === 0 ? (
          <EmptyTransactions
            onReset={activeFilterCount > 0 || search ? resetFilters : undefined}
            onAdd={() => setOpen(true)}
          />
        ) : (
          <TransactionTable
            transactions={visibleTransactions}
            wallets={wallets}
            categories={categories}
            isExpense={isExpense}
            onDelete={handleDelete}
          />
        )}
      </Card>

      {/* =================================================
          CREATE DIALOG
      ================================================= */}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              Tambah {isExpense ? "Pengeluaran" : "Pemasukan"}
            </DialogTitle>
          </DialogHeader>

          <TransactionForm
            type={type}
            wallets={wallets}
            categories={categories}
            isSubmitting={isSubmitting}
            onSubmit={handleCreate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =====================================================
// MINI STAT
// =====================================================

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: "income" | "expense";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60",
          accent === "income" && "bg-income-soft",
          accent === "expense" && "bg-expense-soft",
        )}
      >
        <Icon
          className={cn(
            "size-4 text-muted-foreground",
            accent === "income" && "text-income",
            accent === "expense" && "text-expense",
          )}
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>

        <p className="mt-0.5 truncate text-sm font-semibold tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
}

// =====================================================
// LOADING
// =====================================================

function TransactionLoading() {
  return (
    <div className="space-y-3 p-5">
      <div className="h-10 animate-pulse rounded-md bg-muted" />

      {Array.from({
        length: 7,
      }).map((_, index) => (
        <div key={index} className="grid grid-cols-4 gap-4">
          <div className="h-8 animate-pulse rounded bg-muted" />
          <div className="h-8 animate-pulse rounded bg-muted" />
          <div className="h-8 animate-pulse rounded bg-muted" />
          <div className="h-8 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

// =====================================================
// EMPTY
// =====================================================

function EmptyTransactions({
  onReset,
  onAdd,
}: {
  onReset?: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex min-h-[320px] items-center justify-center border-t">
      <div className="max-w-sm px-6 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl border bg-muted/30">
          <Receipt className="size-5 text-muted-foreground" />
        </div>

        <h3 className="mt-4 text-sm font-semibold">Tidak ada transaksi</h3>

        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Belum ada transaksi yang sesuai dengan filter atau pencarian kamu.
        </p>

        <div className="mt-4 flex justify-center gap-2">
          {onReset && (
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="mr-2 size-3.5" />
              Reset Filter
            </Button>
          )}

          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 size-3.5" />
            Tambah Transaksi
          </Button>
        </div>
      </div>
    </div>
  );
}
