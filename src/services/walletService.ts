import apiClient from "@/lib/apiClient";
import { Wallet } from "@/types/wallet";

export async function getWallets(): Promise<Wallet[]> {
  const response = await apiClient.get("/wallets");

  console.log("WALLETS API:", response.data);

  if (Array.isArray(response.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

export async function getWalletById(id: string): Promise<Wallet> {
  const response = await apiClient.get(`/wallets/${id}`);

  return response.data?.data ?? response.data;
}

export async function createWallet(data: {
  name: string;
  type: string;
  balance: number;
}): Promise<Wallet> {
  const response = await apiClient.post("/wallets", data);

  return response.data?.data ?? response.data;
}

export async function updateWallet(
  id: string,
  data: {
    name: string;
    type: string;
    balance: number;
  }
): Promise<Wallet> {
  const response = await apiClient.put(`/wallets/${id}`, data);

  return response.data?.data ?? response.data;
}

export async function deleteWallet(id: string): Promise<void> {
  await apiClient.delete(`/wallets/${id}`);
}