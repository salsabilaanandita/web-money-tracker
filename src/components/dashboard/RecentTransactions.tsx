import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Transaction } from "@/types/transaction";
import { formatCurrency, formatDate } from "@/lib/format";

export default function RecentTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <Card className="gap-0 p-0">
      <div className="flex items-center justify-between border-b border-dashed border-border px-5 py-4">
        <h3 className="font-display text-base font-semibold">Transaksi Terbaru</h3>
        <Link
          href="/transactions/expense"
          className="text-xs font-semibold text-primary hover:underline"
        >
          Lihat semua →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          Belum ada transaksi.
        </p>
      ) : (
        <div>
          {transactions.map((tx) => {
            const isExpense = tx.type === "expense";
            return (
              <Link
                key={tx.id}
                href={`/transactions/${tx.id}`}
                className="flex items-center gap-3 border-b border-dashed border-border px-5 py-3 last:border-b-0 hover:bg-muted/40"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    isExpense ? "bg-expense-soft text-expense" : "bg-income-soft text-income"
                  }`}
                >
                  {isExpense ? (
                    <ArrowDownCircle className="size-4" />
                  ) : (
                    <ArrowUpCircle className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{tx.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {tx.category_name ?? "Kategori"} · {formatDate(tx.date)}
                  </p>
                </div>
                <span
                  className={`font-mono text-sm font-semibold tabular-nums ${
                    isExpense ? "text-expense" : "text-income"
                  }`}
                >
                  {isExpense ? "−" : "+"}
                  {formatCurrency(tx.amount)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
