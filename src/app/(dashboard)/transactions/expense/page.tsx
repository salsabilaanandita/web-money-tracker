import TransactionListPage from "@/components/transactions/TransactionListPage";

export default function ExpensePage() {
  return (
    <div className="min-h-screen pt-16 lg:pt-0">
      <TransactionListPage type="expense" />
    </div>
  );
}