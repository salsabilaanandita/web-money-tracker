import { CategoryType } from "./category";

export type TransactionType = CategoryType; // "expense" | "income"
export interface Transaction {
  id: string;

  wallet_id: string;
  category_id: string;

  amount: number;
  description: string;
  date: string;

  type: "income" | "expense";

  wallet?: {
    id: string;
    name: string;
  };

  category?: {
    id: string;
    name: string;
    type: "income" | "expense";
  };
}
export interface CreateTransactionPayload {
  wallet_id: string;
  category_id: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
}

export type UpdateTransactionPayload = CreateTransactionPayload;

export interface TransactionQueryParams {
  type?: TransactionType;
  category_id?: string;
  wallet_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface TransactionListResponse {
  data: Transaction[];
  total?: number;
  page?: number;
  limit?: number;
}
