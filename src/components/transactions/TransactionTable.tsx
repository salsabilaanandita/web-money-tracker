"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import DeleteConfirmModal from "@/components/transactions/DeleteConfirmModal";

import { Transaction } from "@/types/transaction";
import { formatCurrency, formatDate } from "@/lib/format";
import { Category } from "@/types/category";
import { Wallet } from "@/types/wallet";

export default function TransactionTable({
  transactions,
  wallets,
  categories,
  isExpense,
  onDelete,
}: {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  isExpense: boolean;
  onDelete: (id: string) => Promise<void>;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const allSelected =
    transactions.length > 0 && selectedIds.length === transactions.length;

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : transactions.map((tx) => tx.id));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    setIsDeleting(true);
    try {
      await onDelete(pendingDeleteId);
      setSelectedIds((prev) => prev.filter((id) => id !== pendingDeleteId));
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      for (const id of selectedIds) {
        await onDelete(id);
      }
      setSelectedIds([]);
    } finally {
      setIsDeleting(false);
    }
  };

  if (transactions.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        Belum ada transaksi {isExpense ? "pengeluaran" : "pemasukan"}.
      </p>
    );
  }

  return (
    <div>
      {/* BULK ACTION BAR — muncul kalau ada baris yang dicentang */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
          <span className="text-xs font-medium text-muted-foreground">
            {selectedIds.length} dipilih
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={handleBulkDelete}
            disabled={isDeleting}
          >
            <Trash2 className="size-3.5" />
            Hapus Terpilih
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-4 py-3">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </th>
              <th className="px-4 py-3 font-medium">Deskripsi</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
              <th className="px-4 py-3 font-medium">Wallet</th>
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 text-right font-medium">Jumlah</th>
              <th className="px-2 py-3"></th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((tx) => {
              const category = categories.find((c) => c.id === tx.category_id);
              const wallet = wallets.find((w) => w.id === tx.wallet_id);
              const isSelected = selectedIds.includes(tx.id);

              return (
                <tr
                  key={tx.id}
                  className="border-b border-dashed border-border last:border-b-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleOne(tx.id)}
                    />
                  </td>

                  <td className="px-4 py-3 font-medium">
                    {tx.description}
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {category?.name ?? "-"}
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {wallet?.name ?? "-"}
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(tx.date)}
                  </td>

                  <td
                    className={`px-4 py-3 text-right font-mono font-semibold tabular-nums ${
                      isExpense ? "text-expense" : "text-income"
                    }`}
                  >
                    {isExpense ? "−" : "+"}
                    {formatCurrency(tx.amount)}
                  </td>

                  <td className="px-2 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/transactions/${tx.id}`}
                            className="flex items-center gap-2"
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setPendingDeleteId(tx.id)}
                        >
                          <Trash2 className="size-3.5" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title="Hapus transaksi ini?"
        description="Saldo wallet terkait akan disesuaikan kembali."
      />
    </div>
  );
}
