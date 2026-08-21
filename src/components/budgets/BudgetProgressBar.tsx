import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BudgetProgressBarProps {
  categoryName: string;
  limit: number | string;
  spent: number | string;
}

export default function BudgetProgressBar({
  categoryName,
  limit,
  spent,
}: BudgetProgressBarProps) {
  const numericLimit = Number(limit) || 0;
  const numericSpent = Number(spent) || 0;

  const percentage =
    numericLimit > 0
      ? (numericSpent / numericLimit) * 100
      : 0;

  const isOver = percentage >= 100;
  const isWarn = percentage >= 70 && percentage < 100;

  return (
    <div className="px-5 py-3.5">
      <div className="mb-1.5 flex items-baseline justify-between gap-4">
        <span className="text-sm font-semibold">
          {categoryName}
        </span>

        <span className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">
          {formatCurrency(numericSpent)} /{" "}
          {formatCurrency(numericLimit)}
        </span>
      </div>

      <Progress
        value={Math.min(percentage, 100)}
        indicatorClassName={cn(
          isOver
            ? "bg-expense"
            : isWarn
            ? "bg-gold"
            : "bg-income"
        )}
      />
    </div>
  );
}