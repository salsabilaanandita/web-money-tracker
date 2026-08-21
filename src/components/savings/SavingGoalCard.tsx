import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SavingGoal } from "@/types/saving";
import { formatCurrency, formatDate } from "@/lib/format";

export default function SavingGoalCard({ goal }: { goal: SavingGoal }) {
  const percentage =
    goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;

  return (
    <Link href={`/savings/${goal.id}`}>
      <Card className="gap-3 p-5 transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">{goal.name}</h3>
          <span className="rounded-md bg-gold-soft px-2 py-0.5 font-mono text-[10px] text-gold">
            jatuh tempo {formatDate(goal.target_date)}
          </span>
        </div>
        <div className="flex items-baseline justify-between font-mono text-xs">
          <span className="font-semibold text-primary">
            {formatCurrency(goal.current_amount)} terkumpul
          </span>
          <span className="text-muted-foreground">dari {formatCurrency(goal.target_amount)}</span>
        </div>
        <Progress value={percentage} />
      </Card>
    </Link>
  );
}
