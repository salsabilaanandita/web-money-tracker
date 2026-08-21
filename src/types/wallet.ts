export type WalletType = "bank" | "cash" | "e-wallet";

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWalletPayload {
  name: string;
  type: WalletType;
  balance: number;
}

export type UpdateWalletPayload = CreateWalletPayload;
