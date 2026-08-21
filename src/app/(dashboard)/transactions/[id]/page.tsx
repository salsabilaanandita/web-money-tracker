"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import TransactionForm from "@/components/transactions/TransactionForm";
import DeleteConfirmModal from "@/components/transactions/DeleteConfirmModal";

import {
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "@/services/transactionService";

import { getWallets } from "@/services/walletService";
import { getCategories } from "@/services/categoryService";

import { TransactionFormValues } from "@/lib/validators/transactionSchema";
import { Transaction } from "@/types/transaction";
import { Wallet } from "@/types/wallet";
import { Category } from "@/types/category";

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [transaction, setTransaction] = useState<Transaction | null>(null);

  const [wallets, setWallets] = useState<Wallet[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        // =========================
        // AMBIL DETAIL TRANSAKSI
        // =========================

        const tx = await getTransactionById(params.id);

        // =========================
        // AMBIL WALLET + KATEGORI
        // =========================

        const [walletRes, categoryRes] = await Promise.all([
          getWallets(),
          getCategories(),
        ]);

        /*
         * API bisa mengembalikan:
         *
         * [
         *   {...},
         *   {...}
         * ]
         *
         * atau:
         *
         * {
         *   data: [...]
         * }
         */

        // =========================
        // WALLET DATA
        // =========================

        const walletsData: Wallet[] = Array.isArray(walletRes)
          ? walletRes
          : Array.isArray(
                (
                  walletRes as {
                    data?: Wallet[];
                  }
                )?.data,
              )
            ? (
                walletRes as {
                  data: Wallet[];
                }
              ).data
            : [];

        // =========================
        // CATEGORY DATA
        // =========================

        const categoriesData: Category[] = Array.isArray(categoryRes)
          ? categoryRes
          : Array.isArray(
                (
                  categoryRes as {
                    data?: Category[];
                  }
                )?.data,
              )
            ? (
                categoryRes as {
                  data: Category[];
                }
              ).data
            : [];

        // =========================
        // FILTER CATEGORY
        // SESUAI TYPE TRANSAKSI
        // =========================

        const filteredCategories = categoriesData.filter(
          (category) => category.type === tx.type,
        );

        // =========================
        // UPDATE STATE
        // =========================

        if (mounted) {
          setTransaction(tx);
          setWallets(walletsData);
          setCategories(filteredCategories);
        }
      } catch (error) {
        console.error("Gagal memuat detail transaksi:", error);

        if (mounted) {
          toast.error("Gagal memuat detail transaksi.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [params.id]);

  // =========================
  // UPDATE TRANSACTION
  // =========================

  const handleUpdate = async (values: TransactionFormValues) => {
    if (!transaction) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateTransaction(transaction.id, {
        ...values,
        type: transaction.type,
      });

      toast.success("Transaksi berhasil diperbarui.");

      router.push(
        transaction.type === "expense"
          ? "/transactions/expense"
          : "/transactions/income",
      );
    } catch (error) {
      console.error("Gagal update transaksi:", error);

      toast.error("Gagal memperbarui transaksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================
  // DELETE TRANSACTION
  // =========================

  const handleDelete = async () => {
    if (!transaction) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteTransaction(transaction.id);

      toast.success("Transaksi berhasil dihapus.");

      router.push(
        transaction.type === "expense"
          ? "/transactions/expense"
          : "/transactions/income",
      );
    } catch (error) {
      console.error("Gagal menghapus transaksi:", error);

      toast.error("Gagal menghapus transaksi.");
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Memuat...</p>;
  }

  // =========================
  // TRANSACTION NOT FOUND
  // =========================

  if (!transaction) {
    return (
      <p className="text-sm text-muted-foreground">
        Transaksi tidak ditemukan.
      </p>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (
    <div className="max-w-lg">
      <PageHeader
        title="Detail Transaksi"
        description="Ubah atau hapus transaksi ini."
      >
        <Button
          variant="outline"
          onClick={() =>
            router.push(
              transaction.type === "expense"
                ? "/transactions/expense"
                : "/transactions/income",
            )
          }
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="size-4" />
          Hapus
        </Button>
      </PageHeader>

      <Card className="p-5">
        <TransactionForm
          type={transaction.type}
          wallets={wallets}
          categories={categories}
          defaultValues={{
            wallet_id: transaction.wallet_id,

            category_id: transaction.category_id,

            amount: transaction.amount,

            description: transaction.description,

            date: transaction.date,
          }}
          submitLabel="Simpan Perubahan"
          isSubmitting={isSubmitting}
          onSubmit={handleUpdate}
        />
      </Card>

      <DeleteConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title="Hapus transaksi ini?"
        description="Saldo wallet terkait akan disesuaikan kembali."
      />
    </div>
  );
}
