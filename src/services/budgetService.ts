import apiClient from "@/lib/apiClient";
import { Budget, BudgetPayload, BudgetSummaryItem } from "@/types/budget";

export async function getBudgets(): Promise<Budget[]> {
  const res = await apiClient.get<{ data: Budget[] }>("/budgets");
  return res.data.data ?? [];
}

export async function createBudget(payload: BudgetPayload): Promise<Budget> {
  const res = await apiClient.post<{ data: Budget }>("/budgets", payload);
  return res.data.data;
}

export async function getBudgetSummary(): Promise<BudgetSummaryItem[]> {
  const res = await apiClient.get<{ data: BudgetSummaryItem[] }>(
    "/budgets/summary"
  );
  return res.data.data ?? [];
}

export async function deleteBudget(id: string): Promise<void> {
  await apiClient.delete(`/budgets/${id}`);
}
