export type CategoryType = "expense" | "income";

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  created_at?: string;
}

export interface CreateCategoryPayload {
  name: string;
  type: CategoryType;
}

export type UpdateCategoryPayload = CreateCategoryPayload;
