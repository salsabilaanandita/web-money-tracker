import apiClient from "@/lib/apiClient";
import {
  Transaction,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  TransactionQueryParams,
} from "@/types/transaction";

export async function getTransactions(
  params?: TransactionQueryParams
): Promise<Transaction[]> {
  const res = await apiClient.get("/transactions", {
    params,
  });

  // Kalau API mengembalikan { data: [...] }
  if (Array.isArray(res.data?.data)) {
    return res.data.data;
  }

  // Kalau API langsung mengembalikan [...]
  if (Array.isArray(res.data)) {
    return res.data;
  }

  return [];
}

export async function getTransactionById(
  id: string
): Promise<Transaction> {
  const res = await apiClient.get(`/transactions/${id}`);

  return res.data?.data ?? res.data;
}

export async function createTransaction(
  payload: CreateTransactionPayload
): Promise<Transaction> {
  const requestPayload = {
    ...payload,

    // Input type="date" menghasilkan:
    // 2026-08-18
    //
    // Backend Go membutuhkan format timestamp:
    // 2026-08-18T00:00:00Z
    date: payload.date
      ? `${payload.date}T00:00:00Z`
      : undefined,
  };

  console.log("CREATE TRANSACTION PAYLOAD:", requestPayload);

  const res = await apiClient.post(
    "/transactions",
    requestPayload
  );

  return res.data?.data ?? res.data;
}

export async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload
): Promise<Transaction> {
  const requestPayload = {
    ...payload,

    date: payload.date
      ? `${payload.date}T00:00:00Z`
      : undefined,
  };

  console.log("UPDATE TRANSACTION PAYLOAD:", requestPayload);

  const res = await apiClient.put(
    `/transactions/${id}`,
    requestPayload
  );

  return res.data?.data ?? res.data;
}

export async function deleteTransaction(
  id: string
): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}