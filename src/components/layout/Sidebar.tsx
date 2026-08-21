"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  PiggyBank,
  Target,
  LogOut,
  Bell,
  Moon,
  Sun,
  Settings2,
  ChevronDown,
  X,
  Menu,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Receipt,
} from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getToken, removeToken } from "@/lib/auth";

import { getBudgetSummary } from "@/services/budgetService";
import { getSavingGoals } from "@/services/savingService";
import { getTransactions } from "@/services/transactionService";

import { Transaction } from "@/types/transaction";
import { SavingGoal } from "@/types/saving";
import { BudgetSummaryItem } from "@/types/budget";

import { useNotificationRefreshSignal } from "@/store/useNotificationRefresh";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ==========================================================
// MENU
// ==========================================================

export const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Pengeluaran",
    href: "/transactions/expense",
    icon: ArrowDownCircle,
  },
  {
    label: "Pemasukan",
    href: "/transactions/income",
    icon: ArrowUpCircle,
  },
  {
    label: "Wallet",
    href: "/wallets",
    icon: Wallet,
  },
  {
    label: "Budget",
    href: "/budgets",
    icon: Target,
  },
  {
    label: "Tabungan",
    href: "/savings",
    icon: PiggyBank,
  },
];

// ==========================================================
// TYPES
// ==========================================================

type DashboardSummary = {
  total_balance?: number;
  totalBalance?: number;
  balance?: number;

  monthly_income?: number;
  monthlyIncome?: number;
  total_income?: number;

  monthly_expense?: number;
  monthlyExpense?: number;
  total_expense?: number;

  balance_change?: number;
  balanceChange?: number;
  change_percentage?: number;
  changePercentage?: number;
};

type UserPreferences = {
  theme?: "light" | "dark" | "system";

  budget_notification?: boolean;
  transaction_notification?: boolean;
  savings_notification?: boolean;
  reminder_notification?: boolean;

  private_mode?: boolean;
  hide_balance?: boolean;
};

type Profile = {
  id?: string;
  name?: string;
  email?: string;
  avatar_url?: string | null;
};

type NotificationCategory = "budget" | "transaction" | "saving" | "reminder";

type NotificationItem = {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  createdAt: string;
  unread: boolean;
};

type NotificationStorage = {
  initialized: boolean;
  notifications: NotificationItem[];

  knownTransactionIds: string[];

  budgetLevels: Record<string, number>;

  savingAmounts: Record<string, number>;

  lastBudgetReminder: string | null;
};

// ==========================================================
// HELPERS
// ==========================================================

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function maskCurrency(value: number, hide: boolean) {
  if (hide) {
    return "••••••";
  }

  return formatCurrency(value);
}

function getNumber(
  data: DashboardSummary,
  ...keys: (keyof DashboardSummary)[]
) {
  for (const key of keys) {
    const value = data[key];

    if (typeof value === "number") {
      return value;
    }
  }

  return 0;
}

// ==========================================================
// AVATAR URL
// ==========================================================

function getAvatarUrl(avatarUrl?: string | null) {
  if (!avatarUrl) {
    return null;
  }

  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

  if (!API_URL) {
    return avatarUrl;
  }

  const backendUrl = API_URL.replace(/\/api\/?$/, "");

  return `${backendUrl}${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`;
}

// ==========================================================
// NOTIFICATION STORAGE
// ==========================================================

function getNotificationStorageKey(profile?: Profile | null) {
  const userKey = profile?.id || profile?.email || "default-user";

  return `money-tracker-notifications-${userKey}`;
}

function getEmptyNotificationStorage(): NotificationStorage {
  return {
    initialized: false,
    notifications: [],
    knownTransactionIds: [],
    budgetLevels: {},
    savingAmounts: {},
    lastBudgetReminder: null,
  };
}

function loadNotificationStorage(
  profile?: Profile | null,
): NotificationStorage {
  if (typeof window === "undefined") {
    return getEmptyNotificationStorage();
  }

  try {
    const key = getNotificationStorageKey(profile);
    const raw = localStorage.getItem(key);

    if (!raw) {
      return getEmptyNotificationStorage();
    }

    const parsed = JSON.parse(raw);

    return {
      ...getEmptyNotificationStorage(),
      ...parsed,
    };
  } catch (error) {
    console.error("Gagal membaca notification storage:", error);

    return getEmptyNotificationStorage();
  }
}

function saveNotificationStorage(
  profile: Profile | null,
  data: NotificationStorage,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const key = getNotificationStorageKey(profile);

    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Gagal menyimpan notification storage:", error);
  }
}

// ==========================================================
// NOTIFICATION HELPERS
// ==========================================================

function createNotification(
  data: Omit<NotificationItem, "createdAt" | "unread">,
): NotificationItem {
  return {
    ...data,
    createdAt: new Date().toISOString(),
    unread: true,
  };
}

function getBudgetLevel(spent: number, limit: number) {
  if (limit <= 0) {
    return 0;
  }

  const percentage = (spent / limit) * 100;

  if (percentage >= 100) {
    return 2;
  }

  if (percentage >= 80) {
    return 1;
  }

  return 0;
}

function getNotificationIcon(category: NotificationCategory) {
  if (category === "budget") {
    return AlertTriangle;
  }

  if (category === "saving") {
    return TrendingUp;
  }

  if (category === "reminder") {
    return Bell;
  }

  return Receipt;
}

// ==========================================================
// GENERATE NOTIFICATIONS
// ==========================================================

function generateNewNotifications(
  profile: Profile | null,
  storage: NotificationStorage,
  budgets: BudgetSummaryItem[],
  goals: SavingGoal[],
  transactions: Transaction[],
  enableBudget: boolean,
  enableTransaction: boolean,
  enableSaving: boolean,
  enableReminder: boolean,
) {
  const nextStorage: NotificationStorage = {
    ...storage,

    notifications: [...storage.notifications],

    knownTransactionIds: [...storage.knownTransactionIds],

    budgetLevels: {
      ...storage.budgetLevels,
    },

    savingAmounts: {
      ...storage.savingAmounts,
    },
  };

  const newNotifications: NotificationItem[] = [];

  // ========================================================
  // INITIAL BASELINE
  // ========================================================

  if (!storage.initialized) {
    nextStorage.initialized = true;

    nextStorage.knownTransactionIds = transactions
      .map((tx) => tx.id)
      .filter(Boolean);

    nextStorage.budgetLevels = {};

    budgets.forEach((budget) => {
      const level = getBudgetLevel(
        Number(budget.spent) || 0,
        Number(budget.amount_limit) || 0,
      );

      const key = `${budget.category_id}-${budget.month}-${budget.year}`;

      nextStorage.budgetLevels[key] = level;
    });

    nextStorage.savingAmounts = {};

    goals.forEach((goal) => {
      nextStorage.savingAmounts[goal.id] = Number(goal.current_amount) || 0;
    });

    saveNotificationStorage(profile, nextStorage);

    return nextStorage;
  }

  // ========================================================
  // 1. TRANSAKSI PEMASUKAN BARU
  // ========================================================

  const knownTransactionIds = new Set(nextStorage.knownTransactionIds);

  const newTransactions = transactions.filter(
    (tx) => tx.id && !knownTransactionIds.has(tx.id),
  );

  if (enableTransaction && newTransactions.length > 0) {
    newTransactions.forEach((tx) => {
      if (tx.type !== "income") {
        return;
      }

      newNotifications.push(
        createNotification({
          id: `transaction-${tx.id}`,
          category: "transaction",
          title: "Transaksi berhasil",
          description: `+${formatCurrency(Number(tx.amount) || 0)} — ${
            tx.description || "Pemasukan berhasil dicatat"
          }`,
        }),
      );
    });
  }

  transactions.forEach((tx) => {
    if (tx.id) {
      knownTransactionIds.add(tx.id);
    }
  });

  nextStorage.knownTransactionIds = Array.from(knownTransactionIds).slice(-100);

  // ========================================================
  // 2. BUDGET HAMPIR HABIS
  // ========================================================

  const currentBudgetLevels: Record<string, number> = {};

  budgets.forEach((budget) => {
    const key = `${budget.category_id}-${budget.month}-${budget.year}`;

    const spent = Number(budget.spent) || 0;
    const limit = Number(budget.amount_limit) || 0;

    const currentLevel = getBudgetLevel(spent, limit);

    const previousLevel = nextStorage.budgetLevels[key] ?? 0;

    currentBudgetLevels[key] = currentLevel;

    if (enableBudget && currentLevel > previousLevel && currentLevel >= 1) {
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

      const isOver = currentLevel >= 2;

      newNotifications.push(
        createNotification({
          id: `budget-${key}-${currentLevel}-${Date.now()}`,
          category: "budget",

          title: isOver
            ? `Budget ${budget.category_name} sudah habis`
            : `Budget ${budget.category_name} hampir habis`,

          description:
            `Terpakai ${percentage}% ` +
            `(${formatCurrency(spent)} dari ${formatCurrency(limit)}).`,
        }),
      );
    }
  });

  nextStorage.budgetLevels = currentBudgetLevels;

  // ========================================================
  // 3. TARGET TABUNGAN
  // ========================================================

  const currentSavingAmounts: Record<string, number> = {};

  goals.forEach((goal) => {
    const current = Number(goal.current_amount) || 0;

    currentSavingAmounts[goal.id] = current;

    const previous = nextStorage.savingAmounts[goal.id];

    if (enableSaving && previous !== undefined && current !== previous) {
      const target = Number(goal.target_amount) || 0;

      const percentage =
        target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

      const isDone = target > 0 && current >= target;

      newNotifications.push(
        createNotification({
          id: `saving-${goal.id}-${current}-${Date.now()}`,
          category: "saving",

          title: isDone
            ? `Target ${goal.name} tercapai! 🎉`
            : `Target ${goal.name} berubah`,

          description: isDone
            ? "Selamat, target tabunganmu sudah tercapai."
            : `Progres tabungan sekarang ${percentage}% dari target.`,
        }),
      );
    }
  });

  nextStorage.savingAmounts = currentSavingAmounts;

  // ========================================================
  // 4. PENGINGAT BUDGET
  // ========================================================

  if (enableReminder && budgets.length > 0) {
    const now = new Date();

    const monthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}`;

    const day = now.getDate();

    if (day <= 7 && nextStorage.lastBudgetReminder !== monthKey) {
      newNotifications.push(
        createNotification({
          id: `budget-reminder-${monthKey}`,
          category: "reminder",
          title: "Pengingat budget",
          description:
            "Yuk cek kembali budget bulananmu dan pastikan pengeluaran tetap terkontrol.",
        }),
      );

      nextStorage.lastBudgetReminder = monthKey;
    }
  }

  // ========================================================
  // SAVE
  // ========================================================

  if (newNotifications.length > 0) {
    nextStorage.notifications = [
      ...newNotifications,
      ...nextStorage.notifications,
    ];
  }

  nextStorage.notifications = nextStorage.notifications.slice(0, 50);

  saveNotificationStorage(profile, nextStorage);

  return nextStorage;
}

// ==========================================================
// LOGOUT
// ==========================================================

export function useLogout() {
  const router = useRouter();

  return () => {
    removeToken();

    toast.success("Berhasil keluar");

    router.push("/login");
  };
}

// ==========================================================
// SIDEBAR
// ==========================================================

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = useLogout();

  const { theme, setTheme, resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // ========================================================
  // PROFILE
  // ========================================================

  const [profile, setProfile] = useState<Profile | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);

  const [avatarError, setAvatarError] = useState(false);

  // ========================================================
  // SUMMARY
  // ========================================================

  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const [loadingSummary, setLoadingSummary] = useState(true);

  // ========================================================
  // PRIVATE MODE
  // ========================================================

  const [privateMode, setPrivateMode] = useState(false);

  // ========================================================
  // NOTIFICATION PREFERENCES
  // ========================================================

  const [notificationPrefs, setNotificationPrefs] = useState({
    budget: true,
    transaction: true,
    savings: true,
    reminder: false,
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const refreshSignal = useNotificationRefreshSignal();

  // ========================================================
  // MOUNT
  // ========================================================

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setShowMobileSidebar(false);
  }, [pathname]);

  // ========================================================
  // GET PROFILE
  // ========================================================

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const token = getToken();

        if (!token || !API_URL) {
          if (mounted) {
            setProfile(null);
            setLoadingProfile(false);
          }

          return;
        }

        setLoadingProfile(true);

        const response = await fetch(`${API_URL}/profile`, {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Gagal mengambil profile (${response.status})`);
        }

        const result = await response.json();

        const data = result?.data ?? result;

        if (mounted) {
          setProfile(data);
          setAvatarError(false);
        }
      } catch (error) {
        console.error("Gagal mengambil profile:", error);

        if (mounted) {
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [pathname, refreshSignal]);

  // ========================================================
  // GET DASHBOARD SUMMARY
  // ========================================================

  useEffect(() => {
    let mounted = true;

    async function loadSummary() {
      try {
        const token = getToken();

        if (!token) {
          if (mounted) {
            setSummary(null);
            setLoadingSummary(false);
          }

          return;
        }

        if (!API_URL) {
          throw new Error("NEXT_PUBLIC_API_URL belum tersedia");
        }

        const response = await fetch(`${API_URL}/dashboard/summary`, {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Gagal mengambil ringkasan dashboard (${response.status})`,
          );
        }

        const result = await response.json();

        const data = result?.data ?? result;

        if (mounted) {
          setSummary(data);
        }
      } catch (error) {
        console.error("Gagal mengambil summary dashboard:", error);

        if (mounted) {
          setSummary(null);
        }
      } finally {
        if (mounted) {
          setLoadingSummary(false);
        }
      }
    }

    loadSummary();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  // ========================================================
  // GET PREFERENCES
  // ========================================================

  useEffect(() => {
    let mounted = true;

    async function loadPrivacy() {
      try {
        const token = getToken();

        if (!token || !API_URL) {
          return;
        }

        const response = await fetch(`${API_URL}/preferences`, {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json();

        const data: UserPreferences = result?.data ?? result;

        if (mounted) {
          setPrivateMode(Boolean(data?.private_mode));

          setNotificationPrefs({
            budget: data?.budget_notification ?? true,

            transaction: data?.transaction_notification ?? true,

            savings: data?.savings_notification ?? true,

            reminder: data?.reminder_notification ?? false,
          });
        }
      } catch (error) {
        console.error("Gagal mengambil preferensi:", error);
      }
    }

    loadPrivacy();

    return () => {
      mounted = false;
    };
  }, [pathname]);

  // ========================================================
  // LOAD NOTIFICATIONS
  // ========================================================

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      const token = getToken();

      if (!token) {
        if (mounted) {
          setNotifications([]);
          setLoadingNotifications(false);
        }

        return;
      }

      try {
        const [budgetResult, savingResult, transactionResult] =
          await Promise.allSettled([
            getBudgetSummary(),

            getSavingGoals(),

            getTransactions({
              limit: 50,
            }),
          ]);

        if (!mounted) {
          return;
        }

        const budgets =
          budgetResult.status === "fulfilled" ? budgetResult.value : [];

        const goals =
          savingResult.status === "fulfilled" ? savingResult.value : [];

        const transactions =
          transactionResult.status === "fulfilled"
            ? Array.isArray(transactionResult.value)
              ? transactionResult.value
              : ((
                  transactionResult.value as {
                    data?: Transaction[];
                  }
                )?.data ?? [])
            : [];

        const storage = loadNotificationStorage(profile);

        const nextStorage = generateNewNotifications(
          profile,
          storage,
          budgets,
          goals,
          transactions,
          notificationPrefs.budget,
          notificationPrefs.transaction,
          notificationPrefs.savings,
          notificationPrefs.reminder,
        );

        if (!mounted) {
          return;
        }

        setNotifications(nextStorage.notifications);
      } catch (error) {
        console.error("Gagal mengambil notifikasi:", error);
      } finally {
        if (mounted) {
          setLoadingNotifications(false);
        }
      }
    }

    loadNotifications();

    const intervalId = setInterval(loadNotifications, 30_000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pathname,
    refreshSignal,
    profile?.id,
    profile?.email,
    notificationPrefs.budget,
    notificationPrefs.transaction,
    notificationPrefs.savings,
    notificationPrefs.reminder,
  ]);

  // ========================================================
  // NOTIFICATION FILTER
  // ========================================================

  const visibleNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (notification.category === "budget") {
        return notificationPrefs.budget;
      }

      if (notification.category === "transaction") {
        return notificationPrefs.transaction;
      }

      if (notification.category === "saving") {
        return notificationPrefs.savings;
      }

      if (notification.category === "reminder") {
        return notificationPrefs.reminder;
      }

      return false;
    });
  }, [notifications, notificationPrefs]);

  const hasUnread = visibleNotifications.some(
    (notification) => notification.unread,
  );

  const unreadCount = visibleNotifications.filter(
    (notification) => notification.unread,
  ).length;

  // ========================================================
  // DELETE NOTIFICATION
  // ========================================================

  function deleteNotification(notificationId: string) {
    setNotifications((prev) => {
      const next = prev.filter(
        (notification) => notification.id !== notificationId,
      );

      const storage = loadNotificationStorage(profile);

      saveNotificationStorage(profile, {
        ...storage,
        notifications: next,
      });

      return next;
    });
  }

  // ========================================================
  // MARK ALL READ
  // ========================================================

  function markAllAsRead() {
    setNotifications((prev) => {
      const next = prev.map((notification) => ({
        ...notification,
        unread: false,
      }));

      const storage = loadNotificationStorage(profile);

      saveNotificationStorage(profile, {
        ...storage,
        notifications: next,
      });

      return next;
    });
  }

  // ========================================================
  // SUMMARY DATA
  // ========================================================

  const totalBalance = summary
    ? getNumber(summary, "total_balance", "totalBalance", "balance")
    : 0;

  const monthlyIncome = summary
    ? getNumber(summary, "monthly_income", "monthlyIncome", "total_income")
    : 0;

  const monthlyExpense = summary
    ? getNumber(summary, "monthly_expense", "monthlyExpense", "total_expense")
    : 0;

  // ========================================================
  // PERSENTASE KEUANGAN
  // ========================================================
  //
  // Rumus:
  //
  // (Pemasukan - Pengeluaran)
  // ------------------------- × 100
  //       Pemasukan
  //
  // Contoh:
  // Income  = 11.350.000
  // Expense =  7.335.000
  //
  // (11.350.000 - 7.335.000)
  // / 11.350.000 × 100
  //
  // = 35,37%
  //
  // ========================================================

  const changePercentage =
    monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100
      : 0;

  const isPositiveChange = changePercentage >= 0;

  // ========================================================
  // PROFILE DATA
  // ========================================================

  const avatarUrl = getAvatarUrl(profile?.avatar_url);

  const profileInitial = profile?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  // ========================================================
  // RENDER
  // ========================================================

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="fixed left-0 right-0 top-0 z-[80] flex h-16 items-center border-b border-border bg-background px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowMobileSidebar(true)}
          className="size-10 rounded-xl"
          aria-label="Buka menu"
        >
          <Menu className="size-5" />
        </Button>

        <Link href="/dashboard" className="ml-2 flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Wallet className="size-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Money Tracker</p>
            <p className="mt-1 text-[7px] uppercase tracking-[0.2em] text-muted-foreground">
              Personal Finance
            </p>
          </div>
        </Link>
      </div>

      <aside
        className={`
          fixed inset-y-0 left-0 z-[100]
          flex h-screen w-[260px] shrink-0
          flex-col
          border-r border-border
          bg-background
          text-foreground
          shadow-xl
          transition-transform duration-300
          lg:sticky lg:top-0 lg:z-[100] lg:translate-x-0 lg:shadow-none
          ${showMobileSidebar ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* MOBILE CLOSE */}
        <div className="flex items-center justify-end px-4 pt-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileSidebar(false)}
            className="size-9 rounded-xl"
            aria-label="Tutup menu"
          >
            <X className="size-5" />
          </Button>
        </div>
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="border-b border-border px-5 py-5">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
                <Wallet className="size-4 text-primary-foreground" />
              </div>

              <div>
                <p className="font-sans text-[15px] font-bold leading-none">
                  Money Tracker
                </p>

                <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                  Personal Finance
                </p>
              </div>
            </Link>

            {/* NOTIFICATION BUTTON */}

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications((prev) => !prev)}
                className="
                  relative size-9 rounded-xl
                  text-muted-foreground
                  hover:bg-muted
                  hover:text-foreground
                "
              >
                <Bell className="size-[18px]" />

                {hasUnread && (
                  <span
                    className="
                      absolute right-1.5 top-1.5
                      flex size-2
                      rounded-full
                      bg-red-500
                      ring-2 ring-background
                    "
                  />
                )}
              </Button>

              {/* NOTIFICATION POPUP */}

              {showNotifications && (
                <div
                  className="
                    absolute left-full top-0 z-50 ml-3
                    w-[350px]
                    overflow-hidden
                    rounded-2xl
                    border border-border
                    bg-background
                    shadow-xl
                  "
                >
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">Notifikasi</p>

                      <p className="text-[11px] text-muted-foreground">
                        {loadingNotifications
                          ? "Memuat notifikasi..."
                          : unreadCount > 0
                            ? `Kamu punya ${unreadCount} notifikasi baru`
                            : "Semua notifikasi sudah dibaca"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="
                        rounded-lg p-1.5
                        text-muted-foreground
                        hover:bg-muted
                        hover:text-foreground
                      "
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="flex items-center justify-center gap-2 px-4 py-8">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />

                        <span className="text-xs text-muted-foreground">
                          Memuat...
                        </span>
                      </div>
                    ) : visibleNotifications.length === 0 ? (
                      <div className="px-4 py-10 text-center">
                        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                          <Bell className="size-4 text-muted-foreground" />
                        </div>

                        <p className="text-xs font-medium">
                          Tidak ada notifikasi
                        </p>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Notifikasi penting akan muncul di sini.
                        </p>
                      </div>
                    ) : (
                      visibleNotifications.map((notification) => {
                        const Icon = getNotificationIcon(notification.category);

                        let time = "Baru saja";

                        try {
                          time = formatDistanceToNow(
                            new Date(notification.createdAt),
                            {
                              addSuffix: true,
                              locale: idLocale,
                            },
                          );
                        } catch {
                          time = "Baru saja";
                        }

                        return (
                          <div
                            key={notification.id}
                            className={`
                                group
                                border-b border-border
                                px-4 py-3
                                last:border-b-0
                                ${
                                  notification.unread ? "bg-primary/[0.03]" : ""
                                }
                              `}
                          >
                            <div className="flex gap-3">
                              <div
                                className={`
                                    mt-0.5
                                    flex size-8 shrink-0
                                    items-center justify-center
                                    rounded-full
                                    ${
                                      notification.unread
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                    }
                                  `}
                              >
                                <Icon className="size-3.5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold">
                                      {notification.title}
                                    </p>

                                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                      {notification.description}
                                    </p>

                                    <p className="mt-1.5 text-[9px] text-muted-foreground">
                                      {time}
                                    </p>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-1">
                                    {notification.unread && (
                                      <span className="size-1.5 rounded-full bg-primary" />
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteNotification(notification.id)
                                      }
                                      aria-label="Hapus notifikasi"
                                      className="
                                          rounded-md p-1
                                          text-muted-foreground
                                          hover:bg-red-500/10
                                          hover:text-red-500
                                        "
                                    >
                                      <X className="size-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-border p-2">
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      disabled={!hasUnread}
                      className="
                        w-full rounded-lg py-2
                        text-[11px] font-medium
                        text-primary
                        hover:bg-primary/5
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                    >
                      Tandai semua sudah dibaca
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================
            QUICK INFO
        ================================================== */}

        <div className="px-4 pt-5">
          <div
            className="
              rounded-xl
              border border-border
              bg-muted/40
              px-3 py-3
            "
          >
            <p className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              Keuangan bulan ini
            </p>

            {loadingSummary ? (
              <div className="mt-3 flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />

                <span className="text-xs text-muted-foreground">
                  Memuat saldo...
                </span>
              </div>
            ) : (
              <>
                {/* SALDO + PERSENTASE */}

                <div className="mt-2 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {maskCurrency(totalBalance, privateMode)}
                    </p>

                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                      Total saldo
                    </p>
                  </div>

                  {/* PERSENTASE */}

                  <div
                    className={`
                      flex h-7 min-w-[62px] shrink-0 items-center justify-center rounded-full
                      px-2.5
                      ${
                        isPositiveChange ? "bg-emerald-500/10" : "bg-red-500/10"
                      }
                    `}
                  >
                    <span
                      className={`
                        whitespace-nowrap text-[10px] font-semibold leading-none tabular-nums
                        ${
                          isPositiveChange
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      `}
                    >
                      {privateMode
                        ? "••"
                        : `${
                            isPositiveChange ? "+" : ""
                          }${changePercentage.toFixed(1)}%`}
                    </span>
                  </div>
                </div>

                {/* INCOME / EXPENSE */}

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/60 pt-2">
                  <div>
                    <p className="text-[8px] text-muted-foreground">
                      Pemasukan
                    </p>

                    <p className="mt-0.5 truncate text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {maskCurrency(monthlyIncome, privateMode)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[8px] text-muted-foreground">
                      Pengeluaran
                    </p>

                    <p className="mt-0.5 truncate text-[10px] font-semibold text-red-600 dark:text-red-400">
                      {maskCurrency(monthlyExpense, privateMode)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ==================================================
            MENU
        ================================================== */}

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Menu
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group flex items-center gap-3
                    rounded-xl px-3 py-2.5
                    text-sm transition-all
                    ${
                      isActive
                        ? "border border-border bg-background font-semibold text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  <Icon
                    className={`
                      size-[17px]
                      ${
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      }
                    `}
                  />

                  <span>{item.label}</span>

                  {isActive && (
                    <span className="ml-auto size-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ==================================================
            BOTTOM MENU
        ================================================== */}

        <div className="border-t border-border px-4 py-4">
          <div className="space-y-1">
            {/* PREFERENSI */}

            <Link
              href="/settings/preferences"
              className={`
                flex w-full items-center gap-3
                rounded-xl px-3 py-2.5
                text-sm transition-colors
                ${
                  pathname === "/settings/preferences"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <Settings2 className="size-[17px]" />

              <span>Preferensi</span>
            </Link>

            {/* THEME */}

            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="
                flex w-full items-center gap-3
                rounded-xl px-3 py-2.5
                text-sm text-muted-foreground
                transition-colors
                hover:bg-muted
                hover:text-foreground
              "
            >
              {!mounted ? (
                <Moon className="size-[17px]" />
              ) : resolvedTheme === "dark" ? (
                <Sun className="size-[17px]" />
              ) : (
                <Moon className="size-[17px]" />
              )}

              <span>
                {!mounted
                  ? "Dark mode"
                  : resolvedTheme === "dark"
                    ? "Light mode"
                    : "Dark mode"}
              </span>

              <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[8px]">
                {!mounted ? "OFF" : resolvedTheme === "dark" ? "ON" : "OFF"}
              </span>
            </button>

            {/* LOGOUT */}

            <button
              type="button"
              onClick={handleLogout}
              className="
                flex w-full items-center gap-3
                rounded-xl px-3 py-2.5
                text-sm text-muted-foreground
                transition-colors
                hover:bg-red-500/10
                hover:text-red-500
              "
            >
              <LogOut className="size-[17px]" />

              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* ==================================================
            USER PROFILE
        ================================================== */}

        <div className="border-t border-border px-4 py-3">
          <Link
            href="/settings/profile"
            className="
              group flex items-center gap-3
              rounded-xl px-2 py-2
              transition-colors
              hover:bg-muted/60
            "
          >
            {/* AVATAR */}

            <div
              className="
                size-9 shrink-0
                overflow-hidden
                rounded-full
                border border-border
                bg-primary/10
              "
            >
              {loadingProfile ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : avatarUrl && !avatarError ? (
                <img
                  src={avatarUrl}
                  alt={profile?.name || "Profile"}
                  onError={() => setAvatarError(true)}
                  className="
                    h-full w-full
                    object-cover
                  "
                />
              ) : (
                <div
                  className="
                    flex h-full w-full
                    items-center justify-center
                    text-xs font-bold
                    text-primary
                  "
                >
                  {profileInitial}
                </div>
              )}
            </div>

            {/* USER INFO */}

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                {loadingProfile ? "Memuat..." : profile?.name || "User"}
              </p>

              <p className="truncate text-[9px] text-muted-foreground">
                {loadingProfile ? "..." : profile?.email || "Personal account"}
              </p>
            </div>

            <ChevronDown
              className="
                size-4 shrink-0
                text-muted-foreground
                transition-transform
                group-hover:text-foreground
              "
            />
          </Link>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {showMobileSidebar && (
        <button
          type="button"
          aria-label="Tutup sidebar"
          onClick={() => setShowMobileSidebar(false)}
          className="fixed inset-0 z-[90] bg-black/50 lg:hidden"
        />
      )}

      {/* ====================================================
          CLICK OUTSIDE NOTIFICATION
      ==================================================== */}

      {showNotifications && (
        <button
          type="button"
          aria-label="Tutup notifikasi"
          onClick={() => setShowNotifications(false)}
          className="
            fixed inset-0 z-40
            cursor-default
          "
        />
      )}
    </>
  );
}
