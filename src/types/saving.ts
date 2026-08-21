export interface SavingGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  created_at?: string;
}

export interface CreateSavingGoalPayload {
  name: string;
  target_amount: number;
  target_date: string;
}

export type UpdateSavingGoalPayload = CreateSavingGoalPayload;

export interface SavingEntry {
  id: string;
  saving_goal_id: string;
  amount: number;
  date: string;
  created_at?: string;
}

export interface CreateSavingEntryPayload {
  amount: number;
  date: string;
}
