"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type Preferences = {
  theme: "light" | "dark" | "system";
  budget_notification: boolean;
  transaction_notification: boolean;
  savings_notification: boolean;
  reminder_notification: boolean;
  private_mode: boolean;
  hide_balance: boolean;
};

const defaultPreferences: Preferences = {
  theme: "system",
  budget_notification: true,
  transaction_notification: true,
  savings_notification: true,
  reminder_notification: false,
  private_mode: false,
  hide_balance: false,
};

export function usePreferences() {
  const [preferences, setPreferences] =
    useState<Preferences>(defaultPreferences);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      try {
        const token = getToken();

        if (!token) {
          console.warn("Preference: token tidak ditemukan");
          return;
        }

        if (!API_URL) {
          console.error(
            "NEXT_PUBLIC_API_URL belum dikonfigurasi"
          );
          return;
        }

        const response = await fetch(
          `${API_URL}/preferences`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json().catch(() => null);

        console.log(
          "GET /preferences:",
          response.status,
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Gagal mengambil preferensi"
          );
        }

        const result = data?.data ?? data;

        if (cancelled) return;

        const loadedPreferences: Preferences = {
          theme:
            result?.theme === "light" ||
            result?.theme === "dark" ||
            result?.theme === "system"
              ? result.theme
              : defaultPreferences.theme,

          budget_notification:
            typeof result?.budget_notification === "boolean"
              ? result.budget_notification
              : defaultPreferences.budget_notification,

          transaction_notification:
            typeof result?.transaction_notification ===
            "boolean"
              ? result.transaction_notification
              : defaultPreferences.transaction_notification,

          savings_notification:
            typeof result?.savings_notification === "boolean"
              ? result.savings_notification
              : defaultPreferences.savings_notification,

          reminder_notification:
            typeof result?.reminder_notification ===
            "boolean"
              ? result.reminder_notification
              : defaultPreferences.reminder_notification,

          private_mode:
            typeof result?.private_mode === "boolean"
              ? result.private_mode
              : defaultPreferences.private_mode,

          hide_balance:
            typeof result?.hide_balance === "boolean"
              ? result.hide_balance
              : defaultPreferences.hide_balance,
        };

        setPreferences(loadedPreferences);

        console.log(
          "PREFERENCES LOADED:",
          loadedPreferences
        );
      } catch (error) {
        console.error(
          "GET PREFERENCES ERROR:",
          error
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadPreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    preferences,
    setPreferences,
    isLoading,
  };
}