export type DashboardPeriod = "daily" | "weekly" | "monthly";

export interface DashboardSummary {
  total_balance: number;
  total_income: number;
  total_expense: number;
  period?: DashboardPeriod;
}
