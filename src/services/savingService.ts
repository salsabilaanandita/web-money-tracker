import apiClient from "@/lib/apiClient";
import {
  SavingGoal,
  SavingEntry,
  CreateSavingGoalPayload,
} from "@/types/saving";

// =====================================================
// GET ALL SAVING GOALS
// =====================================================

export async function getSavingGoals(): Promise<SavingGoal[]> {
  const res = await apiClient.get("/savings");

  console.log("📊 GET SAVINGS RESPONSE:", res.data);

  // Kalau API langsung mengembalikan array
  if (Array.isArray(res.data)) {
    return res.data;
  }

  // Kalau API mengembalikan { data: [...] }
  if (Array.isArray(res.data?.data)) {
    return res.data.data;
  }

  return [];
}

// =====================================================
// GET SAVING GOAL BY ID
// =====================================================

export async function getSavingGoalById(
  id: string
): Promise<SavingGoal> {
  const goals = await getSavingGoals();

  const goal = goals.find(
    (item) => item.id === id
  );

  if (!goal) {
    throw new Error("Target tabungan tidak ditemukan.");
  }

  return goal;
}
// =====================================================
// CREATE SAVING GOAL
// =====================================================

export async function createSavingGoal(
  payload: CreateSavingGoalPayload
): Promise<SavingGoal> {
  const formattedPayload = {
    ...payload,

    // Backend Go membutuhkan RFC3339
    target_date: `${payload.target_date}T00:00:00Z`,
  };

  console.log(
    "📤 CREATE SAVING:",
    formattedPayload
  );

  const res = await apiClient.post(
    "/savings",
    formattedPayload
  );

  console.log(
    "✅ CREATE SAVING RESPONSE:",
    res.data
  );

  return res.data?.data ?? res.data;
}

// =====================================================
// UPDATE SAVING GOAL
// =====================================================

export async function updateSavingGoal(
  id: string,
  payload: Partial<CreateSavingGoalPayload>
): Promise<SavingGoal> {
  const formattedPayload = {
    ...payload,

    ...(payload.target_date
      ? {
          target_date: `${payload.target_date}T00:00:00Z`,
        }
      : {}),
  };

  console.log(
    "📤 UPDATE SAVING:",
    formattedPayload
  );

  const res = await apiClient.put(
    `/savings/${id}`,
    formattedPayload
  );

  return res.data?.data ?? res.data;
}

// =====================================================
// DELETE SAVING GOAL
// =====================================================

export async function deleteSavingGoal(
  id: string
): Promise<void> {
  await apiClient.delete(`/savings/${id}`);
}

// =====================================================
// GET SAVING ENTRIES
// =====================================================

export async function getSavingEntries(
  goalId: string
): Promise<SavingEntry[]> {
  const res = await apiClient.get(
    `/savings/${goalId}/entries`
  );

  console.log(
    "📊 GET SAVING ENTRIES:",
    res.data
  );

  if (Array.isArray(res.data)) {
    return res.data;
  }

  if (Array.isArray(res.data?.data)) {
    return res.data.data;
  }

  return [];
}

// =====================================================
// ADD SAVING ENTRY
// =====================================================


export async function addSavingEntry(
  goalId: string,
  payload: {
    amount: number;
    date: string;
  }
): Promise<SavingEntry> {
  try {
    const requestPayload = {
      amount: Number(payload.amount),
      date: `${payload.date}T00:00:00Z`,
    };

    console.log("🎯 GOAL ID:", goalId);
    console.log("📤 ENTRY PAYLOAD:", requestPayload);

    const res = await apiClient.post(
      `/savings/${goalId}/entries`,
      requestPayload
    );

    console.log("✅ ENTRY RESPONSE:", res.data);

    return res.data?.data ?? res.data;
  } catch (error: any) {
    console.error(
      "❌ STATUS:",
      error?.response?.status
    );

    console.error(
      "❌ RESPONSE:",
      JSON.stringify(
        error?.response?.data,
        null,
        2
      )
    );

    console.error(
      "❌ REQUEST:",
      error?.config?.data
    );

    console.error(
      "❌ URL:",
      error?.config?.url
    );

    throw error;
  }
}