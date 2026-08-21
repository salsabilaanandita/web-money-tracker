"use client";

import {
  MoreHorizontal,
  Wallet as WalletIcon,
  Building2,
  Smartphone,
  Banknote,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type WalletType = "bank" | "cash" | "e-wallet";

export type Wallet = {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  created_at?: string;
  updated_at?: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function getWalletType(typeValue: unknown) {
  const type = String(typeValue ?? "").toLowerCase();

  if (type.includes("bank")) {
    return {
      label: "Bank",
      icon: Building2,
    };
  }

  if (
    type.includes("e-wallet") ||
    type.includes("ewallet") ||
    type.includes("e wallet")
  ) {
    return {
      label: "E-Wallet",
      icon: Smartphone,
    };
  }

  if (type.includes("cash")) {
    return {
      label: "Cash",
      icon: Banknote,
    };
  }

  return {
    label: "Wallet",
    icon: WalletIcon,
  };
}

export default function WalletCard({
  wallet,
  onEdit,
  onDelete,
  hideBalance,
}: {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
  hideBalance: boolean;
}) {
  const walletType = getWalletType(wallet.type);
  const TypeIcon = walletType.icon;
  const balance = Number(wallet.balance ?? 0);

  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-[22px]
        border
        border-border/70
        bg-card
        transition-all
        duration-200
        hover:-translate-y-[2px]
        hover:border-border
        hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]
      "
    >
      <div className="p-6">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <div
              className="
                flex
                size-11
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-border/70
                bg-muted/40
                text-muted-foreground
              "
            >
              <TypeIcon className="size-[19px]" strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
              <h3
                className="
                  truncate
                  text-[15px]
                  font-semibold
                  tracking-[-0.01em]
                  text-foreground
                "
              >
                {wallet.name || "Wallet"}
              </h3>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground">
                  {walletType.label}
                </span>

                <span className="size-1 rounded-full bg-emerald-500" />

                <span className="text-[12px] text-muted-foreground">
                  Aktif
                </span>
              </div>
            </div>
          </div>

          {/* MENU */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="
                  flex
                  size-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-muted-foreground
                  opacity-70
                  transition
                  hover:bg-muted
                  hover:text-foreground
                  hover:opacity-100
                  focus:outline-none
                "
              >
                <MoreHorizontal
                  className="size-[17px]"
                  strokeWidth={2}
                />

                <span className="sr-only">
                  Menu {wallet.name}
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-44 rounded-xl p-1"
            >
              <DropdownMenuItem
                onClick={() => onEdit(wallet)}
                className="gap-2 rounded-lg px-3 py-2.5"
              >
                <Pencil className="size-4" />
                Edit Wallet
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onDelete(wallet)}
                className="
                  mt-0.5
                  gap-2
                  rounded-lg
                  px-3
                  py-2.5
                  text-destructive
                  focus:text-destructive
                "
              >
                <Trash2 className="size-4" />
                Hapus Wallet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* BALANCE */}
        <div className="mt-8">
          <p
            className="
              text-[11px]
              font-medium
              uppercase
              tracking-[0.08em]
              text-muted-foreground
            "
          >
            Saldo saat ini
          </p>

          {hideBalance ? (
            <p
              className="
                mt-2
                text-[26px]
                font-semibold
                tracking-[-0.03em]
                text-foreground
              "
            >
              ••••••••
            </p>
          ) : (
            <p
              className="
                mt-2
                truncate
                text-[26px]
                font-semibold
                tracking-[-0.035em]
                text-foreground
              "
            >
              {formatCurrency(balance)}
            </p>
          )}
        </div>

        {/* FOOTER */}
        <div
          className="
            mt-7
            flex
            items-center
            justify-between
            border-t
            border-border/60
            pt-4
          "
        >
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500" />

            <span className="text-xs text-muted-foreground">
              {balance > 0 ? "Saldo tersedia" : "Saldo kosong"}
            </span>
          </div>

          <span className="text-xs text-muted-foreground">
            {walletType.label}
          </span>
        </div>
      </div>
    </div>
  );
}