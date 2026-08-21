export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function formatCurrencyInput(value: string | number | undefined): string {
  if (value === null || value === undefined || value === "") return "";

  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return "";

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Number(digits));
}

export function parseCurrencyInput(value: string | number | undefined): number {
  if (value === null || value === undefined || value === "") return 0;

  const digits = String(value).replace(/[^\d]/g, "");
  if (!digits) return 0;

  return Number(digits);
}

export function formatDate(value: string | Date, withTime = false): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function toDateInputValue(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export const walletTypeLabel: Record<string, string> = {
  bank: "Bank",
  cash: "Cash",
  "e-wallet": "E-Wallet",
};
