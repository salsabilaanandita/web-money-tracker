export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount_limit: number;
  month: number;
  year: number;
  created_at: string;
}

export interface BudgetPayload {
  category_id: string;
  amount_limit: number;
  month: number;
  year: number;
}

// Sesuai response asli GET /budgets/summary dari backend
export interface BudgetSummaryItem {
  category_id: string;
  category_name: string;
  amount_limit: number;
  spent: number;
  remaining: number;
  month: number;
  year: number;
}

// Gabungan Budget (punya `id`, dipakai buat delete) + data spent dari summary,
// dipakai buat ditampilkan di UI.
export interface BudgetWithSummary {
  id: string;
  category_id: string;
  category_name: string;
  amount_limit: number;
  spent: number;
  remaining: number;
  month: number;
  year: number;
}
