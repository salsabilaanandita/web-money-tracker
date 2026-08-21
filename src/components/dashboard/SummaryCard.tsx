import { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type Tone = "balance" | "income" | "expense";

const toneStyles: Record<Tone, { text: string; icon: string; bg: string }> = {
  balance: { text: "text-primary", icon: "text-primary", bg: "bg-brand-soft" },
  income: { text: "text-income", icon: "text-income", bg: "bg-income-soft" },
  expense: { text: "text-expense", icon: "text-expense", bg: "bg-expense-soft" },
};

export default function SummaryCard({
  label,
  amount,
  tone,
  icon: Icon,
  prefix,
}: {
  label: string;
  amount: number;
  tone: Tone;
  icon: LucideIcon;
  prefix?: string;
}) {
  const style = toneStyles[tone];

  return (
    <Card className="relative gap-2 p-4">
      <div className="torn-edge absolute inset-x-0 top-0" />
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={cn("flex size-7 items-center justify-center rounded-lg", style.bg)}>
          <Icon className={cn("size-3.5", style.icon)} />
        </span>
      </div>
      <p className={cn("font-mono text-xl font-semibold tabular-nums", style.text)}>
        {prefix}
        {formatCurrency(amount)}
      </p>
    </Card>
  );
}
